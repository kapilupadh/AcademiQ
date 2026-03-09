# Project Directory Structure

Below is the high‑level tree of the repository.  Excluded: `node_modules`, `.git`, `dist`, `build`, and any `.env` files.

```
/  (root)
├── package.json
├── README.md
├── client/                  # frontend React application
│   ├── craco.config.js
│   ├── package.json
│   ├── postcss.config.js
│   ├── README.md
│   ├── test.jsx
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   ├── robots.txt
│   │   └── Icons/
│   └── src/
│       ├── App.css
│       ├── App.jsx
│       ├── App.test.jsx
│       ├── index.jsx
│       ├── reportWebVitals.js
│       ├── setupTests.js
│       ├── assets/
│       │   └── README.md
│       ├── components/
│       │   ├── README.md
│       │   ├── common/
│       │   ├── dashboard/
│       │   ├── layout/
│       │   └── ui/
│       ├── context/
│       │   ├── README.md
│       │   └── ThemeContext.jsx
│       ├── demo-data/
│       │   └── demo-data-admin.js
│       ├── hooks/
│       │   ├── README.md
│       │   └── useSidebar.js
│       ├── pages/
│       │   ├── README.md
│       │   ├── admin/
│       │   ├── assignments/
│       │   ├── attendance/
│       │   ├── auth/
│       │   ├── dashboard/
│       │   ├── marks/
│       │   ├── notifications/
│       │   ├── sessionals/
│       │   ├── student/
│       │   └── teacher/
│       ├── ProjectReview/
│       │   └── AcademiQ-Project-Structure.md
│       ├── routes/
│       │   └── README.md
│       ├── services/
│       │   ├── api.js
│       │   └── README.md
│       ├── styles/
│       │   ├── index.css
│       │   └── README.md
│       └── utils/
│           └── README.md
├── DB/                      # database schema/sql files
│   └── academiq_db.sql
├── docs/                    # documentation and module guides
│   ├── README.md
│   └── MODULE_GUIDES/
├── public/                  # static assets served by the root app
│   ├── Icons/
│   └── uploads/
├── scripts/                 # miscellaneous utility scripts
│   ├── README.md
│   ├── verify_otp_WIP.js
├── server/                  # backend Node/Express server
│   ├── out.json
│   ├── package.json
│   ├── test_bulk.js
│   ├── test_registration.js
│   ├── test_single.js
│   ├── public/
│   │   └── uploads/
│   ├── scripts/
│   │   ├── check_ids.js
│   │   ├── check_users.js
│   │   ├── generate_sample_ids.js
│   │   ├── seed_departments.js
│   │   └── test_email.js
│   └── src/
│       ├── seed.js
│       ├── seedAdmin.js
│       ├── server.js
│       ├── config/
│       │   ├── database.js
│       │   └── README.md
│       ├── database/
│       │   └── README.md
│       ├── middleware/
│       │   ├── authMiddleware.js
│       │   ├── README.md
│       │   ├── requireAdmin.js
│       │   ├── requireTeacher.js
│       │   └── uploadMiddleware.js
│       ├── models/
│       │   ├── ActivityLog.js
│       │   ├── Attendance.js
│       │   ├── Department.js
│       │   ├── Exam.js
│       │   ├── ExamAttempt.js
│       │   ├── index.js
│       │   ├── MaterialRequest.js
│       │   ├── Question.js
│       │   ├── RegistrationSession.js
│       │   ├── StudentAnswer.js
│       │   ├── StudentSubject.js
│       │   ├── Subject.js
│       │   ├── UniqueId.js
│       │   ├── User.js
│       │   └── Violation.js
│       ├── modules/
│       │   ├── README.md
│       │   ├── admin/
│       │   ├── assignments/
│       │   ├── attendance/
│       │   ├── auth/
│       │   ├── department/
│       │   ├── exam/
│       │   ├── marks/
│       │   ├── notifications/
│       │   ├── sessionals/
│       │   └── teacher/
│       └── utils/
│           ├── emailService.js
│           └── README.md
└── shared/                  # code/constants shared between client & server
    ├── README.md
    ├── constants/
    ├── types/
    └── validators/
```
