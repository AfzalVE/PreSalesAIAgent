import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const STEPS = [
  { id: 0, label: "Start" },
  { id: 1, label: "Collect" },
  { id: 3, label: "Summary" },
  { id: 4, label: "Compare" },
  { id: 5, label: "Broker" },
  { id: 6, label: "Sign" }
];

export default function JourneyStepper() {
  const { activeStep, setActiveStep } = useAppStore();

  const getStepStatus = (stepId) => {
    // Collect handles step 1 (onboarding form) and step 2 (voice capture)
    const normalizedActive = activeStep === 2 ? 1 : activeStep;
    if (normalizedActive > stepId) return "completed";
    if (normalizedActive === stepId) return "active";
    return "upcoming";
  };

  return (
    <div className="flex items-center space-x-1 sm:space-x-4">
      {STEPS.map((step, idx) => {
        const status = getStepStatus(step.id);
        const isActive = status === "active";
        const isCompleted = status === "completed";

        return (
          <React.Fragment key={step.id}>
            {/* Step circle */}
            <div 
              onClick={() => {
                // Allow back and forward navigating if step was visited
                if (isCompleted || isActive) {
                  setActiveStep(step.id);
                }
              }}
              className="flex items-center space-x-2 cursor-pointer group"
            >
              <div className="relative">
                <motion.div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border transition-all duration-300 ${
                    isCompleted
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : isActive
                      ? 'bg-white border-brand-500 text-brand-600 shadow-sm shadow-brand-100'
                      : 'bg-white border-neutral-200 text-neutral-400'
                  }`}
                  animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                  transition={{ repeat: isActive ? Infinity : 0, duration: 2, repeatType: "reverse" }}
                >
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : (idx + 1)}
                </motion.div>
              </div>
              <span className={`text-xs font-semibold hidden md:inline tracking-tight transition-colors duration-200 ${
                isActive ? 'text-brand-600' : isCompleted ? 'text-neutral-600' : 'text-neutral-400'
              }`}>
                {step.label}
              </span>
            </div>

            {/* Connecting line */}
            {idx < STEPS.length - 1 && (
              <div className="w-4 sm:w-8 h-[2px] bg-neutral-200 rounded overflow-hidden">
                <motion.div 
                  className="h-full bg-brand-500"
                  initial={{ width: 0 }}
                  animate={{ width: isCompleted ? "100%" : "0%" }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
