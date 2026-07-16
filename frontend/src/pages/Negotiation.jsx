import { useState } from 'react';
import { FileCheck2, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import NegotiationChat from '../components/proposal/NegotiationChat';
import FloatingBackground from '../components/common/FloatingBackground';

export default function Negotiation() {
  const { activeProposal, selectProposalFromBackend } = useAppStore();
  const [isCompiling, setIsCompiling] = useState(false);
  const navigate = useNavigate();

  const handleApproveProposal = async () => {
    setIsCompiling(true);
    try {
      const res = await selectProposalFromBackend(activeProposal.id);
      if (res.success) {
        navigate('/sign'); // Navigate to Final Approval Page
      } else {
        alert("Failed to finalize proposal: " + res.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompiling(false);
    }
  };


  return (
    <div className="relative min-h-[calc(100vh-73px)] py-12 px-4">
      <FloatingBackground />

      <div className="max-w-6xl mx-auto space-y-10 relative z-10">

        {/* Header Indicator */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100/50 -mt-4 mb-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/onboarding')}
              className="p-2 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-600 hover:text-neutral-900 shadow-sm transition-colors"
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
            disabled={isCompiling}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/95 shadow-md flex items-center justify-center transition-all duration-200 disabled:opacity-50"
          >
            {isCompiling ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" />
                Compiling Final Proposal...
              </>
            ) : (
              <>
                Approve & Lock Blueprint
                <FileCheck2 size={14} className="ml-1.5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

