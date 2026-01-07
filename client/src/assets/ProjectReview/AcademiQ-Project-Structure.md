# AcademiQ: Modular Project Structure for Team Development

## Overview

This document outlines the complete project structure for **AcademiQ** designed for 6 developers working independently on different modules with minimal merge conflicts and clear separation of concerns.

---

## Complete Repository Structure

```
AcademiQ/
│
├── client/                                    # Frontend React Application
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   │
│   ├── src/
│   │   ├── index.js                          # Entry point
│   │   ├── App.js                            # Main app routing
│   │   │
│   │   ├── assets/                           # Static assets (shared)
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   └── fonts/
│   │   │
│   │   ├── styles/                           # Global styles (shared)
│   │   │   ├── index.css
│   │   │   ├── tailwind.css
│   │   │   └── variables.css
│   │   │
│   │   ├── context/                          # Global state management (shared)
│   │   │   ├── AuthContext.js
│   │   │   ├── ThemeContext.js
│   │   │   ├── NotificationContext.js
│   │   │   └── README.md
│   │   │
│   │   ├── hooks/                            # Custom React hooks (shared)
│   │   │   ├── useAuth.js
│   │   │   ├── useApi.js
│   │   │   ├── useForm.js
│   │   │   ├── useNotification.js
│   │   │   └── README.md
│   │   │
│   │   ├── services/                         # API services (shared)
│   │   │   ├── apiConfig.js
│   │   │   ├── authService.js
│   │   │   ├── assignmentService.js
│   │   │   ├── examService.js
│   │   │   ├── marksService.js
│   │   │   ├── attendanceService.js
│   │   │   ├── notificationService.js
│   │   │   ├── commonService.js
│   │   │   └── README.md
│   │   │
│   │   ├── utils/                            # Utility functions (shared)
│   │   │   ├── validation.js
│   │   │   ├── formatters.js
│   │   │   ├── constants.js
│   │   │   ├── dateUtils.js
│   │   │   └── README.md
│   │   │
│   │   ├── components/                       # Reusable UI components (shared)
│   │   │   ├── common/
│   │   │   │   ├── Button/
│   │   │   │   │   ├── Button.jsx
│   │   │   │   │   ├── Button.css
│   │   │   │   │   └── Button.test.js
│   │   │   │   ├── Input/
│   │   │   │   ├── Card/
│   │   │   │   ├── Modal/
│   │   │   │   ├── LoadingSpinner/
│   │   │   │   ├── Alert/
│   │   │   │   ├── Badge/
│   │   │   │   ├── Pagination/
│   │   │   │   ├── Dropdown/
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── Navbar/
│   │   │   │   │   ├── Navbar.jsx
│   │   │   │   │   ├── Navbar.css
│   │   │   │   │   └── Navbar.test.js
│   │   │   │   ├── Sidebar/
│   │   │   │   ├── Header/
│   │   │   │   ├── Footer/
│   │   │   │   └── README.md
│   │   │   │
│   │   │   └── README.md
│   │   │
│   │   ├── pages/                            # Page-level components by module
│   │   │
│   │   │   ├── auth/                         # MODULE 1: Authentication (Developer 1)
│   │   │   │   ├── Register/
│   │   │   │   │   ├── Register.jsx
│   │   │   │   │   ├── Register.css
│   │   │   │   │   └── Register.test.js
│   │   │   │   ├── Login/
│   │   │   │   │   ├── Login.jsx
│   │   │   │   │   ├── Login.css
│   │   │   │   │   └── Login.test.js
│   │   │   │   ├── ForgotPassword/
│   │   │   │   ├── EmailVerification/
│   │   │   │   ├── Profile/
│   │   │   │   │   ├── Profile.jsx
│   │   │   │   │   ├── Profile.css
│   │   │   │   │   └── EditProfile.jsx
│   │   │   │   ├── components/               # Auth-specific components
│   │   │   │   │   ├── UniqueIDInput.jsx
│   │   │   │   │   ├── PasswordStrengthMeter.jsx
│   │   │   │   │   └── README.md
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── dashboard/                    # MODULE 2: Dashboard (Developer 2)
│   │   │   │   ├── StudentDashboard/
│   │   │   │   │   ├── StudentDashboard.jsx
│   │   │   │   │   ├── StudentDashboard.css
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── QuickStats.jsx
│   │   │   │   │   │   ├── AssignmentWidget.jsx
│   │   │   │   │   │   ├── ExamWidget.jsx
│   │   │   │   │   │   ├── MarksWidget.jsx
│   │   │   │   │   │   ├── AttendanceWidget.jsx
│   │   │   │   │   │   ├── NotificationsWidget.jsx
│   │   │   │   │   │   └── README.md
│   │   │   │   │   └── README.md
│   │   │   │   │
│   │   │   │   ├── TeacherDashboard/
│   │   │   │   │   ├── TeacherDashboard.jsx
│   │   │   │   │   ├── TeacherDashboard.css
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── PendingTasks.jsx
│   │   │   │   │   │   ├── ClassPerformance.jsx
│   │   │   │   │   │   ├── StudentPerformance.jsx
│   │   │   │   │   │   └── README.md
│   │   │   │   │   └── README.md
│   │   │   │   │
│   │   │   │   ├── AdminDashboard/
│   │   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   │   ├── AdminDashboard.css
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── SystemOverview.jsx
│   │   │   │   │   │   ├── AcademicPerformance.jsx
│   │   │   │   │   │   ├── AttendanceAnalytics.jsx
│   │   │   │   │   │   ├── SystemHealth.jsx
│   │   │   │   │   │   └── README.md
│   │   │   │   │   └── README.md
│   │   │   │   │
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── assignments/                  # MODULE 3: Assignments (Developer 3)
│   │   │   │   ├── AssignmentList/
│   │   │   │   │   ├── AssignmentList.jsx
│   │   │   │   │   ├── AssignmentList.css
│   │   │   │   │   ├── AssignmentCard.jsx
│   │   │   │   │   └── AssignmentCard.css
│   │   │   │   │
│   │   │   │   ├── AssignmentDetails/
│   │   │   │   │   ├── AssignmentDetails.jsx
│   │   │   │   │   ├── AssignmentDetails.css
│   │   │   │   │   └── FileDownload.jsx
│   │   │   │   │
│   │   │   │   ├── SubmitAssignment/
│   │   │   │   │   ├── SubmitAssignment.jsx
│   │   │   │   │   ├── SubmitAssignment.css
│   │   │   │   │   ├── FileUpload.jsx
│   │   │   │   │   └── SubmissionForm.jsx
│   │   │   │   │
│   │   │   │   ├── GradeAssignment/          # Teacher view
│   │   │   │   │   ├── SubmissionsList.jsx
│   │   │   │   │   ├── SubmissionsList.css
│   │   │   │   │   ├── GradeForm.jsx
│   │   │   │   │   └── StudentSubmission.jsx
│   │   │   │   │
│   │   │   │   ├── CreateAssignment/         # Teacher view
│   │   │   │   │   ├── CreateAssignment.jsx
│   │   │   │   │   ├── CreateAssignment.css
│   │   │   │   │   ├── AssignmentForm.jsx
│   │   │   │   │   └── FileAttachment.jsx
│   │   │   │   │
│   │   │   │   ├── components/               # Assignment-specific components
│   │   │   │   │   ├── StatusBadge.jsx
│   │   │   │   │   ├── DeadlineCounter.jsx
│   │   │   │   │   └── SubmissionHistory.jsx
│   │   │   │   │
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── sessionals/                   # MODULE 4: Sessional Exams (Developer 4)
│   │   │   │   ├── ExamList/
│   │   │   │   │   ├── ExamList.jsx
│   │   │   │   │   ├── ExamList.css
│   │   │   │   │   └── ExamCard.jsx
│   │   │   │   │
│   │   │   │   ├── ExamSchedule/
│   │   │   │   │   ├── ExamSchedule.jsx
│   │   │   │   │   ├── ExamSchedule.css
│   │   │   │   │   └── ExamCalendar.jsx
│   │   │   │   │
│   │   │   │   ├── ExamInterface/            # Main exam taking interface
│   │   │   │   │   ├── ExamInterface.jsx
│   │   │   │   │   ├── ExamInterface.css
│   │   │   │   │   ├── Question.jsx
│   │   │   │   │   ├── QuestionNavigation.jsx
│   │   │   │   │   ├── Timer.jsx
│   │   │   │   │   ├── ProgressBar.jsx
│   │   │   │   │   ├── ReviewSection.jsx
│   │   │   │   │   └── SubmitConfirmation.jsx
│   │   │   │   │
│   │   │   │   ├── ExamResult/
│   │   │   │   │   ├── ExamResult.jsx
│   │   │   │   │   ├── ExamResult.css
│   │   │   │   │   └── AnswerReview.jsx
│   │   │   │   │
│   │   │   │   ├── CreateExam/               # Teacher/Admin view
│   │   │   │   │   ├── CreateExam.jsx
│   │   │   │   │   ├── CreateExam.css
│   │   │   │   │   ├── ExamForm.jsx
│   │   │   │   │   └── QuestionBankSetup.jsx
│   │   │   │   │
│   │   │   │   ├── QuestionBank/             # Teacher/Admin view
│   │   │   │   │   ├── QuestionBank.jsx
│   │   │   │   │   ├── QuestionBank.css
│   │   │   │   │   ├── QuestionList.jsx
│   │   │   │   │   ├── AddQuestion.jsx
│   │   │   │   │   └── EditQuestion.jsx
│   │   │   │   │
│   │   │   │   ├── components/               # Exam-specific components
│   │   │   │   │   ├── OptionButton.jsx
│   │   │   │   │   ├── AnswerIndicator.jsx
│   │   │   │   │   └── ExamTimer.jsx
│   │   │   │   │
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── marks/                        # MODULE 5: Marks Management (Developer 5)
│   │   │   │   ├── MarksView/
│   │   │   │   │   ├── MarksView.jsx
│   │   │   │   │   ├── MarksView.css
│   │   │   │   │   ├── SubjectBreakdown.jsx
│   │   │   │   │   └── MarksTable.jsx
│   │   │   │   │
│   │   │   │   ├── PerformanceAnalytics/
│   │   │   │   │   ├── PerformanceAnalytics.jsx
│   │   │   │   │   ├── PerformanceAnalytics.css
│   │   │   │   │   ├── TrendChart.jsx
│   │   │   │   │   ├── SubjectComparison.jsx
│   │   │   │   │   ├── ClassAverageComparison.jsx
│   │   │   │   │   └── GradeDistribution.jsx
│   │   │   │   │
│   │   │   │   ├── GradeCalculation/        # Admin/Teacher view
│   │   │   │   │   ├── CalculateMarks.jsx
│   │   │   │   │   ├── CalculateMarks.css
│   │   │   │   │   ├── GradeSettings.jsx
│   │   │   │   │   └── ResultSheet.jsx
│   │   │   │   │
│   │   │   │   ├── EnterMarks/              # Teacher view
│   │   │   │   │   ├── EnterMarks.jsx
│   │   │   │   │   ├── EnterMarks.css
│   │   │   │   │   ├── BulkMarkEntry.jsx
│   │   │   │   │   └── MarkForm.jsx
│   │   │   │   │
│   │   │   │   ├── ExportMarks/
│   │   │   │   │   ├── ExportMarks.jsx
│   │   │   │   │   ├── ExportMarks.css
│   │   │   │   │   └── ExportOptions.jsx
│   │   │   │   │
│   │   │   │   ├── components/               # Marks-specific components
│   │   │   │   │   ├── GradeCard.jsx
│   │   │   │   │   ├── PercentageBar.jsx
│   │   │   │   │   ├── MarksHistory.jsx
│   │   │   │   │   └── GpaCalculator.jsx
│   │   │   │   │
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── attendance/                   # MODULE 6: Attendance (Developer 6 / You)
│   │   │   │   ├── AttendanceView/
│   │   │   │   │   ├── AttendanceView.jsx
│   │   │   │   │   ├── AttendanceView.css
│   │   │   │   │   ├── AttendanceBySubject.jsx
│   │   │   │   │   └── AttendanceCalendar.jsx
│   │   │   │   │
│   │   │   │   ├── AttendanceTracking/
│   │   │   │   │   ├── AttendanceTracking.jsx
│   │   │   │   │   ├── AttendanceTracking.css
│   │   │   │   │   ├── AttendanceTrend.jsx
│   │   │   │   │   └── ShortageAlert.jsx
│   │   │   │   │
│   │   │   │   ├── MarkAttendance/          # Teacher view
│   │   │   │   │   ├── MarkAttendance.jsx
│   │   │   │   │   ├── MarkAttendance.css
│   │   │   │   │   ├── StudentList.jsx
│   │   │   │   │   └── AttendanceForm.jsx
│   │   │   │   │
│   │   │   │   ├── AttendanceReports/       # Admin/Teacher view
│   │   │   │   │   ├── AttendanceReports.jsx
│   │   │   │   │   ├── AttendanceReports.css
│   │   │   │   │   ├── DepartmentReport.jsx
│   │   │   │   │   └── StudentReport.jsx
│   │   │   │   │
│   │   │   │   ├── components/               # Attendance-specific components
│   │   │   │   │   ├── AttendancePercentage.jsx
│   │   │   │   │   ├── StatusIndicator.jsx
│   │   │   │   │   └── AttendanceChart.jsx
│   │   │   │   │
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── admin/                        # Admin-specific pages (shared)
│   │   │   │   ├── UserManagement/
│   │   │   │   │   ├── UserManagement.jsx
│   │   │   │   │   ├── UserManagement.css
│   │   │   │   │   ├── UserList.jsx
│   │   │   │   │   ├── AddUser.jsx
│   │   │   │   │   └── EditUser.jsx
│   │   │   │   │
│   │   │   │   ├── IDManagement/
│   │   │   │   │   ├── IDManagement.jsx
│   │   │   │   │   ├── IDManagement.css
│   │   │   │   │   ├── GenerateIDs.jsx
│   │   │   │   │   └── TrackIDs.jsx
│   │   │   │   │
│   │   │   │   ├── AcademicSetup/
│   │   │   │   │   ├── DepartmentManagement.jsx
│   │   │   │   │   ├── SubjectManagement.jsx
│   │   │   │   │   └── CourseManagement.jsx
│   │   │   │   │
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── notifications/                # Notification center (shared)
│   │   │   │   ├── NotificationCenter.jsx
│   │   │   │   ├── NotificationCenter.css
│   │   │   │   ├── NotificationList.jsx
│   │   │   │   └── NotificationPreferences.jsx
│   │   │   │
│   │   │   └── README.md
│   │   │
│   │   └── routes/                           # Route configuration (shared)
│   │       ├── PrivateRoute.jsx
│   │       ├── PublicRoute.jsx
│   │       ├── index.js
│   │       └── README.md
│   │
│   ├── package.json
│   ├── tailwind.config.js
│   ├── .env.example
│   └── README.md
│
├── server/                                    # Backend Node.js Application
│   ├── src/
│   │   ├── app.js                            # Express app initialization (shared)
│   │   │
│   │   ├── config/                           # Configuration (shared)
│   │   │   ├── database.js
│   │   │   ├── env.js
│   │   │   ├── jwt.js
│   │   │   └── README.md
│   │   │
│   │   ├── middleware/                       # Global middleware (shared)
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   ├── corsConfig.js
│   │   │   ├── requestLogger.js
│   │   │   ├── validation.js
│   │   │   └── README.md
│   │   │
│   │   ├── utils/                            # Utility functions (shared)
│   │   │   ├── passwordUtils.js
│   │   │   ├── tokenUtils.js
│   │   │   ├── emailService.js
│   │   │   ├── fileUpload.js
│   │   │   ├── validators.js
│   │   │   ├── constants.js
│   │   │   └── README.md
│   │   │
│   │   ├── database/                         # Database setup (shared)
│   │   │   ├── init.js
│   │   │   ├── migrations/
│   │   │   │   ├── 001_create_users_table.sql
│   │   │   │   ├── 002_create_unique_ids_table.sql
│   │   │   │   └── README.md
│   │   │   ├── seeds/
│   │   │   │   ├── seedUsers.js
│   │   │   │   └── README.md
│   │   │   └── README.md
│   │   │
│   │   ├── modules/                         # Modular endpoints by feature
│   │   │   │
│   │   │   ├── auth/                         # MODULE 1: Authentication (Developer 1)
│   │   │   │   ├── authController.js
│   │   │   │   ├── authRoutes.js
│   │   │   │   ├── authValidator.js
│   │   │   │   ├── models/
│   │   │   │   │   ├── User.js
│   │   │   │   │   ├── UniqueID.js
│   │   │   │   │   └── RegistrationSession.js
│   │   │   │   ├── services/
│   │   │   │   │   ├── registerService.js
│   │   │   │   │   ├── loginService.js
│   │   │   │   │   ├── passwordResetService.js
│   │   │   │   │   └── emailVerificationService.js
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── verifyUniqueID.js
│   │   │   │   │   └── validateRegistration.js
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── assignments/                  # MODULE 2: Assignments (Developer 3)
│   │   │   │   ├── assignmentController.js
│   │   │   │   ├── assignmentRoutes.js
│   │   │   │   ├── assignmentValidator.js
│   │   │   │   ├── models/
│   │   │   │   │   ├── Assignment.js
│   │   │   │   │   ├── AssignmentSubmission.js
│   │   │   │   │   ├── SubmissionFile.js
│   │   │   │   │   └── AssignmentGrade.js
│   │   │   │   ├── services/
│   │   │   │   │   ├── createAssignmentService.js
│   │   │   │   │   ├── submissionService.js
│   │   │   │   │   ├── gradingService.js
│   │   │   │   │   └── notificationService.js
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── validateSubmission.js
│   │   │   │   │   ├── fileUploadHandler.js
│   │   │   │   │   └── deadlineCheck.js
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── sessionals/                   # MODULE 3: Sessional Exams (Developer 4)
│   │   │   │   ├── examController.js
│   │   │   │   ├── examRoutes.js
│   │   │   │   ├── examValidator.js
│   │   │   │   ├── models/
│   │   │   │   │   ├── ExamSession.js
│   │   │   │   │   ├── Question.js
│   │   │   │   │   ├── QuestionBank.js
│   │   │   │   │   ├── StudentExamAllocation.js
│   │   │   │   │   ├── ExamResponse.js
│   │   │   │   │   └── ExamScore.js
│   │   │   │   ├── services/
│   │   │   │   │   ├── examCreationService.js
│   │   │   │   │   ├── questionAllocationService.js      # Randomization logic
│   │   │   │   │   ├── examTakingService.js
│   │   │   │   │   ├── scoringService.js
│   │   │   │   │   └── randomizationAlgorithm.js         # Fisher-Yates shuffle
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── validateExam.js
│   │   │   │   │   ├── checkExamEligibility.js
│   │   │   │   │   └── sessionLocking.js
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── marks/                        # MODULE 4: Marks Management (Developer 5)
│   │   │   │   ├── marksController.js
│   │   │   │   ├── marksRoutes.js
│   │   │   │   ├── marksValidator.js
│   │   │   │   ├── models/
│   │   │   │   │   ├── Mark.js
│   │   │   │   │   ├── GradeSetting.js
│   │   │   │   │   ├── ResultSheet.js
│   │   │   │   │   └── PerformanceHistory.js
│   │   │   │   ├── services/
│   │   │   │   │   ├── enterMarksService.js
│   │   │   │   │   ├── calculateMarksService.js
│   │   │   │   │   ├── gradeCalculationService.js
│   │   │   │   │   ├── reportGenerationService.js
│   │   │   │   │   └── analyticsService.js
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── validateMarks.js
│   │   │   │   │   └── authorizeGradeAccess.js
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── attendance/                   # MODULE 5: Attendance (Developer 6 / You)
│   │   │   │   ├── attendanceController.js
│   │   │   │   ├── attendanceRoutes.js
│   │   │   │   ├── attendanceValidator.js
│   │   │   │   ├── models/
│   │   │   │   │   ├── Attendance.js
│   │   │   │   │   ├── AttendanceRule.js
│   │   │   │   │   └── AttendanceReport.js
│   │   │   │   ├── services/
│   │   │   │   │   ├── markAttendanceService.js
│   │   │   │   │   ├── calculatePercentageService.js
│   │   │   │   │   ├── alertService.js
│   │   │   │   │   └── reportService.js
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── validateAttendanceData.js
│   │   │   │   │   └── checkTeacherAccess.js
│   │   │   │   ├── jobs/
│   │   │   │   │   ├── calculateDailyAttendance.js
│   │   │   │   │   └── sendShortageAlerts.js
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── notifications/                # MODULE 6: Notifications (Shared)
│   │   │   │   ├── notificationController.js
│   │   │   │   ├── notificationRoutes.js
│   │   │   │   ├── models/
│   │   │   │   │   ├── Notification.js
│   │   │   │   │   ├── NotificationTemplate.js
│   │   │   │   │   └── NotificationLog.js
│   │   │   │   ├── services/
│   │   │   │   │   ├── createNotificationService.js
│   │   │   │   │   ├── sendEmailService.js
│   │   │   │   │   ├── sendSmsService.js
│   │   │   │   │   └── notificationQueueService.js
│   │   │   │   └── README.md
│   │   │   │
│   │   │   ├── admin/                        # MODULE 7: Admin Functions (Shared)
│   │   │   │   ├── adminController.js
│   │   │   │   ├── adminRoutes.js
│   │   │   │   ├── models/
│   │   │   │   │   ├── Department.js
│   │   │   │   │   ├── Subject.js
│   │   │   │   │   ├── Course.js
│   │   │   │   │   └── AcademicCalendar.js
│   │   │   │   ├── services/
│   │   │   │   │   ├── userManagementService.js
│   │   │   │   │   ├── idGenerationService.js
│   │   │   │   │   ├── academicSetupService.js
│   │   │   │   │   ├── auditLogService.js
│   │   │   │   │   └── reportService.js
│   │   │   │   └── README.md
│   │   │   │
│   │   │   └── README.md
│   │   │
│   │   ├── server.js                        # Entry point
│   │   └── README.md
│   │
│   ├── tests/                                # Testing (shared)
│   │   ├── unit/
│   │   │   ├── auth/
│   │   │   ├── assignments/
│   │   │   ├── sessionals/
│   │   │   ├── marks/
│   │   │   ├── attendance/
│   │   │   └── README.md
│   │   │
│   │   ├── integration/
│   │   │   ├── auth/
│   │   │   ├── assignments/
│   │   │   └── README.md
│   │   │
│   │   └── README.md
│   │
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── shared/                                    # Shared utilities (optional)
│   ├── constants/
│   │   ├── apiEndpoints.js
│   │   ├── statusCodes.js
│   │   ├── errorMessages.js
│   │   ├── validationRules.js
│   │   └── README.md
│   │
│   ├── types/                                # Type definitions (if using TypeScript)
│   │   ├── user.types.js
│   │   ├── assignment.types.js
│   │   ├── exam.types.js
│   │   ├── marks.types.js
│   │   └── README.md
│   │
│   ├── validators/
│   │   ├── authValidators.js
│   │   ├── assignmentValidators.js
│   │   ├── examValidators.js
│   │   ├── marksValidators.js
│   │   └── README.md
│   │
│   └── README.md
│
├── docs/                                      # Documentation
│   ├── API.md                                 # API endpoints documentation
│   ├── DATABASE.md                            # Database schema
│   ├── SETUP.md                               # Setup instructions
│   ├── WORKFLOW.md                            # Git workflow guide
│   ├── ARCHITECTURE.md                        # System architecture
│   ├── MODULE_GUIDES/
│   │   ├── AUTH_MODULE.md                     # Authentication module guide
│   │   ├── ASSIGNMENT_MODULE.md               # Assignment module guide
│   │   ├── SESSIONAL_MODULE.md                # Sessional exam module guide
│   │   ├── MARKS_MODULE.md                    # Marks module guide
│   │   ├── ATTENDANCE_MODULE.md               # Attendance module guide
│   │   └── README.md
│   │
│   └── README.md
│
├── scripts/                                   # Utility scripts
│   ├── setupDatabase.js
│   ├── seedData.js
│   ├── backupDatabase.sh
│   ├── deploymentChecklist.sh
│   └── README.md
│
├── .gitignore                                 # Git ignore rules
├── .env.example                               # Environment template
├── README.md                                  # Project overview
├── CONTRIBUTING.md                            # Contribution guidelines
├── CODE_OF_CONDUCT.md                         # Team conduct
└── docker-compose.yml                         # Docker setup (optional)
```

---

## Module Assignment Strategy

### Developer 1: Authentication & User Management
**Modules:** `client/src/pages/auth/` + `server/src/modules/auth/`

**Responsibilities:**
- User registration with unique ID validation
- Login and logout functionality
- Password reset and email verification
- Profile management
- User role assignment
- Token generation and refresh
- **Key Files:** authController.js, registerService.js, loginService.js

**Dependencies:** None (foundational module)

**Deliverables:**
- ✅ Registration API endpoint
- ✅ Login API endpoint
- ✅ Email verification system
- ✅ JWT token management
- ✅ Registration UI forms
- ✅ Login page with validation

---

### Developer 2: Dashboard & Analytics
**Modules:** `client/src/pages/dashboard/` + Backend dashboard data APIs

**Responsibilities:**
- Student dashboard (stats, assignments, exams, marks)
- Teacher dashboard (pending tasks, class performance)
- Admin dashboard (system metrics, analytics)
- Performance visualization charts
- Role-specific widgets
- **Key Files:** *Dashboard.jsx components, Dashboard data services

**Dependencies:**
- Auth module (verify user roles)
- Assignments module (get pending assignments)
- Sessionals module (get exam data)
- Marks module (get performance data)
- Attendance module (get attendance percentage)

**Deliverables:**
- ✅ Student dashboard with widgets
- ✅ Teacher dashboard with analytics
- ✅ Admin dashboard with metrics
- ✅ Performance charts and visualizations
- ✅ Real-time data updates

---

### Developer 3: Assignment Management
**Modules:** `client/src/pages/assignments/` + `server/src/modules/assignments/`

**Responsibilities:**
- Create/publish assignments (teacher)
- Submit assignments (student)
- Grade submissions (teacher)
- View submission history
- File upload/download handling
- Late submission detection
- Deadline tracking
- **Key Files:** assignmentController.js, submissionService.js, gradingService.js

**Dependencies:**
- Auth module (verify user roles)
- Notification module (send deadline reminders)

**Deliverables:**
- ✅ Assignment creation interface
- ✅ Submission interface with file upload
- ✅ Grading interface with feedback
- ✅ Assignment list and tracking
- ✅ Deadline notification system

---

### Developer 4: Sessional Exams (MCQ Module)
**Modules:** `client/src/pages/sessionals/` + `server/src/modules/sessionals/`

**Responsibilities:**
- Create exam sessions
- Manage question banks
- Random question allocation algorithm
- Exam taking interface
- Auto-scoring system
- Exam result display
- Question randomization (Fisher-Yates)
- **Key Files:** randomizationAlgorithm.js, questionAllocationService.js, scoringService.js

**Dependencies:**
- Auth module (verify student eligibility)
- Attendance module (check exam eligibility)
- Marks module (save exam scores)
- Notification module (exam schedule notifications)

**Critical Logic:**
- Each student gets unique 20 questions from 50-question bank
- Questions displayed in randomized order
- No predictability in allocation
- Session locking after submission

**Deliverables:**
- ✅ Question bank management
- ✅ Exam creation and scheduling
- ✅ Random question allocation system
- ✅ Exam taking interface with timer
- ✅ Auto-scoring and results display
- ✅ Answer review section

---

### Developer 5: Marks Management
**Modules:** `client/src/pages/marks/` + `server/src/modules/marks/`

**Responsibilities:**
- Enter marks for assessments
- Automatic mark calculation
- Grade assignment based on weightage
- SGPA/CGPA calculation
- Performance trends and analytics
- Report generation (PDF/Excel)
- Subject-wise breakdown
- **Key Files:** calculateMarksService.js, gradeCalculationService.js, reportGenerationService.js

**Dependencies:**
- Assignments module (assignment marks)
- Sessionals module (exam scores)
- Admin module (grading policies)

**Deliverables:**
- ✅ Marks entry interface (bulk and individual)
- ✅ Automatic grade calculation
- ✅ Performance analytics dashboard
- ✅ Report generation (PDF/Excel)
- ✅ Student performance comparison
- ✅ Historical marks tracking

---

### Developer 6 (You): Attendance Management & Integration
**Modules:** `client/src/pages/attendance/` + `server/src/modules/attendance/`

**Responsibilities:**
- Daily attendance marking (teacher)
- Attendance calculation and percentage
- Shortage alerts and notifications
- Attendance reports
- Exam eligibility based on attendance
- Attendance trends visualization
- Integration with other modules
- **Key Files:** markAttendanceService.js, calculatePercentageService.js, alertService.js

**Additional Responsibilities (Project Lead):**
- Code review and integration testing
- Bug fixes and debugging
- Deployment and DevOps
- Team coordination
- Documentation updates
- Performance optimization

**Dependencies:**
- Auth module (verify user roles)
- Notification module (shortage alerts)
- Sessionals module (exam eligibility check)
- Dashboard module (attendance widget)

**Deliverables:**
- ✅ Attendance marking interface
- ✅ Automatic percentage calculation
- ✅ Shortage alert system
- ✅ Attendance reports and analytics
- ✅ Exam eligibility enforcement
- ✅ Cron jobs for daily calculations

---

## Avoiding Merge Conflicts

### Rules for Developers

1. **Strictly Follow Module Boundaries**
   - Only modify files in your assigned module
   - Don't edit other developers' files
   - Use APIs/services to communicate between modules

2. **Shared Files - Communication**
   - Files in `shared/`, `middleware/`, `config/`, `utils/` are shared
   - Discuss changes in these files in team meetings
   - Create separate branches for shared file changes
   - Always PR for shared file modifications

3. **API Contracts**
   - Define API endpoints in documentation first
   - Don't change endpoint structure without discussion
   - Version APIs if breaking changes needed
   - Use consistent response format

4. **Database Models**
   - Define schema collectively before implementation
   - Each module has own models (no cross-module models)
   - Document relationships between tables

5. **Code Style**
   - Use consistent naming conventions
   - Follow the same indentation (2 spaces)
   - Use ESLint configuration
   - Run `npm run lint` before committing

### Pre-Commit Checklist

```bash
# Before pushing, run:
npm run lint          # Check code style
npm run test          # Run tests
npm run build         # Build for production (client)
```

---

## Git Workflow for Each Developer

### Daily Workflow

```bash
# 1. Start day - update dev branch
git checkout dev
git pull origin dev

# 2. Create feature branch from dev
git checkout -b feature/auth-email-verification

# 3. Work on your module
# Edit files only in your module folder
# Make small, logical commits
git add client/src/pages/auth/
git commit -m "Add email verification component"

# 4. Push your work
git push origin feature/auth-email-verification

# 5. Create Pull Request on GitHub
# Set base: dev, compare: feature/auth-email-verification
# Add description and assign reviewers
# Wait for approval and merge

# 6. After merge, cleanup
git checkout dev
git pull origin dev
git branch -d feature/auth-email-verification
```

### Updating When Others Merge

```bash
# If another developer merges and you want their changes
git checkout dev
git pull origin dev

# Then rebase your current branch
git checkout your-current-branch
git rebase dev

# If conflicts, resolve them
git add .
git rebase --continue

# Force push (be careful!)
git push origin -f your-current-branch
```

---

## Communication Protocol

### Weekly Sync-Up (Every Monday)
**Agenda:**
- Previous week's progress
- Current week's plans
- Blockers and dependencies
- API changes or shared file updates

### Daily Standup (10 minutes via chat)
**Report:**
- What did I complete yesterday?
- What will I complete today?
- Any blockers?

### Module Integration Points (Communicate)

| Module 1 → Module 2 | Communication Channel |
|-------------------|----------------------|
| Auth → Any | User ID, roles, permissions |
| Assignments → Marks | Assignment marks data |
| Sessionals → Marks | Exam scores data |
| Assignments → Notifications | Deadline, submission events |
| Attendance → Sessionals | Eligibility check for exams |
| All → Dashboard | Aggregate data for widgets |

---

## Testing Strategy

### Unit Tests (Each Developer)
Test your module independently

```javascript
// Example: test/unit/auth/register.test.js
describe('User Registration', () => {
  test('should register user with valid unique ID', () => {
    // Test logic
  });
});
```

### Integration Tests (Team)
Test module interactions

```javascript
// Example: test/integration/assignments/submission.test.js
describe('Assignment Submission Flow', () => {
  test('should create mark after assignment submission', () => {
    // Test auth → assignment → marks flow
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific module tests
npm test -- auth

# Watch mode during development
npm test -- --watch
```

---

## Documentation Requirements

Each module needs a README.md:

```markdown
# [Module Name] Module

## Overview
Brief description of what this module does

## API Endpoints
List of all endpoints with request/response examples

## Database Tables
Tables used by this module with relationships

## Dependencies
Other modules this depends on

## Files Structure
Key files and their purposes

## Setup Instructions
How to set up this module locally

## Testing
How to run tests for this module

## Common Issues
Troubleshooting guide
```

---

## Sample Module README Template

Create `server/src/modules/[modulename]/README.md`:

```markdown
# Authentication Module

## Overview
Handles user registration, login, password reset, and email verification

## API Endpoints
- POST /api/auth/register - Register new student
- POST /api/auth/login - User login
- POST /api/auth/forgot-password - Password reset request
- GET /api/auth/verify-email/:token - Verify email

## Database Models
- User (id, email, password_hash, role)
- UniqueID (unique_id, is_used, expiry_date)
- RegistrationSession (unique_id, session_token)

## Dependencies
- None (foundational)

## Key Services
- registerService.js - Handles registration logic
- loginService.js - Handles login and token generation
- emailVerificationService.js - Email verification flow

## Testing
npm test -- auth

## Common Issues
- "Unique ID not found" - Verify ID exists in database
- "Email already registered" - User tried registering twice
```

---

## Deployment Strategy

### Dev Branch (Active Development)
- All feature branches merge here
- Daily changes
- May have bugs

### Staging Branch (Pre-Production)
- Merge dev every Friday
- Full testing
- Performance check
- Deployment to staging environment

### Main Branch (Production)
- Only stable, tested code
- Monthly releases
- Each release tagged with version (v1.0.0)
- Requires multiple approvals

---

## Summary Table

| Developer | Primary Module | Frontend Path | Backend Path | Key Responsibility |
|-----------|---|---|---|---|
| Dev 1 | Authentication | `pages/auth/` | `modules/auth/` | User registration & login |
| Dev 2 | Dashboard | `pages/dashboard/` | API integration | Role-specific dashboards |
| Dev 3 | Assignments | `pages/assignments/` | `modules/assignments/` | Create, submit, grade assignments |
| Dev 4 | Sessionals | `pages/sessionals/` | `modules/sessionals/` | Randomized MCQ exams |
| Dev 5 | Marks | `pages/marks/` | `modules/marks/` | Mark entry & grade calculation |
| Dev 6 (You) | Attendance | `pages/attendance/` | `modules/attendance/` | Attendance tracking & alerts |

---

## Next Steps

1. **Set up GitHub repository** with this structure
2. **Create branch protection rules** on `main` and `dev`
3. **Add all team members as collaborators**
4. **Create project board** with issues for each module
5. **Schedule first team sync-up** to assign specific tasks
6. **Each developer clones and sets up local environment**
7. **Create pull request template** for consistency

This structure ensures minimal conflicts, clear ownership, and smooth collaboration!
