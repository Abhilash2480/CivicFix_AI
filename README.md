# CivicFix AI

CivicFix AI is a full-stack civic reporting app. Citizens can report infrastructure issues, receive photo and video AI suggestions, and track updates. Administrators can review and filter reports, change status, and add notes.

## Project structure

```text
client/                 React 18 + Vite application
  src/App.jsx            Pages, navigation, dashboards, and forms
  src/api.js             Authenticated API client
  src/styles.css         Responsive application styles
server/                 Express API
  src/models/            MongoDB User and Complaint models
  src/routes/            Authentication and complaint endpoints
  src/services/          Gemini image and video analysis integration
  src/middleware/        JWT authorization and error handling
  src/scripts/            Administrator setup command
```

## Requirements

- Node.js 18 or later
- MongoDB running locally or a MongoDB Atlas connection string
- A Gemini API key for image and video analysis (other app features work independently)

## Local setup

1. Install root and application dependencies:

   ```bash
   npm install
   npm --prefix server install
   npm --prefix client install
   ```

2. Copy `server/.env.example` to `server/.env`, then set `MONGODB_URI` and a long random `JWT_SECRET`. Set `GEMINI_API_KEY` to enable real photo and video analysis. Change the administrator values before use.

3. Create the administrator account:

   ```bash
   npm --prefix server run seed:admin
   ```

4. Start both applications from the repository root:

   ```bash
   npm run dev
   ```

5. Visit <http://localhost:5173> for the citizen site. Admins sign in separately at <http://localhost:5173/admin/login>. The API listens at `http://localhost:5000`.

## Deploy as one service

The Express server serves the built React app, API, and uploaded media from one origin. This keeps `/api` and `/uploads` working without a separate frontend proxy.

1. Push the repository to a private or public GitHub repository.
2. Create a MongoDB Atlas database and a database user. Add the hosting service's outbound IP ranges to Atlas Network Access; keep the list as narrow as the host permits.
3. Create a Node web service on Render and connect the repository. Set:

   - **Build command:** `npm install && npm --prefix server install && npm --prefix client install && npm run build`
   - **Start command:** `npm start`
   - **Health check path:** `/api/health`

4. Add these environment variables in the hosting dashboard: `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`, and `CLIENT_URL` (the deployed site's `https://...onrender.com` origin). Use a randomly generated JWT secret with at least 32 characters. The host provides `PORT` automatically.
5. Uploaded media is stored on disk. Attach a persistent disk mounted at `/var/data` and set `UPLOAD_DIR=/var/data/uploads`; without persistent media storage, uploaded photos and videos may disappear when the host replaces or restarts an instance.
6. Create the administrator account once by running `npm --prefix server run seed:admin` from a trusted machine with `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optionally `ADMIN_NAME` set to the production values. Do not commit `.env` files.
7. Open the deployed site, check `/api/health`, sign in at `/admin/login`, and submit a small test report.

Render's default filesystem is ephemeral; persistent disks are available for paid web services. For a multi-instance setup, store uploads in object storage such as Cloudinary or S3 instead of a local disk. Atlas access lists should be restricted to trusted addresses where possible. [Render deployment docs](https://render.com/docs/web-services), [Render disks](https://render.com/docs/disks), [Atlas IP access lists](https://www.mongodb.com/docs/atlas/security/ip-access-list/).

## Configuration

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign seven-day session tokens |
| `GEMINI_API_KEY` | Gemini API key; omit to disable AI analysis |
| `GEMINI_MODEL` | Gemini model name (defaults to `gemini-3.8-flash` via the Interactions API) |
| `PORT` | API port (defaults to `5000`) |
| `CLIENT_URL` | Allowed browser origin for CORS |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Seed administrator identity |
| `UPLOAD_DIR` | Directory for uploaded photos and videos; point this to a persistent disk in production |

## Main API routes

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/complaints/analyze` (authenticated, multipart photo or video)
- `POST /api/complaints` (authenticated, multipart report)
- `GET /api/complaints`, `GET /api/complaints/stats`
- `GET /api/complaints/:complaintId`
- `PATCH /api/complaints/:complaintId` (administrators only)

Citizen requests are scoped to the signed-in account. Administrators are created using the seed command rather than public registration. Uploads accept JPEG, PNG, WebP, MP4, WebM, and MOV media up to 14 MB. Short videos are sent to Gemini using inline video input; Google recommends inline requests below 20 MB total request size.
