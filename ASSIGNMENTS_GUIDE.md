# Assignments Module - Implementation Guide

This document provides a complete breakdown of the Assignment functionality recently implemented in AcademiQ.

---

## 🔐 Credentials & Test Users

To test the module after running `node src/seedTestUsers.js`, use the following accounts:
signments 
| User Role | Email | Password |
| :--- | :--- | :--- |
| **Teacher** | `teacher@academiq.com` | `Password123!` |
| **Student** | `student@academiq.com` | `Password123!` |

*Note: For the Teacher, ensure they select the "Database Management Systems" subject.*

---

## 📂 File-by-File Breakdown

### 🖥️ Backend (Server Side)

1.  **`server/src/modules/assignments/assignmentController.js`**
    - Manages the lifecycle of an assignment (Create, Update, Delete, List).
    - Handles student submissions and teacher grading logic.
    - Fully integrated with PostgreSQL via Sequelize.

2.  **`server/src/modules/assignments/assignmentRoutes.js`**
    - Defines API endpoints like `POST /submit` and `GET /my`.
    - Integrated with `uploadMiddleware` for handling attachments.

3.  **`server/src/middleware/uploadMiddleware.js`**
    - Uses `multer` to handle file uploads.
    - Restricted to **JPG, PNG, and PDF** formats.
    - Saves files to `server/public/uploads/submissions`.

4.  **`server/src/models/Assignment.js`** & **`AssignmentSubmission.js`**
    - Database schemas for storing assignment details and student work.

### 🎨 Frontend (Client Side)

1.  **`client/src/services/assignmentService.js`**
    - Handles all API communication including `multipart/form-data` for file uploads.

2.  **`client/src/pages/student/Assignments/AssignmentSubmissionPage.jsx`**
    - The interface for students to type content and attach files.
    - Features a **live preview** for images and a professional icon for PDFs.

3.  **`client/src/pages/teacher/Assignments/AssignmentSubmissions.jsx`**
    - Used by teachers to grade submissions.
    - Displays attachments with a "View Full Size" / "View PDF" feature.

---

## 🛠️ Setup Instructions

1.  **Environment**: Ensure your `.env` has the correct database credentials.
2.  **Seeding**: Run `node src/seedTestUsers.js` in the `server` folder to populate the subjects and users.
3.  **Storage**: The images and PDFs will be saved in `server/public/uploads/submissions`. Ensure the `server` is running to view them.
