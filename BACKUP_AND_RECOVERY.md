ve# Backup & Disaster Recovery Plan

**Purpose**
Provide a clear, testable backup and disaster recovery (DR) plan for the Sista Events project so the site and data can be restored with minimal downtime and data loss.

**Scope**
- Firestore data
- Server uploads (`server/uploads/`) and static assets
- Server configuration & environment (service account keys, env vars)
- Git repository and deployment config (Vercel/GitHub)
- Convex/other third-party data (document procedures)

**Objectives & Targets**
- Recovery Point Objective (RPO): <= 1 hour for critical data; daily for non-critical
- Recovery Time Objective (RTO): <= 1 hour for frontend/backend; <= 4 hours for full recovery
- Regular test restores: monthly smoke test; quarterly full DR rehearsal

**Backup Inventory**
- Firestore: production collections (bookings, reviews, collections metadata)
- Uploads: `server/uploads/collections`, `popup-ads`, `bookings`, `reviews`
- Server code & configs: repository + `server/serviceAccountKey.json` (if used in dev)
- Environment: service accounts, API keys (store in Secret Manager)

**Backup Strategy**
1. Firestore (preferred):
   - Use managed exports to Cloud Storage (recommended):
     - Export command (requires `gcloud` and a GCP project with billing):
       ```bash
       gcloud firestore export gs://<BACKUP_BUCKET>/firestore-exports/$(date +%F_%H%M%S) --project=<PROJECT_ID>
       ```
     - Import (restore):
       ```bash
       gcloud firestore import gs://<BACKUP_BUCKET>/firestore-exports/<EXPORT_FOLDER> --project=<PROJECT_ID>
       ```
   - If not using GCP exports, run a scheduled Node script that reads collections and writes newline-delimited JSON (NDJSON) into a backup bucket or S3-compatible store.

2. Uploads directory
   - Sync to an offsite Cloud Storage bucket or S3-compatible storage daily using `gsutil rsync` or `aws s3 sync`:
     ```bash
     gsutil -m rsync -r server/uploads gs://<BACKUP_BUCKET>/uploads/$(date +%F)
     ```
   - Keep a rolling snapshot: daily backups kept 30 days, weekly kept 90 days, monthly kept 1 year.

3. Repository & config
   - GitHub repo acts as source-of-truth for code. Protect with branch protection and backups via GitHub backup or mirror to another remote occasionally.
   - Do NOT commit secrets. Export service account keys to a secure vault and rotate them.

4. Service account keys & env
   - Store secrets in a secrets manager: GitHub Secrets, Azure Key Vault, or GCP Secret Manager.
   - Automate periodic rotation (90 days recommended).

5. Convex / third-party data
   - Use vendor-provided export features; schedule exports if available and store in the same backup bucket.

**Storage & Retention**
- Primary backups: Cloud Storage bucket in same region (fast restore)
- Secondary copies: replicate to another region or provider for resilience
- Retention policy: Daily x30, Weekly x13, Monthly x12, Yearly x3 (adjust to cost/requirements)
- Encrypt backups at rest (GCS server-side encryption) and in transit (HTTPS)

**Security**
- Restrict bucket access with least-privilege IAM roles
- Use short-lived service accounts / Workload Identity / OIDC for CI access rather than checked-in keys
- Ensure backups are immutable where possible (object versioning / retention locks)

**Restore Procedures (Runbook)**
1. Firestore restore (quick restore)
   - Ensure project and correct billing / Firestore mode
   - Find latest export folder in `gs://<BACKUP_BUCKET>/firestore-exports/`
   - Run import:
     ```bash
     gcloud firestore import gs://<BACKUP_BUCKET>/firestore-exports/<EXPORT_FOLDER> --project=<PROJECT_ID>
     ```
   - Validate restored collections by querying small samples.

2. Uploads restore
   - Copy files back to server (or re-point static host):
     ```bash
     gsutil -m rsync -r gs://<BACKUP_BUCKET>/uploads/<DATE>/ server/uploads
     ```
   - Verify file permissions and web server static serving.

3. Env/service account restore
   - Recreate secrets in Secret Manager or GitHub Secrets using stored encrypted dumps
   - Attach roles to the service account with least privilege

4. Repo/Deployment
   - If repo is intact, trigger a deployment (Vercel/GitHub Actions)
   - If repo corrupted, clone mirror and push to origin, then re-deploy

**Verification & Tests**
- Automated checksum or manifest for each backup; verify after each backup
- Monthly: restore Firestore into a test project and run smoke tests against the frontend
- Quarterly: full DR rehearsal with team (simulate data loss and restore end-to-end)

**Automation & Scheduling**
- Cloud Scheduler + Cloud Functions or GitHub Actions to trigger Firestore export daily
- GitHub Actions example step (uses service account JSON from repository secret):
  - Use Workload Identity with GCP recommended; if not available, use a short-lived service account key stored in GitHub Secrets.

**Sample GitHub Action (firestore export)**
```yaml
# .github/workflows/firestore-backup.yml
name: Firestore Backup
on:
  schedule:
    - cron: '0 * * * *' # hourly (adjust)
  workflow_dispatch: {}

jobs:
  export:
    runs-on: ubuntu-latest
    steps:
      - name: Authenticate to GCP
        uses: google-github-actions/auth@v1
        with:
          workload_identity_provider: ${{ secrets.GCP_WI_PROVIDER }}
          service_account: ${{ secrets.GCP_SA_EMAIL }}

      - name: Run firestore export
        run: |
          gcloud firestore export gs://$BACKUP_BUCKET/firestore-exports/$(date +%F_%H%M%S) --project=$PROJECT_ID
        env:
          BACKUP_BUCKET: ${{ secrets.BACKUP_BUCKET }}
          PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
```

**Roles & Responsibilities**
- Owner: on-call developer — triggers restores, validates recovery
- Ops: maintain backup jobs, IAM, storage lifecycle
- Security: rotate keys, review access

**Post-Recovery Checklist**
- Validate data integrity (sample queries)
- Verify web and API endpoints
- Rotate involved credentials used during restore
- Run smoke tests and confirm monitoring/alerting is operational
- Post-mortem: document root cause and improvements

**Next Steps I can do for you**
- Implement scheduled Cloud/GitHub Actions backup (requires secrets and network access)
- Add automated restore smoke-tests and DR runbook in CI
- Configure bucket lifecycle and immutability

**Important notes**
- Test restores BEFORE relying on backups
- Prefer provider-managed exports when available (e.g., GCP Firestore exports)
- Avoid storing service account keys in the repo; use secret stores or Workload Identity

---
Generated on: 2026-05-14
