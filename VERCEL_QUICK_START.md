# Vercel Deployment - Quick Start (5 Steps)

## Step 1: Create New Firebase Service Account Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project **sistaer** → IAM & Admin → Service Accounts
3. Click service account → Keys → Add Key → Create new key → JSON
4. Download the file (`sista-prod-key.json`)
5. Save locally (do NOT commit)

---

## Step 2: Convert to Base64

**macOS/Linux:**
```bash
cat sista-prod-key.json | base64 -w 0 | pbcopy
echo "✓ Copied to clipboard"
```

**Windows PowerShell:**
```powershell
$content = [System.IO.File]::ReadAllBytes("sista-prod-key.json")
$b64 = [System.Convert]::ToBase64String($content)
$b64 | Set-Clipboard
$b64  # print it too
```

**👉 Save this base64 string — you'll use it in Step 4**

---

## Step 3: Push Code to Git

Make sure the updated `server/server.js` (with SERVICE_ACCOUNT_JSON_BASE64 support) is committed:

```bash
git add server/server.js server/vercel.json
git commit -m "chore: add SERVICE_ACCOUNT_JSON_BASE64 support for Vercel"
git push origin main
```

---

## Step 4: Deploy to Vercel (via CLI - Fastest)

### Install Vercel CLI
```bash
npm install -g vercel
vercel login
```

### Deploy Frontend
```bash
vercel --prod
# Select project or create new "sista-events"
# Wait for deployment to complete
# Note the frontend URL (e.g., https://sista-events.vercel.app)
```

### Set Secret in Vercel
```bash
vercel env add SERVICE_ACCOUNT_JSON_BASE64
# Paste the base64 string from Step 2
# Select: Production, Preview, Development
```

### Redeploy with Secret
```bash
vercel --prod
# Redeploys with the environment variable active
```

### Deploy Backend (Optional - if separate project)
```bash
vercel --cwd=server --prod
# Or deploy as part of the same project using API routes
```

---

## Step 5: Verify

### Check Frontend
Open in browser: `https://sista-events.vercel.app` (or your project URL)
- Homepage loads ✓
- Testimonials show ✓
- Admin login works ✓

### Check Backend
```bash
curl https://your-backend-url/api/health
# Expected: { "status": "Backend is running" }
```

### Check Logs
Vercel Dashboard → Deployments → Click latest → **Logs**
Look for: `"Firebase Admin initialized using SERVICE_ACCOUNT_JSON_BASE64"`

---

## Done! 🎉

Your app is now deployed on Vercel with the new Firebase service account.

### Optional: Delete Old Key
Go to GCP Console → Service Accounts → Your service account → Keys
Delete the old key(s) to ensure they're not used anywhere else.

---

## Troubleshooting

**Issue: Firebase not initializing**
- Check Vercel Logs for error message
- Verify base64 string was copied completely (no line breaks)
- Re-run `vercel env add SERVICE_ACCOUNT_JSON_BASE64` and `vercel --prod`

**Issue: CORS error**
- Add your frontend URL to `ALLOWED_ORIGINS` env var or update `server/server.js`

**Issue: 502 errors**
- Check Vercel function logs
- Ensure `server/vercel.json` exists with `maxDuration: 300`

For detailed steps, see [VERCEL_DEPLOYMENT_CHECKLIST.md](VERCEL_DEPLOYMENT_CHECKLIST.md)

