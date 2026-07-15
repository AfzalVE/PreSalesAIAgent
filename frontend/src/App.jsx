import { useState } from 'react';
import { useAppStore } from './store/useAppStore';
import Navbar from './components/layout/Navbar';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import VoiceCapture from './pages/VoiceCapture';
import RequirementsSummary from './pages/RequirementsSummary';
import ProposalComparisonPage from './pages/ProposalComparisonPage';
import Negotiation from './pages/Negotiation';
import FinalApproval from './pages/FinalApproval';
import ClientPortal from './pages/ClientPortal';
import AdminPortal from './pages/AdminPortal';

function App() {
  const { activeStep } = useAppStore();
  const [isAdmin, setIsAdmin] = useState(false);

  const toggleAdminMode = () => {
    setIsAdmin(!isAdmin);
  };

  const renderActiveStep = () => {
    if (isAdmin) {
      return <AdminPortal />;
    }

    switch (activeStep) {
      case 0:
        return <Landing />;
      case 1:
        return <Onboarding />;
      case 2:
        return <VoiceCapture />;
      case 3:
        return <RequirementsSummary />;
      case 4:
        return <ProposalComparisonPage />;
      case 5:
        return <Negotiation />;
      case 6:
        return <FinalApproval />;
      case 7:
        return <ClientPortal />;
      default:
        return <Landing />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar isAdmin={isAdmin} onToggleMode={toggleAdminMode} />
      <main className="flex-grow">
        {renderActiveStep()}
      </main>
    </div>
  );
}

export default App;
