import { ShieldAlert, UserCheck, ArrowLeft, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import JourneyStepper from "../common/JourneyStepper";
import { useNavigate } from "react-router-dom";

export default function Navbar({ isAdmin = false, onToggleMode }) {
  const { activeStep, setActiveStep, user, resetStore } = useAppStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <div 
          onClick={() => navigate("/")} 
          className="flex items-center space-x-2.5 cursor-pointer hover:opacity-95 select-none"
        >
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

        <div className="hidden sm:flex items-center flex-wrap gap-2 sm:gap-3 justify-end ml-auto">
          {user?.isVerified && (
            <>
              <span className="text-xs font-semibold text-navy-accent bg-neutral-100 px-2.5 sm:px-3 py-1.5 rounded-lg border border-neutral-200 truncate max-w-[150px] sm:max-w-none">
                {user.fullName || user.emailOrPhone}
              </span>
              <button
                onClick={() => navigate("/profile")}
                className="text-xl cursor-pointer hover:scale-110 transition-transform mr-1"
                title="Profile"
              >
                👤
              </button>
              <button
                onClick={() => {
                  if (user.role === "super-admin" || user.emailOrPhone?.toLowerCase().includes("superadmin")) {
                    navigate("/super-admin-dashboard");
                  } else if (user.role === "admin") {
                    navigate("/admin");
                  } else {
                    navigate("/client-portal");
                  }
                }}
                className="bg-primary-container text-navy-accent px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-button-text shadow-sm hover:shadow-md transition-all font-semibold text-xs cursor-pointer whitespace-nowrap"
              >
                Client Dashboard
              </button>
              <button
                onClick={resetStore}
                className="border border-red-200 bg-red-50 text-red-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-button-text hover:bg-red-100 transition-all font-semibold text-xs shadow-sm hover:shadow-md cursor-pointer whitespace-nowrap"
              >
                Logout
              </button>
            </>
          )}
        </div>
        
        {/* Mobile menu toggle */}
        <div className="sm:hidden flex items-center ml-auto">
          {user?.isVerified && (
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-navy-accent">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Menu for Navbar */}
      {isMobileMenuOpen && user?.isVerified && (
        <div className="sm:hidden absolute top-full left-0 w-full bg-white border-b border-outline-variant/20 shadow-lg p-4 flex flex-col gap-3 animate-in slide-in-from-top-2 z-50">
          <span className="text-sm font-semibold text-navy-accent bg-neutral-100 px-3 py-2 rounded-lg border border-neutral-200">
            {user.fullName || user.emailOrPhone}
          </span>
          <button
            onClick={() => {
              if (user.role === "super-admin" || user.emailOrPhone?.toLowerCase().includes("superadmin")) {
                navigate("/super-admin-dashboard");
              } else if (user.role === "admin") {
                navigate("/admin");
              } else {
                navigate("/client-portal");
              }
              setIsMobileMenuOpen(false);
            }}
            className="bg-primary-container text-navy-accent px-4 py-2 rounded-lg font-button-text shadow-sm hover:shadow-md transition-all font-semibold text-sm w-full text-center"
          >
            Client Dashboard
          </button>
          <button
            onClick={() => {
              resetStore();
              setIsMobileMenuOpen(false);
            }}
            className="border border-red-200 bg-red-50 text-red-700 px-4 py-2 rounded-lg font-button-text hover:bg-red-100 transition-all font-semibold text-sm shadow-sm hover:shadow-md w-full text-center"
          >
            Logout
          </button>
        </div>
      )}

      {/* Mobile Journey Stepper (Visible only on mobile/tablet) */}
      {!isAdmin && activeStep > 0 && activeStep < 4 && (
        <div className="sm:hidden flex justify-center mt-3 pt-3 border-t border-neutral-100/50">
          <JourneyStepper />
        </div>
      )}
    </header>
  );
}
