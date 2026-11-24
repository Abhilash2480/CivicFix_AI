# CivicFix AI

CivicFix AI helps residents report local infrastructure problems and follow them through to resolution. Residents can attach a photo or video, ask Gemini for a suggested issue category and severity, and track updates. Administrators review reports, update statuses, and add notes.

## What’s included

- Citizen registration, sign-in, and complaint history
- Separate administrator sign-in at `/admin/login`
- Photo and video upload with preview
- Gemini image and video analysis, when configured
- Complaint status tracking and administrator notes
- MongoDB-backed dashboards and complaint records
- Responsive React interface and Express API

## Run locally

### Prerequisites

- Node.js 18 or newer
- MongoDB running locally or a MongoDB Atlas database
- A Gemini API key for AI media analysis (optional; reporting still works without it)

### Install and configure

From the repository root, install the root, API, and client dependencies:

```sh
npm install
npm --prefix server install
npm --prefix client install
```

Copy `server/.env.example` to `server/.env`. Set `MONGODB_URI` to your database and replace `JWT_SECRET` with a random secret of at least 32 characters. Add your Gemini API key to `GEMINI_API_KEY` to enable AI analysis.

PowerShell:

```powershell
Copy-Item server/.env.example server/.env
```

macOS/Linux:

```sh
cp server/.env.example server/.env
```

Edit `server/.env` with your own values. It is ignored by Git. Do not commit or share it.

### Create an administrator account

Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `server/.env`. The administrator password must be at least 12 characters. Then run this once:

```sh
npm --prefix server run seed:admin
```

Public registration creates citizen accounts only. Create administrators with this seed command.

### Start the app

Run both the API and client from the repository root:

```sh
npm run dev
```

Open:

- Citizen site: <http://localhost:5173>
- Administrator sign-in: <http://localhost:5173/admin/login>
- API health check: <http://localhost:5000/api/health>

## Environment variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | API listen port | `5000` |
| `MONGODB_URI` | MongoDB connection string | Local MongoDB URL in the example |
| `JWT_SECRET` | Signs seven-day authentication tokens | Must be supplied |
| `CLIENT_URL` | Browser origin allowed by API CORS | `http://localhost:5173` |
| `GEMINI_API_KEY` | Enables Gemini analysis | Empty (AI disabled) |
| `GEMINI_MODEL` | Gemini model used for image/video analysis | `gemini-3.8-flash` |
| `ADMIN_NAME` | Name for the seeded administrator | `CivicFix Administrator` |
| `ADMIN_EMAIL` | Email for the seeded administrator | `admin@example.com` |
| `ADMIN_PASSWORD` | Password for the seeded administrator | Set a strong password |
| `UPLOAD_DIR` | Directory for uploaded media | `uploads` under `server/` |

## Upload and AI details

Supported uploads are JPEG, PNG, WebP, MP4, WebM, and MOV up to 14 MB. The application previews selected media before submission. Gemini results are suggestions; residents can review and edit the report details.

Short videos are sent to Gemini as inline video input. Google recommends keeping the total inline request below 20 MB. Larger videos need a Files API or object-storage workflow.

## Deploy on Render

The Express service serves the built React app, API, and uploaded files from one origin.

1. Push this repository to GitHub and create a MongoDB Atlas database and database user.
2. In Atlas Network Access, allow the outbound IP ranges for your Render service. Keep the allowlist limited to the addresses your service needs. [Render outbound IPs](https://render.com/docs/outbound-ip-addresses) · [Atlas IP access lists](https://www.mongodb.com/docs/atlas/security/ip-access-list/)
3. In Render, create a **Web Service** connected to the repository. Use:

   - **Build command:** `npm install && npm --prefix server install && npm --prefix client install && npm run build`
   - **Start command:** `npm start`
   - **Health check path:** `/api/health`

4. Add `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`, and `CLIENT_URL` to the Render environment. Set `CLIENT_URL` to the deployed site’s HTTPS origin. Render provides `PORT` automatically.
5. Create the admin record once, using the production database URI and admin credentials with `npm --prefix server run seed:admin`. Keep those values private.
6. Attach persistent storage mounted at `/var/data` and set `UPLOAD_DIR=/var/data/uploads`. Render’s default filesystem is ephemeral, so files stored there can disappear on restart or deploy. Persistent disks require a paid web service. [Render web services](https://render.com/docs/web-services) · [Render disks](https://render.com/docs/disks)
7. Open the deployed site, check `/api/health`, then sign in at `/admin/login`.

For multi-instance or higher-volume deployments, move uploads to durable object storage such as Cloudinary or Amazon S3 rather than a local disk.

## API overview

All API paths start with `/api`. Protected endpoints require a bearer token.

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Register a citizen |
| `POST` | `/api/auth/login` | Public | Citizen sign-in |
| `POST` | `/api/auth/admin/login` | Public | Administrator sign-in |
| `GET` | `/api/auth/me` | Signed in | Get the current account |
| `POST` | `/api/complaints/analyze` | Signed in | Analyze one uploaded photo or video |
| `POST` | `/api/complaints` | Signed in | Submit a complaint with media |
| `GET` | `/api/complaints` | Signed in | List own complaints, or all for admins |
| `GET` | `/api/complaints/stats` | Signed in | Dashboard counts |
| `GET` | `/api/complaints/:complaintId` | Owner or admin | View a complaint |
| `PATCH` | `/api/complaints/:complaintId` | Admin | Update status, category, severity, or remarks |

## Project structure

```text
client/                 React + Vite frontend
  src/App.jsx            Pages, dashboards, forms, and navigation
  src/api.js             Authenticated API client
  src/styles.css         Responsive styles
server/                 Express + MongoDB API
  src/models/            User and complaint models
  src/routes/            Authentication and complaint endpoints
  src/services/vision.js Gemini image/video analysis
  src/middleware/        Authentication and error handling
  src/scripts/seedAdmin.js Administrator setup command
  .env.example           Local environment template
```
