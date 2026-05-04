# Vercel Deployment Checklist - Sista Events

This guide deploys the entire Sista Events stack to Vercel:
- **Frontend**: Vite + React (Vercel Hosting)
- **Backend**: Node.js/Express (Vercel Serverless Functions)

---

## Pre-Deployment Setup

### 1. Create New Firebase Service Account Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: **sistaer**
3. Navigate to **IAM & Admin → Service Accounts**
4. Select service account: `firebase-adminsdk-xxxxx@sistaer.iam.gserviceaccount.com`
5. Go to **Keys** tab → **Add Key → Create new key → JSON**
6. Download the file (e.g., `sista-prod-key.json`)
7. Save locally (do NOT commit to git)

### 2. Convert Service Account Key to Base64

Run this command to convert and copy the secret:

**macOS/Linux:**
```bash
cat sista-prod-key.json | base64 -w 0 | pbcopy
echo "✓ Base64 secret copied to clipboard"
```

**Windows PowerShell:**
```powershell
$content = [System.IO.File]::ReadAllBytes("sista-prod-key.json")
$b64 = [System.Convert]::ToBase64String($content)
$b64 | Set-Clipboard
Write-Host "✓ Base64 secret copied to clipboard"
$b64  # also print it
```

**Paste the output somewhere safe** (you'll use it in the next step).

### 3. Revoke Old Service Account Keys (Recommended)

1. In GCP Console → Service Accounts → Your service account → **Keys**
2. Click the trash icon next to old key(s) to delete them
3. This immediately invalidates the old credentials

---

## Vercel Deployment Steps

### Option A: Using Vercel CLI (Recommended)

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
# Follow prompts to authenticate
```

#### Step 3: Deploy Frontend

```bash
# From project root (sistawebupdate)
vercel --prod
# Select project or create new
# Vercel will auto-detect Vite config and deploy
```

Save the frontend URL (e.g., `https://sista-events.vercel.app`).

#### Step 4: Deploy Backend (Serverless Function)

The backend is deployed as Vercel Serverless Functions. Two approaches:

**Approach A: Auto-detect (Recommended)**
```bash
vercel --prod --cwd=server
# or link the server/ folder as a separate project in Vercel dashboard
```

**Approach B: Manual API Route**
Create `api/bookings.js` in the Vite project root if needed, or configure `vercel.json` (see below).

#### Step 5: Set Environment Variable in Vercel

```bash
# Set the SERVICE_ACCOUNT_JSON_BASE64 secret
vercel env add SERVICE_ACCOUNT_JSON_BASE64
# When prompted, paste the base64 string from Step 2
# Select environments: Production, Preview, Development
```

#### Step 6: Redeploy with Secret

```bash
vercel --prod
# Vercel will rebuild and deploy with the new environment variable
```

#### Step 7: Update Frontend API URL

If backend is deployed to a separate Vercel project:

1. Get the backend URL (e.g., `https://sista-backend.vercel.app`)
2. Update frontend `.env.production`:
   ```env
   VITE_API_URL=https://sista-backend.vercel.app
   ```
3. Redeploy frontend:
   ```bash
   vercel --prod
   ```

---

### Option B: Using Vercel Web Dashboard

#### Step 1: Add Project to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New...** → **Project**
3. Import from Git (connect GitHub, GitLab, Bitbucket)
4. Select repository: `niidoku01/sistaevents.site`
5. Click **Import**

#### Step 2: Configure Build Settings

- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

Click **Deploy**.

#### Step 3: Set Environment Variables

1. After deployment, go to **Settings → Environment Variables**
2. Click **Add New**
   - **Name**: `SERVICE_ACCOUNT_JSON_BASE64`
   - **Value**: paste the base64 string from Step 2 above
   - **Environments**: Select all (Production, Preview, Development)
3. Click **Save**

#### Step 4: Redeploy

1. Go to **Deployments**
2. Click the latest deployment
3. Click **Redeploy** (or push to `main` branch in git to auto-redeploy)

#### Step 5: Deploy Backend as Separate Project (if needed)

1. Click **Add New → Project** again
2. Select `niidoku01/sistaevents.site` and configure for `server/` folder:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Install Command**: `npm install` (no build needed for Express)
3. Set the same `SERVICE_ACCOUNT_JSON_BASE64` environment variable
4. Deploy

---

## Configuration Files

### Vite Frontend `vercel.json` (Optional)

Create `vercel.json` in project root if you want explicit Vercel config:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "@vite_api_url",
    "VITE_CONVEX_URL": "@vite_convex_url"
  }
}
```

### Backend Express `vercel.json` (for server/)

If deploying server as a separate Vercel project, create `server/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "PORT": "3000"
  }
}
```

Then run:
```bash
vercel --cwd=server --prod
```

---

## Verify Deployment

### 1. Check Frontend

Open your frontend URL in browser (e.g., `https://sista-events.vercel.app`):
- Homepage loads ✓
- Testimonials section shows approved reviews ✓
- Popup ads display correctly ✓
- Admin login works ✓

### 2. Check Backend Health

```bash
curl https://your-backend-url/api/health
# Expected: { "status": "Backend is running" }
```

### 3. Check Firebase Initialization

In Vercel dashboard → **Deployment → Logs**:
- Look for: `"Firebase Admin initialized using SERVICE_ACCOUNT_JSON_BASE64"`
- This confirms the environment variable was read

### 4. Test API Endpoints

```bash
# Get approved reviews
curl https://your-backend-url/api/reviews

# Test booking submission
curl -X POST https://your-backend-url/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "eventDate": "2026-06-01",
    "message": "Test booking"
  }'

# Get health check
curl https://your-backend-url/api/health
```

### 5. Verify Firestore Access

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **sistaer**
3. Firestore Database → **Collections**
4. Check `bookings`, `reviews`, `popupAds` collections
5. Verify reads/writes working (new bookings should appear)

---

## Common Issues & Solutions

### Issue: "Firebase Admin initialized without explicit credentials"

**Cause**: `SERVICE_ACCOUNT_JSON_BASE64` env var not set.

**Solution**:
1. Go to Vercel dashboard → Settings → Environment Variables
2. Verify `SERVICE_ACCOUNT_JSON_BASE64` is set
3. Redeploy (`vercel --prod`)

### Issue: Invalid base64 / "Failed to decode SERVICE_ACCOUNT_JSON_BASE64"

**Cause**: Base64 string has extra line breaks or was truncated.

**Solution**:
1. Re-generate base64 (ensure no line breaks):
   ```bash
   # macOS/Linux
   cat sista-prod-key.json | base64 -w 0
   ```
2. Copy the ENTIRE output (no line breaks)
3. Update Vercel env var and redeploy

### Issue: Firestore permission denied

**Cause**: Service account doesn't have required roles.

**Solution**:
1. GCP Console → IAM & Admin → Roles
2. Verify service account has:
   - `Firebase Admin`
   - `Firestore Admin`
   - `Cloud Datastore User` (if using Firestore)
3. Grant roles if missing

### Issue: CORS error from frontend to backend

**Cause**: Frontend URL not in backend `ALLOWED_ORIGINS`.

**Solution**:
1. Update `server/server.js` - `ALLOWED_ORIGINS`:
   ```bash
   vercel env add ALLOWED_ORIGINS
   # Value: https://your-frontend-url.vercel.app
   ```
2. Or pass as env var and update `server/server.js` to read it

### Issue: Backend times out on requests

**Cause**: Vercel Serverless Function timeout (default 60s).

**Solution**:
1. In `server/vercel.json`, add:
   ```json
   "functions": {
     "api/index.js": {
       "maxDuration": 300
     }
   }
   ```
2. Max duration: 300s on Pro plan, 10s on Hobby

---

## Post-Deployment Checklist

- [ ] Frontend URL is accessible and loads
- [ ] Admin login works
- [ ] `/api/health` returns success
- [ ] Reviews/bookings appear in Firestore
- [ ] Testimonials show approved reviews
- [ ] Popup ads display on homepage
- [ ] SMS notifications work (if Twilio configured)
- [ ] Old service account key is deleted from GCP
- [ ] No unencrypted secrets in git history (run `git log -p | grep -i "AIza\|firebase\|secret"`)

---

## Rollback Plan (if needed)

If deployment fails:

1. **Revert git commit**:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Revert Vercel deployment**:
   - Vercel dashboard → Deployments → Click previous successful deployment
   - Click **Promote to Production**

3. **Restore old service account** (if rotated):
   - GCP Console → Service Accounts → Keys → Re-add old key
   - Update Vercel env var to old secret
   - Redeploy

---

## Next Steps

1. ✅ Create new service account key (Step 1-2)
2. ✅ Convert to base64 (Step 2)
3. ✅ Deploy to Vercel (Option A or B)
4. ✅ Set environment variable
5. ✅ Verify deployment
6. ✅ Clean up (delete old key from GCP)

If you have questions or need help, check the **Troubleshooting** section or refer back to [FIREBASE_SERVICE_ACCOUNT_ROTATION.md](FIREBASE_SERVICE_ACCOUNT_ROTATION.md) for detailed GCP steps.

