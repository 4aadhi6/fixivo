import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./pages/AuthContext";
import { Navbar } from "./pages/components/Navbar";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import SmartDiagnosis from "./pages/SmartDiagnosis";
import BookingPage from "./pages/BookingPage";
import BookingStatus from "./pages/BookingStatus";
import AdminDashboard from "./pages/AdminDashboard";
import WorkerRegistration from "./pages/WorkerRegistration";
import WorkerDashboard from "./pages/WorkerDashboard";
import WorkersPage from "./pages/WorkersPage";
import { ProtectedRoute } from "./pages/components/ProtectedRoute";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-white">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/diagnosis" element={<SmartDiagnosis />} />
            <Route path="/workers" element={<WorkersPage />} />
            <Route
              path="/booking/new"
              element={
                <ProtectedRoute role="user">
                  <BookingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking/status/:id"
              element={
                <ProtectedRoute role="user">
                  <BookingStatus />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/worker/register" element={<WorkerRegistration />} />
            <Route
              path="/worker/dashboard"
              element={
                <ProtectedRoute role="worker">
                  <WorkerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute role="user">
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster position="top-center" />
        </div>
      </Router>
    </AuthProvider>
  );
}
