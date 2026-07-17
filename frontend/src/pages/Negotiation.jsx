import { useState } from 'react';
import { FileCheck2, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import NegotiationChat from '../components/proposal/NegotiationChat';
import FloatingBackground from '../components/common/FloatingBackground';

export default function Negotiation() {
  const { activeProposal, selectProposalFromBackend, projectData } = useAppStore();
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

  const handlePreviewDynamicProposal = () => {
    const currentBudget = activeProposal?.budget || projectData.budget || 75000;
    const currentTimeline = activeProposal?.timeline || projectData.timeline || "12 Weeks";
    const currentTech = projectData.techStack || ["React", "FastAPI"];
    const currentName = projectData.name || "Zenith Retail Portal";

    const mockMvp = {
      id: activeProposal?.id || "0aa3092c-2306-4808-bf95-57b92cb6ba58",
      proposal_type: "MVP",
      project_name: currentName,
      scope: `Core MVP implementation of ${currentName}. Focus on basic workflows and functional scope.`,
      estimated_cost: Math.round(currentBudget * 0.5),
      estimated_duration: currentTimeline.includes("Week") ? `${Math.max(2, Math.round(parseInt(currentTimeline) * 0.5))} Weeks` : "6 Weeks",
      tech_stack: currentTech,
      timeline_phases: [
        {"Phase": "Architecture Setup", "Duration": "2 Weeks", "Output": "System Architecture"},
        {"Phase": "Core Feature Development", "Duration": "4 Weeks", "Output": "MVP codebase"}
      ],
      assumptions: "Standard server environment",
      risks: "Potential delays in third-party API integration",
      selected_resources: {
        resources: (activeProposal?.team || activeProposal?.full?.team || [
          { name: "Alex Rivera", role: "Lead Architect" },
          { name: "Elena Rostova", role: "Full Stack Engineer" }
        ]).slice(0, 2)
      }
    };

    const mockFull = {
      id: activeProposal?.id || "0aa3092c-2306-4808-bf95-57b92cb6ba58",
      proposal_type: "FULL",
      project_name: currentName,
      scope: `Complete enterprise deployment of ${currentName} with high availability, integration test coverage, and complete feature modules.`,
      estimated_cost: currentBudget,
      estimated_duration: currentTimeline,
      tech_stack: currentTech,
      timeline_phases: [
        {"Phase": "Design & Setup", "Duration": "3 Weeks", "Output": "UI/UX Layout"},
        {"Phase": "Core Backend Engine", "Duration": "6 Weeks", "Output": "REST API Layer"},
        {"Phase": "Deploy & Launch", "Duration": "3 Weeks", "Output": "Production Environment"}
      ],
      assumptions: "Continuous deployment access",
      risks: "Scale and database query constraints",
      selected_resources: {
        resources: activeProposal?.team || activeProposal?.full?.team || [
          { name: "Alex Rivera", role: "Lead Architect" },
          { name: "Elena Rostova", role: "Full Stack Engineer" },
          { name: "Sarah Chen", role: "Senior AI Engineer" }
        ]
      }
    };

    useAppStore.setState({
      activeProposal: {
        inferred_project_name: currentName,
        inferred_business_domain: projectData.domain || "E-Commerce",
        inferred_project_description: projectData.description || "Project scope under evaluation.",
        inferred_preferred_technology: currentTech,
        inferred_budget: currentBudget,
        inferred_timeline: currentTimeline,
        mvp: mockMvp,
        full: mockFull,
        proposals: [mockMvp, mockFull]
      }
    });

    navigate("/proposal-preview");
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
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-neutral-900 leading-none">
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
              ${(activeProposal?.budget ?? activeProposal?.inferred_budget ?? 0).toLocaleString()} Budget • {activeProposal?.timeline ?? activeProposal?.inferred_timeline ?? "12 Weeks"} Duration • {(activeProposal?.team ?? activeProposal?.full?.team ?? []).length} Engineers
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handlePreviewDynamicProposal}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs shadow-sm flex items-center justify-center transition-all duration-200 cursor-pointer"
            >
              Preview Generated Proposal
            </button>

            <button
              onClick={handleApproveProposal}
              disabled={isCompiling}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/95 shadow-md flex items-center justify-center transition-all duration-200 disabled:opacity-50 cursor-pointer"
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
    </div>
  );
}

