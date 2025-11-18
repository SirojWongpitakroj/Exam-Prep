import { saveQuizToFirestore, getUserQuizzes } from "./firestoreService";

// Test function to verify quiz Firestore functionality
export const testQuizSave = async (userId: string) => {
  console.log("=== TESTING QUIZ FIRESTORE ===");
  console.log("User ID:", userId);

  try {
    // Create a test quiz
    const testQuiz = {
      user_id: userId,
      title: "Test Quiz - Manual Test",
      questions: [
        {
          id: "test-1",
          question: "What is 2 + 2?",
          options: ["3", "4", "5", "6"],
          correctAnswer: 1,
          explanation: "Basic math",
        },
        {
          id: "test-2",
          question: "What color is the sky?",
          options: ["Red", "Blue", "Green", "Yellow"],
          correctAnswer: 1,
        },
      ],
      userPlan: "free" as const,
    };

    console.log("Attempting to save test quiz...");
    console.log("Test quiz data:", JSON.stringify(testQuiz, null, 2));

    const quizId = await saveQuizToFirestore(testQuiz);
    
    console.log("✅ Test quiz saved successfully!");
    console.log("Quiz ID:", quizId);

    // Try to retrieve it
    console.log("Attempting to retrieve quizzes...");
    const quizzes = await getUserQuizzes(userId);
    console.log("Retrieved quizzes:", quizzes.length);
    console.log("Quizzes data:", JSON.stringify(quizzes, null, 2));

    return { success: true, quizId, quizzesCount: quizzes.length };
  } catch (error) {
    console.error("❌ Test quiz save failed!");
    console.error("Error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return { success: false, error };
  }
};

