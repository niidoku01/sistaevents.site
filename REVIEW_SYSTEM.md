# Review System - Database Schema

## Firestore Collection: `reviews`

### Document Structure

```javascript
{
  id: number,           // Unique identifier (timestamp)
  name: string,         // Reviewer's name (2-100 characters)
  email: string,        // Reviewer's email (validated format)
  event: string,        // Type of event (max 100 characters)
  content: string,      // Review text (10-1000 characters)
  rating: number,       // Star rating (1-5)
  approved: boolean,    // Admin approval status
  createdAt: string     // ISO 8601 timestamp
}
```

### Example Document

```javascript
{
  id: 1738187641234,
  name: "Jane Smith",
  email: "jane@example.com",
  event: "Wedding Reception",
  content: "Absolutely amazing service! The team went above and beyond to make our special day perfect.",
  rating: 5,
  approved: true,
  createdAt: "2026-01-29T10:30:00.000Z"
}
```

## Firestore Security Rules

Add these rules to your Firestore console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Reviews collection
    match /reviews/{reviewId} {
      // Allow public read of approved reviews only
      allow read: if resource.data.approved == true;
      
      // Allow server-side writes only (via Admin SDK)
      allow write: if false;
      
      // Admin read all reviews (requires authentication)
      allow read: if request.auth != null;
    }
    
    // Existing rules for other collections...
  }
}
```

## API Endpoints

### Public Endpoints

#### Submit Review
```
POST /api/reviews
Body: {
  name: string (required, 2-100 chars),
  email: string (required, valid email),
  event: string (required, max 100 chars),
  content: string (required, 10-1000 chars),
  rating: number (required, 1-5)
}
Response: {
  success: true,
  message: "Review submitted successfully",
  review: { ... }
}
```

#### Get Approved Reviews
```
GET /api/reviews
Response: {
  reviews: [
    { id, name, event, content, rating, createdAt }
  ]
}
```

### Admin Endpoints

#### Get Pending Reviews
```
GET /api/reviews/pending
Response: {
  reviews: [
    { id, name, email, event, content, rating, approved, createdAt }
  ]
}
```

#### Approve Review
```
PUT /api/reviews/:id/approve
Response: {
  success: true,
  message: "Review approved"
}
```

#### Delete Review
```
DELETE /api/reviews/:id
Response: {
  success: true,
  message: "Review deleted"
}
```

## Input Validation

All review submissions are validated using express-validator:

- **Name**: 
  - Required
  - 2-100 characters
  - Letters, spaces, apostrophes, hyphens only

- **Email**:
  - Required
  - Valid email format
  - Normalized (lowercase, trimmed)

- **Event**:
  - Required
  - Max 100 characters
  - Trimmed

- **Content**:
  - Required
  - 10-1000 characters
  - Trimmed

- **Rating**:
  - Required
  - Integer between 1-5

## Rate Limiting

Review submissions use the same rate limiter as bookings:
- **Limit**: 5 submissions per 15 minutes per IP address
- **Protection**: Prevents spam and abuse

## Data Storage

Reviews are stored in two locations:

1. **Firestore (Primary)**
   - Cloud-based
   - Real-time sync
   - Scalable

2. **JSON File (Backup)**
   - Location: `server/uploads/reviews/reviews.json`
   - Fallback if Firestore is unavailable
   - Local backup

## Admin Workflow

1. **Review Submission**
   - Client submits review via form
   - Review saved with `approved: false`
   - Stored in database

2. **Admin Review**
   - Admin logs into dashboard
   - Navigate to "Reviews" tab
   - View pending reviews

3. **Approval/Rejection**
   - Admin reviews content
   - Click "Approve" to publish
   - Click "Delete" to reject
   - Approved reviews appear on website

4. **Display**
   - Only approved reviews shown
   - Sorted by newest first
   - Displayed on Testimonials section

## Frontend Components

### ReviewForm.tsx
- Client-facing review submission form
- Star rating selector
- Input validation
- Toast notifications

### ManageReviews.tsx
- Admin interface
- Shows pending and approved reviews
- Approve/delete actions
- Real-time updates

### Testimonials.tsx
- Public-facing display
- Fetches approved reviews
- Star rating display
- Toggle to show/hide review form

## Setup Instructions

1. **Enable Firestore**
   ```bash
   # In Firebase Console
   # Go to Firestore Database
   # Click "Create database"
   # Choose "Production mode"
   # Set location
   ```

2. **Add Security Rules**
   - Copy rules from above
   - Paste in Firestore Rules tab
   - Publish changes

3. **Test Review Submission**
   ```bash
   # Start backend
   cd server && npm start
   
   # Start frontend
   npm run dev
   
   # Navigate to website
   # Scroll to Testimonials
   # Click "Share Your Experience"
   # Submit a test review
   ```

4. **Test Admin Approval**
   ```bash
   # Log into admin dashboard
   # Go to /admin/reviews
   # Review pending submissions
   # Approve or delete
   ```

## Monitoring

Track these metrics:
- Number of pending reviews
- Average rating
- Most common event types
- Review submission rate
- Approval/rejection rate

## Best Practices

1. **Review Content**
   - Check for inappropriate language
   - Verify authenticity
   - Ensure relevance

2. **Response Time**
   - Review submissions within 24-48 hours
   - Maintain active moderation

3. **Quality Control**
   - Only approve genuine reviews
   - Maintain high standards
   - Remove spam/fake reviews

4. **Privacy**
   - Email addresses not displayed publicly
   - Only show name and event type
   - Respect client privacy

## Troubleshooting

### Reviews not appearing
- Check if reviews are approved
- Verify Firestore connection
- Check browser console for errors

### Cannot submit review
- Check rate limiting (5 per 15 min)
- Verify backend is running
- Check form validation errors

### Admin cannot approve
- Verify authentication
- Check Firestore permissions
- Review server logs

---

**Last Updated**: January 2026  
**Version**: 1.0.0
