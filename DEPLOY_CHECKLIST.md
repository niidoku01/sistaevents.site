# Deployment Checklist

## Pre-Deployment (Local)

- [ ] Run `npm run build` and verify no TypeScript/ESLint errors
- [ ] Test admin login page (password eye toggle working)
- [ ] Test booking phone dropdown (Call/WhatsApp with color hover)
- [ ] Test gallery images load and lazy-load as expected
- [ ] Verify popup ad appears 3 seconds after search (URL has `?`)
- [ ] Test blocked dates display with red (upcoming) and green (past) badges
- [ ] Verify all admin header elements fit on mobile (single line)
- [ ] Run `npm run preview` to test production build locally

## Firebase Configuration

### Firestore Rules (`firestore.rules`)
- [ ] Rules are published to Firestore (via Firebase CLI or console)
- [ ] Admin auth check uses hardcoded admin email or custom claims
- [ ] Bookings collection is admin-read/write only
- [ ] Reviews allow public read, authenticated create
- [ ] Collections allow public read, admin write

### Storage Rules (`storage.rules`)
- [ ] **CRITICAL**: Booking attachments now require admin auth (no longer public-write)
- [ ] Gallery images remain public-read, admin-write
- [ ] Popup ad images have 2 MB size limit and image content type check
- [ ] All other paths default-deny

**⚠️ Impact**: If your public booking flow uploads files to `/bookings/{bookingId}/`, it will fail. You need either:
  - A separate public uploads bucket with different auth rules
  - A backend API endpoint that handles uploads on behalf of users
  - Manual admin upload only

## Vercel Deployment

### Environment Variables
- [ ] All `VITE_*` Firebase keys are set in Vercel project settings
- [ ] `VITE_FIREBASE_API_KEY` is public, others should be treated as sensitive
- [ ] Convex environment variables (if applicable) are configured

### Security Headers (`vercel.json`)
- [ ] Content-Security-Policy is configured and tested
- [ ] HSTS, X-Content-Type-Options, X-Frame-Options are set
- [ ] Permissions-Policy restricts camera, microphone, geolocation
- [ ] CORS headers match your domain

### Redirects
- [ ] SPA fallback to `/index.html` is active (for client-side routing)
- [ ] Static assets have long cache TTL (1 year, immutable)
- [ ] HTML pages have no-cache to allow updates

### Domain & SSL
- [ ] Custom domain is configured in Vercel project
- [ ] SSL certificate is auto-provisioned and active
- [ ] DNS records point to Vercel

## Testing Post-Deployment

- [ ] Homepage loads and images render (check Network tab for lazy loading)
- [ ] Admin login works (Firebase auth from Vercel domain)
- [ ] Bookings page displays booking IDs in YEAR-XXX format
- [ ] Phone dropdowns show Call/WhatsApp with correct hover colors
- [ ] Gallery loads collection images with correct lazy-load behavior
- [ ] Blocked dates show red (upcoming) and green (past)
- [ ] Popup ad appears after 3s delay on search queries
- [ ] CSP headers are present (DevTools → Network → Response Headers)
- [ ] No console errors related to CSP, CORS, or auth

## Rollback Plan

- [ ] If bookings break, revert `storage.rules` to allow public uploads (temporary)
- [ ] If Firestore rules cause issues, revert rules from Firebase Console
- [ ] If Vercel deploy fails, use "Rollback" button in Deployment history
- [ ] Keep a backup of working `.env` and `vercel.json` files

## Post-Deployment Monitoring

- [ ] Check Vercel Analytics for Core Web Vitals
- [ ] Monitor Firebase usage and quota (especially image storage)
- [ ] Set up error logging (Sentry, LogRocket, or Firebase Crashlytics)
- [ ] Review admin login attempts in Firebase Authentication logs
