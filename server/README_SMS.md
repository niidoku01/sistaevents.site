Twilio SMS notifications

To enable SMS notifications when a booking is received, set the following environment variables in the `server` folder (or your system):

- `TWILIO_ACCOUNT_SID` - your Twilio Account SID
- `TWILIO_AUTH_TOKEN` - your Twilio Auth Token
- `TWILIO_FROM` - the Twilio phone number (in E.164, e.g. +1234567890)
- `BOOKINGS_SMS_TO` - one or more destination phone numbers (in E.164). You can provide a comma-separated list to notify multiple recipients.

Optional customer confirmation

- `SEND_CONFIRMATION_TO_CUSTOMER` - set to `true` to also send a short confirmation SMS to the customer's phone number provided in the booking (must be E.164). Default: `false`.

Example (PowerShell):

```powershell
$env:TWILIO_ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
$env:TWILIO_AUTH_TOKEN = "your_auth_token"
$env:TWILIO_FROM = "+1234567890"
$env:BOOKINGS_SMS_TO = "+233555182969,+12345678901"
node server.js
```

Message format

When a booking is created, the backend will send a concise, well-organized SMS that looks like:

New Booking #123456789
Name: Sylvia Crabbe
Phone: +233555182969
Date: 2025-12-24
Email: sylvia@example.com
Message: Small ceremony, 50 guests...

The booking message is truncated to ~120 characters to keep SMS concise. If Twilio env vars are not provided, the booking is still saved to disk and no SMS is sent.

Notes:
- Twilio will charge per SMS — use a test account/number if needed.
- Keep your credentials secret; do not commit them to the repo.
