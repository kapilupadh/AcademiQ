# 🎓 AcademiQ - Elite Academic Management System

AcademiQ is a professional academic management platform designed with an "Elite" dark theme. It features a fully dynamic, request-based user system that requires **Zero Initial Setup**.

---

## 🛠️ Prerequisites
1.  **Node.js** (LTS)
2.  **PostgreSQL** (Create an empty database named `academiq_db`)

---

## 🚀 Instant Setup Guide

### 1. Configure Environment
Create a file named `.env` in the `server` folder:

**`server/.env`**
```env
PORT=5000
JWT_SECRET=academiq_elite_secret
NODE_ENV=development

# Database Settings
DB_NAME=academiq_db
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
DB_HOST=localhost
DB_PORT=5432
```

### 2. Install & Run
Open your terminal in the root folder:

```bash
# Install everything
npm install && cd server && npm install && cd ../client && npm install

# Start Backend (Terminal 1)
cd server && npm run dev

# Start Frontend (Terminal 2)
cd client && npm start
```

---

## 🔐 How to Start (The Real Flow)

Since this system uses real users, you start with a System Admin to build your school.

### **Step 1: Login as Admin**
| Role | Unique ID (Username) | Password |
| :--- | :--- | :--- |
| **System Admin** | `ADMIN-BCA-001` | `AcademiQ@BCA2026` |

### **Step 2: Create Real Teachers & Students**
1.  Go to `http://localhost:3000/request-access`.
2.  Submit a request as a Teacher or Student.
3.  In the Admin Panel, go to **Access Requests** and click **Approve**.
4.  The system will **automatically** create the BCA department and subjects the moment you approve your first user.
5.  Get the generated **Unique ID** and Register/Login!

---

## ✨ Why Zero Setup?
-   **Auto-Initialization**: The system automatically creates the BCA department and subjects when you approve the first user.
-   **Virtual Admin**: No need to seed an admin account; the system uses a secure configuration-based login for the initial setup.
-   **No Hardcoded Users**: Every Teacher and Student in the system is a real person created through the official flow.

---

© 2026 AcademiQ Team. Built for Excellence.
