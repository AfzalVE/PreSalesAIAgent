import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Mic,
  DollarSign,
  Clock3,
  Briefcase,
  Cpu,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
// Access it directly where you need it
const API = import.meta.env.VITE_API_BASE_URL;

let messageCounter = 0;
const generateMessageId = (sender) => `msg-${sender}-${++messageCounter}`;

const SUGGESTIONS = [
  "Reduce budget by 20%",
  "Use React instead of Angular",
  "Launch within 2 months",
  "Add AI recommendations",
];

const renderFormattedText = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

function StreamingText({ text, onComplete, onUpdate }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
        if (onUpdate) onUpdate();
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 15);
    return () => clearInterval(interval);
  }, [text, onComplete, onUpdate]);

  return <span className="whitespace-pre-wrap">{renderFormattedText(displayedText)}</span>;
}

// ---------------------------------------------------------------------------
// Helpers for budget-reduction intent detection
// ---------------------------------------------------------------------------

/**
 * Returns true when the user's message is clearly asking for a budget reduction.
 * Matches phrases like "reduce budget", "lower the cost", "cheaper", "cut price", etc.
 */
function isBudgetReductionIntent(text) {
  const t = text.toLowerCase();
  const budgetWords = ["budget", "cost", "price", "spend", "cheaper", "expensive"];
  const reductionWords = [
    "reduce", "lower", "cut", "decrease", "less", "cheap", "affordable",
    "bring down", "scale down", "trim",
  ];
  const hasBudget = budgetWords.some((w) => t.includes(w));
  const hasReduction = reductionWords.some((w) => t.includes(w));
  // Also catch bare phrases like "too expensive" or "reduce by 20%"
  const barePhrase = /(too expensive|cut by|reduce by|lower by|save money|cheaper option)/i.test(text);
  return (hasBudget && hasReduction) || barePhrase;
}

/**
 * Parse a percentage from the user's message, e.g. "reduce by 20%" → 0.20.
 * Returns null if no percentage is found.
 */
function parseReductionPercent(text) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? parseFloat(match[1]) / 100 : null;
}

export default function NegotiationChat() {
  const {
    applyNegotiationRequest,
    negotiateBudgetOnBackend,
    negotiationHistory,
    projectData,
    activeProposal,
    updateProjectData,
    user,
    activeRequestId,
    setActiveRequestId,
  } = useAppStore();
  const [inputPrompt, setInputPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedStreams, setCompletedStreams] = useState({});
  const [messages, setMessages] = useState([
    {
      id: "init",
      sender: "ai",
      text: "Hello! I am your AI Proposal Broker. You can adjust the project budget, timeline, team structures, or technical parameters here. Try typing a request, or click one of the quick suggestions below.",
      timestamp: "Just now",
    },
  ]);

  const messagesEndRef = useRef(null);

  // Tracks how many budget-reduction negotiations have happened this session.
  // 0 = none yet → attempt 1 on first request (developer swap).
  // 1+ = already swapped devs → attempt 2+ triggers timeline extension.
  const [budgetNegotiationAttempt, setBudgetNegotiationAttempt] = useState(0);

  const [recognition, setRecognition] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [proposalData, setProposalData] = useState(null);
  const [activeTab, setActiveTab] = useState("mvp");
  const [finalizedProposals, setFinalizedProposals] = useState({});
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing, completedStreams]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
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

  // ---------------------------------------------------------------------------
  // Budget negotiation handler — called when intent is detected
  // ---------------------------------------------------------------------------
  const handleBudgetNegotiation = async (text) => {
    setIsProcessing(true);

    const userMessageId = generateMessageId("user");
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        sender: "user",
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    try {
      // Determine which proposal is currently displayed in the side panel.
      // Prefer the tab the user is looking at (activeTab), fall back to mvp.
      const currentTabType = activeTab === "full" ? "FULL" : "MVP";
      const currentProposalVariant =
        proposalData?.proposals?.find((p) => p.proposal_type === currentTabType) ||
        proposalData?.proposals?.[0] ||
        activeProposal?.mvp ||
        activeProposal;

      const currentCost =
        currentProposalVariant?.estimated_cost ??
        activeProposal?.inferred_budget ??
        projectData?.budget ??
        0;

      // Try to extract a target budget from the user's message (e.g. "reduce by 20%")
      const reductionPct = parseReductionPercent(text);
      const targetBudget = reductionPct
        ? Math.round(currentCost * (1 - reductionPct))
        : Math.round(currentCost * 0.80); // default: aim for 20% savings

      // Timeline: convert "X Weeks" string to days, or use stored days
      const timelineStr =
        currentProposalVariant?.estimated_duration ??
        activeProposal?.inferred_timeline ??
        projectData?.timeline ??
        "12 Weeks";
      const timelineWeeks = parseInt(timelineStr) || 12;
      const currentTimelineDays = timelineWeeks * 7;

      // Current resources list from the active variant
      const currentResources =
        currentProposalVariant?.selected_resources?.selected_resources ??
        currentProposalVariant?.selected_resources ??
        [];

      const attempt = budgetNegotiationAttempt + 1;

      const result = await negotiateBudgetOnBackend({
        targetBudget,
        currentCost,
        currentTimelineDays,
        currentResources,
        proposalType: currentTabType,
        negotiationAttempt: attempt,
        requestId: activeRequestId,
      });

      if (result.success) {
        setBudgetNegotiationAttempt(attempt);

        // If proposal data exists in local state, patch it so the side panel refreshes
        if (proposalData) {
          setProposalData((prev) => {
            if (!prev) return prev;
            const patchedProposals = (prev.proposals || []).map((p) => {
              if (p.proposal_type !== currentTabType) return p;
              return {
                ...p,
                estimated_cost: result.newCost,
                estimated_duration: result.newTimelineFormatted,
                selected_resources: {
                  ...(p.selected_resources || {}),
                  selected_resources: result.newResources,
                },
              };
            });
            return { ...prev, proposals: patchedProposals };
          });
        }
      }

      const aiMsgId = generateMessageId("ai");
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          sender: "ai",
          text: result.responseMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          success: result.success,
          warning: result.success ? undefined : result.errorMessage,
          strategyBadge: result.strategyUsed,
        },
      ]);
    } catch (err) {
      console.error("handleBudgetNegotiation error:", err);
      const aiMsgId = generateMessageId("ai");
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          sender: "ai",
          text: "Sorry, I encountered an error while trying to optimise the budget. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          success: false,
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isProcessing) return;

    // ── Budget reduction detected: route to the specialist handler ──────────
    const hasProposalData = proposalData?.proposals?.length > 0 || activeProposal?.proposals?.length > 0 || activeProposal?.mvp;
    
    if (isBudgetReductionIntent(text) && hasProposalData) {
      setInputPrompt("");
      return handleBudgetNegotiation(text);
    }
    // ────────────────────────────────────────────────────────────────────────

    setInputPrompt("");
    setIsProcessing(true);

    const userMessageId = generateMessageId("user");
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        sender: "user",
        text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    try {
      const payload = { text };
      if (activeRequestId) {
        payload.request_id = activeRequestId;
      }

      const response = await fetch(
        `${API}/api/v1/ai-agent/extract-requirements`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to process request");
      }

      if (data.request_id) {
        setActiveRequestId(data.request_id);
      }

      // Update store with merged parameters
      updateProjectData({
        budget:
          data.client_budget !== null ? data.client_budget : projectData.budget,
        timeline: data.timeline_weeks
          ? `${data.timeline_weeks} Weeks`
          : projectData.timeline,
        techStack: data.resource_requirements
          ? data.resource_requirements.flatMap((r) => r.skills)
          : projectData.techStack,
      });

      const aiMessageId = generateMessageId("ai");

      let reply =
        "I've extracted your requirements and updated the project scope.";
      if (data.follow_up_message) {
        reply = data.follow_up_message;
      }

      if (data.ready_for_proposal_generation) {
        reply +=
          "\n\n✨ **Status:** I have all the information I need! I am generating your proposal now. Please check the Proposals dashboard in a few moments.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          sender: "ai",
          text: reply,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          success: true,
        },
      ]);

      if (data.ready_for_proposal_generation) {
        if (data.proposal_data) {
          setProposalData(data.proposal_data);
          console.log(data.proposal_data, "proposal_data in NegotiationChat.jsx");
          useAppStore.getState().setIsDemoReady(true);
        }
      }
    } catch (err) {
      console.error("API error, falling back to simulation:", err);
      const result = applyNegotiationRequest(text);
      const aiMessageId = generateMessageId("ai");

      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          sender: "ai",
          text: result.text,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          success: result.success,
          warning: result.success ? undefined : result.error,
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto font-sans">
      {/* Conversation Thread */}
      <div className="lg:col-span-8 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft flex flex-col justify-between h-[600px]">
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-6 border-b border-neutral-100">
          <div className="flex items-center space-x-2">
            <MessageSquare size={16} className="text-primary" />
            <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              AI Negotiation Console
            </h4>
          </div>
          <span className="text-xs font-medium text-neutral-400">
            Version 1.{negotiationHistory.length}
          </span>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto my-2 space-y-4 pr-1 min-h-0">
          {messages.map((msg) => {
            const isLatest = messages[messages.length - 1].id === msg.id;
            const shouldStream =
              msg.sender === "ai" &&
              msg.id !== "init" &&
              isLatest &&
              !completedStreams[msg.id];

            return (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} items-start gap-2.5`}
              >
                {msg.sender === "ai" && (
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary mt-0.5 flex-shrink-0 shadow-sm border border-primary/5">
                    <Sparkles size={12} className="animate-pulse" />
                  </div>
                )}
                <div className="max-w-[80%] flex flex-col">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm border ${msg.sender === "user"
                      ? "bg-neutral-900 text-white font-medium rounded-tr-none border-transparent"
                      : "bg-primary/5 text-neutral-800 rounded-tl-none border-primary/10"
                      }`}
                  >
                    {shouldStream ? (
                      <StreamingText
                        text={msg.text}
                        onUpdate={() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" })}
                        onComplete={() =>
                          setCompletedStreams((prev) => ({
                            ...prev,
                            [msg.id]: true,
                          }))
                        }
                      />
                    ) : (
                      <span className="whitespace-pre-wrap">{renderFormattedText(msg.text)}</span>
                    )}

                    {/* Warning Container */}
                    {msg.warning && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-start space-x-2 animate-pulse-subtle">
                        <AlertTriangle
                          size={14}
                          className="text-amber-500 mt-0.5 flex-shrink-0"
                        />
                        <span className="font-semibold">{msg.warning}</span>
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[9px] text-neutral-400 mt-1 ${msg.sender === "user" ? "text-right" : "text-left"}`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex justify-start items-center space-x-2.5 py-2 text-neutral-400 text-xs pl-8">
              <RefreshCw size={14} className="animate-spin text-primary" />
              <span className="font-medium">
                Recalculating allocate values...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion buttons */}
        <div className="pt-2">
          {/* <div className="flex flex-wrap gap-2 mb-4">
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
          </div> */}

          {/* Form input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end space-x-2 border border-neutral-200/80 rounded-2xl p-1.5 bg-[#fcfdfe] focus-within:bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 shadow-inner transition-all duration-200"
          >
            <textarea
              value={inputPrompt}
              onChange={(e) => {
                setInputPrompt(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (inputPrompt.trim() && !isProcessing) {
                    handleSendMessage();
                    e.target.style.height = 'auto';
                  }
                }
              }}
              placeholder="e.g. Reduce budget by 15% or use React..."
              disabled={isProcessing}
              rows={1}
              className="flex-1 bg-transparent py-2.5 px-4 text-xs border-none focus:border-none outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 text-neutral-800 disabled:opacity-50 placeholder-neutral-400 font-medium resize-none overflow-y-auto max-h-[120px] leading-relaxed"
            />

            {/* Mic voice input simulator */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={toggleMic}
              className={`p-2.5 rounded-xl transition-all duration-200 disabled:opacity-40 relative ${isRecording
                ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-200"
                : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                }`}
              title="Speak to Broker"
            >
              {isRecording && (
                <span className="absolute inset-0 rounded-xl bg-red-400 opacity-50 animate-ping pointer-events-none" />
              )}
              <Mic
                size={14}
                className={isRecording ? "text-white" : "text-primary"}
              />
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

      {/* Evolution History & Active Scope Overview */}
      <div className="lg:col-span-4 flex flex-col justify-between bg-neutral-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden h-[600px]">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />

        {(() => {
          const mvpProposal = proposalData?.proposals?.find(p => p.proposal_type === 'MVP');
          const fullProposal = proposalData?.proposals?.find(p => p.proposal_type === 'FULL');

          return proposalData ? (
            <div className="flex flex-col h-full z-10 relative">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles size={16} className="text-primary-container animate-pulse" />
                  <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider">
                    Generated Proposal
                  </h4>
                </div>
                <div className="flex space-x-1 bg-neutral-800 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab("mvp")}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeTab === 'mvp' ? 'bg-primary text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
                  >
                    MVP
                  </button>
                  <button
                    onClick={() => setActiveTab("full")}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeTab === 'full' ? 'bg-primary text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
                  >
                    FULL
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-6 text-xs text-neutral-300 custom-scrollbar pb-20">

                {/* ======================================================= */}
                {/* Project Overview & Preferred Technologies                */}
                {/* Shown once above the MVP / FULL tab content, since these */}
                {/* fields live at the top level of the proposal response.   */}
                {/* ======================================================= */}
                <div className="space-y-5 pb-5 border-b border-white/10">
                  <div>
                    <h5 className="text-primary-container font-bold mb-3 flex items-center gap-1.5">
                      <Sparkles size={12} /> Project Overview
                    </h5>
                    <div className="grid grid-cols-2 gap-2.5 mb-3">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                        <div className="text-[9px] text-neutral-400 uppercase tracking-wider font-bold mb-1">Project Name</div>
                        <div className="font-semibold text-white text-[11px]">{proposalData.project_name || "—"}</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                        <div className="text-[9px] text-neutral-400 uppercase tracking-wider font-bold mb-1">Business Domain</div>
                        <div className="font-semibold text-white text-[11px]">{proposalData.business_domain || "—"}</div>
                      </div>
                    </div>
                    {proposalData.inferred_project_description && (
                      <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                        <div className="text-[9px] text-neutral-400 uppercase tracking-wider font-bold mb-1">Description</div>
                        <p className="text-[11px] leading-relaxed opacity-90">{proposalData.inferred_project_description}</p>
                      </div>
                    )}
                  </div>

                  {proposalData.preferred_technology && proposalData.preferred_technology.length > 0 && (
                    <div>
                      <h5 className="text-primary-container font-bold mb-2 flex items-center gap-1.5">
                        <Cpu size={12} /> Preferred Technologies
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {proposalData.preferred_technology.map((technology, index) => (
                          <span
                            key={index}
                            className="px-2.5 py-1 rounded-full bg-primary/15 text-primary-container font-semibold text-[10px]"
                          >
                            {technology}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {activeTab === "mvp" && mvpProposal && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-5">

                    {/* ======================================================= */}
                    {/* Budget / Timeline / Type stat cards                     */}
                    {/* ======================================================= */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex flex-col items-start gap-1">
                        <DollarSign size={12} className="text-primary-container" />
                        <div className="text-[8px] text-neutral-400 uppercase tracking-wider font-bold">Budget</div>
                        <div className="font-bold text-white text-[11px]">${Number(mvpProposal.estimated_cost || 0).toLocaleString()}</div>
                      </div>
                      <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex flex-col items-start gap-1">
                        <Clock3 size={12} className="text-primary-container" />
                        <div className="text-[8px] text-neutral-400 uppercase tracking-wider font-bold">Timeline</div>
                        <div className="font-bold text-white text-[11px]">{mvpProposal.estimated_duration}</div>
                      </div>
                      <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex flex-col items-start gap-1">
                        <Briefcase size={12} className="text-primary-container" />
                        <div className="text-[8px] text-neutral-400 uppercase tracking-wider font-bold">Type</div>
                        <div className="font-bold text-white text-[11px]">{mvpProposal.proposal_type || "MVP"}</div>
                      </div>
                    </div>

                    {/* ======================================================= */}
                    {/* Detailed Budget Breakdown / Team Allocation             */}
                    {/* ======================================================= */}
                    {mvpProposal.selected_resources?.selected_resources?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-primary-container font-bold flex items-center gap-1.5">
                            <DollarSign size={12} /> Detailed Budget Breakdown
                          </h5>
                          <span className="text-[9px] font-semibold text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                            {mvpProposal.selected_resources.selected_resources.length} Experts
                          </span>
                        </div>
                        <div className="space-y-2.5">
                          {mvpProposal.selected_resources.selected_resources.map((dev, index) => (
                            <div key={index} className="bg-white/5 p-3 rounded-xl border border-white/10 relative">
                              <div className="absolute top-2.5 right-3 text-primary-container font-bold text-[11px]">
                                ${Number(dev.estimated_cost).toLocaleString()}
                              </div>
                              <div className="flex items-start gap-2.5 pr-14">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-[11px] font-black text-neutral-300">
                                  {dev.name?.charAt(0) || "D"}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-[11px] leading-tight">{dev.name}</div>
                                  <div className="text-primary-container text-[10px] font-semibold">{dev.role}</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2.5 bg-white/5 rounded-lg p-2 border border-white/5">
                                <div>
                                  <div className="text-[8px] text-neutral-400 uppercase tracking-wider font-bold">Experience</div>
                                  <div className="text-[10px] font-semibold text-neutral-200">{dev.experience_years}+ Years</div>
                                </div>
                                <div>
                                  <div className="text-[8px] text-neutral-400 uppercase tracking-wider font-bold">Rate</div>
                                  <div className="text-[10px] font-semibold text-neutral-200">${dev.hourly_cost}/hr</div>
                                </div>
                              </div>
                              {dev.skills?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {dev.skills.map((skill, skillIndex) => (
                                    <span key={skillIndex} className="px-2 py-0.5 rounded-full bg-white/10 text-neutral-200 text-[9px] font-semibold">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h5 className="text-primary-container font-bold mb-2">Executive Summary</h5>
                      <p className="text-[11px] leading-relaxed opacity-90">{mvpProposal.executive_summary}</p>
                    </div>

                    {mvpProposal.scope && (
                      <div>
                        <h5 className="text-primary-container font-bold mb-2">Scope</h5>
                        <p className="text-[11px] leading-relaxed opacity-90">{mvpProposal.scope}</p>
                      </div>
                    )}

                    <div>
                      <h5 className="text-primary-container font-bold mb-2">Key Features</h5>
                      <ul className="list-disc pl-4 space-y-1 text-[11px] opacity-90">
                        {mvpProposal.key_features?.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>

                    {mvpProposal.deliverables?.length > 0 && (
                      <div>
                        <h5 className="text-primary-container font-bold mb-2">Deliverables</h5>
                        <ul className="list-disc pl-4 space-y-1 text-[11px] opacity-90">
                          {mvpProposal.deliverables.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                      </div>
                    )}

                    {mvpProposal.acceptance_criteria?.length > 0 && (
                      <div>
                        <h5 className="text-primary-container font-bold mb-2">Acceptance Criteria</h5>
                        <ul className="list-disc pl-4 space-y-1 text-[11px] opacity-90">
                          {mvpProposal.acceptance_criteria.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                    )}

                    {(mvpProposal.assumptions || mvpProposal.risks) && (
                      <div className="grid grid-cols-2 gap-4">
                        {mvpProposal.assumptions && (
                          <div>
                            <h5 className="text-primary-container font-bold mb-2">Assumptions</h5>
                            <p className="text-[11px] opacity-90">{mvpProposal.assumptions}</p>
                          </div>
                        )}
                        {mvpProposal.risks && (
                          <div>
                            <h5 className="text-primary-container font-bold mb-2">Risks</h5>
                            <p className="text-[11px] opacity-90">{mvpProposal.risks}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {mvpProposal.timeline_phases?.length > 0 && (
                      <div>
                        <h5 className="text-primary-container font-bold mb-2">Timeline Phases</h5>
                        <div className="space-y-2">
                          {mvpProposal.timeline_phases.map((p, i) => (
                            <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/10 flex flex-col gap-1.5">
                              <span className="font-bold text-white text-[11px]">Phase: {p.Phase || p.phase || (i + 1)}</span>
                              {(p.Duration || p.duration) && <span className="text-[9px] font-semibold text-neutral-400">{p.Duration || p.duration}</span>}
                              <span className="text-[10px] opacity-80 leading-relaxed">{p.Output || p.output || p.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                        <div className="text-[9px] text-neutral-400 uppercase tracking-wider font-bold mb-1">Timeline</div>
                        <div className="font-semibold text-white">{mvpProposal.estimated_duration}</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                        <div className="text-[9px] text-neutral-400 uppercase tracking-wider font-bold mb-1">Cost</div>
                        <div className="font-semibold text-white">${mvpProposal.estimated_cost?.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === "full" && fullProposal && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-5">

                    {/* ======================================================= */}
                    {/* Budget / Timeline / Type stat cards                     */}
                    {/* ======================================================= */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex flex-col items-start gap-1">
                        <DollarSign size={12} className="text-primary-container" />
                        <div className="text-[8px] text-neutral-400 uppercase tracking-wider font-bold">Budget</div>
                        <div className="font-bold text-white text-[11px]">${Number(fullProposal.estimated_cost || 0).toLocaleString()}</div>
                      </div>
                      <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex flex-col items-start gap-1">
                        <Clock3 size={12} className="text-primary-container" />
                        <div className="text-[8px] text-neutral-400 uppercase tracking-wider font-bold">Timeline</div>
                        <div className="font-bold text-white text-[11px]">{fullProposal.estimated_duration}</div>
                      </div>
                      <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex flex-col items-start gap-1">
                        <Briefcase size={12} className="text-primary-container" />
                        <div className="text-[8px] text-neutral-400 uppercase tracking-wider font-bold">Type</div>
                        <div className="font-bold text-white text-[11px]">{fullProposal.proposal_type || "FULL"}</div>
                      </div>
                    </div>

                    {/* ======================================================= */}
                    {/* Detailed Budget Breakdown / Team Allocation             */}
                    {/* ======================================================= */}
                    {fullProposal.selected_resources?.selected_resources?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-primary-container font-bold flex items-center gap-1.5">
                            <DollarSign size={12} /> Detailed Budget Breakdown
                          </h5>
                          <span className="text-[9px] font-semibold text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                            {fullProposal.selected_resources.selected_resources.length} Experts
                          </span>
                        </div>
                        <div className="space-y-2.5">
                          {fullProposal.selected_resources.selected_resources.map((dev, index) => (
                            <div key={index} className="bg-white/5 p-3 rounded-xl border border-white/10 relative">
                              <div className="absolute top-2.5 right-3 text-primary-container font-bold text-[11px]">
                                ${Number(dev.estimated_cost).toLocaleString()}
                              </div>
                              <div className="flex items-start gap-2.5 pr-14">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-[11px] font-black text-neutral-300">
                                  {dev.name?.charAt(0) || "D"}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-[11px] leading-tight">{dev.name}</div>
                                  <div className="text-primary-container text-[10px] font-semibold">{dev.role}</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2.5 bg-white/5 rounded-lg p-2 border border-white/5">
                                <div>
                                  <div className="text-[8px] text-neutral-400 uppercase tracking-wider font-bold">Experience</div>
                                  <div className="text-[10px] font-semibold text-neutral-200">{dev.experience_years}+ Years</div>
                                </div>
                                <div>
                                  <div className="text-[8px] text-neutral-400 uppercase tracking-wider font-bold">Rate</div>
                                  <div className="text-[10px] font-semibold text-neutral-200">${dev.hourly_cost}/hr</div>
                                </div>
                              </div>
                              {dev.skills?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {dev.skills.map((skill, skillIndex) => (
                                    <span key={skillIndex} className="px-2 py-0.5 rounded-full bg-white/10 text-neutral-200 text-[9px] font-semibold">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h5 className="text-primary-container font-bold mb-2">Executive Summary</h5>
                      <p className="text-[11px] leading-relaxed opacity-90">{fullProposal.executive_summary}</p>
                    </div>

                    {fullProposal.scope && (
                      <div>
                        <h5 className="text-primary-container font-bold mb-2">Scope</h5>
                        <p className="text-[11px] leading-relaxed opacity-90">{fullProposal.scope}</p>
                      </div>
                    )}

                    <div>
                      <h5 className="text-primary-container font-bold mb-2">Key Features</h5>
                      <ul className="list-disc pl-4 space-y-1 text-[11px] opacity-90">
                        {fullProposal.key_features?.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>

                    {fullProposal.deliverables?.length > 0 && (
                      <div>
                        <h5 className="text-primary-container font-bold mb-2">Deliverables</h5>
                        <ul className="list-disc pl-4 space-y-1 text-[11px] opacity-90">
                          {fullProposal.deliverables.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                      </div>
                    )}

                    {fullProposal.acceptance_criteria?.length > 0 && (
                      <div>
                        <h5 className="text-primary-container font-bold mb-2">Acceptance Criteria</h5>
                        <ul className="list-disc pl-4 space-y-1 text-[11px] opacity-90">
                          {fullProposal.acceptance_criteria.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                    )}

                    {(fullProposal.assumptions || fullProposal.risks) && (
                      <div className="grid grid-cols-2 gap-4">
                        {fullProposal.assumptions && (
                          <div>
                            <h5 className="text-primary-container font-bold mb-2">Assumptions</h5>
                            <p className="text-[11px] opacity-90">{fullProposal.assumptions}</p>
                          </div>
                        )}
                        {fullProposal.risks && (
                          <div>
                            <h5 className="text-primary-container font-bold mb-2">Risks</h5>
                            <p className="text-[11px] opacity-90">{fullProposal.risks}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {fullProposal.timeline_phases?.length > 0 && (
                      <div>
                        <h5 className="text-primary-container font-bold mb-2">Timeline Phases</h5>
                        <div className="space-y-2">
                          {fullProposal.timeline_phases.map((p, i) => (
                            <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/10 flex flex-col gap-1.5">
                              <span className="font-bold text-white text-[11px]">Phase: {p.Phase || p.phase || (i + 1)}</span>
                              {(p.Duration || p.duration) && <span className="text-[9px] font-semibold text-neutral-400">{p.Duration || p.duration}</span>}
                              <span className="text-[10px] opacity-80 leading-relaxed">{p.Output || p.output || p.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                        <div className="text-[9px] text-neutral-400 uppercase tracking-wider font-bold mb-1">Timeline</div>
                        <div className="font-semibold text-white">{fullProposal.estimated_duration}</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/10 overflow-hidden">
                        <div className="text-[9px] text-neutral-400 uppercase tracking-wider font-bold mb-1">Architecture</div>
                        <div className="font-semibold text-white leading-snug">{fullProposal.architecture}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-neutral-900 pt-4 pb-2 border-t border-white/10 flex items-center justify-end z-20">
                {(() => {
                  const targetProposal = activeTab === 'mvp' ? mvpProposal : fullProposal;
                  const isFinalized = targetProposal && finalizedProposals[targetProposal.id];

                  return isFinalized ? (
                    <button
                      className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20"
                      onClick={(e) => {
                        e.preventDefault();
                        if (!targetProposal?.id) return;
                        const token = user?.accessToken;
                        window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/v1/proposals/${targetProposal.id}/download${token ? `?token=${token}` : ""}`;
                      }}
                    >
                      Download POC
                    </button>
                  ) : (
                    <button
                      className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-lg shadow-primary/20"
                      onClick={async () => {
                        if (!targetProposal) return;
                        try {
                          const res = await fetch(`${API}/api/v1/proposals/${targetProposal.id}/select`, {
                            method: "POST"
                          });
                          if (res.ok) {
                            setFinalizedProposals(prev => ({ ...prev, [targetProposal.id]: true }));
                          } else {
                            alert("Failed to create Final POC.");
                          }
                        } catch (e) {
                          alert("Error calling endpoint");
                        }
                      }}
                    >
                      Create Final POC
                    </button>
                  );
                })()}
              </div>
            </div>
          ) : (
            <>
              <div className="z-10 relative">
                <div className="flex items-center space-x-2 pb-4 border-b border-white/10 mb-5">
                  <Sparkles
                    size={16}
                    className="text-primary-container animate-pulse"
                  />
                  <h4 className="text-xs font-semibold text-white/90 uppercase tracking-wider">
                    Adjustment Changelog
                  </h4>
                </div>

                <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                  {negotiationHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="pb-3.5 border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary-container">
                          {item.version}
                        </span>
                        <span className="text-[9px] text-neutral-400 font-semibold">
                          {item.date}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-300 font-medium mt-1">
                        {item.changeDescription}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-neutral-500 mt-1 font-semibold">
                        <span>By: {item.author}</span>
                        <span className="text-white/80">
                          ${item.budget.toLocaleString()} • {item.timeline}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs z-10 relative">
                <span className="text-neutral-400 font-medium">
                  Review Proposal
                </span>
                {/* <span className="text-primary-container font-bold flex items-center">
                  Ready to Sign
                  <ChevronRight size={14} className="ml-0.5" />
                </span> */}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
