# Firebase Service Account Rotation Guide

This guide explains how to rotate the Firebase service account and securely deploy the new key to production using `SERVICE_ACCOUNT_JSON_BASE64` environment variable.

---

## Step 1: Create a New Service Account Key in GCP

1. **Open Google Cloud Console**
   - Navigate to [console.cloud.google.com](https://console.cloud.google.com)
   - Select your Firebase project (sistaer)

2. **Create or Retrieve the Service Account**
   - Go to **IAM & Admin** → **Service Accounts**
   - Locate the service account used for Firebase Admin SDK (usually named `firebase-adminsdk-xxxxx@sistaer.iam.gserviceaccount.com`)
   - If none exists, click **Create Service Account** and grant roles: `Firebase Admin`, `Firestore Admin`, `Storage Admin`

3. **Create a New Key**
   - Click on the service account name
   - Go to **Keys** tab
   - Click **Add Key** → **Create new key**
   - Choose **JSON** format
   - Download the file (e.g., `sista-service-account.json`)

4. **Revoke Old Keys (Recommended)**
   - In the same **Keys** tab, click the trash icon next to old keys to delete them
   - This immediately invalidates the old credentials

---

## Step 2: Prepare the Base64 Secret

Run this command locally to convert the downloaded JSON to base64:

```bash
# On macOS/Linux
cat sista-service-account.json | base64 -w 0 > /tmp/svcacct-b64.txt
cat /tmp/svcacct-b64.txt

# On Windows PowerShell
$content = [System.IO.File]::ReadAllBytes("sista-service-account.json")
$b64 = [System.Convert]::ToBase64String($content)
$b64 | Set-Clipboard
$b64  # also print to console
```

**IMPORTANT**: Do NOT commit this base64 string to git. Treat it as a secret.

Copy the output string — you'll paste it into your hosting provider's secret manager in the next step.

---

## Step 3: Deploy to Your Platform

### **Option A: Vercel**

1. **Set the Secret in Vercel**
   ```bash
   # Using Vercel CLI (requires login)
   vercel env add SERVICE_ACCOUNT_JSON_BASE64
   # When prompted, paste the base64 string
   # Select: Production, Preview, Development (or all)
   ```

2. **Or via Web Dashboard**
   - Go to [vercel.com](https://vercel.com) → Select your project
   - Settings → Environment Variables
   - Click **Add New**
   - Name: `SERVICE_ACCOUNT_JSON_BASE64`
   - Value: paste the base64 string
   - Select scopes: Production, Preview, Development
   - Click **Save**

3. **Redeploy**
   ```bash
   git push origin main  # or trigger deploy via web
   # Vercel will rebuild and deploy with the new env var
   ```

4. **Verify**
   - After deployment, check logs in Vercel dashboard for: `"Firebase Admin initialized using SERVICE_ACCOUNT_JSON_BASE64"`

---

### **Option B: Netlify**

1. **Set the Secret in Netlify**
   - Go to [netlify.com](https://netlify.com) → Select your site
   - Site settings → Build & deploy → Environment
   - Click **Edit variables**
   - Add variable: `SERVICE_ACCOUNT_JSON_BASE64` = base64 string
   - Click **Save**

2. **Trigger Redeploy**
   ```bash
   git push origin main  # or manually trigger via Netlify UI
   ```

3. **Verify**
   - In Netlify Deploys, open the latest deploy logs
   - Search for: `"Firebase Admin initialized using SERVICE_ACCOUNT_JSON_BASE64"`

---

### **Option C: Google Cloud Run (Recommended for Backend)**

1. **Deploy Backend as Cloud Run Service**
   ```bash
   # Install Google Cloud SDK if needed
   # https://cloud.google.com/sdk/docs/install

   gcloud auth login
   gcloud config set project sistaer

   # Build and push to Container Registry
   cd server
   docker build -t gcr.io/sistaer/sista-backend .
   docker push gcr.io/sistaer/sista-backend

   # Deploy to Cloud Run
   gcloud run deploy sista-backend \
     --image gcr.io/sistaer/sista-backend \
     --platform managed \
     --region us-central1 \
     --set-env-vars="SERVICE_ACCOUNT_JSON_BASE64=<paste-base64-string-here>" \
     --allow-unauthenticated
   ```

2. **Or via Google Cloud Console**
   - Go to Cloud Run
   - Click **Create Service**
   - Select container image: `gcr.io/sistaer/sista-backend` (or deploy from source)
   - Set Memory: 512 MB, Timeout: 3600s
   - Under **Runtime settings** → **Set environment variables**
   - Add: `SERVICE_ACCOUNT_JSON_BASE64` = base64 string
   - Deploy

3. **Update Frontend VITE_API_URL**
   - Vite frontend should point to the Cloud Run service URL (e.g., `https://sista-backend-xxxxx.run.app`)
   - Update `VITE_API_URL` in `.env.production` or deployment settings

---

### **Option D: Heroku (Legacy but Still Supported)**

1. **Set Config Var**
   ```bash
   heroku login
   heroku apps:create sista-backend  # if not already created
   heroku config:set SERVICE_ACCOUNT_JSON_BASE64="<paste-base64-string>" -a sista-backend
   ```

2. **Or via Web Dashboard**
   - Go to [heroku.com](https://heroku.com) → Select app
   - Settings → Config Vars
   - Click **Reveal Config Vars** → **Add**
   - KEY: `SERVICE_ACCOUNT_JSON_BASE64`
   - VALUE: paste base64 string
   - Click **Add**

3. **Redeploy**
   ```bash
   git push heroku main
   ```

---

### **Option E: Azure App Service**

1. **Set Application Settings**
   ```bash
   # Using Azure CLI
   az login
   az webapp config appsettings set \
     --resource-group <your-resource-group> \
     --name <your-app-name> \
     --settings SERVICE_ACCOUNT_JSON_BASE64="<paste-base64-string>"
   ```

2. **Or via Azure Portal**
   - Azure Portal → App Services → Your App
   - Settings → Configuration
   - Click **New application setting**
   - Name: `SERVICE_ACCOUNT_JSON_BASE64`
   - Value: paste base64 string
   - Click **OK** → **Save**

3. **Redeploy**
   - Restart the app (Configuration → General Settings → **Restart**)
   - Or redeploy from git/container

---

### **Option F: Firebase Hosting (Frontend) + Cloud Functions (Backend)**

Frontend (Vite) on Firebase Hosting:
```bash
npm run build
firebase deploy --only hosting
```

Backend (Node) as Cloud Function:
```bash
# Create a Cloud Function in server/
gcloud functions deploy sista-backend \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars="SERVICE_ACCOUNT_JSON_BASE64=<base64-string>" \
  --source=./server
```

---

## Step 4: Verify the Deployment

After deploying to your platform, verify that the new service account is active:

1. **Check Server Logs**
   - Look for: `"Firebase Admin initialized using SERVICE_ACCOUNT_JSON_BASE64"`
   - This confirms the environment variable was read successfully

2. **Test API Endpoints**
   ```bash
   # Test health check
   curl https://your-backend-url/api/health

   # Test Firestore access (should see reviews)
   curl https://your-backend-url/api/reviews

   # Test booking submission
   curl -X POST https://your-backend-url/api/bookings \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com",
       "phone": "+1234567890",
       "eventDate": "2026-06-01"
     }'
   ```

3. **Check Firestore in GCP Console**
   - Go to Firestore Database
   - Browse collections to confirm reads/writes are working with the new service account

---

## Step 5: Clean Up Old Service Account (Optional but Recommended)

Once verified that the new key works in production:

1. **Delete the Old Key in GCP**
   - Service Accounts → Your service account → Keys
   - Delete the old key(s) from the JSON column

2. **Revoke Old Credentials if Leaked**
   - If the old key was exposed, consider creating a new service account entirely
   - Update all references (github secrets, CI/CD, etc.)

---

## Troubleshooting

### Error: "Invalid base64 JSON"
- Ensure the entire base64 string was copied correctly (no line breaks or extra characters)
- Regenerate: `cat sista-service-account.json | base64 -w 0`

### Error: "Firebase Admin initialized without explicit credentials"
- The environment variable was NOT set; check platform dashboard
- Restart/redeploy after saving the env var

### Error: "Permission denied" on Firestore
- Verify the service account has roles: `Firebase Admin`, `Firestore Admin`
- Check IAM & Admin → Service Accounts → Roles

### API returns 500 on /api/bookings or /api/reviews
- Check server logs for Firebase init errors
- Verify `SERVICE_ACCOUNT_JSON_BASE64` is valid base64
- Test locally first: `node server/server.js` with `SERVICE_ACCOUNT_JSON_BASE64=<base64>`

---

## Summary of Environment Variables

| Variable | Purpose | Priority |
|----------|---------|----------|
| `SERVICE_ACCOUNT_JSON_BASE64` | Base64-encoded service account JSON (NEW, preferred) | 1 (highest) |
| `SERVICE_ACCOUNT_JSON` | Raw JSON string (alternative) | 2 |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account file | 3 |
| `server/serviceAccountKey.json` | Local file (dev only, not in git) | 4 |
| (none) | Application Default Credentials (ADC) | 5 (lowest) |

Server will use the first available in order.

---

## Security Best Practices

✅ **DO:**
- Use `SERVICE_ACCOUNT_JSON_BASE64` env var (never committed)
- Store secrets in hosting provider's secret manager
- Rotate keys every 90 days
- Delete old keys after verifying new ones work
- Enable audit logging in GCP

❌ **DON'T:**
- Commit `server/serviceAccountKey.json` to git
- Share base64 strings in Slack or email
- Hardcode secrets in code or config files
- Use the same key across dev, staging, and production

---

## Questions?

If you encounter issues:
1. Check the server logs for "Firebase Admin initialized" message
2. Verify the base64 string has no line breaks
3. Restart the service after setting the env var
4. Test locally first with `node server/server.js`

