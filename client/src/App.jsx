import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login/Login";
import Register from "./pages/auth/Register/Register";
import Layout from "./components/layout/Layout";
import Navbar from "./components/layout/Navbar";

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

        {/* DEFAULT: Redirect to Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* PROTECTED PAGES: Wrapped in Layout with Navbar */}
        <Route
          path="/dashboard"
          element={
            <Layout
              header={<Navbar />}
              sidebar={<div className="text-zinc-500">College Sidebar</div>}
            >
              <div className="text-white">Welcome to the Dashboard</div>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
