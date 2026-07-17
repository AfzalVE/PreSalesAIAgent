import { ShieldAlert, UserCheck, ArrowLeft } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import JourneyStepper from "../common/JourneyStepper";

export default function Navbar({ isAdmin = false, onToggleMode }) {
  const { activeStep, setActiveStep } = useAppStore();

  const handleBack = () => {
    if (activeStep === 2) {
      setActiveStep(0); // Voice Capture -> Landing
    } else if (activeStep === 3) {
      setActiveStep(1); // Summary -> Onboarding
    } else if (activeStep > 1) {
      setActiveStep(activeStep - 1); // Generic previous step
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full py-4 px-4 sm:px-8 border-b border-outline-variant/20 bg-surface/80 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Back Button */}
        <div className="flex items-center space-x-2.5">
          <img
            src="/ve.png"
            alt="Pre Sales Platform"
            className="h-9 w-auto object-contain"
          />
          <span className="font-display-lg text-xl font-extrabold tracking-tight text-navy-accent">
            Pre Sales Platform
          </span>
        </div>

        {/* Journey Stepper (Only on client journey steps) */}
        {!isAdmin && activeStep > 0 && activeStep < 4 && (
          <div className="hidden sm:block">
            <JourneyStepper />
          </div>
        )}

        <div className="flex items-center space-x-4">
        </div>
      </div>

      {/* Mobile Journey Stepper (Visible only on mobile/tablet) */}
      {!isAdmin && activeStep > 0 && activeStep < 4 && (
        <div className="sm:hidden flex justify-center mt-3 pt-3 border-t border-neutral-100/50">
          <JourneyStepper />
        </div>
      )}
    </header>
  );
}
