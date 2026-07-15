import { ShieldAlert, UserCheck } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import JourneyStepper from "../common/JourneyStepper";

export default function Navbar({ isAdmin = false, onToggleMode }) {
  const { activeStep } = useAppStore();

  return (
    <header className="sticky top-0 z-50 w-full py-4 px-4 sm:px-8 border-b border-outline-variant/20 bg-surface/80 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
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
        {!isAdmin && activeStep > 0 && activeStep < 7 && (
          <div className="hidden sm:block">
            <JourneyStepper />
          </div>
        )}

        {/* Navigation Action Buttons */}
        <div className="flex items-center space-x-4">
          {isAdmin ? (
            <button
              onClick={onToggleMode}
              className="inline-flex items-center px-4 py-2 rounded-lg font-button-text text-xs font-semibold bg-primary-container text-navy-accent hover:shadow-md transition-all duration-200"
            >
              <UserCheck size={13} className="mr-1.5" />
              Client Workspace
            </button>
          ) : (
            <button
              onClick={onToggleMode}
              className="inline-flex items-center px-4 py-2 rounded-lg font-button-text text-xs font-semibold bg-white text-navy-accent border border-outline-variant/30 hover:bg-surface-container-low shadow-soft transition-all duration-200"
            >
              <ShieldAlert size={13} className="mr-1.5 text-primary" />
              Admin Portal
            </button>
          )}
        </div>
      </div>

      {/* Mobile Journey Stepper (Visible only on mobile/tablet) */}
      {!isAdmin && activeStep > 0 && activeStep < 7 && (
        <div className="sm:hidden flex justify-center mt-3 pt-3 border-t border-neutral-100/50">
          <JourneyStepper />
        </div>
      )}
    </header>
  );
}
