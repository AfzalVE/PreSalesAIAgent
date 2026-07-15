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
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [tempData, setTempData] = useState({});

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

  return (
    <div className="relative min-h-[calc(100vh-73px)] flex items-center justify-center px-4">
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
