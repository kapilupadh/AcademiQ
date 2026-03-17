// App.jsx
import { useEffect } from "react"; // ---> TEST CODE: Added useEffect
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAcademic } from "./context/AcademicContext"; // ---> TEST CODE: Added context import
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
import TeacherLogin from "./pages/auth/Login/TeacherLogin";
import TeacherRegister from "./pages/auth/Register/TeacherRegister";
import GenerateId from "./pages/admin/GenerateId";
import AdminDashboard from "./pages/admin/Dashboard/AdminDashboard";
import AdminLogin from "./pages/auth/Login/AdminLogin";
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

// Shared wrapper for student pages (sidebar + layout)
function StudentPage({ children }) {
  return (
    <ProtectedRoute allowedRoles={[3]}>
      <Sidebar />
      <div
        className="transition-all duration-300"
        style={{ paddingLeft: "var(--student-sidebar-w, 260px)" }}
      >
        <Layout header={<Navbar page="student" />}>{children}</Layout>
      </div>
    </ProtectedRoute>
  );
}

// Shared wrapper for teacher pages
function TeacherPage({ children }) {
  return (
    <ProtectedRoute allowedRoles={[2]}>
      <TeacherSidebar />
      <div
        className="transition-all duration-300"
        style={{ paddingLeft: "var(--teacher-sidebar-w, 240px)" }}
      >
        <Layout header={<Navbar page="teacher" />}>{children}</Layout>
      </div>
    </ProtectedRoute>
  );
}

// Shared wrapper for admin pages
function AdminPage({ children }) {
  return (
    <ProtectedRoute allowedRoles={[1]}>
      <AdminSidebar />
      <div
        className="transition-all duration-300"
        style={{ paddingLeft: "var(--admin-sidebar-w, 260px)" }}
      >
        <Layout header={<Navbar page="public" />}>{children}</Layout>
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  // ---> TEST CODE STARTS HERE <---
  const { departments, isLoading } = useAcademic();

  useEffect(() => {
    console.log("Context Test - Loading Status:", isLoading);
    console.log("Context Test - Departments Data:", departments);
  }, [departments, isLoading]);
  // ---> TEST CODE ENDS HERE <---

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public / Auth ── */}
        <Route path="/login" element={<Layout header={<Navbar page="login" />}><Login /></Layout>} />
        <Route path="/register" element={<Layout header={<Navbar page="public" />}><Register /></Layout>} />
        <Route path="/forgot-password" element={<Layout header={<Navbar page="public" />}><ForgotPassword /></Layout>} />
        <Route path="/teacher-login" element={<Layout header={<Navbar page="public" />}><TeacherLogin /></Layout>} />
        <Route path="/teacher-register" element={<Layout header={<Navbar page="public" />}><TeacherRegister /></Layout>} />
        <Route path="/admin/login" element={<Layout header={<Navbar page="public" />}><AdminLogin /></Layout>} />
        <Route path="/admin/register" element={<Layout header={<Navbar page="public" />}><AdminRegister /></Layout>} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ── Student Pages ── */}
        <Route path="/dashboard" element={<StudentPage><Dashboard /></StudentPage>} />
        <Route path="/profile" element={<StudentPage><Profile /></StudentPage>} />
        <Route path="/exams/result" element={<StudentPage><Result /></StudentPage>} />
        <Route path="/exam/instructions" element={<StudentPage><ExamInstructions /></StudentPage>} />

        {/* Exam portal — no sidebar/navbar, isolated layout */}
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

       {/* ── Admin Pages ── */}
        <Route path="/admin/generate-id" element={<AdminPage><GenerateId /></AdminPage>} />
        <Route path="/admin/dashboard" element={<AdminPage><AdminDashboard /></AdminPage>} />
        <Route path="/admin/exams" element={<AdminPage><AdminExamEngine /></AdminPage>} />
        
        {/* ADDED THESE NEW ROUTES: */}
        <Route path="/admin/subjects/import" element={<AdminPage><SubjectImport /></AdminPage>} />
        <Route path="/admin/subjects/manage" element={<AdminPage><SubjectManager /></AdminPage>} />

        {/* ── Teacher Pages ── */}
        <Route path="/teacher/dashboard" element={<TeacherPage><TeacherDashboard /></TeacherPage>} />
        <Route path="/teacher/exams" element={<TeacherPage><ExamList /></TeacherPage>} />
        <Route path="/teacher/exams/create" element={<TeacherPage><ExamBuilder /></TeacherPage>} />
        <Route path="/teacher/exams/edit/:id" element={<TeacherPage><ExamBuilder /></TeacherPage>} />
        <Route path="/teacher/exams/:id/manage" element={<TeacherPage><ExamManage /></TeacherPage>} />
      </Routes>
    </BrowserRouter>
  );
}