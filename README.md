# AcademiQ - Academic Management System

This is the **Guaranteed Setup Guide**. If you are setting this project up for the first time on a new laptop, follow every single command below in order.

---

## 🚀 Step-by-Step Setup (Do not skip any step!)

### 1. Clone the Project
Open your terminal and run:
```bash
git clone <your-repository-url>
cd AcademiQ
```

### 2. Install All Dependencies
Run these commands one by one:
```bash
# Install root dependencies
npm install

# Install Server dependencies
cd server
npm install

# Install Client dependencies
cd ../client
npm install
```

### 3. Setup the Database (PostgreSQL)
1. Open your PostgreSQL terminal or **pgAdmin**.
2. Run this command to create the database:
   ```sql
   CREATE DATABASE "AcademiQ";
   ```
3. Go back to your terminal (in the `AcademiQ` root folder) and import the data:
   ```bash
   psql -U postgres -d AcademiQ -f DB/academiq_db.sql
   ```
   *(Enter your PostgreSQL password when prompted)*

### 4. Setup Environment Variables (.env)
You must create two files. **Do not skip this.**

**A. Server Config:**
Create a file named `.env` inside the `server` folder and paste this:
```env
PORT=5000
JWT_SECRET=dev_secret_key
ADMIN_SETUP_CODE=123456
NODE_ENV=development
DB_NAME=AcademiQ
DB_USER=postgres
DB_PASSWORD=your_postgresql_password
DB_HOST=localhost
DB_PORT=5432
```

**B. Client Config:**
Create a file named `.env` inside the `client` folder and paste this:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 5. Run the "Magic Fix" Script (CRITICAL)
This script fixes the "Empty Subject Dropdown" issue by setting up Departments and linking the Teacher account.
```bash
cd server
node scripts/seed_for_friend.js
```

---

## 💻 How to Run the Project

You need **two** terminal windows open at the same time:

**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm start
```

## Production Deployment Guide

This project is split into a frontend React app and a backend Node/Express app using PostgreSQL.

The easiest free deployment path is:

1. Deploy backend + PostgreSQL on Railway.
2. Deploy frontend on Vercel.
3. Configure `REACT_APP_API_URL` to point the frontend to the backend.

### Step 1: Prepare the backend for deployment

In `server/package.json`, make sure there is a production start script:

```json
"scripts": {
  "dev": "nodemon src/server.js",
  "start": "node src/server.js"
}
```

Railway and other hosts use `npm start` for production.

### Step 2: Deploy backend + PostgreSQL on Railway

1. Create a free Railway account at https://railway.app.
2. Create a new project.
3. Add the PostgreSQL plugin to the project.
4. Connect your GitHub repository.
5. Choose the `server` folder as the deploy root.
6. Set the deploy command to:
   ```bash
   npm install
   npm start
   ```
7. Add the required environment variables in Railway:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `JWT_SECRET`

### Step 3: Deploy frontend on Vercel

1. Create a free Vercel account at https://vercel.com.
2. Create a new project and connect your GitHub repository.
3. Select the `client` folder as the project root.
4. Set build settings:
   - Build command: `npm run build`
   - Output directory: `build`
5. Add a project environment variable:
   - `REACT_APP_API_URL=https://<your-backend-domain>/api`

---

## 🔑 Login Credentials
Use these to see the subjects and assignments immediately:
*   **Teacher Login**: `http://localhost:3000/teacher-login`
*   **Email**: `teacher@academiq.com`
*   **Password**: `Password123!`

---

## 🛠 Troubleshooting
- **Missing Subjects?** Ensure you ran `node scripts/seed_for_friend.js` in Step 5.
- **Database Error?** Make sure `DB_PASSWORD` in `server/.env` is correct.
- **Port Busy?** If port 3000 or 5000 is used, restart your laptop or kill the process.
