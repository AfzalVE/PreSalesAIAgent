import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import ApprovalFlow from '../components/proposal/ApprovalFlow';
import FloatingBackground from '../components/common/FloatingBackground';

export default function FinalApproval() {
  const navigate = useNavigate();
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
        
        {/* Header Indicator */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100/50 -mt-4 mb-2">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => navigate('/broker')}
              className="p-2 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-600 hover:text-neutral-900 shadow-sm transition-colors"
            >
              <ArrowLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-neutral-400">Final Approval</span>
          </div>
        </div>

        <ApprovalFlow />

        <div className="text-center pt-8">
          <button
            onClick={() => navigate('/client-portal')} // Navigate to Client Portal view (Step 7)
            className="px-6 py-3 rounded-full bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all"
          >
            Access Client Workspace
          </button>
        </div>
      </div>
    </div>
  );
}

