import { useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import FloatingBackground from '../components/common/FloatingBackground';

const ONBOARDING_QUESTIONS = [
  { 
    key: "name", 
    label: "Project Name", 
    question: "What is the name of your new venture?", 
    placeholder: "e.g. Zenith Retail Portal", 
    optional: false,
    helper: "Choose a memorable title for your project. This will be stamped on your PDF blueprints and final scopes."
  },
  { 
    key: "domain", 
    label: "Business Domain", 
    question: "Which business industry or domain does this project target?", 
    placeholder: "e.g. E-Commerce / Fintech / Healthcare", 
    optional: false,
    helper: "Understanding the industry helps the AI engine suggest matching compliance targets, vector databases, and API schemas."
  },
  { 
    key: "description", 
    label: "Description", 
    question: "Could you describe what you're trying to build?", 
    placeholder: "Describe core features, user roles, or goals...", 
    optional: false,
    helper: "Detail the features: e.g., user profiles, integrations, or interactive panels. The more details you provide, the richer your generated modules will be."
  },
  { 
    key: "techStack", 
    label: "Technologies", 
    question: "Any preferred programming language or technical frameworks?", 
    placeholder: "e.g. React, Node.js, Python, PostgreSQL", 
    optional: true,
    helper: "List any tools or languages. If left empty, our AI algorithm will select a state-of-the-art stack based on your domain."
  },
  { 
    key: "budget", 
    label: "Budget Goals", 
    question: "What budget threshold are you planning for this launch cycle?", 
    placeholder: "e.g. 75000 (numeric value in USD)", 
    optional: true,
    helper: "Provide an estimated budget. The AI broker uses this value to optimize team sizing and balance critical deliverables."
  },
  { 
    key: "timeline", 
    label: "Timeline Expectation", 
    question: "What is your target launch schedule?", 
    placeholder: "e.g. 12 Weeks / 3 Months", 
    optional: true,
    helper: "Specify your target timeline. We will automatically structure milestones and resource allocations to match this pace."
  }
];

export default function Onboarding() {
  const { updateProjectData, setActiveStep } = useAppStore();
  const [isSinglePage, setIsSinglePage] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [tempData, setTempData] = useState({});

  // Single-page form states
  const [formName, setFormName] = useState("");
  const [formDomain, setFormDomain] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTechStack, setFormTechStack] = useState("");
  const [formBudget, setFormBudget] = useState(75000);
  const [formTimeline, setFormTimeline] = useState("12 Weeks");
  const [formWorkforce, setFormWorkforce] = useState(4);

  const question = ONBOARDING_QUESTIONS[currentIdx];

  const handleNext = () => {
    // Save current step data
    let parsedValue = inputValue;
    if (question.key === 'budget') {
      parsedValue = parseInt(inputValue, 10) || 75000;
    } else if (question.key === 'techStack' && typeof inputValue === 'string') {
      parsedValue = inputValue.split(',').map(t => t.trim()).filter(Boolean);
    }
    
    const updatedData = { ...tempData, [question.key]: parsedValue };
    setTempData(updatedData);

    if (currentIdx < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
      // Load next value if already typed, otherwise blank
      setInputValue(updatedData[ONBOARDING_QUESTIONS[currentIdx + 1].key] || "");
    } else {
      // Completed all steps!
      updateProjectData(updatedData);
      setActiveStep(3); // Go to summary
    }
  };

  const handleBack = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setInputValue(tempData[ONBOARDING_QUESTIONS[currentIdx - 1].key] || "");
    } else {
      setActiveStep(0); // Back to Landing
    }
  };

  const handleSkip = () => {
    if (!question.optional) return;
    handleNext();
  };

  const handleSinglePageSubmit = (e) => {
    e.preventDefault();
    if (!formName.trim() || !formDomain.trim() || !formDescription.trim()) {
      return;
    }
    const techArray = formTechStack
      ? formTechStack.split(',').map(t => t.trim()).filter(Boolean)
      : ["React", "Node.js"];
      
    updateProjectData({
      name: formName,
      domain: formDomain,
      description: formDescription,
      techStack: techArray,
      budget: Number(formBudget) || 75000,
      timeline: formTimeline,
      estimatedTeam: Number(formWorkforce) || 4
    });
    setActiveStep(3); // Go to summary
  };

  if (isSinglePage) {
    return (
      <div className="relative min-h-[calc(100vh-73px)] flex items-center justify-center px-4 py-12 font-sans bg-[#f7f7f7]">
        <FloatingBackground />
        
        <div className="max-w-2xl w-full bg-white border border-[#e5e5e5] rounded-xl p-8 shadow-sm relative z-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-[#e5e5e5] mb-6 gap-4">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#7cebcb]/15 border border-[#00d4a4]/20 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00d4a4]" />
                <span className="text-[11px] font-semibold text-[#00b48a] uppercase tracking-wider">Specifications Form</span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#0a0a0a]">
                Project Scope & Requirements
              </h2>
              <p className="text-xs text-[#5a5a5c] mt-1">
                Fill in all details in a single page to skip step-by-step discovery.
              </p>
            </div>
            
            <button
              onClick={() => setIsSinglePage(false)}
              className="self-start sm:self-center px-4 py-2 rounded-full border border-[#e5e5e5] text-xs font-medium text-[#0a0a0a] hover:bg-[#fafafa] transition-colors"
            >
              Step-by-Step Mode
            </button>
          </div>

          <form onSubmit={handleSinglePageSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] uppercase font-bold text-[#5a5a5c] tracking-wider mb-1.5 block">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Zenith Retail Portal"
                  className="h-10 px-3 border border-[#e5e5e5] rounded-md w-full bg-white text-sm text-[#0a0a0a] transition-all outline-none focus:border-[#00d4a4] focus:ring-1 focus:ring-[#00d4a4]"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-[#5a5a5c] tracking-wider mb-1.5 block">
                  Business Domain <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formDomain}
                  onChange={(e) => setFormDomain(e.target.value)}
                  placeholder="e.g. Fintech / E-Commerce"
                  className="h-10 px-3 border border-[#e5e5e5] rounded-md w-full bg-white text-sm text-[#0a0a0a] transition-all outline-none focus:border-[#00d4a4] focus:ring-1 focus:ring-[#00d4a4]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-[#5a5a5c] tracking-wider mb-1.5 block">
                Project Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe core features, user roles, or business goals..."
                rows={4}
                className="px-3 py-2.5 border border-[#e5e5e5] rounded-md w-full bg-white text-sm text-[#0a0a0a] transition-all outline-none focus:border-[#00d4a4] focus:ring-1 focus:ring-[#00d4a4] resize-none"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-[#5a5a5c] tracking-wider mb-1.5 block">
                Technologies & Frameworks (Optional)
              </label>
              <input
                type="text"
                value={formTechStack}
                onChange={(e) => setFormTechStack(e.target.value)}
                placeholder="e.g. React, Node.js, PostgreSQL (comma separated)"
                className="h-10 px-3 border border-[#e5e5e5] rounded-md w-full bg-white text-sm text-[#0a0a0a] transition-all outline-none focus:border-[#00d4a4] focus:ring-1 focus:ring-[#00d4a4]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] uppercase font-bold text-[#5a5a5c] tracking-wider mb-1.5 block">
                  Budget (USD)
                </label>
                <input
                  type="number"
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                  className="h-10 px-3 border border-[#e5e5e5] rounded-md w-full bg-white text-sm text-[#0a0a0a] transition-all outline-none focus:border-[#00d4a4] focus:ring-1 focus:ring-[#00d4a4]"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-[#5a5a5c] tracking-wider mb-1.5 block">
                  Target Timeline
                </label>
                <input
                  type="text"
                  value={formTimeline}
                  onChange={(e) => setFormTimeline(e.target.value)}
                  placeholder="e.g. 12 Weeks"
                  className="h-10 px-3 border border-[#e5e5e5] rounded-md w-full bg-white text-sm text-[#0a0a0a] transition-all outline-none focus:border-[#00d4a4] focus:ring-1 focus:ring-[#00d4a4]"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-[#5a5a5c] tracking-wider mb-1.5 block">
                  Workforce (Team Size)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formWorkforce}
                  onChange={(e) => setFormWorkforce(e.target.value)}
                  className="h-10 px-3 border border-[#e5e5e5] rounded-md w-full bg-white text-sm text-[#0a0a0a] transition-all outline-none focus:border-[#00d4a4] focus:ring-1 focus:ring-[#00d4a4]"
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#e5e5e5] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setFormName("");
                  setFormDomain("");
                  setFormDescription("");
                  setFormTechStack("");
                  setFormBudget(75000);
                  setFormTimeline("12 Weeks");
                  setFormWorkforce(4);
                }}
                className="px-4 py-2 text-xs font-semibold text-[#5a5a5c] hover:text-[#0a0a0a] transition-colors"
              >
                Clear Form
              </button>

              <button
                type="submit"
                disabled={!formName.trim() || !formDomain.trim() || !formDescription.trim()}
                className="px-6 py-2.5 rounded-full bg-[#00d4a4] hover:bg-[#00b48a] text-[#0a0a0a] font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Build Proposal Summary
                <ChevronRight size={14} />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-73px)] flex items-center justify-center px-4 bg-[#f8f9ff]">
      <FloatingBackground />

      <div className="max-w-xl w-full bg-white border border-neutral-200/80 rounded-3xl p-8 shadow-premium relative z-10">
        
        {/* Header Indicator */}
        <div className="flex items-center justify-between pb-6 border-b border-neutral-100 mb-6">
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleBack}
              className="p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-500 transition-colors"
            >
              <ArrowLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-neutral-400">Onboarding Discovery</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSinglePage(true)}
              className="px-3.5 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold hover:shadow-sm transition-all duration-200"
            >
              Single Page Form
            </button>
            <button
              onClick={() => {
                // Populate default mockup variables and go straight to chat comparison/negotiation page
                updateProjectData({
                  name: "Bespoke Technical Architecture",
                  domain: "SaaS / General Application",
                  description: "Custom technical requirements scoping sandbox.",
                  techStack: ["React", "Node.js", "PostgreSQL", "OpenAI API"],
                  budget: 100000,
                  timeline: "12 Weeks"
                });
                setActiveStep(5); // Redirects straight to negotiation AI chat
              }}
              className="px-3.5 py-1.5 rounded-xl bg-primary-container text-navy-accent text-xs font-bold hover:shadow-md transition-all duration-200"
            >
              Skip to AI Chat
            </button>
          </div>
        </div>

        {/* Question display */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Question {currentIdx + 1} of {ONBOARDING_QUESTIONS.length}
              </span>
              {question.optional && (
                <span className="text-[10px] font-bold text-neutral-400 uppercase bg-neutral-100 px-2 py-0.5 rounded">Optional</span>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-display text-neutral-900 leading-tight">
              {question.question}
            </h2>
          </div>

          {/* Form input */}
          <div>
            {question.key === 'description' ? (
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={question.placeholder}
                rows={4}
                className="w-full bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-xs outline-none p-4 rounded-xl border border-neutral-200 focus:border-primary transition-all duration-200 text-neutral-800 resize-none font-semibold"
              />
            ) : (
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={question.placeholder}
                className="w-full h-12 bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white text-xs outline-none px-4 rounded-xl border border-neutral-200 focus:border-primary transition-all duration-200 text-neutral-800 font-semibold"
              />
            )}
            {question.helper && (
              <p className="text-[10px] text-neutral-400 font-medium mt-2 leading-relaxed bg-neutral-50 p-2.5 rounded-xl border border-neutral-100/60">
                {question.helper}
              </p>
            )}
          </div>
        </div>

        {/* Buttons bottom row */}
        <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center justify-between">
          <div className="flex space-x-1.5">
            {ONBOARDING_QUESTIONS.map((q, idx) => (
              <div 
                key={q.key} 
                className={`w-2 h-2 rounded-full ${idx <= currentIdx ? 'bg-primary' : 'bg-neutral-200'}`}
              />
            ))}
          </div>

          <div className="flex items-center space-x-3">
            {question.optional && (
              <button 
                onClick={handleSkip}
                className="text-xs font-semibold text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                Skip
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={!inputValue.trim() && !question.optional}
              className={`inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                inputValue.trim() || question.optional
                  ? 'bg-primary-container text-navy-accent hover:shadow-md cursor-pointer'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              }`}
            >
              {currentIdx === ONBOARDING_QUESTIONS.length - 1 ? 'Build Summary' : 'Next'}
              <ChevronRight size={14} className="ml-1" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
