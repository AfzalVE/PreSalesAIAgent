import { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

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

import AdminPortal from "./pages/AdminPortal";
import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import EditUser from "./pages/EditUser";

import AdminPortalRoute from "./routes/AdminPortalRoute";

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

          <Route path="/onboarding" element={<Onboarding />} />

          <Route path="/summary" element={<RequirementsSummary />} />

          <Route path="/compare" element={<ProposalComparisonPage />} />

          <Route
            path="/proposal-preview"
            element={<ProposalPreviewPage />}
          />

          <Route path="/broker" element={<Negotiation />} />

          <Route path="/sign" element={<FinalApproval />} />

          <Route path="/client-portal" element={<ClientPortal />} />

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
            element={<EditUser />}
          />

          {/* Admin Login */}

          <Route
            path="/admin/sign-up"
            element={
              user?.role ? (
                <Navigate to="/admin" replace />
              ) : (
                <AdminSignup 
                  onLogin={() => navigate("/admin")}
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
                  <AdminSignup />
                </AdminPortalRoute>
              ) : (
                <Navigate to="/admin/sign-up" replace />
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