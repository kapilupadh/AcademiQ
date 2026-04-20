# AcademiQ

## Project Structure

- `client/`: React frontend application
- `server/`: Node.js/Express backend application

## How to Start

### Client (Frontend)

1. Open a terminal.
2. Navigate to the client directory:
   ```bash
   cd client
   ```
3. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm start
   ```
   Runs on http://localhost:3000 by default.

### Server (Backend)

1. Open a **new** terminal.
2. Navigate to the server directory:
   ```bash
   cd server
   ```
3. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
4. Start the backend server:

   ```bash
   npm run dev
   ```

   This uses `nodemon` to watch for file changes.

5. Login to different Credentials as followed -
   1. Student URL : localhost:3000/login
   2. Teacher URL : localhost:3000/teacher-login
   3. Admin URL : localhost:3000/admin/login
      (Register a new admin at: localhost:3000/admin/register)

Unique ids for Student to register
STD-2026-8872
STD-2026-4724
STD-2026-4499
Unique id's to Teacher to register
TCH-2026-8836


Bulk mode of student data should be generated .


