# Sista Events Backend

Simple Express.js backend for handling bookings and collection image uploads.

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:5000`

## API Endpoints

### Bookings

- **POST** `/api/bookings`
  - Receive booking form submissions
  - Body: `{ name, email, phone, eventDate, message }`
  - Returns: Booking object with ID and timestamp

- **GET** `/api/bookings`
  - Retrieve all bookings (for admin)
  - Returns: Array of all bookings

### Collections (Image Uploads)

- **POST** `/api/uploads/collections`
  - Upload collection images
  - FormData: `images` (multipart file upload, up to 10 files)
  - Returns: Array of uploaded image URLs

- **GET** `/api/collections`
  - Retrieve all uploaded collection images
  - Returns: Array of image URLs and names

- **DELETE** `/api/collections/:filename`
  - Delete a collection image by filename
  - Returns: Success message

### Health Check

- **GET** `/api/health`
  - Check if backend is running
  - Returns: Status message

## Directory Structure

```
server/
├── server.js          # Main Express app
├── package.json       # Dependencies
├── uploads/           # Uploaded files (auto-created)
│   ├── collections/   # Collection images
│   └── bookings/      # Booking data (JSON)
└── README.md         # This file
```

## Notes

- Images are stored in `uploads/collections/`
- Bookings are stored in `uploads/bookings/bookings.json`
- Max file size: 10MB per image
- Supported formats: JPEG, PNG, GIF, WebP
- CORS is enabled for frontend requests
