import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

// Initialize Firebase Admin
admin.initializeApp();

// Configure email transporter
// You'll need to set up these environment variables in Firebase
const transporter = nodemailer.createTransport({
  service: "gmail", // or your email service
  auth: {
    user: functions.config().email?.user || process.env.EMAIL_USER,
    pass: functions.config().email?.password || process.env.EMAIL_PASSWORD,
  },
});

interface User {
  id: string;
  email: string;
  name: string;
  plan: "free" | "pro";
}

interface Quiz {
  id: string;
  user_id: string;
  title: string;
  createdAt: admin.firestore.Timestamp;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
}

/**
 * Get all users who have generated quizzes
 */
async function getUsersWithQuizzes(): Promise<Map<string, User>> {
  const usersMap = new Map<string, User>();
  
  try {
    // Get all quizzes
    const quizzesSnapshot = await admin
      .firestore()
      .collection("quizzes")
      .get();

    // Extract unique user IDs
    const userIds = new Set<string>();
    quizzesSnapshot.forEach((doc) => {
      const quiz = doc.data() as Quiz;
      userIds.add(quiz.user_id);
    });

    // Get user details from Firebase Auth
    for (const userId of userIds) {
      try {
        const userRecord = await admin.auth().getUser(userId);
        if (userRecord.email) {
          usersMap.set(userId, {
            id: userId,
            email: userRecord.email,
            name: userRecord.displayName || "User",
            plan: "free", // Default, you can fetch from Firestore if stored
          });
        }
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
      }
    }

    return usersMap;
  } catch (error) {
    console.error("Error getting users with quizzes:", error);
    throw error;
  }
}

/**
 * Get the latest quiz for a user
 */
async function getLatestQuizForUser(userId: string): Promise<Quiz | null> {
  try {
    const quizzesSnapshot = await admin
      .firestore()
      .collection("quizzes")
      .where("user_id", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (quizzesSnapshot.empty) {
      return null;
    }

    const doc = quizzesSnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Quiz;
  } catch (error) {
    console.error(`Error getting quiz for user ${userId}:`, error);
    return null;
  }
}

/**
 * Send email to a user about their quiz
 */
async function sendQuizReminderEmail(
  user: User,
  quiz: Quiz
): Promise<boolean> {
  try {
    const quizUrl = `https://your-domain.com/quiz`; // Replace with your actual domain
    const dashboardUrl = `https://your-domain.com/`; // Replace with your actual domain

    const mailOptions = {
      from: `"Exam Prep Assistant" <${functions.config().email?.user || process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "📚 Don't Forget Your Quiz! - Exam Prep Assistant",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #8b5cf6;
              margin: 0;
              font-size: 24px;
            }
            .content {
              margin-bottom: 30px;
            }
            .quiz-info {
              background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
              color: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .quiz-info h2 {
              margin: 0 0 10px 0;
              font-size: 18px;
            }
            .quiz-info p {
              margin: 5px 0;
              opacity: 0.95;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
              color: white !important;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              text-align: center;
              margin: 10px 0;
            }
            .button:hover {
              opacity: 0.9;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
            .stats {
              display: flex;
              justify-content: space-around;
              margin: 20px 0;
            }
            .stat {
              text-align: center;
            }
            .stat-number {
              font-size: 32px;
              font-weight: bold;
              color: #8b5cf6;
            }
            .stat-label {
              font-size: 14px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ Exam Prep Assistant</h1>
            </div>
            
            <div class="content">
              <p>Hi ${user.name},</p>
              
              <p>We noticed you have a quiz waiting for you! 📝</p>
              
              <div class="quiz-info">
                <h2>📚 ${quiz.title}</h2>
                <p>Created: ${quiz.createdAt.toDate().toLocaleDateString()}</p>
                <p>Questions: ${quiz.questions.length}</p>
              </div>
              
              <p>Taking regular quizzes is a great way to reinforce your learning and identify areas that need more focus. Why not challenge yourself today?</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${quizUrl}" class="button">
                  📝 Take Quiz Now
                </a>
              </div>
              
              <div class="stats">
                <div class="stat">
                  <div class="stat-number">${quiz.questions.length}</div>
                  <div class="stat-label">Questions</div>
                </div>
                <div class="stat">
                  <div class="stat-number">~${Math.ceil(quiz.questions.length * 1.5)}</div>
                  <div class="stat-label">Minutes</div>
                </div>
              </div>
              
              <p style="margin-top: 30px;">
                <strong>Quick Tips:</strong>
              </p>
              <ul>
                <li>📖 Review your materials before starting</li>
                <li>🎯 Read each question carefully</li>
                <li>⏰ Take your time - there's no rush!</li>
                <li>🔄 You can always generate new quizzes</li>
              </ul>
              
              <p style="margin-top: 30px;">
                Need to generate more quizzes or upload new materials? 
                <a href="${dashboardUrl}" style="color: #8b5cf6;">Visit your dashboard</a>
              </p>
            </div>
            
            <div class="footer">
              <p>You're receiving this email because you have an active quiz in Exam Prep Assistant.</p>
              <p>© ${new Date().getFullYear()} Exam Prep Assistant. All rights reserved.</p>
              <p style="margin-top: 10px;">
                <a href="${dashboardUrl}" style="color: #8b5cf6;">Dashboard</a> • 
                <a href="${dashboardUrl}/pricing" style="color: #8b5cf6;">Upgrade to Pro</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${user.name},

We noticed you have a quiz waiting for you!

Quiz: ${quiz.title}
Created: ${quiz.createdAt.toDate().toLocaleDateString()}
Questions: ${quiz.questions.length}

Taking regular quizzes is a great way to reinforce your learning. 
Visit ${quizUrl} to take your quiz now!

Quick Tips:
- Review your materials before starting
- Read each question carefully
- Take your time - there's no rush!
- You can always generate new quizzes

Need help? Visit ${dashboardUrl}

© ${new Date().getFullYear()} Exam Prep Assistant
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending email to ${user.email}:`, error);
    return false;
  }
}

/**
 * Scheduled function to send daily quiz reminders
 * Runs every day at 7:00 AM (your local timezone)
 * 
 * Note: Adjust the timezone in the cron expression as needed
 * Example timezones:
 * - America/New_York
 * - Europe/London
 * - Asia/Singapore
 * - Australia/Sydney
 */
export const sendDailyQuizReminders = functions.pubsub
  .schedule("0 7 * * *") // Cron: Every day at 7:00 AM
  .timeZone("America/Los_Angeles") // Change to your timezone
  .onRun(async (context) => {
    console.log("🔔 Starting daily quiz reminder job...");
    
    try {
      // Get all users with quizzes
      const usersWithQuizzes = await getUsersWithQuizzes();
      console.log(`📊 Found ${usersWithQuizzes.size} users with quizzes`);

      if (usersWithQuizzes.size === 0) {
        console.log("No users with quizzes found. Exiting.");
        return null;
      }

      // Send emails to all users
      let successCount = 0;
      let failureCount = 0;

      for (const [userId, user] of usersWithQuizzes) {
        // Get the latest quiz for this user
        const quiz = await getLatestQuizForUser(userId);
        
        if (!quiz) {
          console.log(`No quiz found for user ${userId}`);
          continue;
        }

        // Send email
        const sent = await sendQuizReminderEmail(user, quiz);
        
        if (sent) {
          successCount++;
        } else {
          failureCount++;
        }

        // Add a small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log(`✅ Daily quiz reminder job completed:`);
      console.log(`   - Emails sent: ${successCount}`);
      console.log(`   - Failures: ${failureCount}`);
      console.log(`   - Total users: ${usersWithQuizzes.size}`);

      return null;
    } catch (error) {
      console.error("❌ Error in daily quiz reminder job:", error);
      throw error;
    }
  });

/**
 * Manual trigger function for testing - sends to ALL users with quizzes
 * Call this function to test email sending without waiting for the schedule
 * 
 * Usage: firebase functions:call sendQuizRemindersManual
 */
export const sendQuizRemindersManual = functions.https.onCall(
  async (data, context) => {
    // Verify the user is authenticated (optional security check)
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    console.log("🔔 Manual quiz reminder triggered by:", context.auth.uid);

    try {
      const usersWithQuizzes = await getUsersWithQuizzes();
      console.log(`📊 Found ${usersWithQuizzes.size} users with quizzes`);

      const results = [];

      for (const [userId, user] of usersWithQuizzes) {
        const quiz = await getLatestQuizForUser(userId);
        
        if (quiz) {
          const sent = await sendQuizReminderEmail(user, quiz);
          results.push({
            userId,
            email: user.email,
            sent,
          });
        }
      }

      return {
        success: true,
        message: `Sent ${results.filter((r) => r.sent).length} emails`,
        results,
      };
    } catch (error: any) {
      console.error("Error sending reminders:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  }
);

/**
 * Send email reminder to CURRENT USER only
 * This is triggered by the test button in the Profile page
 * Sends email immediately to the user who clicked the button
 */
export const sendTestEmailToMe = functions.https.onCall(
  async (data, context) => {
    // Verify the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to send test email"
      );
    }

    const userId = context.auth.uid;
    console.log("📧 Sending test email to current user:", userId);

    try {
      // Get user details from Firebase Auth
      const userRecord = await admin.auth().getUser(userId);
      
      if (!userRecord.email) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "User does not have an email address"
        );
      }

      const user: User = {
        id: userId,
        email: userRecord.email,
        name: userRecord.displayName || "User",
        plan: "free", // Default, you can fetch from Firestore if stored
      };

      // Get the latest quiz for this user
      const quiz = await getLatestQuizForUser(userId);

      if (!quiz) {
        return {
          success: false,
          message: "No quiz found. Please generate a quiz first to receive email reminders.",
        };
      }

      // Send email
      const sent = await sendQuizReminderEmail(user, quiz);

      if (sent) {
        console.log(`✅ Test email sent successfully to ${user.email}`);
        return {
          success: true,
          message: `Test email sent to ${user.email}!`,
          email: user.email,
          quizTitle: quiz.title,
        };
      } else {
        throw new functions.https.HttpsError(
          "internal",
          "Failed to send email"
        );
      }
    } catch (error: any) {
      console.error("❌ Error sending test email:", error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      
      throw new functions.https.HttpsError(
        "internal",
        `Error sending test email: ${error.message}`
      );
    }
  }
);

