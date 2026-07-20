import { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { useAppStore } from "./store/useAppStore";

import Navbar from "./components/layout/Navbar";

import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import RequirementsSummary from "./pages/RequirementsSummary";
import ProposalComparisonPage from "./pages/ProposalComparisonPage";
import ProposalPreviewPage from "./pages/ProposalPreviewPage";
import Negotiation from "./pages/Negotiation";
import FinalApproval from "./pages/FinalApproval";
import ClientPortal from "./pages/ClientPortal";
import ResourceContactPage from "./pages/ResourceContactPage";
import ProfilePage from "./pages/ProfilePage";

import AdminPortal from "./pages/AdminPortal";
import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import EditUser from "./pages/EditUser";

import AdminPortalRoute from "./routes/AdminPortalRoute";
import ClientProtectedRoute from "./routes/ClientProtectedRoute";

const PATH_TO_STEP = {
  "/": 0,
  "/onboarding": 1,
  "/broker": 2,
  "/proposal-preview": 2,
  "/sign": 3,
  "/client-portal": 4,
};

function App() {
  const { activeStep, setActiveStep, user } = useAppStore();

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const path = location.pathname;
    const step = PATH_TO_STEP[path];

    if (step !== undefined && activeStep !== step) {
      setActiveStep(step);
    }
  }, [location.pathname, activeStep, setActiveStep]);

  const isAdmin =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/super-admin");

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Toaster position="top-right" />
      {(activeStep > 0 || isAdmin) && (
        <Navbar
          isAdmin={isAdmin}
          onToggleMode={() => {
            if (isAdmin) {
              navigate("/");
            } else {
              navigate("/admin/sign-up");
            }
          }}
        />
      )}

      <main className="flex-grow">
        <Routes>

          {/* Landing */}

          <Route
            path="/"
            element={
              <Landing
                onAdminClick={() => navigate("/admin-signup")}
              />
            }
          />

          {/* Client */}
          <Route path="/onboarding" element={<ClientProtectedRoute><Onboarding /></ClientProtectedRoute>} />
          <Route path="/summary" element={<ClientProtectedRoute><RequirementsSummary /></ClientProtectedRoute>} />
          <Route path="/compare" element={<ClientProtectedRoute><ProposalComparisonPage /></ClientProtectedRoute>} />
          <Route
            path="/proposal-preview"
            element={<ClientProtectedRoute><ProposalPreviewPage /></ClientProtectedRoute>}
          />
          <Route
            path="/client/resource-contact"
            element={<ClientProtectedRoute><ResourceContactPage /></ClientProtectedRoute>}
          />
          <Route path="/broker" element={<ClientProtectedRoute><Negotiation /></ClientProtectedRoute>} />
          <Route path="/sign" element={<ClientProtectedRoute><FinalApproval /></ClientProtectedRoute>} />
          <Route path="/client-portal" element={<ClientProtectedRoute><ClientPortal /></ClientProtectedRoute>} />
          <Route path="/profile" element={<ClientProtectedRoute><ProfilePage /></ClientProtectedRoute>} />

          {/* Super Admin */}

          <Route
            path="/super-admin-login"
            element={<SuperAdminLogin />}
          />

          <Route
            path="/super-admin-dashboard"
            element={
              <AdminPortalRoute>
                <SuperAdminDashboard />
              </AdminPortalRoute>
            }
          />

          {/* Admin Signup */}

          <Route
            path="/admin-signup"
            element={<AdminSignup />}
          />

          {/* Edit User */}
          <Route
            path="/edit-user"
            element={<ClientProtectedRoute><EditUser /></ClientProtectedRoute>}
          />

          <Route
            path="/super-admin"
            element={<Navigate to="/super-admin-dashboard" replace />}
          />

          {/* Admin Login */}
          <Route
            path="/admin/login"
            element={
              user?.role === "super-admin" ? (
                <Navigate to="/super-admin-dashboard" replace />
              ) : user?.role ? (
                <Navigate to="/admin" replace />
              ) : (
                <AdminLogin
                  onLogin={({ role }) => {
                    if (role === "super-admin") {
                      navigate("/super-admin-dashboard");
                    } else {
                      navigate("/admin");
                    }
                  }}
                  onCancel={() => navigate("/")}
                />
              )
            }
          />

          {/* Admin Sign-up */}
          <Route
            path="/admin/sign-up"
            element={
              user?.role === "super-admin" ? (
                <Navigate to="/super-admin-dashboard" replace />
              ) : user?.role ? (
                <Navigate to="/admin" replace />
              ) : (
                <AdminSignup 
                  onLogin={({ role }) => {
                    if (role === "super-admin") {
                      navigate("/super-admin-dashboard");
                    } else {
                      navigate("/admin");
                    }
                  }}
                  onCancel={() => navigate("/")}
                />
              )
            }
          />

          {/* Admin Dashboard */}

          <Route
            path="/admin/*"
            element={
              user?.role ? (
                <AdminPortalRoute>
                  <AdminPortal />
                </AdminPortalRoute>
              ) : (
                <Navigate to="/admin/login" replace />
              )
            }
          />

          {/* 404 */}

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;