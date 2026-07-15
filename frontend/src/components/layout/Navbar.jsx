import { Sparkles, ShieldAlert, UserCheck } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import JourneyStepper from "../common/JourneyStepper";

export default function Navbar({ isAdmin = false, onToggleMode }) {
  const { activeStep } = useAppStore();

  return (
    <header className="sticky top-0 z-50 w-full py-4 px-4 sm:px-8 border-b border-neutral-100 bg-white/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-400 to-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-200">
            <Sparkles size={16} className="animate-pulse" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-neutral-900">
            Proflo<span className="text-brand-500">.ai</span>
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
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 shadow-soft transition-all duration-200"
            >
              <UserCheck size={13} className="mr-1.5" />
              Client Workspace
            </button>
          ) : (
            <button
              onClick={onToggleMode}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50 shadow-soft transition-all duration-200"
            >
              <ShieldAlert size={13} className="mr-1.5 text-neutral-400" />
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
