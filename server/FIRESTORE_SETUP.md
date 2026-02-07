# Firebase Firestore Setup for Bookings

This project now uses Firebase Firestore to store bookings data. The JSON file system is kept as a backup.

## Setup Instructions

### 1. Enable Firestore in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/sistaer/firestore)
2. Click "Create Database" if not already created
3. Choose "Start in production mode" or "Start in test mode"
4. Select a location (e.g., us-central)

### 2. Set up Firebase Admin SDK

For **production** deployment:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file as `serviceAccountKey.json` in the `server/` directory
4. Update `server.js` to use the service account:
   ```javascript
   admin.initializeApp({
     credential: admin.credential.cert(require('./serviceAccountKey.json'))
   });
   ```

For **development** (current setup):

The server uses Application Default Credentials. To authenticate:

```bash
# Install Google Cloud SDK, then run:
gcloud auth application-default login
```

Or set the environment variable:
```bash
set GOOGLE_APPLICATION_CREDENTIALS=path\to\serviceAccountKey.json
```

### 3. Firestore Security Rules

Set up security rules in Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Bookings collection - only authenticated users can read/write
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null;
      // Or for public write (form submissions):
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }
  }
}
```

## How It Works

### POST /api/bookings
- Saves booking to Firestore collection `bookings`
- Also saves to JSON file as backup
- Sends SMS notifications if configured

### GET /api/bookings
- Fetches all bookings from Firestore (ordered by creation date)
- Falls back to JSON file if Firestore fails

### DELETE /api/bookings/:id
- Deletes from both Firestore and JSON file

## Collections Structure

### bookings
```
{
  id: string (timestamp),
  name: string,
  email: string,
  phone: string,
  eventDate: string,
  message: string,
  createdAt: string (ISO 8601)
}
```

## Client-Side Updates

The admin dashboard (`src/pages/admin/Bookings.tsx`) automatically fetches from the API, which now returns Firestore data.

No changes needed on the client side - the API abstraction handles it all!

## Troubleshooting

- **"Firebase Admin initialization failed"**: Check that Firebase Admin SDK is installed (`npm install firebase-admin`) and credentials are configured
- **"Permission denied"**: Check Firestore security rules
- **Firestore not saving**: Verify projectId in server.js matches your Firebase project

## Note

The JSON file backup ensures no data loss during Firestore migration or if Firestore is unavailable.
