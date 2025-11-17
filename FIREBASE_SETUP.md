# Firebase Google Authentication Setup Guide

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select an existing project
3. Follow the setup wizard (you can disable Google Analytics if you don't need it)

## Step 2: Register Your Web App

1. In your Firebase project dashboard, click the **Web icon** `</>` to add a web app
2. Give your app a nickname (e.g., "Exam Prep App")
3. Click **"Register app"**
4. Copy the Firebase configuration object

## Step 3: Enable Google Authentication

1. In Firebase Console, go to **Authentication** in the left sidebar
2. Click **"Get started"** if you haven't set it up yet
3. Go to the **"Sign-in method"** tab
4. Click on **"Google"**
5. Toggle **"Enable"**
6. Select a support email
7. Click **"Save"**

## Step 4: Configure Environment Variables

1. Create a `.env` file in the root of your project (same level as `package.json`)
2. Add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

3. Replace the values with your actual Firebase config values from Step 2

## Step 5: Add Authorized Domains

1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**
2. Add your domain(s):
   - `localhost` (for development)
   - Your production domain when you deploy

## Step 6: Restart Your Development Server

```bash
# Stop the current dev server (Ctrl+C)
npm run dev
```

## Testing

1. Visit `http://localhost:8080/login`
2. Click **"Continue with Google"**
3. A Google Sign-In popup should appear
4. Select your Google account
5. You should be redirected to the home page after successful login

## Important Security Notes

- **Never commit `.env` file to version control**
- Add `.env` to your `.gitignore` file
- The `.env.example` file has been created as a template
- For production, set environment variables in your hosting platform (Vercel, Netlify, etc.)

## Troubleshooting

### Popup Blocked
- Make sure popups are allowed in your browser
- Check browser console for errors

### Auth Domain Error
- Verify `localhost` is in your Firebase authorized domains
- Check that your `.env` file is properly loaded

### Invalid API Key
- Double-check your Firebase config values in `.env`
- Make sure environment variables start with `VITE_` prefix (required for Vite)

## Demo Mode

If you haven't set up Firebase yet, the app will use demo configuration values. The Google Sign-In will fail, but you can still test the UI.

