import { ArrowLeft, FileCheck2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import NegotiationChat from '../components/proposal/NegotiationChat';
import FloatingBackground from '../components/common/FloatingBackground';

export default function Negotiation() {
  const { setActiveStep, activeProposal } = useAppStore();

  const handleApproveProposal = () => {
    setActiveStep(6); // Navigate to Final Approval Page
  };

  return (
    <div className="relative min-h-[calc(100vh-73px)] py-12 px-4">
      <FloatingBackground />

      <div className="max-w-6xl mx-auto space-y-10 relative z-10">
        
        {/* Header Indicator */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100/50 -mt-4 mb-2">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setActiveStep(4)}
              className="p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-500 transition-colors"
            >
              <ArrowLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-neutral-400">Broker Negotiation</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-3">
          <h2 className="text-4xl md:text-5xl font-black font-display tracking-tight text-neutral-900 leading-none">
            Scope & Resource Broker
          </h2>
          <p className="text-sm text-neutral-500 max-w-xl mx-auto">
            Input adjustments below. When the budget, timeline, and feature lists match your targets, click the approval button below.
          </p>
        </div>

        {/* Console chat */}
        <NegotiationChat />

        {/* Confirmation bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-white border border-neutral-200/80 rounded-2xl shadow-soft gap-4 max-w-4xl mx-auto">
          <div className="text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Current Validated Blueprint</span>
            <div className="text-sm font-bold text-neutral-800 mt-0.5">
              ${activeProposal.budget.toLocaleString()} Budget • {activeProposal.timeline} Duration • {activeProposal.team.length} Engineers
            </div>
          </div>

          <button
            onClick={handleApproveProposal}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary/90 shadow-md flex items-center justify-center transition-all duration-200"
          >
            Approve & Lock Blueprint
            <FileCheck2 size={14} className="ml-1.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
