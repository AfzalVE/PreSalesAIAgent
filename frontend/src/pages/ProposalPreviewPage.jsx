import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, ChevronRight, FileText, Sparkles, ShieldAlert, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import FloatingBackground from '../components/common/FloatingBackground';

export default function ProposalPreviewPage() {
  const navigate = useNavigate();
  const { activeProposal, projectData } = useAppStore();

  const handleProceedToSign = () => {
    navigate('/sign');
  };

  return (
    <div className="relative min-h-[calc(100vh-73px)] py-12 px-4">
      <FloatingBackground />

      <div className="max-w-5xl mx-auto space-y-10 relative z-10">
        
        {/* Header Indicator */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100/50 -mt-4 mb-2">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => navigate('/onboarding')}
              className="p-2 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-600 hover:text-neutral-900 shadow-sm transition-colors"
            >
              <ArrowLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-neutral-400">Proposal Preview</span>
          </div>
        </div>

        {/* Header Title */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-neutral-900 leading-none">
            Your Generated Proposal
          </h2>
          <p className="text-sm text-neutral-500 max-w-xl mx-auto leading-relaxed font-medium">
            Based on your requirements, timeline, and budget goals, we've designed this optimal blueprint. Review the details below and proceed to sign.
          </p>
        </div>

        {/* Main Preview Card */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
          
          {/* Project Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-neutral-100">
            <div>
              <span className="text-neutral-400 block uppercase text-[9px] font-bold">Project Name</span>
              <span className="text-neutral-800 font-extrabold text-lg block">{projectData.name || "Zenith Retail Portal"}</span>
            </div>
            <div>
              <span className="text-neutral-400 block uppercase text-[9px] font-bold">Business Domain</span>
              <span className="text-neutral-800 font-bold text-base block">{projectData.domain || "E-Commerce"}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-neutral-400 block uppercase text-[9px] font-bold">Description</span>
              <p className="text-xs text-neutral-600 mt-1 leading-relaxed font-medium">
                {projectData.description || "Implementation of core application features."}
              </p>
            </div>
          </div>

          {/* Budget & Timeline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <span className="text-neutral-400 block uppercase text-[9px] font-bold mb-2">Estimated Budget</span>
              <span className="text-primary font-black text-2xl block">${(activeProposal?.budget || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-neutral-400 block uppercase text-[9px] font-bold mb-2">Estimated Timeline</span>
              <span className="text-neutral-800 font-black text-2xl block">{activeProposal?.timeline || "12 Weeks"}</span>
            </div>
          </div>

          {/* Features Scope */}
          <div>
            <span className="text-neutral-400 block uppercase text-[9px] font-bold mb-3">Scope Features</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(activeProposal?.features || []).map((f, idx) => {
                const name = typeof f === 'object' && f !== null ? f.name : f;
                return (
                  <div key={idx} className="flex items-center space-x-2 p-2.5 bg-neutral-50 rounded-xl border border-neutral-100">
                    <CheckCircle2 size={14} className="text-primary" />
                    <span className="text-xs text-neutral-800 font-semibold truncate">{name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team balance */}
          <div>
            <span className="text-neutral-400 block uppercase text-[9px] font-bold mb-3">Suggested Team Balance</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(activeProposal?.team || []).map((member, idx) => (
                <div key={idx} className="flex items-center space-x-3 p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neutral-200 to-neutral-300 flex items-center justify-center font-bold text-xs text-neutral-600">
                    {member.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-neutral-800">{member.name}</h5>
                    <span className="text-[10px] text-neutral-500 font-semibold">{member.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full sm:w-auto px-6 py-3 rounded-full border border-neutral-300 hover:border-neutral-800 text-neutral-600 hover:text-neutral-900 transition-all font-bold text-xs"
          >
            Edit Proposal Details
          </button>
          <button
            onClick={handleProceedToSign}
            className="w-full sm:w-auto px-8 py-3 rounded-full bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            Proceed to Signing
            <ChevronRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
