import { useState, useRef } from 'react';
import { ArrowLeft, ChevronRight, Loader2, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
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
  const { updateProjectData, generateProposalsFromBackend } = useAppStore();
  const navigate = useNavigate();

  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  // Single-page form states
  const [formName, setFormName] = useState("");
  const [formDomain, setFormDomain] = useState("E-Commerce");
  const [customDomain, setCustomDomain] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTechStack, setFormTechStack] = useState("");

  const [formBudget, setFormBudget] = useState(75000);
  const [customBudget, setCustomBudget] = useState("");

  const [formTimeline, setFormTimeline] = useState("12 Weeks");
  const [customTimeline, setCustomTimeline] = useState("");

  const [formWorkforce, setFormWorkforce] = useState(4);
  const [customWorkforce, setCustomWorkforce] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);

  const handleVoiceClick = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = window.navigator.language || 'en-US';
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
    };

    let finalTranscriptAtStart = formDescription;

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const newText = (finalTranscriptAtStart ? finalTranscriptAtStart + ' ' : '') + finalTranscript + interimTranscript;
      setFormDescription(newText);
      
      if (finalTranscript) {
         finalTranscriptAtStart = (finalTranscriptAtStart ? finalTranscriptAtStart + ' ' : '') + finalTranscript;
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'network') {
        toast.error("Network Error: Speech recognition failed. This could be due to browser restrictions or network issues.");
      } else if (event.error === 'not-allowed') {
        toast.error("Microphone access denied. Please allow permissions in your browser.");
      } else {
        toast.error(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSinglePageSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formDomain.trim() || !formDescription.trim()) {
      return;
    }
    const finalDomain = formDomain === "Other" ? customDomain.trim() : formDomain;
    if (formDomain === "Other" && !finalDomain) {
      return; // Ensure custom domain is provided
    }

    const finalBudget = formBudget === "Custom" ? Number(customBudget) : Number(formBudget);
    const finalTimeline = formTimeline === "Custom" ? customTimeline.trim() : formTimeline;
    const finalWorkforce = formWorkforce === "Custom" ? Number(customWorkforce) : Number(formWorkforce);

    const techArray = formTechStack
      ? formTechStack.split(',').map(t => t.trim()).filter(Boolean)
      : ["React", "Node.js"];

    updateProjectData({
      name: formName,
      domain: finalDomain || "Custom Domain",
      description: formDescription,
      techStack: techArray,
      budget: finalBudget,
      timeline: finalTimeline,
      estimatedTeam: finalWorkforce
    });

    setIsGenerating(true);
    try {
      const res = await generateProposalsFromBackend();
      if (res.success) {
        toast.success("Proposals generated successfully!");
        navigate('/proposal-preview');
      } else {
        toast.error("Failed to generate proposals: " + res.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error occurred while generating proposals.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="relative min-h-[calc(100vh-73px)] flex flex-col items-center justify-center bg-[#f7f7f7]">
        <FloatingBackground />
        <div className="text-center space-y-4 relative z-10">
          <Loader2 className="h-12 w-12 animate-spin text-brand-500 mx-auto" />
          <h3 className="text-xl font-bold text-neutral-800">Generating AI Proposals...</h3>
          <p className="text-sm text-neutral-500">Creating custom MVP, Growth, and Enterprise blueprints</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-73px)] flex items-center justify-center px-4 py-12 font-sans bg-[#f7f7f7]">
      <FloatingBackground />

      <div className="max-w-2xl w-full bg-white border border-[#e5e5e5] rounded-2xl sm:rounded-xl p-5 sm:p-8 shadow-sm relative z-10">
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
              Fill in the details below to specify your project scope and requirements.
            </p>
          </div>
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
              <select
                required
                value={formDomain}
                onChange={(e) => setFormDomain(e.target.value)}
                className="h-10 px-3 border border-[#e5e5e5] rounded-md w-full bg-white text-sm text-[#0a0a0a] transition-all outline-none focus:border-[#00d4a4] focus:ring-1 focus:ring-[#00d4a4] cursor-pointer"
              >
                <option value="E-Commerce">E-Commerce</option>
                <option value="Fintech">Fintech / Financial Services</option>
                <option value="Healthcare">Healthcare & Biotech</option>
                <option value="SaaS">SaaS / Cloud Software</option>
                <option value="AI / ML">AI & Machine Learning</option>
                <option value="Real Estate">Real Estate & Proptech</option>
                <option value="Logistics">Logistics & Supply Chain</option>
                <option value="Edtech">Education / Edtech</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Other">Other / Custom</option>
              </select>

              {formDomain === "Other" && (
                <input
                  type="text"
                  required
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="Type your custom industry domain..."
                  className="mt-2 h-10 px-3 border border-[#e5e5e5] rounded-md w-full bg-white text-sm text-[#0a0a0a] transition-all outline-none focus:border-[#00d4a4] focus:ring-1 focus:ring-[#00d4a4]"
                />
              )}
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase font-bold text-[#5a5a5c] tracking-wider mb-1.5 block">
              Project Description <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                required
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe core features, user roles, or business goals..."
                rows={4}
                className="px-3 py-2.5 border border-[#e5e5e5] rounded-md w-full bg-white text-sm text-[#0a0a0a] transition-all outline-none focus:border-[#00d4a4] focus:ring-1 focus:ring-[#00d4a4] resize-none pr-10"
              />
              <button
                type="button"
                onClick={handleVoiceClick}
                className={`absolute bottom-2.5 right-2.5 p-1.5 rounded-full transition-colors ${
                  isListening 
                    ? "bg-red-100 text-red-500 animate-pulse" 
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
                title={isListening ? "Stop listening" : "Start voice dictation"}
              >
                <Mic size={16} />
              </button>
            </div>
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
              <select
                value={formBudget}
                onChange={(e) => setFormBudget(e.target.value === "Custom" ? "Custom" : Number(e.target.value))}
                className="h-10 px-3 border border-[#e5e5e5] rounded-md w-full bg-white text-sm text-[#0a0a0a] transition-all outline-none focus:border-[#00d4a4] focus:ring-1 focus:ring-[#00d4a4] cursor-pointer"
              >
                <option value={20000}>$10,000 - $25,000</option>
                <option value={40000}>$25,000 - $50,000</option>
                <option value={75000}>$50,000 - $100,000</option>
                <option value={150000}>$100,000 - $250,000</option>
                <option value={300000}>$250,000+</option>
                <option value="Custom">Custom / Other</option>
              </select>
              {formBudget === "Custom" && (
                <input
                  type="number"
                  required
                  value={customBudget}
                  onChange={(e) => setCustomBudget(e.target.value)}
                  placeholder="Enter custom budget ($)..."
                  className="mt-2 h-10 px-3 border border-[#e5e5e5] rounded-md w-full bg-white text-sm text-[#0a0a0a] transition-all outline-none focus:border-[#00d4a4] focus:ring-1 focus:ring-[#00d4a4]"
                />
              )}
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-[#5a5a5c] tracking-wider mb-1.5 block">
                Target Timeline
              </label>
              <select
                value={formTimeline}
                onChange={(e) => setFormTimeline(e.target.value)}
                className="h-10 px-3 border border-[#e5e5e5] rounded-md w-full bg-white text-sm text-[#0a0a0a] transition-all outline-none focus:border-[#00d4a4] focus:ring-1 focus:ring-[#00d4a4] cursor-pointer"
              >
                <option value="4 Weeks">4 Weeks</option>
                <option value="8 Weeks">8 Weeks</option>
                <option value="12 Weeks">12 Weeks</option>
                <option value="16 Weeks">16 Weeks</option>
                <option value="24 Weeks">24 Weeks</option>
                <option value="Custom">Custom / Other</option>
              </select>
              {formTimeline === "Custom" && (
                <input
                  type="text"
                  required
                  value={customTimeline}
                  onChange={(e) => setCustomTimeline(e.target.value)}
                  placeholder="e.g. 30 Weeks or 6 Months..."
                  className="mt-2 h-10 px-3 border border-[#e5e5e5] rounded-md w-full bg-white text-sm text-[#0a0a0a] transition-all outline-none focus:border-[#00d4a4] focus:ring-1 focus:ring-[#00d4a4]"
                />
              )}
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-[#5a5a5c] tracking-wider mb-1.5 block">
                Workforce (Team Size)
              </label>
              <select
                value={formWorkforce}
                onChange={(e) => setFormWorkforce(e.target.value === "Custom" ? "Custom" : Number(e.target.value))}
                className="h-10 px-3 border border-[#e5e5e5] rounded-md w-full bg-white text-sm text-[#0a0a0a] transition-all outline-none focus:border-[#00d4a4] focus:ring-1 focus:ring-[#00d4a4] cursor-pointer"
              >
                <option value={2}>1 - 2 Engineers</option>
                <option value={4}>3 - 5 Engineers</option>
                <option value={8}>6 - 10 Engineers</option>
                <option value={12}>10+ Engineers</option>
                <option value="Custom">Custom / Other</option>
              </select>
              {formWorkforce === "Custom" && (
                <input
                  type="number"
                  min="1"
                  required
                  value={customWorkforce}
                  onChange={(e) => setCustomWorkforce(e.target.value)}
                  placeholder="Enter number of developers..."
                  className="mt-2 h-10 px-3 border border-[#e5e5e5] rounded-md w-full bg-white text-sm text-[#0a0a0a] transition-all outline-none focus:border-[#00d4a4] focus:ring-1 focus:ring-[#00d4a4]"
                />
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#e5e5e5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
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
              className="px-5 py-2.5 rounded-full border border-neutral-300 hover:border-neutral-800 text-neutral-600 hover:text-neutral-900 transition-all font-bold text-xs w-full sm:w-auto text-center"
            >
              Clear Form
            </button>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate("/broker")}
                className="px-4 sm:px-5 py-2.5 rounded-full border border-primary text-primary hover:bg-primary/5 transition-all font-bold text-xs flex-1 sm:flex-initial text-center justify-center inline-flex"
              >
                Skip to Broker Chat
              </button>

              <button
                type="submit"
                disabled={!formName.trim() || !formDomain.trim() || !formDescription.trim()}
                className="px-5 sm:px-6 py-2.5 rounded-full bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial"
              >
                <span>Build Proposal & Open Broker</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
