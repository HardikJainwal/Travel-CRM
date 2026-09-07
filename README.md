# Travel Agency Lead CRM (MERN Stack)

A lightweight, high-performance internal CRM built specifically for a travel agency team of 3–4 members to manage Meta/Facebook Ads enquiries, track WhatsApp & phone communications, assign leads, schedule follow-ups, and monitor booking conversion pipelines.

---

## Features Built

### 1. Facebook/Meta Ads & WhatsApp Workflow
- **Fast Lead Entry**: Quick creation modal requiring only Customer Name, Phone, Destination, and Source.
- **Duplicate Detection**: Live phone number checking before creation with options to open existing lead or continue anyway.
- **Instant WhatsApp Link (`wa.me`)**: 1-Click WhatsApp chat launch with pre-filled greeting templates.
- **Activity & Note Logger**: Log calls, WhatsApp messages, general notes, and follow-up notes in a chronological activity feed.

### 2. Follow-Up Command Center
- **Categorized Views**: Overdue (🔴 Red alert), Today's (🟡 Yellow alert), Upcoming, and Completed (🟢 Green).
- **One-Click Completion**: Mark follow-up as completed and schedule the next follow-up date in a single step.

### 3. Pipeline & Conversion Management
- **9-Stage Sales Pipeline**: New → Contacted → Follow-up Required → Interested → Quote Sent → Negotiation → Booked → Lost → Not Interested.
- **Commercial Tracking**: Track Estimated Value, Quotation Amount, Confirmed Booking Value, and Lost Reasons.
- **Automated Statistics**: Live Conversion Rate % `(Bookings / Total Leads * 100)`, Total Booking Revenue, and Average Deal Size calculations.

### 4. Role-Based Permissions & Team Management
- **Admin**: View all leads, assign/reassign leads, view team leaderboard, add team members, reset passwords, and toggle active status.
- **Team Member**: View assigned leads, log activities, update statuses, schedule follow-ups, and mark bookings.

---

## Test Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@travelcrm.com` | `Password123!` |
| **Sales Agent (Sarah)** | `sarah@travelcrm.com` | `Password123!` |
| **Sales Agent (Alex)** | `alex@travelcrm.com` | `Password123!` |
| **Sales Agent (Priya)** | `priya@travelcrm.com` | `Password123!` |

*(Note: The login page includes 1-click quick demo buttons for testing).*

---

## Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local instance or MongoDB Atlas URI)

### 2. Start Backend Server
```bash
cd backend
npm install
npm run seed  # Populates database with sample leads & users
npm run dev   # Starts backend on http://localhost:5001
```

### 3. Start Frontend App
```bash
cd frontend
npm install
npm run dev   # Starts React SPA on http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=5001
NODE_ENV=development
DATABASE_URL=mongodb://127.0.0.1:27017/travel_crm
JWT_SECRET=travel_crm_super_secret_jwt_key_2026_x987
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5001/api
```

---

## Free-Tier Deployment Guide (Zero Cost)

### Step 1: Database Setup (MongoDB Atlas Free Tier M0)
1. Register for free at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create an **M0 Shared Cluster** (Free Forever, 512MB storage).
3. Under **Database Access**, create a user (e.g. `crm_user` and password).
4. Under **Network Access**, add IP `0.0.0.0/0` (Allow access from anywhere).
5. Click **Connect** → **Drivers** to get your connection string:
   `mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/travel_crm?retryWrites=true&w=majority`

### Step 2: Backend Deployment (Render / Koyeb Free Tier)
1. Push repository to GitHub.
2. Sign up on [Render.com](https://render.com/).
3. Create a **New Web Service** connected to your GitHub repository.
4. Set **Root Directory** to `backend`.
5. Set **Build Command**: `npm install`
6. Set **Start Command**: `npm start`
7. Add Environment Variables:
   - `DATABASE_URL`: *(Your MongoDB Atlas connection string)*
   - `JWT_SECRET`: *(A long random secret string)*
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: *(Your frontend Vercel URL)*
8. Run seed once via Render terminal or console: `node seed/seed.js`.

### Step 3: Frontend Deployment (Vercel / Netlify Free Tier)
1. Sign up on [Vercel](https://vercel.com/).
2. Click **Add New Project** and select your GitHub repository.
3. Set **Framework Preset**: Vite
4. Set **Root Directory**: `frontend`
5. Add Environment Variable:
   - `VITE_API_URL`: `https://<your-render-backend-name>.onrender.com/api`
6. Click **Deploy**.
