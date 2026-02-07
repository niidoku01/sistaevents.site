# Security Testing Guide

## Quick Security Tests

### 1. Rate Limiting Test

**Test the booking endpoint rate limit:**

```bash
# Make 6 rapid requests (limit is 5 per 15 minutes)
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/bookings \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test User",
      "email": "test@example.com",
      "phone": "1234567890",
      "eventDate": "2026-02-01",
      "message": "Test booking"
    }'
  echo "\n---\n"
done
```

**Expected**: 6th request should return 429 (Too Many Requests)

### 2. Input Validation Test

**Test invalid email:**
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "invalid-email",
    "phone": "1234567890",
    "eventDate": "2026-02-01"
  }'
```
**Expected**: 400 error with validation details

**Test XSS attempt:**
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<script>alert(\"XSS\")</script>",
    "email": "test@example.com",
    "phone": "1234567890",
    "eventDate": "2026-02-01"
  }'
```
**Expected**: 400 error (name contains invalid characters)

### 3. CORS Test

**Test from unauthorized origin:**
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Origin: https://malicious-site.com" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@example.com",
    "phone": "1234567890",
    "eventDate": "2026-02-01"
  }'
```
**Expected**: CORS error if origin not in whitelist

### 4. File Upload Security Test

**Test invalid file type:**
```bash
curl -X POST http://localhost:5000/api/uploads/collections \
  -F "images=@test.txt"
```
**Expected**: Error "Only image files are allowed"

**Test oversized file:**
```bash
# Create a 15MB file (limit is 10MB)
dd if=/dev/zero of=large.jpg bs=1M count=15
curl -X POST http://localhost:5000/api/uploads/collections \
  -F "images=@large.jpg"
```
**Expected**: File size limit error

### 5. Security Headers Test

**Check server headers:**
```bash
curl -I http://localhost:5000/api/bookings
```

**Expected headers:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy: ...`

### 6. Frontend Security Headers Test

```bash
curl -I http://localhost:8080
```

**Expected headers:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Automated Security Testing

### Run NPM Audit

```bash
# Check for vulnerabilities
cd server && npm audit
cd .. && npm audit

# Fix vulnerabilities
cd server && npm audit fix
cd .. && npm audit fix
```

### Check for Outdated Packages

```bash
cd server && npm outdated
cd .. && npm outdated
```

## Manual Security Checklist

- [ ] Rate limiting works (test with 6+ rapid requests)
- [ ] Input validation rejects invalid data
- [ ] XSS attempts are blocked
- [ ] CORS blocks unauthorized origins
- [ ] File uploads reject non-images
- [ ] File uploads reject oversized files
- [ ] Security headers are present in responses
- [ ] No sensitive data in error messages
- [ ] HTTPS enabled in production
- [ ] Environment variables not exposed
- [ ] Source maps disabled in production build

## Production Security Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Configure `FRONTEND_URL` environment variable
- [ ] Update CORS whitelist with production domains
- [ ] Enable HTTPS/SSL certificate
- [ ] Test rate limiting with production traffic
- [ ] Verify Firestore security rules
- [ ] Disable debug/development endpoints
- [ ] Review all environment variables
- [ ] Test error handling (don't expose stack traces)
- [ ] Verify file upload works with production storage

## Common Issues & Solutions

### Issue: CORS error in production
**Solution**: Add production domain to `allowedOrigins` array in server.js

### Issue: Rate limiting too strict
**Solution**: Adjust `windowMs` and `max` values in rate limiter configuration

### Issue: Valid files rejected
**Solution**: Check `allowedMimes` array in multer configuration

### Issue: Validation errors unclear
**Solution**: Check validation middleware in booking endpoint

## Security Monitoring

**Things to monitor in production:**

1. Failed login attempts (if auth added)
2. Rate limit violations
3. File upload attempts
4. Invalid input patterns
5. Unusual request patterns
6. Server errors and stack traces
7. Failed database operations

**Recommended tools:**
- Winston for logging
- Sentry for error tracking
- Cloudflare for DDoS protection
- Google Cloud Monitoring (if using GCP)

## Emergency Response

If security breach detected:

1. **Immediate**: Disable affected endpoints
2. **Review**: Check logs for attack patterns
3. **Patch**: Fix vulnerability immediately
4. **Rotate**: Change all API keys and secrets
5. **Monitor**: Watch for continued attempts
6. **Document**: Record incident and response

---

**Note**: These tests should be run in a development/staging environment, not production.
