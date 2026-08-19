# ZBigHype Academy

## Requirements
- Node.js 20 or newer
- npm
- A hosted LibSQL database for production on Vercel

## Setup
1. Copy `.env.example` to `.env`
2. Set `JWT_SECRET`
3. Set `DATABASE_URL`
4. Set `DATABASE_AUTH_TOKEN`
5. Run `npm install`
6. Run `npm start`

## Development URL
- `http://localhost:3000`

## QR Image
- Place the payment QR at `public/assets/payment-qr.png`

## API Routes
- `GET /api/courses`
- `GET /api/courses/:slug`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard`
- `GET /api/learn/:courseSlug`
- `POST /api/learn/:courseSlug/:lessonId/complete`
- `POST /api/payment/confirm`
- `GET /api/payment/:id`

## Database Tables
- `users`
- `courses`
- `payment_confirmations`
- `enrollments`
- `lesson_progress`

## Authentication Flow
- Sign up or log in to receive a JWT
- Store the token in `localStorage`
- Send it as a Bearer token for protected routes

## Payment Flow
- User opens the payment page for a course
- QR code is scanned and payment is made manually
- User submits UTR / transaction details
- The server stores a payment confirmation with status `Pending Verification`
- Course access is not automatically activated

## Important Note
- Payment confirmation does not automatically verify payment.

## Deployment
- Push the repository to GitHub
- Import the GitHub repository into Vercel
- Set the environment variables listed below
- Deploy with the existing Express server entrypoint

## Required Environment Variables
- `PORT=3000`
- `JWT_SECRET=replace_with_a_long_random_secret`
- `DATABASE_URL=libsql://your-database.turso.io`
- `DATABASE_AUTH_TOKEN=your_database_token`

## Vercel Notes
- Frontend API calls already use relative `/api/...` URLs
- Production data is stored in a hosted LibSQL database, not a writable local file
- Payment confirmations remain `Pending Verification` until an authorized manual update
