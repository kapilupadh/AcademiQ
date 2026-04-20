# AcademiQ

## Project Structure

- `client/`: React frontend application
- `server/`: Node.js/Express backend application

## Local Development

### Client (Frontend)

1. Open a terminal.
2. Navigate to the client directory:
   ```bash
   cd client
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the frontend development server:
   ```bash
   npm start
   ```
   - The app runs on http://localhost:3000 by default.

### Server (Backend)

1. Open a new terminal.
2. Navigate to the server directory:
   ```bash
   cd server
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```
   - This uses `nodemon` and runs on http://localhost:5000 by default.

### Example local URLs

- Student login: `http://localhost:3000/login`
- Teacher login: `http://localhost:3000/teacher-login`
- Admin login: `http://localhost:3000/admin/login`
- Admin register: `http://localhost:3000/admin/register`

## Production Deployment Guide

This project is split into a frontend React app and a backend Node/Express app using PostgreSQL.

Bulk mode of student data should be generated.

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
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `DB_PORT`
   - `JWT_SECRET`
   - any other env vars your backend needs

Railway gives you a Postgres connection string and database credentials. Paste them into Railway's environment variables panel.

### Step 3: Deploy frontend on Vercel

1. Create a free Vercel account at https://vercel.com.
2. Create a new project and connect your GitHub repository.
3. Select the `client` folder as the project root.
4. Set build settings:
   - Build command: `npm run build`
   - Output directory: `build`
5. Add a project environment variable:
   - `REACT_APP_API_URL=https://<your-backend-domain>/api`

Your frontend will use this API URL for requests to the deployed backend.

### Step 4: Connect frontend to backend

The React app uses `REACT_APP_API_URL` or `/api` by default.

- If you deploy the backend on Railway, set `REACT_APP_API_URL` to the Railway backend URL.
- Example:
  ```text
  https://my-backend-name.up.railway.app/api
  ```

### Optional: One-host alternative

If you want a single provider instead, you can also use Render:
- Web Service for the backend
- PostgreSQL database
- Static Site for the frontend

However, the fastest free path is Railway for backend + DB and Vercel for frontend.

## Environment variables

### Backend environment variables (`server/.env` or host config)

Example variables:

```env
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
DB_PORT=5432
JWT_SECRET=your-jwt-secret
```

### Frontend environment variables (`client/.env` or Vercel project settings)

```env
REACT_APP_API_URL=https://<your-backend-domain>/api
```

## Important notes

- Free tiers often sleep when idle and have limits on CPU, memory, and database size.
- Some services require a card to sign up, but you can still use the free tier without spending money.
- Test the deployed backend first, then connect the frontend.
- If your backend uses file uploads, verify the upload destination supports persistent storage.

## Project details

- Frontend: React with `craco` and Tailwind CSS
- Backend: Express, Sequelize, PostgreSQL
- Local frontend dev command: `cd client && npm start`
- Local backend dev command: `cd server && npm run dev`

Good luck deploying! If you want, I can also add a separate `DEPLOYMENT.md` file with the same guide.

