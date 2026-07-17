import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, AlertTriangle, RefreshCw, Mic } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';

let messageCounter = 0;
const generateMessageId = (sender) => `msg-${sender}-${++messageCounter}`;

const SUGGESTIONS = [
  "Reduce budget by 20%",
  "Use React instead of Angular",
  "Launch within 2 months",
  "Add AI recommendations"
];

function StreamingText({ text, onComplete }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 15);
    return () => clearInterval(interval);
  }, [text, onComplete]);

  return <span>{displayedText}</span>;
}

export default function NegotiationChat() {
  const navigate = useNavigate();
  const {
    applyNegotiationRequest,
    negotiationHistory,
    projectData,
    updateProjectData
  } = useAppStore();

  const handleLoadMockMvp = () => {
    const mockMvp = {
      id: "0aa3092c-2306-4808-bf95-57b92cb6ba58",
      proposal_type: "MVP",
      project_name: projectData.name || "Zenith Retail Portal",
      scope: "Core boutique storefront engine and catalog system.",
      estimated_cost: 35000,
      estimated_duration: "6 Weeks",
      tech_stack: ["React", "FastAPI", "PostgreSQL"],
      timeline_phases: [
        {"Phase": "Architecture Setup", "Duration": "2 Weeks", "Output": "System Architecture Blueprint"},
        {"Phase": "Core Feature Development", "Duration": "4 Weeks", "Output": "Fully functional MVP codebase"}
      ],
      assumptions: "Standard cloud environment",
      risks: "Potential delays in third-party API configurations",
      selected_resources: {
        resources: [
          { name: "Alex Rivera", role: "Lead Architect" },
          { name: "Elena Rostova", role: "Full Stack Engineer" }
        ]
      }
    };

    const mockFull = {
      id: "0aa3092c-2306-4808-bf95-57b92cb6ba58",
      proposal_type: "FULL",
      project_name: projectData.name || "Zenith Retail Portal",
      scope: "Enterprise-grade digital storefront with AI sizing recommendations.",
      estimated_cost: 75000,
      estimated_duration: "12 Weeks",
      tech_stack: ["React", "FastAPI", "PostgreSQL", "AWS"],
      timeline_phases: [
        {"Phase": "Design & Setup", "Duration": "3 Weeks", "Output": "UI/UX Layout Prototype"},
        {"Phase": "Core Backend Engine", "Duration": "6 Weeks", "Output": "REST API Development"},
        {"Phase": "Deploy & Launch", "Duration": "3 Weeks", "Output": "Production Environment Build"}
      ],
      assumptions: "Continuous deployment pipeline",
      risks: "Scale and concurrent database query limits",
      selected_resources: {
        resources: [
          { name: "Alex Rivera", role: "Lead Architect" },
          { name: "Elena Rostova", role: "Full Stack Engineer" },
          { name: "Sarah Chen", role: "Senior AI Engineer" }
        ]
      }
    };

    useAppStore.setState({
      activeProposal: {
        inferred_project_name: projectData.name || "Zenith Retail Portal",
        inferred_business_domain: projectData.domain || "E-Commerce",
        inferred_project_description: projectData.description || "Boutique storefront with recommendations.",
        inferred_preferred_technology: projectData.techStack || ["React", "FastAPI"],
        inferred_budget: projectData.budget || 75000,
        inferred_timeline: projectData.timeline || "12 Weeks",
        mvp: mockMvp,
        full: mockFull,
        proposals: [mockMvp, mockFull]
      }
    });

    navigate("/proposal-preview");
  };

  const [inputPrompt, setInputPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedStreams, setCompletedStreams] = useState({});
  const [messages, setMessages] = useState([
    {
      id: "init",
      sender: "ai",
      text: "Hello! I am your AI Proposal Broker. You can adjust the project budget, timeline, team structures, or technical parameters here. Try typing a request, or click one of the quick suggestions below.",
      timestamp: "Just now"
    }
  ]);

  const messagesEndRef = useRef(null);

  const [recognition, setRecognition] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [chatRequestId, setChatRequestId] = useState(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;

      rec.onresult = (event) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInputPrompt(currentTranscript);
      };

      rec.onerror = (e) => {
        console.error(e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleMic = () => {
    if (!recognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      // Let user manually send the prompt after stopping or we could auto-send.
      // Auto-sending is a bit abrupt if they want to review it.
    } else {
      setInputPrompt("");
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isProcessing) return;

    setInputPrompt("");
    setIsProcessing(true);

    const userMessageId = generateMessageId("user");
    setMessages(prev => [
      ...prev,
      {
        id: userMessageId,
        sender: "user",
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    try {
      const payload = { text };
      if (chatRequestId) {
        payload.request_id = chatRequestId;
      }

      const response = await fetch("http://127.0.0.1:8000/api/v1/ai-agent/extract-requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to process request");
      }
      
      if (data.request_id) {
        setChatRequestId(data.request_id);
      }

      // Update store with merged parameters
      updateProjectData({
        budget: data.client_budget !== null ? data.client_budget : projectData.budget,
        timeline: data.timeline_weeks ? `${data.timeline_weeks} Weeks` : projectData.timeline,
        techStack: data.resource_requirements ? data.resource_requirements.flatMap(r => r.skills) : projectData.techStack
      });

      const aiMessageId = generateMessageId("ai");
      
      let reply = "I've extracted your requirements and updated the project scope.";
      if (data.follow_up_message) {
        reply = data.follow_up_message;
      }
      
      if (data.is_ready_for_proposal) {
        reply += "\n\n✨ **Status:** I have all the information I need! I am generating your proposal now. Please check the Proposals dashboard in a few moments.";
      }

      setMessages(prev => [
        ...prev,
        {
          id: aiMessageId,
          sender: "ai",
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          success: true
        }
      ]);
    } catch (err) {
      console.error("API error, falling back to simulation:", err);
      const result = applyNegotiationRequest(text);
      const aiMessageId = generateMessageId("ai");

      setMessages(prev => [
        ...prev,
        {
          id: aiMessageId,
          sender: "ai",
          text: result.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          success: result.success,
          warning: result.success ? undefined : result.error
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto font-sans w-full">
      {/* Conversation Thread */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft flex flex-col justify-between min-h-[460px]">

        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center space-x-2">
            <MessageSquare size={16} className="text-primary" />
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">AI Negotiation Console</h4>
          </div>
          <span className="text-xs font-medium text-neutral-400">Version 1.{negotiationHistory.length}</span>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1 max-h-[300px]">
          {messages.map((msg) => {
            const isLatest = messages[messages.length - 1].id === msg.id;
            const shouldStream = msg.sender === 'ai' && msg.id !== 'init' && isLatest && !completedStreams[msg.id];

            return (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2.5`}>
                {msg.sender === 'ai' && (
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary mt-0.5 flex-shrink-0 shadow-sm border border-primary/5">
                    <Sparkles size={12} className="animate-pulse" />
                  </div>
                )}
                <div className="max-w-[80%] flex flex-col">
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm border ${msg.sender === 'user'
                    ? 'bg-neutral-900 text-white font-medium rounded-tr-none border-transparent'
                    : 'bg-primary/5 text-neutral-800 rounded-tl-none border-primary/10'
                    }`}>
                    {shouldStream ? (
                      <StreamingText
                        text={msg.text}
                        onComplete={() => setCompletedStreams(prev => ({ ...prev, [msg.id]: true }))}
                      />
                    ) : (
                      msg.text
                    )}

                    {/* Warning Container */}
                    {msg.warning && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-start space-x-2 animate-pulse-subtle">
                        <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="font-semibold">{msg.warning}</span>
                      </div>
                    )}
                  </div>
                  <span className={`text-[9px] text-neutral-400 mt-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex justify-start items-center space-x-2.5 py-2 text-neutral-400 text-xs pl-8">
              <RefreshCw size={14} className="animate-spin text-primary" />
              <span className="font-medium">Recalculating allocate values...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion buttons */}
        <div className="pt-2">
          <div className="flex flex-wrap gap-2 mb-4">
            {SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                onClick={() => handleSendMessage(sug)}
                disabled={isProcessing}
                className="text-[11px] font-bold text-neutral-600 bg-white border border-neutral-200 hover:border-primary hover:text-primary px-3 py-1.5 rounded-full transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow"
              >
                {sug}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mb-4 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/60 shadow-inner">
            <span className="text-[10px] uppercase font-bold text-neutral-400 w-full mb-1">Scoping Output Generators (Demo Sandbox)</span>
            <button
              type="button"
              onClick={handleLoadMockMvp}
              className="text-[11px] font-bold text-navy-accent bg-primary-container hover:bg-primary-container/80 border border-primary/20 px-4 py-2 rounded-xl transition-all duration-200 shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              🚀 Generate MVP Mock Preview
            </button>
            <button
              type="button"
              onClick={handleLoadMockMvp} // Both will initialize activeProposal and redirect to proposal preview toggle
              className="text-[11px] font-bold text-navy-accent bg-primary-container hover:bg-primary-container/80 border border-primary/20 px-4 py-2 rounded-xl transition-all duration-200 shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              ✨ Generate Full Mock Preview
            </button>
          </div>

          {/* Form input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex items-center space-x-2 border border-neutral-200/80 rounded-2xl p-1.5 bg-[#fcfdfe] focus-within:bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 shadow-inner transition-all duration-200"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="e.g. Reduce budget by 15% or use React..."
              disabled={isProcessing}
              className="flex-1 bg-transparent py-2.5 px-4 text-xs border-none focus:border-none outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 text-neutral-800 disabled:opacity-50 placeholder-neutral-400 font-medium"
            />

            {/* Mic voice input simulator */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={toggleMic}
              className={`p-2.5 rounded-xl transition-all duration-200 disabled:opacity-40 relative ${isRecording
                ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-200'
                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                }`}
              title="Speak to Broker"
            >
              {isRecording && (
                <span className="absolute inset-0 rounded-xl bg-red-400 opacity-50 animate-ping pointer-events-none" />
              )}
              <Mic size={14} className={isRecording ? 'text-white' : 'text-primary'} />
            </button>

            <button
              type="submit"
              disabled={!inputPrompt.trim() || isProcessing}
              className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 transition-all duration-200 disabled:opacity-40 shadow-sm"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
