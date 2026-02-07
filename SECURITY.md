# Security Best Practices & Implementation

This document outlines the security measures implemented in the Sista Events & Rentals web application.

## 🔒 Implemented Security Features

### 1. Backend Security (Express Server)

#### Helmet.js - HTTP Security Headers
- **Content Security Policy (CSP)**: Prevents XSS attacks by controlling resource loading
- **X-Content-Type-Options**: Prevents MIME-type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-XSS-Protection**: Enables browser's XSS filter

#### Rate Limiting
- **General API Rate Limit**: 100 requests per 15 minutes per IP
- **Booking Endpoint Rate Limit**: 5 booking attempts per 15 minutes per IP
- **Protection against**: Brute force attacks, DoS attacks, spam submissions

#### CORS (Cross-Origin Resource Sharing)
- **Configured Origins**: Only allows requests from trusted domains
- **Production Setup**: Set `FRONTEND_URL` environment variable
- **Default Allowed Origins**:
  - `http://localhost:8080` (Vite dev server)
  - `http://localhost:5173` (Alternative Vite port)
  - `http://localhost:3000` (React dev server)

#### Input Validation & Sanitization
- **express-validator**: Validates all booking form inputs
- **Name**: 2-100 characters, letters/spaces/hyphens only
- **Email**: Valid email format, normalized
- **Phone**: 10-20 characters, numbers and standard phone symbols
- **Event Date**: ISO 8601 date format
- **Message**: Optional, max 1000 characters
- **Parameter Pollution Prevention**: Removes duplicate query parameters

#### File Upload Security
- **Allowed File Types**: JPEG, PNG, GIF, WebP only
- **File Size Limit**: 10MB per file
- **Upload Limit**: Maximum 10 files per request
- **Secure Naming**: Timestamp-based unique filenames

### 2. Frontend Security (Vite + React)

#### Security Headers
- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: Enabled with blocking mode
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: Restricts camera, microphone, geolocation access

#### Build Optimization
- **Minification**: Terser minification enabled
- **Source Maps**: Disabled in production (prevents code exposure)
- **Code Splitting**: Vendor chunks separated for better caching

## 🔧 Environment Variables

Create a `.env` file in the `server/` directory with the following variables:

```env
# Frontend URL (for CORS)
FRONTEND_URL=https://yourdomain.com

# Firebase Configuration
GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json

# Twilio Configuration (Optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM=+1234567890
BOOKINGS_SMS_TO=+1234567890
SEND_CONFIRMATION_TO_CUSTOMER=false

# Server Configuration
PORT=5000
NODE_ENV=production
```

## 🛡️ Additional Security Recommendations

### 1. HTTPS/SSL Certificate
- **Action Required**: Deploy with HTTPS in production
- **Options**:
  - Let's Encrypt (Free)
  - Cloudflare SSL
  - Commercial SSL certificate
- **Why**: Encrypts data in transit, prevents man-in-the-middle attacks

### 2. Environment Variables
- ✅ Never commit `.env` files to version control
- ✅ Use different credentials for development/production
- ✅ Rotate secrets regularly (Firebase keys, API tokens)

### 3. Database Security (Firebase Firestore)
- **Setup Firestore Security Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow server-side writes
    match /bookings/{booking} {
      allow read: if request.auth != null;
      allow write: if false; // Only allow via Admin SDK
    }
    match /collections/{collection} {
      allow read: if true; // Public read
      allow write: if false; // Only allow via Admin SDK
    }
  }
}
```

### 4. Regular Security Maintenance
- [ ] Run `npm audit` regularly to check for vulnerabilities
- [ ] Update dependencies monthly: `npm update`
- [ ] Review security advisories for your dependencies
- [ ] Monitor server logs for suspicious activity

### 5. Additional Headers (Future Enhancement)
Consider adding these headers in production:
```javascript
// In server.js
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  next();
});
```

### 6. API Authentication (Future Enhancement)
For admin endpoints, consider implementing:
- JWT (JSON Web Tokens) for authentication
- OAuth 2.0 for third-party integrations
- API keys for service-to-service communication

### 7. Data Sanitization
- ✅ Already implemented: Input validation on all form fields
- ✅ Email normalization to prevent duplicates
- ✅ Trim whitespace from all text inputs

### 8. Logging & Monitoring
**Recommended Implementation**:
```javascript
// Add logging middleware
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log all requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});
```

### 9. Backup & Recovery
- Enable automated Firestore backups
- Keep local JSON backup files (already implemented)
- Test restore procedures regularly

### 10. Firebase Admin SDK Security
- ✅ Service account credentials stored securely
- ✅ Minimal permissions principle
- Consider using Workload Identity in cloud environments

## 🚨 Security Incident Response

If you suspect a security breach:

1. **Immediate Actions**:
   - Disable affected endpoints
   - Rotate all API keys and secrets
   - Review server logs for suspicious activity

2. **Investigation**:
   - Check Firebase audit logs
   - Review rate limit violations
   - Analyze request patterns

3. **Recovery**:
   - Patch vulnerabilities
   - Update dependencies
   - Restore from clean backups if needed

## 📋 Security Checklist for Deployment

- [ ] Enable HTTPS/SSL certificate
- [ ] Set `NODE_ENV=production`
- [ ] Configure production `FRONTEND_URL` in environment variables
- [ ] Set up Firestore security rules
- [ ] Disable source maps (`sourcemap: false`)
- [ ] Review and restrict CORS allowed origins
- [ ] Set up server monitoring and alerts
- [ ] Configure automated backups
- [ ] Test rate limiting in production
- [ ] Verify all environment variables are set
- [ ] Remove any test/debug endpoints
- [ ] Enable HTTPS-only cookies if using sessions

## 🔍 Vulnerability Scanning

Run these commands regularly:

```bash
# Check for known vulnerabilities
npm audit

# Automatic fix for vulnerabilities
npm audit fix

# Force fix (may introduce breaking changes)
npm audit fix --force

# Check for outdated packages
npm outdated
```

## 📞 Security Contacts

- **Report Security Issues**: [Your security contact email]
- **Emergency Response**: [Your emergency contact]

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

**Last Updated**: January 2026  
**Version**: 1.0.0
