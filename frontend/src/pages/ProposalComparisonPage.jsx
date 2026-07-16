import { ArrowLeft, MessageSquare, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import ProposalComparison from '../components/proposal/ProposalComparison';
import FloatingBackground from '../components/common/FloatingBackground';

export default function ProposalComparisonPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[calc(100vh-73px)] py-12 px-4">
      <FloatingBackground />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        {/* Header Indicator */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100/50 -mt-4 mb-2">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => navigate('/summary')}
              className="p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-500 transition-colors"
            >
              <ArrowLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-neutral-400">Proposal Comparison</span>
          </div>
        </div>

        {/* Wise Editorial Typography Header */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black font-display tracking-tight text-neutral-900 leading-none">
            Three Ways We Could Build This
          </h2>
          <p className="text-sm sm:text-base text-neutral-500 max-w-2xl mx-auto font-medium">
            Based on your requirements, resource availability, timeline, and budget goals, we've designed multiple paths forward. Evolve the slider milestones to see parameters change.
          </p>
        </div>

        {/* Dynamic Comparison Panel (Slider, stacked feature blueprint layers, and team allocations) */}
        <ProposalComparison />

        {/* Negotiation Entry Point Banner */}
        <div className="max-w-3xl mx-auto bg-neutral-900 text-white rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-400/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-1 text-center sm:text-left relative z-10">
            <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest flex items-center justify-center sm:justify-start">
              <Sparkles size={12} className="mr-1 animate-pulse" />
              Interactive AI Broker
            </span>
            <h4 className="text-base font-bold">Want to adjust budget, timeline, features, or technology?</h4>
            <p className="text-xs text-neutral-400">Describe what you need changed and the broker will modify allocations dynamically.</p>
          </div>

          <button
            onClick={() => navigate('/broker')} // Route to Negotiation Chat Step
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-neutral-900 text-xs font-bold flex items-center justify-center transition-all duration-200"
          >
            Negotiate Scope
            <MessageSquare size={14} className="ml-1.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
