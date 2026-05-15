# 🎓 AcademiQ Complete Setup Guide

Follow these exact steps to set up AcademiQ on a new laptop. 

---

## 🛠️ 1. Prerequisites (Install These First)
Before you touch the code, you must have these two things on your computer:
1.  **Node.js**: Download and install from [nodejs.org](https://nodejs.org/). (Choose the **LTS** version).
2.  **PostgreSQL**: Download and install from [postgresql.org](https://www.postgresql.org/download/). 
    *   *Note: During installation, remember the password you set for the 'postgres' user!*

---

## 🐘 2. Create the Database
1.  Open **pgAdmin 4** (installed with PostgreSQL).
2.  Right-click on **Databases** -> **Create** -> **Database...**
3.  Type the name: `academiq_db`
4.  Click **Save**.

---

## 🔑 3. Configure the Environment (.env)
You must tell the server how to talk to your database.
1.  Go to the `server` folder.
2.  Find the file named `.env`.
3.  Update these lines to match YOUR computer:
    ```env
    DB_NAME=academiq_db
    DB_USER=postgres
    DB_PASS=YOUR_POSTGRES_PASSWORD_HERE  <-- Change this!
    DB_HOST=localhost
    DB_PORT=5432
    JWT_SECRET=any_random_string_here
    PORT=5000
    ```

---

## 📦 4. Install Dependencies
Open **two** separate terminal windows (Command Prompt or VS Code Terminal).

### **Terminal 1: Server**
```bash
cd server
npm install
```

### **Terminal 2: Client**
```bash
cd client
npm install
```

---

## 🚀 5. Initialize the Data (THE MOST IMPORTANT STEP)
Once everything is installed, you must run the magic script to create the users and subjects. **If you skip this, the assignments will not show up.**

**In the Server terminal, run:**
```bash
node scripts/seed_for_friend.js
```
*Wait until you see the message: "✅ DATABASE INITIALIZATION COMPLETE!"*

---

## 🏃 6. Start the Application
### **In Terminal 1 (Server):**
```bash
npm run dev
```

### **In Terminal 2 (Client):**
```bash
npm start
```

---

## 🔐 7. Login and Test
Open your browser to `http://localhost:3000` and use these credentials:

| Account | Email | Password |
| :--- | :--- | :--- |
| **Teacher** | `teacher@academiq.com` | `Password123!` |
| **Student** | `student@academiq.com` | `Password123!` |

### **How to see Assignments:**
1.  Log in as **Teacher**. Create an assignment for "Database Management Systems".
2.  Log out and log in as **Student**.
3.  Click on **Assignments** - they will be there!

---

## ✅ 8. How to Verify (Optional)
If you want to make sure the database is actually filled with data, do this:

### **Option A: Use the Check Script**
In the server terminal, run:
```bash
node check_final.js
```
It will tell you exactly how many users and subjects were found.

### **Option B: Use pgAdmin**
1.  Open **pgAdmin 4**.
2.  Navigate to: `Databases` > `academiq_db` > `Schemas` > `public` > `Tables`.
3.  Right-click on the `Users` table and select **View/Edit Data** > **All Rows**.
4.  You should see the teacher and student accounts in the list.

---

## ❓ Troubleshooting
*   **"Database connection failed"**: Double-check your `DB_PASS` in the `.env` file.
*   **"No Assignments Found"**: Make sure you ran `node scripts/seed_for_friend.js` in the server folder.
*   **"Module not found"**: Make sure you ran `npm install` in both the server and client folders.
