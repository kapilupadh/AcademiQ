import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

export default function App() {
  return (
    // 1. Router must be the TOP level parent
    <BrowserRouter>
      <Routes>
        {/* LOGIN: Wrapped in Layout with Navbar */}
        <Route
          path="/login"
          element={
            <Layout header={<Navbar page="login" />}>
              <Login />
            </Layout>
          }
        />

        {/* REGISTER: Wrapped in Layout with Navbar */}
        <Route
          path="/register"
          element={
            <Layout header={<Navbar page="public" />}>
              <Register />
            </Layout>
          }
        />

        {/* FORGOT PASSWORD: Wrapped in Layout with Navbar */}
        <Route
          path="/forgot-password"
          element={
            <Layout header={<Navbar page="public" />}>
              <ForgotPassword />
            </Layout>
          }
        />

        {/* TEACHER ROUTING */}
        <Route
          path="/teacher-login"
          element={
            <Layout header={<Navbar page="public" />}>
              <TeacherLogin />
            </Layout>
          }
        />
        <Route
          path="/teacher-register"
          element={
            <Layout header={<Navbar page="public" />}>
              <TeacherRegister />
            </Layout>
          }
        />

        {/* ADMIN AUTH ROUTING */}
        <Route
          path="/admin/login"
          element={
            <Layout header={<Navbar page="public" />}>
              <AdminLogin />
            </Layout>
          }
        />
        <Route
          path="/admin/register"
          element={
            <Layout header={<Navbar page="public" />}>
              <AdminRegister />
            </Layout>
          }
        />

        {/* DEFAULT: Redirect to Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* PROTECTED PAGES: Wrapped in Layout with Navbar */}
        <Route
          path="/dashboard"
          element={
            <>
              <Sidebar />
              <div
                className="transition-all duration-300"
                style={{ paddingLeft: "var(--student-sidebar-w, 260px)" }}
              >
                <Layout header={<Navbar page="student" />}>
                  <Dashboard />
                </Layout>
              </div>
            </>
          }
        />

        <Route
          path="/admin/generate-id"
          element={
            <>
              <AdminSidebar />
              <div
                className="transition-all duration-300"
                style={{ paddingLeft: "var(--admin-sidebar-w, 260px)" }}
              >
                <Layout header={<Navbar page="public" />}>
                  <GenerateId />
                </Layout>
              </div>
            </>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <>
              <AdminSidebar />
              <div
                className="transition-all duration-300"
                style={{ paddingLeft: "var(--admin-sidebar-w, 260px)" }}
              >
                <Layout header={<Navbar page="public" />}>
                  <AdminDashboard />
                </Layout>
              </div>
            </>
          }
        />

        {/* TEACHER DASHBOARD */}
        <Route
          path="/teacher/dashboard"
          element={
            <>
              <TeacherSidebar />
              <div
                className="transition-all duration-300"
                style={{ paddingLeft: "var(--teacher-sidebar-w, 240px)" }}
              >
                <Layout header={<Navbar page="teacher" />}>
                  <TeacherDashboard />
                </Layout>
              </div>
            </>
          }
        />

        <Route
          path="/teacher/exams"
          element={
            <>
              <TeacherSidebar />
              <div
                className="transition-all duration-300"
                style={{ paddingLeft: "var(--teacher-sidebar-w, 240px)" }}
              >
                <Layout header={<Navbar page="teacher" />}>
                  <ExamList />
                </Layout>
              </div>
            </>
          }
        />

        <Route
          path="/teacher/exams/create"
          element={
            <>
              <TeacherSidebar />
              <div
                className="transition-all duration-300"
                style={{ paddingLeft: "var(--teacher-sidebar-w, 240px)" }}
              >
                <Layout header={<Navbar page="teacher" />}>
                  <ExamBuilder />
                </Layout>
              </div>
            </>
          }
        />

        <Route
          path="/teacher/exams/edit/:id"
          element={
            <>
              <TeacherSidebar />
              <div
                className="transition-all duration-300"
                style={{ paddingLeft: "var(--teacher-sidebar-w, 240px)" }}
              >
                <Layout header={<Navbar page="teacher" />}>
                  <ExamBuilder />
                </Layout>
              </div>
            </>
          }
        />

        <Route
          path="/teacher/exams/:id/manage"
          element={
            <>
              <TeacherSidebar />
              <div
                className="transition-all duration-300"
                style={{ paddingLeft: "var(--teacher-sidebar-w, 240px)" }}
              >
                <Layout header={<Navbar page="teacher" />}>
                  <ExamManage />
                </Layout>
              </div>
            </>
          }
        />

        <Route
          path="/profile"
          element={
            <>
              <Sidebar />
              <div
                className="transition-all duration-300"
                style={{ paddingLeft: "var(--student-sidebar-w, 260px)" }}
              >
                <Layout header={<Navbar page="student" />}>
                  <Profile />
                </Layout>
              </div>
            </>
          }
        />

        {/* EXAM MODULE ROUTES */}
        {/* Instructions Page - Wrapped in Standard Layout (Optional, or ExamLayout) */}
        {/* Let's keep instructions in standard layout so they feel still "in app" */}
        <Route
          path="/exam/instructions"
          element={
            <>
              <Sidebar />
              <div
                className="transition-all duration-300"
                style={{ paddingLeft: "var(--student-sidebar-w, 260px)" }}
              >
                <Layout header={<Navbar page="student" />}>
                  <ExamInstructions />
                </Layout>
              </div>
            </>
          }
        />

        {/* The Actual Exam Portal - NO Sidebar, NO Navbar, Custom Layout */}
        <Route
          path="/exam/portal/:sessionId"
          element={
            <ExamLayout>
              <ExamPortal />
            </ExamLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
