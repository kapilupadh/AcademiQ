import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Login from "./pages/auth/Login/Login";
import Register from "./pages/auth/Register/Register";
import ForgotPassword from "./pages/auth/ForgotPassword/ForgotPassword";
import Dashboard from "./pages/student/Dashboard/Dashboard";
import Layout from "./components/layout/Layout";
import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import ExamInstructions from "./pages/student/Exam/ExamInstructions";
import ExamPortal from "./pages/student/Exam/ExamPortal";
import ExamLayout from "./components/layout/ExamLayout";
import Profile from "./pages/student/Profile/Profile";
import Result from "./pages/student/Result/Result";
import TeacherRegister from "./pages/auth/Register/TeacherRegister";
import GenerateId from "./pages/admin/GenerateId";
import AdminDashboard from "./pages/admin/Dashboard/AdminDashboard";
import AdminRegister from "./pages/auth/Login/AdminRegister";
import AdminSidebar from "./components/layout/AdminSidebar";
import TeacherDashboard from "./pages/teacher/Dashboard/TeacherDashboard";
import TeacherSidebar from "./components/layout/TeacherSidebar";
import ExamList from "./pages/teacher/Exam/ExamList";
import ExamBuilder from "./pages/teacher/Exam/ExamBuilder";
import ExamManage from "./pages/teacher/Exam/ExamManage";
import AdminExamEngine from "./pages/admin/ExamEngine/AdminExamEngine";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import SubjectImport from "./pages/admin/SubjectImport/SubjectImport";
import SubjectManager from "./pages/admin/SubjectManager/SubjectManager";
import TeacherAttendancePage from "./pages/teacher/Attendance/TeacherAttendancePage";
import StudentAttendancePage from "./pages/student/Attendance/StudentAttendancePage";
import DepartmentLocation from "./pages/admin/DepartmentLocation/DepartmentLocation";
import AdminAttendanceReport from "./pages/admin/AttendanceReport/AdminAttendanceReport";
import TeacherSubjectsPage from "./pages/teacher/Subjects/TeacherSubjectsPage";
import AssignmentList from "./pages/teacher/Assignments/AssignmentList";
import CreateAssignment from "./pages/teacher/Assignments/CreateAssignment";
import AssignmentSubmissions from "./pages/teacher/Assignments/AssignmentSubmissions";
import StudentAssignmentList from "./pages/student/Assignments/AssignmentList";
import AssignmentSubmissionPage from "./pages/student/Assignments/AssignmentSubmissionPage";

import RequestAccess from "./pages/auth/RequestAccess/RequestAccess";
import AccessRequestManager from "./pages/admin/AccessRequestManager/AccessRequestManager";

function StudentPage({ children }) {
  return (
    <ProtectedRoute allowedRoles={[3]}>
      <Sidebar />
      <div
        className="transition-all duration-300 max-lg:!pl-0 w-full"
        style={{ paddingLeft: "var(--student-sidebar-w, 260px)" }}
      >
        <Layout header={<Navbar page="student" />}>{children}</Layout>
      </div>
    </ProtectedRoute>
  );
}

function TeacherPage({ children }) {
  return (
    <ProtectedRoute allowedRoles={[2]}>
      <TeacherSidebar />
      <div
        className="transition-all duration-300 max-lg:!pl-0 w-full"
        style={{ paddingLeft: "var(--teacher-sidebar-w, 240px)" }}
      >
        <Layout header={<Navbar page="teacher" />}>{children}</Layout>
      </div>
    </ProtectedRoute>
  );
}

function AdminPage({ children }) {
  return (
    <ProtectedRoute allowedRoles={[1]}>
      <AdminSidebar />
      <div
        className="transition-all duration-300 max-lg:!pl-0 w-full"
        style={{ paddingLeft: "var(--admin-sidebar-w, 260px)" }}
      >
        <Layout header={<Navbar page="admin" />}>{children}</Layout>
      </div>
    </ProtectedRoute>
  );
}

function UniversalPage({ children }) {
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; } })();
  const role = user.role;
  
  return (
    <ProtectedRoute allowedRoles={[1, 2, 3]}>
      {role === 1 && <AdminSidebar />}
      {role === 2 && <TeacherSidebar />}
      {role === 3 && <Sidebar />}
      <div
        className="transition-all duration-300 max-lg:!pl-0 w-full"
        style={{ 
          paddingLeft: role === 1 ? "var(--admin-sidebar-w, 260px)" : 
                       role === 2 ? "var(--teacher-sidebar-w, 240px)" : 
                       "var(--student-sidebar-w, 260px)" 
        }}
      >
        <Layout header={<Navbar page="profile" />}>{children}</Layout>
      </div>
    </ProtectedRoute>
  );
}


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public / Auth ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/teacher-login" element={<Login />} />
        <Route path="/admin/login" element={<Login />} />
        
        <Route path="/register" element={<Layout header={<Navbar page="public" />}><Register /></Layout>} />
        <Route path="/forgot-password" element={<Layout header={<Navbar page="public" />}><ForgotPassword /></Layout>} />
        <Route path="/teacher-register" element={<Layout header={<Navbar page="public" />}><TeacherRegister /></Layout>} />
        <Route path="/admin/register" element={<Layout header={<Navbar page="public" />}><AdminRegister /></Layout>} />

        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ── Student Pages ── */}
        {/* Shared Pages */}
        <Route path="/profile" element={<UniversalPage><Profile /></UniversalPage>} />

        <Route path="/dashboard" element={<StudentPage><Dashboard /></StudentPage>} />
        <Route path="/exams/result" element={<StudentPage><Result /></StudentPage>} />
        <Route path="/exam/instructions" element={<StudentPage><ExamInstructions /></StudentPage>} />
        <Route path="/attendance/history" element={<StudentPage><StudentAttendancePage /></StudentPage>} />
        <Route path="/student/assignments" element={<StudentPage><StudentAssignmentList /></StudentPage>} />
        <Route path="/student/assignments/:id" element={<StudentPage><AssignmentSubmissionPage /></StudentPage>} />

        {/* Exam portal — isolated layout */}
        <Route
          path="/exam/portal/:sessionId"
          element={
            <ProtectedRoute allowedRoles={[3]}>
              <ExamLayout>
                <ExamPortal />
              </ExamLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/request-access" element={<RequestAccess />} />

        {/* ── Admin Pages ── */}
        <Route path="/admin/access-requests" element={<AdminPage><AccessRequestManager /></AdminPage>} />
        <Route path="/admin/generate-id" element={<AdminPage><GenerateId /></AdminPage>} />
        <Route path="/admin/dashboard" element={<AdminPage><AdminDashboard /></AdminPage>} />
        <Route path="/admin/exams" element={<AdminPage><AdminExamEngine /></AdminPage>} />
        <Route path="/admin/subjects/import" element={<AdminPage><SubjectImport /></AdminPage>} />
        <Route path="/admin/subjects/manage" element={<AdminPage><SubjectManager /></AdminPage>} />
        <Route path="/admin/departments/locations" element={<AdminPage><DepartmentLocation /></AdminPage>} />
        <Route path="/admin/attendance/report" element={<AdminPage><AdminAttendanceReport /></AdminPage>} />

        {/* ── Teacher Pages ── */}
        <Route path="/teacher/dashboard" element={<TeacherPage><TeacherDashboard /></TeacherPage>} />
        <Route path="/teacher/exams" element={<TeacherPage><ExamList /></TeacherPage>} />
        <Route path="/teacher/exams/create" element={<TeacherPage><ExamBuilder /></TeacherPage>} />
        <Route path="/teacher/exams/edit/:id" element={<TeacherPage><ExamBuilder /></TeacherPage>} />
        <Route path="/teacher/exams/:id/manage" element={<TeacherPage><ExamManage /></TeacherPage>} />
        <Route path="/teacher/attendance/mark" element={<TeacherPage><TeacherAttendancePage /></TeacherPage>} />
        <Route path="/teacher/subjects" element={<TeacherPage><TeacherSubjectsPage /></TeacherPage>} />
        <Route path="/teacher/assignments" element={<TeacherPage><AssignmentList /></TeacherPage>} />
        <Route path="/teacher/assignments/create" element={<TeacherPage><CreateAssignment /></TeacherPage>} />
        <Route path="/teacher/assignments/edit/:id" element={<TeacherPage><CreateAssignment /></TeacherPage>} />
        <Route path="/teacher/assignments/:id/submissions" element={<TeacherPage><AssignmentSubmissions /></TeacherPage>} />
      </Routes>
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  );
}