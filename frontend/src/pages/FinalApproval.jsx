import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import ApprovalFlow from '../components/proposal/ApprovalFlow';
import FloatingBackground from '../components/common/FloatingBackground';

export default function FinalApproval() {
  const { setActiveStep } = useAppStore();
  const [particles] = useState(() => 
    Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage width
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
      color: ['#00CD80', '#3754db', '#f59e0b', '#ec4899', '#3b82f6'][Math.floor(Math.random() * 5)]
    }))
  );

  return (
    <div className="relative min-h-[calc(100vh-73px)] py-12 px-4 overflow-hidden">
      <FloatingBackground />

      {/* Confetti Particle Layer */}
      <div className="absolute inset-0 pointer-events-none z-25 overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: -20, opacity: 1, x: `${p.x}vw` }}
            animate={{ y: '105vh', rotate: 360, opacity: 0 }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: 'easeOut',
            }}
            className="absolute w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: p.color }}
          />
        ))}
      </div>

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        <ApprovalFlow />

        <div className="text-center pt-8">
          <button
            onClick={() => setActiveStep(7)} // Navigate to Client Portal view (Step 7)
            className="text-xs font-semibold text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Access Client Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
