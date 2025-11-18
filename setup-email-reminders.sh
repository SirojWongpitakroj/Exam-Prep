#!/bin/bash

echo "📧 Setting up Daily Email Reminders for Exam Prep Assistant"
echo "============================================================"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null
then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
else
    echo "✅ Firebase CLI found"
fi

echo ""
echo "📦 Installing function dependencies..."
cd functions
npm install
cd ..

echo ""
echo "🔐 Setting up email configuration..."
echo ""
echo "Choose your email service:"
echo "1) Gmail (Recommended for testing)"
echo "2) SendGrid (Recommended for production)"
echo "3) Skip (I'll configure later)"
read -p "Enter choice (1-3): " email_choice

if [ "$email_choice" = "1" ]; then
    echo ""
    echo "Gmail Setup:"
    echo "1. Enable 2-Factor Authentication on your Gmail account"
    echo "2. Go to: https://myaccount.google.com/apppasswords"
    echo "3. Create an App Password for 'Mail'"
    echo ""
    read -p "Enter your Gmail address: " gmail_user
    read -p "Enter your Gmail App Password (16 characters): " gmail_pass
    
    firebase functions:config:set email.user="$gmail_user"
    firebase functions:config:set email.password="$gmail_pass"
    
    echo "✅ Gmail configured!"
    
elif [ "$email_choice" = "2" ]; then
    echo ""
    echo "SendGrid Setup:"
    echo "1. Sign up at: https://sendgrid.com/"
    echo "2. Create an API Key"
    echo ""
    read -p "Enter your SendGrid API Key: " sendgrid_key
    
    firebase functions:config:set sendgrid.apikey="$sendgrid_key"
    
    echo "✅ SendGrid configured!"
    echo "⚠️  Remember to update functions/src/index.ts to use SendGrid transporter"
else
    echo "⏭️  Skipping email configuration"
fi

echo ""
echo "🌍 Timezone Configuration"
echo "Current timezone in code: America/Los_Angeles"
echo ""
echo "Common timezones:"
echo "  - America/New_York (Eastern)"
echo "  - America/Chicago (Central)"
echo "  - America/Los_Angeles (Pacific)"
echo "  - Europe/London"
echo "  - Asia/Singapore"
echo ""
read -p "Do you want to change the timezone? (y/n): " change_tz

if [ "$change_tz" = "y" ]; then
    read -p "Enter your timezone (e.g., America/New_York): " timezone
    echo "⚠️  Please manually update the timezone in functions/src/index.ts"
    echo "   Change: .timeZone(\"America/Los_Angeles\") to .timeZone(\"$timezone\")"
fi

echo ""
echo "🌐 Domain Configuration"
read -p "Enter your domain (e.g., https://example.com or http://localhost:5173): " domain

echo "⚠️  Please manually update the URLs in functions/src/index.ts:"
echo "   const quizUrl = \`$domain/quiz\`;"
echo "   const dashboardUrl = \`$domain/\`;"

echo ""
echo "🔨 Building functions..."
cd functions
npm run build
cd ..

echo ""
echo "📤 Ready to deploy!"
echo ""
echo "To deploy, run:"
echo "  firebase deploy --only functions"
echo ""
echo "To test immediately, run:"
echo "  firebase functions:call sendQuizRemindersManual"
echo ""
echo "📖 For detailed instructions, see: DAILY_EMAIL_SETUP.md"
echo ""
echo "✅ Setup complete!"

