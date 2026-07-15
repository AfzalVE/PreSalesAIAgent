<<<<<<< HEAD
import { useState } from 'react';
import { ArrowRight, Cpu, Clock, Users, ArrowUpRight, Loader2 } from 'lucide-react';
=======
import { ArrowLeft, ArrowRight, Cpu, Clock, Users, ArrowUpRight } from 'lucide-react';
>>>>>>> 52a8096acb83de608f08d45905f0dc3197cdacae
import { useAppStore } from '../store/useAppStore';
import FloatingBackground from '../components/common/FloatingBackground';
import AnimatedCard from '../components/common/AnimatedCard';
import SkillTag from '../components/common/SkillTag';

export default function RequirementsSummary() {
  const { projectData, setActiveStep, generateProposalsFromBackend } = useAppStore();
  const [loading, setLoading] = useState(false);

  const handleCreateProposals = async () => {
    setLoading(true);
    try {
      const res = await generateProposalsFromBackend();
      if (res.success) {
        setActiveStep(4); // Navigate to Proposal Comparison Page
      } else {
        alert("Failed to generate proposals: " + res.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="relative min-h-[calc(100vh-73px)] py-12 px-4">
      <FloatingBackground />

      <div className="max-w-5xl mx-auto space-y-10 relative z-10">
        
        {/* Header Indicator */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100/50 -mt-4 mb-2">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setActiveStep(1)}
              className="p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-500 transition-colors"
            >
              <ArrowLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-neutral-400">Project Blueprint</span>
          </div>
        </div>

        {/* Title Wise-style Header */}
        <div className="text-center space-y-3">
          <h2 className="text-4xl md:text-5xl font-black font-display tracking-tight text-neutral-900 leading-none">
            Your Project Blueprint
          </h2>
          <p className="text-sm text-neutral-500 max-w-xl mx-auto">
            Review the architecture framework generated from your description. Next, we will evolve this blueprint into development proposals.
          </p>
        </div>

        {/* Dynamic flow illustration */}
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft text-center">
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Pipeline Analysis Flow</h4>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-xs font-semibold text-neutral-600">
            <div className="px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200/60 shadow-sm flex items-center">
              <span>1. Client Intake</span>
            </div>
            <ArrowRight size={14} className="text-neutral-300 hidden md:block" />
            <div className="px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200/60 shadow-sm flex items-center">
              <span>2. Semantic AI Analysis</span>
            </div>
            <ArrowRight size={14} className="text-neutral-300 hidden md:block" />
            <div className="px-3.5 py-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 shadow-sm flex items-center">
              <span>3. Resource Mapping</span>
            </div>
            <ArrowRight size={14} className="text-neutral-300 hidden md:block" />
            <div className="px-3.5 py-2 rounded-xl bg-neutral-50 border border-neutral-200/60 shadow-sm flex items-center">
              <span>4. Evolution Engine</span>
            </div>
          </div>
        </div>

        {/* Detailed Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Core Goal & Domain */}
          <AnimatedCard className="md:col-span-2 space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Business Target</span>
              <h3 className="text-xl font-bold text-neutral-800 mt-1">{projectData.name || "Zenith Retail Portal"}</h3>
              <p className="text-xs text-neutral-500 font-semibold mt-0.5">Industry: {projectData.domain || "E-Commerce"}</p>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              {projectData.description || "Describe the core features, targeted business results, or product modules in Onboarding to start."}
            </p>
          </AnimatedCard>

          {/* Card 2: Tech Blueprint Specs */}
          <AnimatedCard className="space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Suggested Technologies</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(Array.isArray(projectData.techStack) && projectData.techStack.length > 0 
                ? projectData.techStack 
                : ["React", "Node.js", "PostgreSQL", "Tailwind CSS", "OpenAI API"]
              ).map((tech) => (
                <SkillTag key={tech} skill={tech} />
              ))}
            </div>
            <div className="pt-2 border-t border-neutral-100/60 flex items-center justify-between text-xs text-neutral-500">
              <span>Framework: Javascript</span>
              <span className="font-semibold text-brand-600">Light theme</span>
            </div>
          </AnimatedCard>
        </div>

        {/* Estimation Metrics Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-soft flex items-center space-x-4">
            <div className="p-3.5 rounded-xl bg-brand-50 text-brand-600">
              <Cpu size={18} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Complexity Rating</span>
              <span className="text-base font-bold text-neutral-800 mt-0.5 block">{projectData.complexity || "Medium"}</span>
            </div>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-soft flex items-center space-x-4">
            <div className="p-3.5 rounded-xl bg-brand-50 text-brand-600">
              <Users size={18} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Estimated Core Team</span>
              <span className="text-base font-bold text-neutral-800 mt-0.5 block">{projectData.estimatedTeam || 4} Members</span>
            </div>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-soft flex items-center space-x-4">
            <div className="p-3.5 rounded-xl bg-brand-50 text-brand-600">
              <Clock size={18} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Target Timeline</span>
              <span className="text-base font-bold text-neutral-800 mt-0.5 block">{projectData.timeline || "12 Weeks"}</span>
            </div>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleCreateProposals}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold text-sm hover:bg-brand-600 shadow-md transition-all duration-200 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Generating Custom Proposals...
              </>
            ) : (
              <>
                Review Custom Proposals
                <ArrowUpRight size={16} className="ml-1.5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

