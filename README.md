# 🎓 AcademiQ - Elite Academic Management System

AcademiQ is a professional, high-performance academic management platform designed with an "Elite" dark-theme design language. It supports dynamic multi-department provisioning, semester-based isolation, assignment pipelines, secure real-time student/teacher profile checks, and custom admin controls.

Follow this step-by-step guide to get the entire project up and running on your laptop in less than 5 minutes!

---

## 🛠️ Step 1: Install Prerequisites

Ensure you have the following software installed on your machine:
1. **Node.js** (LTS Version 18 or higher) - [Download Node.js](https://nodejs.org/)
2. **PostgreSQL** (LTS Database Server) - [Download PostgreSQL](https://www.postgresql.org/)

---

## 🗄️ Step 2: Set Up the Database

1. Open your PostgreSQL terminal (`psql`) or **pgAdmin**.
2. Create a brand new, empty database named **`academiq_db`**:
   ```sql
   CREATE DATABASE academiq_db;
   ```

---

## ⚙️ Step 3: Configure Environment Variables

1. Navigate to the **`server`** folder.
2. Create a file named **`.env`** and copy-paste the configuration below:

**File Location: `server/.env`**
```env
PORT=5000
JWT_SECRET=academiq_elite_secret
NODE_ENV=development

# Database Configuration
DB_NAME=academiq_db
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
DB_HOST=localhost
DB_PORT=5432
```
> [!IMPORTANT]
> Be sure to replace `YOUR_POSTGRES_PASSWORD_HERE` with your actual local PostgreSQL user password!

---

## 📦 Step 4: Install Dependencies (Single Command)

Open a terminal at the **root directory** of the project and run this command to automatically download all packages for the root, frontend, and backend:

```bash
npm install && cd server && npm install && cd ../client && npm install
```

---

## ⚡ Step 5: Initialize & Seed the Database

To set up the table structures and populate default departments and admin accounts, run these commands:

1. **Start the backend server once to automatically synchronize database tables:**
   ```bash
   cd ../server
   npm run dev
   ```
   *(Wait until you see `✅ Models synchronized.` in the terminal logs, then you can press `Ctrl + C` to stop the server).*

2. **Seed the default Academic Departments:**
   ```bash
   node src/seedDepartments.js
   ```

---

## 🚀 Step 6: Run the Whole Project (Concurrently)

To start both the **React Frontend** and **Express Backend** at the same time with a single command, open a terminal in the **root directory** of the project and run:

```bash
npm run dev
```

* **React Client App** will run at: `http://localhost:3000`
* **Node.js Express Server** will run at: `http://localhost:5000`

---

## 🔐 System Admin Credentials

You can log in immediately as the System Administrator using the pre-configured **Virtual Admin** credentials (zero database setup required):

* **URL:** `http://localhost:3000/login` (select **Admin** role)
* **Login ID (Username):** `ADMIN-DU-001`
* **Password:** `AcademiQ@DU2026`

---

## 🏫 Real-User Provisioning Flow

To create actual Student and Teacher accounts:
1. Go to `http://localhost:3000/request-access`.
2. Select your role (Student/Teacher), choose your department, fill out your name/email/phone, and submit.
3. Log in as an **Admin**, click **Access Requests** in the sidebar, and click **Approve** on the request.
4. Copy the newly generated **Unique ID** (e.g. `STU-ZOOL-00001` or `TCH-COMP-00001`).
5. Open the login page and sign in using that Unique ID and the password chosen during registration!

---

© 2026 AcademiQ Team. Handed over for Educational Excellence.
