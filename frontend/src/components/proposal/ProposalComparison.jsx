import { motion, AnimatePresence } from 'framer-motion';
import { Layers, User, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import ArchitectureDiagram from './ArchitectureDiagram';
import BudgetChart from './BudgetChart';
import TimelineRoadmap from './TimelineRoadmap';

const STAGE_STEPS = [
  { id: 'mvp', label: 'MVP Launch', offset: 0 },
  { id: 'growth', 'label': 'Growth Engine', offset: 50 },
  { id: 'enterprise', label: 'Enterprise Scale', offset: 100 }
];

const getFeatureLayersForProject = (projectData) => {
  const isEcommerce = (projectData.domain || "").toLowerCase().includes("commerce") || (projectData.domain || "").toLowerCase().includes("retail");
  const isFintech = (projectData.domain || "").toLowerCase().includes("fintech") || (projectData.domain || "").toLowerCase().includes("finance");

  return [
    { key: 'auth', name: 'Authentication & Security Guard', mvp: true, growth: true, enterprise: true, desc: "SAML, OAuth2, and session management" },
    { 
      key: 'engine', 
      name: isEcommerce ? 'Core Boutique Storefront Engine' : isFintech ? 'Transaction Settlement Vault' : 'Core Business Action Processors', 
      mvp: true, growth: true, enterprise: true, 
      desc: isEcommerce ? "Storefront catalogs, checkouts, and customer accounts" : "Vault records, accounts, and balance logs"
    },
    { key: 'notif', name: 'Websockets & Notification Service', mvp: false, growth: true, enterprise: true, desc: "Real-time orders and transactional status logs" },
    { 
      key: 'ai', 
      name: isEcommerce ? 'AI Product Recommender Engine' : isFintech ? 'Fraud Detection Classifier' : 'Semantic Document Searcher', 
      mvp: false, growth: true, enterprise: true, 
      desc: "Smart customer size vector search & pinecone pipelines" 
    },
    { key: 'billing', name: 'Enterprise Billing & Invoicing Workspace', mvp: false, growth: false, enterprise: true, desc: "Credit notes, custom tax rules, and subscriptions" },
    { key: 'infra', name: 'High Availability Multi-Region Cluster', mvp: false, growth: false, enterprise: true, desc: "Terraform nodes, failure routing, and AWS Edge" }
  ];
};

export default function ProposalComparison() {
  const { 
    selectedProposalStage, 
    setSelectedProposalStage,
    activeProposal,
    projectData
  } = useAppStore();

  const dynamicFeatureLayers = getFeatureLayersForProject(projectData);

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (val < 33) {
      setSelectedProposalStage('mvp');
    } else if (val < 75) {
      setSelectedProposalStage('growth');
    } else {
      setSelectedProposalStage('enterprise');
    }
  };

  const getSliderValue = () => {
    if (selectedProposalStage === 'mvp') return 0;
    if (selectedProposalStage === 'growth') return 50;
    return 100;
  };

  return (
    <div className="space-y-12">
      
      {/* 1. Evolution Slider Milestones */}
      <div className="max-w-3xl mx-auto bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-8 shadow-soft relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-400 via-brand-500 to-wise-blue" />
        
        <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider text-center mb-6">Select Product Development Path</h3>
        
        {/* Animated timeline path */}
        <div className="relative flex justify-between items-center mb-4">
          <div className="absolute left-0 right-0 h-1 bg-neutral-100 rounded z-0" />
          <motion.div 
            className="absolute left-0 h-1 bg-brand-500 rounded z-0"
            animate={{ 
              width: selectedProposalStage === 'mvp' ? '0%' : selectedProposalStage === 'growth' ? '50%' : '100%' 
            }}
            transition={{ duration: 0.3 }}
          />

          {STAGE_STEPS.map((step) => {
            const isSelected = selectedProposalStage === step.id;
            return (
              <button
                key={step.id}
                onClick={() => setSelectedProposalStage(step.id)}
                className="relative z-10 flex flex-col items-center focus:outline-none"
              >
                <motion.div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors duration-200 ${
                    isSelected 
                      ? 'bg-white border-brand-500 shadow-sm' 
                      : 'bg-neutral-100 border-neutral-200 hover:bg-neutral-200'
                  }`}
                  animate={isSelected ? { scale: 1.15 } : { scale: 1 }}
                >
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />}
                </motion.div>
                <span className={`text-xs font-semibold mt-2 tracking-tight ${isSelected ? 'text-brand-600' : 'text-neutral-500'}`}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Input slider selector overlay for accessibility */}
        <input 
          type="range" 
          min="0" 
          max="100" 
          step="1"
          value={getSliderValue()}
          onChange={handleSliderChange}
          className="w-full h-2 bg-transparent cursor-pointer appearance-none outline-none mt-4 focus:ring-0 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:appearance-none"
        />
        
        <p className="text-center text-xs text-neutral-400 mt-4 leading-relaxed font-medium">
          {activeProposal.description}
        </p>
      </div>

      {/* 2. Visual Blueprints & Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: SVG diagram, Recharts Budget allocation, and Milestones */}
        <div className="lg:col-span-8 space-y-8">
          <ArchitectureDiagram stage={selectedProposalStage} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <BudgetChart budget={activeProposal.budget} />
            <TimelineRoadmap timeline={activeProposal.timeline} timelinePhases={activeProposal.timeline_phases} />
          </div>

        </div>

        {/* Right Side: Stacked Features & Team Nodes */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Stacked Blueprint Layers */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft">
            <div className="flex items-center space-x-2 pb-4 border-b border-neutral-100 mb-4">
              <Layers size={16} className="text-brand-500" />
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Scope Blueprint Layers</h4>
            </div>

            <div className="space-y-3">
              {dynamicFeatureLayers.map((layer) => {
                const isActive = layer[selectedProposalStage];
                return (
                  <motion.div
                    key={layer.key}
                    layout
                    className={`p-3.5 rounded-xl border text-left transition-all duration-300 ${
                      isActive 
                        ? 'bg-white border-brand-200 shadow-soft text-neutral-800' 
                        : 'bg-neutral-50/50 border-neutral-200/40 text-neutral-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="text-xs font-bold">{layer.name}</h5>
                        <p className="text-[10px] text-neutral-500 mt-0.5">{layer.desc}</p>
                      </div>
                      {isActive ? (
                        <div className="w-4 h-4 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-neutral-100 text-neutral-300 flex items-center justify-center">
                          <span className="text-[9px] font-bold">Lck</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Team allocation with suggestions matching tech stack & client requests */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center space-x-2">
                <User size={16} className="text-brand-500" />
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Suggested Team Balance</h4>
              </div>
              <span className="text-[9px] uppercase font-extrabold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">Match AI</span>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {activeProposal.team.map((member) => {
                  // check if member skills match the projectData.techStack
                  const isMatch = (member.skills || []).some(s => (projectData.techStack || []).includes(s));
                  return (
                    <motion.div
                      key={member.name}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-100 rounded-xl"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neutral-200 to-neutral-300 flex items-center justify-center font-bold text-xs text-neutral-600">
                          {member.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-neutral-800">{member.name}</h5>
                          <span className="text-[10px] text-neutral-500 font-semibold">{member.role}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700">
                        {isMatch || member.role.includes("Architect") ? "Expert Match" : "Standard"}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <button
              onClick={() => {
                alert("Allocation preferences requested! Our Admin studio has been notified for final review.");
              }}
              className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all duration-200 shadow-md"
            >
              Submit Custom Resource Request
            </button>
          </div>

        </div>
      </div>
      
    </div>
  );
}
