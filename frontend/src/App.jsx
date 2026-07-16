import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import Navbar from './components/layout/Navbar';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import RequirementsSummary from './pages/RequirementsSummary';
import ProposalComparisonPage from './pages/ProposalComparisonPage';
import Negotiation from './pages/Negotiation';
import FinalApproval from './pages/FinalApproval';
import ClientPortal from './pages/ClientPortal';
import AdminPortal from './pages/AdminPortal';
import AdminLogin from './pages/AdminLogin';
import AdminPortalRoute from './routes/AdminPortalRoute';

const STEP_PATHS = {
  0: '/',
  1: '/onboarding',
  2: '/broker',
  3: '/sign',
  4: '/client-portal',
  5: '/summary',
  6: '/compare'
};

function App() {
  const { activeStep, setActiveStep, user } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Sync route path to store's activeStep
  useEffect(() => {
    const path = location.pathname;
    const step = Object.keys(STEP_PATHS).find(key => STEP_PATHS[key] === path);
    if (step !== undefined) {
      const stepNum = Number(step);
      if (activeStep !== stepNum) {
        setActiveStep(stepNum);
      }
    }
  }, [location.pathname, activeStep, setActiveStep]);

  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {(activeStep > 0 || isAdmin) && (
        <Navbar 
          isAdmin={isAdmin} 
          onToggleMode={() => {
            if (isAdmin) {
              navigate('/');
            } else {
              navigate('/admin');
            }
          }} 
        />
      )}
      <main className="flex-grow">
        <Routes>
          {/* Public / Client Journey Routes */}
          <Route path="/" element={<Landing onAdminClick={() => navigate('/admin/login')} />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/summary" element={<RequirementsSummary />} />
          <Route path="/compare" element={<ProposalComparisonPage />} />
          <Route path="/broker" element={<Negotiation />} />
          <Route path="/sign" element={<FinalApproval />} />
          <Route path="/client-portal" element={<ClientPortal />} />

          {/* Admin Routes */}
          <Route 
            path="/admin" 
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
          <Route 
            path="/admin/login" 
            element={
              user?.role ? (
                <Navigate to="/admin" replace />
              ) : (
                <AdminLogin 
                  onLogin={() => navigate('/admin')} 
                  onCancel={() => navigate('/')} 
                />
              )
            } 
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

