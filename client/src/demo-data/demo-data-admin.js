/**
 * demo-data-admin.js
 * ─────────────────────────────────────────────────────────────────────────────
 * All static demo data for the Admin Dashboard.
 * Replace individual exports with real API responses when integrating backend.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── SECTION 2: Platform Summary Stats ─────────────────────────────────────────
// Replace with: GET /api/admin/dashboard/stats
export const platformStats = [
  {
    key: "totalStudents",
    label: "Total Students",
    value: "1,240",
    delta: "+8%",
    deltaType: "positive",
    icon: "Users",
    accentColor: "violet",
  },
  {
    key: "activeTeachers",
    label: "Active Teachers",
    value: "86",
    delta: "+3%",
    deltaType: "positive", 
    icon: "GraduationCap",
    accentColor: "violet",
  },
  {
    key: "activeExams",
    label: "Active Exams",
    value: "3",
    delta: "-1",
    deltaType: "negative",
    icon: "FileText",
    accentColor: "violet",
  },
  {
    key: "departments",
    label: "Departments",
    value: "12",
    delta: "+0%",
    deltaType: "neutral",
    icon: "Building2",
    accentColor: "violet",
  },
  {
    key: "lowAttendance",
    label: "Low Attendance Alerts",
    value: "24",
    delta: "+5",
    deltaType: "negative",
    icon: "AlertTriangle",
    accentColor: "red",
  },
  {
    key: "avgSessional",
    label: "Avg Sessional Score",
    value: "71%",
    delta: "+2%",
    deltaType: "positive",
    icon: "TrendingUp",
    accentColor: "violet",
  },
];

// ── SECTION 3a: Student Enrollment Trend (AreaChart) ──────────────────────────
// Replace with: GET /api/admin/dashboard/enrollment-trend
export const enrollmentTrend = [
  { month: "Jul", newEnrollments: 110, totalActive: 920 },
  { month: "Aug", newEnrollments: 145, totalActive: 1005 },
  { month: "Sep", newEnrollments: 130, totalActive: 1065 },
  { month: "Oct", newEnrollments: 95,  totalActive: 1100 },
  { month: "Nov", newEnrollments: 60,  totalActive: 1120 },
  { month: "Dec", newEnrollments: 20,  totalActive: 1090 },
  { month: "Jan", newEnrollments: 75,  totalActive: 1140 },
  { month: "Feb", newEnrollments: 88,  totalActive: 1240 },
];

// ── SECTION 3b: Department Distribution (PieChart / DonutChart) ───────────────
// Replace with: GET /api/admin/dashboard/department-distribution
export const departmentDistribution = [
  { name: "Computer Science",     studentCount: 320, color: "#8b5cf6" },
  { name: "Mechanical",           studentCount: 210, color: "#06b6d4" },
  { name: "Civil",                studentCount: 175, color: "#10b981" },
  { name: "Electronics",          studentCount: 195, color: "#f59e0b" },
  { name: "Business Admin",       studentCount: 220, color: "#ec4899" },
  { name: "Biotechnology",        studentCount: 120, color: "#f97316" },
];

// ── SECTION 4a: Attendance Heatmap Trend (BarChart) ───────────────────────────
// Replace with: GET /api/admin/dashboard/attendance-trend
export const attendanceTrend = [
  { day: "Mon", studentAttendance: 88, teacherAttendance: 94, overall: 90 },
  { day: "Tue", studentAttendance: 82, teacherAttendance: 90, overall: 85 },
  { day: "Wed", studentAttendance: 79, teacherAttendance: 88, overall: 82 },
  { day: "Thu", studentAttendance: 85, teacherAttendance: 92, overall: 87 },
  { day: "Fri", studentAttendance: 76, teacherAttendance: 86, overall: 79 },
  { day: "Sat", studentAttendance: 55, teacherAttendance: 72, overall: 61 },
  { day: "Sun", studentAttendance: 40, teacherAttendance: 60, overall: 47 },
];

// ── SECTION 4b: Exam Performance Summary (LineChart) ─────────────────────────
// Replace with: GET /api/admin/dashboard/exam-performance
export const examPerformance = [
  { examName: "Sessional I",  subject: "Mathematics",   averageScore: 64, totalStudents: 210 },
  { examName: "Sessional II", subject: "Physics",       averageScore: 58, totalStudents: 200 },
  { examName: "Mid-Term",     subject: "Chemistry",     averageScore: 71, totalStudents: 215 },
  { examName: "Sessional III",subject: "English",       averageScore: 77, totalStudents: 208 },
  { examName: "Pre-Final",    subject: "Data Structures",averageScore: 62, totalStudents: 195 },
  { examName: "Final",        subject: "Networks",      averageScore: 69, totalStudents: 220 },
];

// ── SECTION 5a: Recent Activity Log ───────────────────────────────────────────
// Replace with: GET /api/admin/dashboard/recent-activity
export const recentActivity = [
  {
    id: 1,
    action: "New student registered: Arjun Mehta (CSE-3A)",
    role: "Admin",
    timestamp: "2 min ago",
    dotColor: "bg-violet-500",
  },
  {
    id: 2,
    action: "Exam scheduled: Data Structures Final — 28 Feb",
    role: "Teacher",
    timestamp: "15 min ago",
    dotColor: "bg-violet-400",
  },
  {
    id: 3,
    action: "Attendance marked for Mechanical Dept (Mon)",
    role: "Teacher",
    timestamp: "1 hr ago",
    dotColor: "bg-teal-500",
  },
  {
    id: 4,
    action: "Low attendance alert flagged: Priya Nair (< 60%)",
    role: "Admin",
    timestamp: "2 hr ago",
    dotColor: "bg-red-500",
  },
  {
    id: 5,
    action: "Teacher ID generated for Suraj Prakash Hazarika (Electronics)",
    role: "Admin",
    timestamp: "3 hr ago",
    dotColor: "bg-amber-500",
  },
  {
    id: 6,
    action: "Sessional I results uploaded by Dr. Rao",
    role: "Teacher",
    timestamp: "5 hr ago",
    dotColor: "bg-violet-400",
  },
  {
    id: 7,
    action: "Student Rahul Verma submitted exam: Sessional III",
    role: "Student",
    timestamp: "6 hr ago",
    dotColor: "bg-sky-500",
  },
  {
    id: 8,
    action: "System backup completed successfully",
    role: "Admin",
    timestamp: "8 hr ago",
    dotColor: "bg-emerald-500",
  },
];

// ── SECTION 5b: Upcoming Exams ────────────────────────────────────────────────
// Replace with: GET /api/admin/dashboard/upcoming-exams
export const upcomingExams = [
  {
    name: "Data Structures Final",
    subject: "Computer Science",
    date: "28 Feb 2025",
    time: "10:00 AM",
    status: "Scheduled",
  },
  {
    name: "Fluid Mechanics Mid-Term",
    subject: "Mechanical",
    date: "01 Mar 2025",
    time: "01:00 PM",
    status: "Scheduled",
  },
  {
    name: "Business Strategy Sessional",
    subject: "Business Admin",
    date: "02 Mar 2025",
    time: "09:00 AM",
    status: "Scheduled",
  },
  {
    name: "VLSI Design Pre-Final",
    subject: "Electronics",
    date: "05 Mar 2025",
    time: "02:00 PM",
    status: "Scheduled",
  },
  {
    name: "Genetics & Biotechnology Final",
    subject: "Biotechnology",
    date: "07 Mar 2025",
    time: "11:00 AM",
    status: "Ongoing",
  },
];

// ── SECTION 5c: Top Performing Students ───────────────────────────────────────
// Replace with: GET /api/admin/dashboard/top-students
export const topStudents = [
  { rank: 1, name: "Ananya Reddy",   department: "CSE",     avgScore: 94 },
  { rank: 2, name: "Rohan Gupta",    department: "Electronics", avgScore: 91 },
  { rank: 3, name: "Meera Pillai",   department: "CSE",     avgScore: 89 },
  { rank: 4, name: "Sahil Agarwal",  department: "Business Admin", avgScore: 87 },
  { rank: 5, name: "Ishika Nambiar", department: "Biotechnology", avgScore: 86 },
];
