import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle,
  Send,
  Trash2,
  Eye,
  Filter,
  RefreshCw,
  X,
  Mic,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import FloatingBackground from "../components/common/FloatingBackground";
import AnimatedCard from "../components/common/AnimatedCard";

export default function ClientPortal() {
  const { activeProposal, projectData, resetStore, updateProjectData } =
    useAppStore();
  const navigate = useNavigate();

  // Navigation: "overview" | "requests" | "chat"
  const [activeTab, setActiveTab] = useState("overview");

  // New Proposal Form Dialog State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjDomain, setNewProjDomain] = useState("");
  const [newProjTech, setNewProjTech] = useState("");
  const [newProjBudget, setNewProjBudget] = useState("");
  const [newProjTimeline, setNewProjTimeline] = useState("");
  const [newProjComm, setNewProjComm] = useState("Slack");

  const recognitionModalRef = useRef(null);
  const [isListeningModal, setIsListeningModal] = useState(false);

  const handleModalVoiceClick = () => {
    if (isListeningModal) {
      if (recognitionModalRef.current) {
        recognitionModalRef.current.stop();
      }
      setIsListeningModal(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = window.navigator.language || 'en-US';
    recognitionModalRef.current = recognition;

    recognition.onstart = () => {
      setIsListeningModal(true);
    };

    let finalTranscriptAtStart = newProjDesc;

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
      setNewProjDesc(newText);
      
      if (finalTranscript) {
         finalTranscriptAtStart = (finalTranscriptAtStart ? finalTranscriptAtStart + ' ' : '') + finalTranscript;
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'network') {
        alert("Network Error: Speech recognition failed. This could be due to browser restrictions or network issues.");
      } else if (event.error === 'not-allowed') {
        alert("Microphone access denied. Please allow permissions in your browser.");
      } else {
        alert(`Speech recognition error: ${event.error}`);
      }
      setIsListeningModal(false);
    };

    recognition.onend = () => {
      setIsListeningModal(false);
    };

    recognition.start();
  };

  // Filtering states for requests list
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRequest, setSelectedRequest] = useState(null);

  // AI Chat simulation inside dashboard
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState([
    {
      sender: "ai",
      text: "Welcome to the real-time scoping assistant. Feel free to refine your requirements here.",
    },
  ]);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatRequestId, setChatRequestId] = useState(null);
  const [isDemosLoading, setIsDemosLoading] = useState(false);

  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setChatInput((prev) => (prev + " " + transcript).trim());
        setIsRecordingVoice(false);
      };
      rec.onerror = (e) => {
        console.error(e);
        setIsRecordingVoice(false);
      };
      rec.onend = () => setIsRecordingVoice(false);
      setRecognition(rec);
    }
  }, []);

  // List of client's proposal requests dynamically fetched from PostgreSQL
  const [requestsList, setRequestsList] = useState([]);
  const { adminProposals, user, isDemoReady, setIsDemoReady, generatedDemos } =
    useAppStore(); // Load existing admin-curated proposals for review

  const fetchClientData = async () => {
    try {
      const currentUser = useAppStore.getState().user;
      const currentUserEmail = (
        currentUser?.email ||
        currentUser?.emailOrPhone ||
        ""
      ).trim();
      const currentUserId = (
        currentUser?.id ||
        currentUser?.user_id ||
        ""
      ).trim();

      const queryParams = new URLSearchParams();
      if (currentUserEmail) {
        queryParams.append("user_email", currentUserEmail);
      } else if (currentUserId) {
        queryParams.append("user_id", currentUserId);
      }
      const queryString = queryParams.toString()
        ? `?${queryParams.toString()}`
        : "";

      // 1. Fetch Proposal Requests from database for THIS logged-in user
      const reqsRes = await fetch(
        `http://127.0.0.1:8000/api/v1/proposal-requests${queryString}`,
      );
      if (reqsRes.ok) {
        const reqsData = await reqsRes.json();
        const formattedReqs = reqsData.map((req) => ({
          id: req.id,
          name: req.project_name || "Untitled Project",
          domain: req.business_domain || "Enterprise",
          budget: Number(req.budget) || 0,
          timeline: req.timeline || "12 Weeks",
          status:
            req.status === "COMPLETED"
              ? "Approved"
              : req.status === "PROCESSING"
                ? "Processing"
                : "Draft",
          createdDate: req.created_at
            ? new Date(req.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
          tech: Array.isArray(req.preferred_technology)
            ? req.preferred_technology.join(", ")
            : req.preferred_technology || "React, Node.js, PostgreSQL",
          desc: req.project_description || "Project scope under evaluation.",
          transcript: req.extracted_json
            ? JSON.stringify(req.extracted_json)
            : "",
          conversationsCount: req.conversations_count || 0,
        }));
        setRequestsList(formattedReqs);
      }

      // 2. Fetch Proposals from database for THIS logged-in user
      const propsRes = await fetch(
        `http://127.0.0.1:8000/api/v1/proposals/all${queryString}`,
      );
      if (propsRes.ok) {
        const propsData = await propsRes.json();
        if (propsData && Array.isArray(propsData)) {
          const filteredProps = currentUserEmail
            ? propsData.filter(
                (p) =>
                  !p.clientEmail ||
                  p.clientEmail.toLowerCase() ===
                    currentUserEmail.toLowerCase(),
              )
            : propsData;
          useAppStore.setState({ adminProposals: filteredProps });
        }
      }
    } catch (err) {
      console.error("Failed to fetch client portal data from database:", err);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, []);

  const handleRestart = () => {
    resetStore();
    navigate("/"); // Restart journey
  };

  const handleLogout = () => {
    if (resetStore) resetStore();
    navigate("/");
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    const currentUser = useAppStore.getState().user;
    const currentUserEmail = (
      currentUser?.email ||
      currentUser?.emailOrPhone ||
      ""
    ).trim();
    const currentUserId = (
      currentUser?.id ||
      currentUser?.user_id ||
      ""
    ).trim();

    const payload = {
      project_name: newProjName || "New Proposal Request",
      project_description: newProjDesc || "Project scope under evaluation.",
      business_domain: newProjDomain || "Enterprise",
      preferred_technology: newProjTech
        ? newProjTech.split(",").map((t) => t.trim())
        : [],
      budget: parseInt(newProjBudget, 10) || 50000,
      timeline: newProjTimeline || "10 Weeks",
      user_email: currentUserEmail,
      user_id: currentUserId,
    };

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/v1/proposal-requests",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) {
        await fetchClientData();
      } else {
        const newReq = {
          id: `req-${Date.now()}`,
          name: newProjName,
          domain: newProjDomain,
          budget: parseInt(newProjBudget, 10) || 50000,
          timeline: newProjTimeline || "10 Weeks",
          status: "Draft",
          createdDate: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          tech: newProjTech,
          desc: newProjDesc,
          transcript: "Manual request entry.",
        };
        setRequestsList([newReq, ...requestsList]);
      }
    } catch (err) {
      console.error("Error creating request in database:", err);
      const newReq = {
        id: `req-${Date.now()}`,
        name: newProjName,
        domain: newProjDomain,
        budget: parseInt(newProjBudget, 10) || 50000,
        timeline: newProjTimeline || "10 Weeks",
        status: "Draft",
        createdDate: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        tech: newProjTech,
        desc: newProjDesc,
        transcript: "Manual request entry.",
      };
      setRequestsList([newReq, ...requestsList]);
    }

    updateProjectData({
      name: newProjName,
      domain: newProjDomain,
      description: newProjDesc,
      budget: parseInt(newProjBudget, 10),
      timeline: newProjTimeline,
    });

    // Reset form fields
    setNewProjName("");
    setNewProjDesc("");
    setNewProjDomain("");
    setNewProjTech("");
    setNewProjBudget("");
    setNewProjTimeline("");
    setShowCreateModal(false);
  };

  const handleDeleteRequest = async (id) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/v1/proposal-requests/${id}`, {
        method: "DELETE",
      });
      setRequestsList((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Error deleting request from database:", err);
      setRequestsList((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleSelectChatRequest = async (req) => {
    setChatRequestId(req.id);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/v1/proposal-requests/${req.id}/conversations`,
      );
      if (res.ok) {
        const convos = await res.json();
        if (convos && convos.length > 0) {
          setChatLog(
            convos.map((c) => ({
              sender:
                c.sender === "client" || c.sender === "user" ? "user" : "ai",
              text: c.text,
            })),
          );
          return;
        }
      }
    } catch (err) {
      console.error("Error loading chat history from database:", err);
    }
    setChatLog([
      {
        sender: "ai",
        text: `Loaded project context for "${req.name}". How can I help adjust the budget, timeline, or scope today?`,
      },
    ]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userText = chatInput.trim();
    const userMsg = { sender: "user", text: userText };
    setChatLog((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const payload = { text: userText };
      if (chatRequestId) {
        payload.request_id = chatRequestId;
      }

      const res = await fetch(
        "http://127.0.0.1:8000/api/v1/ai-agent/extract-requirements",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (data.request_id) {
        setChatRequestId(data.request_id);
      }

      let reply =
        "I've extracted your requirements and updated the project scope in the database.";
      if (data.follow_up_message) {
        reply = data.follow_up_message;
      }

      if (data.is_ready_for_proposal) {
        setIsDemoReady(true);
        setActiveTab("demos");
        reply +=
          "\n\n✨ **Status:** I have all the information I need! I am generating your proposal now. Please check the Proposals tab in a few moments.";
      }

      setChatLog((prev) => [...prev, { sender: "ai", text: reply }]);

      updateProjectData({
        name: data.project_name || projectData.name,
        budget: data.client_budget || projectData.budget,
        timeline: data.timeline_weeks
          ? `${data.timeline_weeks} Weeks`
          : projectData.timeline,
      });

      await fetchClientData(); // Refresh overview statistics and proposals list from database
    } catch (err) {
      setChatLog((prev) => [
        ...prev,
        { sender: "ai", text: "Error connecting to AI service." },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const toggleVoiceRecording = () => {
    if (!recognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    if (isRecordingVoice) {
      recognition.stop();
      setIsRecordingVoice(false);
    } else {
      recognition.start();
      setIsRecordingVoice(true);
    }
  };

  const handleNewProposal = () => {
    navigate("/onboarding");
  };

  const handleChat = () => {
    navigate("/broker");
  };

  const clientProposals = (adminProposals || []).filter((prop) => {
    if (!user || !user.isVerified) return true;
    const uEmail = (user.email || user.emailOrPhone || "").toLowerCase().trim();
    const uId = (user.id || user.user_id || "").toString().trim();
    if (!prop.clientEmail && !prop.clientId) return true;
    if (uEmail && prop.clientEmail && prop.clientEmail.toLowerCase() === uEmail)
      return true;
    if (uId && prop.clientId && prop.clientId.toString() === uId) return true;
    return false;
  });

  const totalRequestsCount = requestsList.length;
  const approvedCount =
    requestsList.filter(
      (r) => r.status === "Approved" || r.status === "COMPLETED",
    ).length +
    clientProposals.filter(
      (p) => p.status === "Approved" || p.status === "Completed",
    ).length;
  const pendingCount =
    Math.max(
      0,
      totalRequestsCount -
        requestsList.filter(
          (r) => r.status === "Approved" || r.status === "COMPLETED",
        ).length,
    ) +
    clientProposals.filter(
      (p) => p.status !== "Approved" && p.status !== "Completed",
    ).length;
  const totalEstimatedBudget =
    requestsList.reduce((sum, r) => sum + (Number(r.budget) || 0), 0) +
    clientProposals.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);

  return (
    <div className="relative min-h-[calc(100vh-73px)] overflow-hidden py-12 px-4 bg-surface">
      <FloatingBackground />
      <div className="pointer-events-none absolute inset-0 -z-[9] min-h-full overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,107,93,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,107,93,0.06)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-70" />
        <div className="absolute left-[-8rem] top-[-5rem] h-[34rem] w-[34rem] animate-float-slow rounded-full bg-primary-container/60 blur-[85px]" />
        <div className="absolute right-[-7rem] top-[12%] h-[36rem] w-[36rem] animate-float-medium rounded-full bg-primary/25 blur-[105px]" />
        <div className="absolute left-[24%] top-[42%] h-[32rem] w-[32rem] animate-pulse-subtle rounded-full bg-secondary-container/60 blur-[95px]" />
        <div className="absolute bottom-[-10rem] right-[18%] h-[42rem] w-[42rem] animate-float-slow rounded-full bg-primary-container/50 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(113,245,229,0.34),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(0,107,93,0.20),transparent_30%),radial-gradient(circle_at_42%_55%,rgba(218,226,253,0.50),transparent_34%),radial-gradient(circle_at_78%_86%,rgba(113,245,229,0.28),transparent_32%)]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-outline-variant/30">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="font-display-lg text-4xl md:text-5xl font-semibold text-navy-accent tracking-tight leading-tight">
                Pre Sales Dashboard
              </h2>
              <p className="font-body-md text-base text-on-surface-variant mt-1">
                Create project requirements, manage generated drafts, and
                negotiate with our AI broker.
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 sm:gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button
              onClick={handleNewProposal}
              className="inline-flex items-center px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl bg-primary-container text-navy-accent font-button-text text-xs sm:text-sm font-semibold hover:shadow-md transition-all duration-200 cursor-pointer flex-1 sm:flex-initial justify-center"
            >
              <PlusCircle size={14} className="mr-1.5 flex-shrink-0" />
              <span>New Proposal Request</span>
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 font-button-text text-xs sm:text-sm font-semibold hover:bg-red-100 shadow-sm transition-all duration-200 cursor-pointer flex-1 sm:flex-initial justify-center"
            >
              <LogOut size={14} className="mr-1.5 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center overflow-x-auto whitespace-nowrap scrollbar-none w-fit gap-1 sm:gap-2 border border-neutral-200/80 bg-neutral-100/70 p-1.5 rounded-2xl font-button-text text-xs sm:text-sm font-medium self-start shadow-inner relative z-10 backdrop-blur-sm max-w-full">
          {[
            { id: "overview", label: "Overview" },
            { id: "requests", label: "Proposal Requests" },
            { id: "chat", label: "AI Assistant Chat" },
            ...(isDemoReady ? [{ id: "demos", label: "Generated Demos" }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "chat") {
                  navigate("/broker");
                  return;
                }
                setActiveTab(tab.id);
              }}
              className={`relative px-4 py-2 rounded-xl transition-colors duration-200 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? "text-neutral-900 font-bold"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="client-portal-active-tab"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm border border-neutral-200/50"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 1. OVERVIEW VIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Overview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnimatedCard className="p-6">
                <span className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block">
                  Active Requests
                </span>
                <span className="font-display-lg text-3xl font-semibold text-navy-accent mt-1 block">
                  {totalRequestsCount}
                </span>
                <p className="font-body-md text-sm text-on-surface-variant mt-2">
                  Scoping & proposals in progress
                </p>
              </AnimatedCard>

              <AnimatedCard className="p-6">
                <span className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block">
                  Pending Proposals
                </span>
                <span className="font-display-lg text-3xl font-semibold text-navy-accent mt-1 block">
                  {pendingCount}
                </span>
                <p className="font-body-md text-sm text-on-surface-variant mt-2">
                  Under broker & client review
                </p>
              </AnimatedCard>

              <AnimatedCard className="p-6">
                <span className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block">
                  Approved Proposals
                </span>
                <span className="font-display-lg text-3xl font-semibold text-primary mt-1 block">
                  {approvedCount}
                </span>
                <p className="font-body-md text-sm text-on-surface-variant mt-2">
                  Contract locked & signed
                </p>
              </AnimatedCard>

              <AnimatedCard className="p-6">
                <span className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block">
                  Total Estimated Budget
                </span>
                <span className="font-display-lg text-3xl font-semibold text-navy-accent mt-1 block">
                  ${totalEstimatedBudget.toLocaleString()}
                </span>
                <p className="font-body-md text-sm text-on-surface-variant mt-2">
                  Consolidated project cost
                </p>
              </AnimatedCard>
            </div>

            {/* Dynamic Status Timeline & Recent Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Timeline */}
              <div className="lg:col-span-6 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft space-y-6">
                <h3 className="font-headline-md text-lg font-semibold text-navy-accent pb-3 border-b border-neutral-100">
                  Active Build Status Tracker
                </h3>

                <div className="relative pl-6 border-l border-neutral-100 space-y-6">
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-primary ring-4 ring-primary-container" />
                    <span className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-primary bg-primary-container/40 px-2 py-0.5 rounded">
                      Active Phase
                    </span>
                    <h4 className="font-body-md text-base font-semibold text-navy-accent mt-1">
                      1. Intake Modeling & Discovery
                    </h4>
                    <p className="font-body-md text-sm text-on-surface-variant mt-0.5">
                      Specifications extracted:{" "}
                      {projectData.name || "Zenith Retail Portal"}
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-primary ring-4 ring-primary-container" />
                    <span className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant bg-neutral-100 px-2 py-0.5 rounded">
                      Completed
                    </span>
                    <h4 className="font-body-md text-base font-semibold text-navy-accent mt-1">
                      2. Proposal Negotiation & Balancing
                    </h4>
                    <p className="font-body-md text-sm text-on-surface-variant mt-0.5">
                      Budget holds at $
                      {Number(
                        (activeProposal && activeProposal.budget) || 0,
                      ).toLocaleString()}{" "}
                      for{" "}
                      {activeProposal ? activeProposal.timeline : "12 Weeks"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Proposals Review Section */}
              <div className="lg:col-span-6 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft space-y-4">
                <h3 className="font-headline-md text-lg font-semibold text-navy-accent pb-3 border-b border-neutral-100">
                  Your Proposals Directory
                </h3>
                <div className="space-y-3">
                  {!clientProposals || clientProposals.length === 0 ? (
                    <p className="font-body-md text-sm text-on-surface-variant italic py-4">
                      No proposals generated yet. Submit a request to begin
                      scoring & estimation.
                    </p>
                  ) : (
                    clientProposals.map((prop) => (
                      <div
                        key={prop.id}
                        className="p-4 bg-neutral-50 border border-neutral-100 rounded-xl space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-body-md text-sm font-semibold text-navy-accent block">
                              {prop.projectName}
                            </span>
                            <span className="font-body-md text-sm text-on-surface-variant">
                              {prop.timeline} •{" "}
                              {Array.isArray(prop.techStack)
                                ? prop.techStack.join(", ")
                                : prop.techStack || "Modern Stack"}
                            </span>
                          </div>
                          <span className="font-body-md text-sm font-semibold text-primary">
                            ${Number(prop.budget || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-neutral-200/60 font-body-md text-sm font-semibold">
                          <span
                            className={`px-2 py-0.5 rounded ${prop.status === "Approved" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
                          >
                            {prop.status}
                          </span>
                          <div className="space-x-2">
                            <button
                              onClick={() =>
                                alert(`Reviewing proposal: ${prop.projectName}`)
                              }
                              className="text-primary hover:underline"
                            >
                              View Specs
                            </button>
                            <button
                              onClick={() =>
                                alert(
                                  `Downloading final package for ${prop.projectName}`,
                                )
                              }
                              className="text-neutral-700 hover:underline"
                            >
                              Download PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PROPOSAL REQUESTS VIEW */}
        {activeTab === "requests" && (
          <div className="space-y-6">
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-soft">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h3 className="font-headline-md text-lg font-semibold text-navy-accent">
                  Your Proposal Requests
                </h3>
                <div className="flex items-center space-x-2 font-body-md text-sm">
                  <Filter size={12} className="text-neutral-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 font-semibold text-neutral-700 outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Approved">Approved</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto w-full -mx-6 sm:mx-0 px-6 sm:px-0">
                <table className="w-full text-left border-collapse font-body-md text-sm min-w-[650px]">
                  <thead>
                    <tr className="border-b border-neutral-100 text-on-surface-variant font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em]">
                      <th className="py-4">Project Name</th>
                      <th className="py-4">Domain</th>
                      <th className="py-4">Budget</th>
                      <th className="py-4">Timeline</th>
                      <th className="py-4">Status</th>
                      <th className="py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {requestsList
                      .filter(
                        (r) =>
                          statusFilter === "All" || r.status === statusFilter,
                      )
                      .map((req) => (
                        <tr
                          key={req.id}
                          className="hover:bg-neutral-50/50 transition-colors"
                        >
                          <td className="py-4 font-semibold text-navy-accent">
                            {req.name}
                          </td>
                          <td className="py-4 text-neutral-500 font-medium">
                            {req.domain}
                          </td>
                          <td className="py-4 font-semibold text-navy-accent">
                            ${Number(req.budget || 0).toLocaleString()}
                          </td>
                          <td className="py-4 text-neutral-500 font-medium">
                            {req.timeline}
                          </td>
                          <td className="py-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] ${
                                req.status === "Approved"
                                  ? "bg-primary-container/40 text-primary border border-primary-container"
                                  : "bg-neutral-100 text-neutral-500"
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td className="py-4 text-right space-x-2">
                            <button
                              onClick={() => setSelectedRequest(req)}
                              className="p-1.5 rounded bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
                              title="View Details"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              onClick={() => {
                                updateProjectData(req);
                                navigate("/compare");
                              }}
                              className="p-1.5 rounded bg-primary-container/40 text-primary hover:bg-primary-container/70 transition-colors"
                              title="Generate Proposal"
                            >
                              <RefreshCw size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteRequest(req.id)}
                              className="p-1.5 rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                              title="Delete Request"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. AI CHAT ASSISTANT VIEW */}
        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Previous Requests sidebar */}
            <div className="lg:col-span-4 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft space-y-4">
              <h4 className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                Chat History & Blueprints
              </h4>
              <div className="space-y-2">
                {requestsList.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => handleSelectChatRequest(req)}
                    className={`w-full p-3.5 rounded-xl border text-left hover:bg-neutral-50/50 transition-all duration-200 ${
                      chatRequestId === req.id
                        ? "border-primary bg-primary-container/20 ring-1 ring-primary"
                        : "border-neutral-100"
                    }`}
                  >
                    <span className="font-body-md text-sm font-semibold text-navy-accent block">
                      {req.name}
                    </span>
                    <span className="font-body-md text-sm text-on-surface-variant mt-0.5 block">
                      {req.domain} • ${Number(req.budget || 0).toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Box */}
            <div className="lg:col-span-8 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft flex flex-col justify-between min-h-[450px]">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <span className="font-body-md text-base font-semibold text-navy-accent">
                  Scoping Assistant Chat
                </span>
                <span className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-primary bg-primary-container/40 px-2 py-0.5 rounded">
                  AI Broker Engine Online
                </span>
              </div>

              {/* Messages feed */}
              <div className="flex-1 overflow-y-auto my-4 space-y-4 max-h-[250px]">
                {chatLog.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl font-body-md text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-neutral-900 text-white rounded-tr-none"
                          : "bg-neutral-50 text-neutral-800 border border-neutral-100 rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] px-4 py-3 rounded-2xl font-body-md text-sm leading-relaxed bg-neutral-50 text-neutral-800 border border-neutral-100 rounded-tl-none animate-pulse">
                      Analyzing...
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons & form input */}
              <div className="space-y-4 pt-3 border-t border-neutral-100">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center space-x-2 border border-neutral-200/80 rounded-2xl p-1.5 bg-[#fcfdfe] focus-within:bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 shadow-inner transition-all duration-200"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Refine proposal parameters here..."
                    className="flex-1 bg-transparent py-2.5 px-4 text-xs border-none focus:border-none outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 text-neutral-800 disabled:opacity-50 placeholder-neutral-400 font-medium"
                  />

                  {/* Mic voice input simulator */}
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={`p-2.5 rounded-xl transition-all duration-200 relative ${
                      isRecordingVoice
                        ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-200"
                        : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                    }`}
                    title="Speak to Broker"
                  >
                    {isRecordingVoice && (
                      <span className="absolute inset-0 rounded-xl bg-red-400 opacity-50 animate-ping pointer-events-none" />
                    )}
                    <Mic
                      size={14}
                      className={
                        isRecordingVoice ? "text-white" : "text-primary"
                      }
                    />
                  </button>

                  <button
                    type="submit"
                    className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 transition-all duration-200 shadow-sm"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 4. DEMOS VIEW */}
        {activeTab === "demos" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h3 className="font-headline-md text-2xl font-bold text-navy-accent">
                Generated Demos
              </h3>
              <p className="text-sm text-neutral-500 max-w-lg">
                Please select one of the proposed demos below. The AI has
                tailored these approaches based on your chat.
              </p>
            </div>

            {isDemosLoading ? (
              <div className="flex justify-center p-12 text-primary">
                Loading demos...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generatedDemos.map((demo) => (
                  <div
                    key={demo.id}
                    className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-soft flex flex-col hover:border-primary/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-primary bg-primary-container/40 px-2 py-0.5 rounded">
                          {demo.proposal_type} Demo
                        </span>
                        <h4 className="font-headline-md text-lg font-bold text-navy-accent mt-2">
                          {demo.project_name}
                        </h4>
                      </div>
                      <span className="text-xl font-bold text-primary">
                        ${(demo.estimated_cost || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-3 mb-6 flex-1 text-sm text-neutral-600">
                      <div className="flex justify-between border-b border-neutral-100 pb-2">
                        <span className="font-medium text-neutral-400">
                          Timeline:
                        </span>
                        <span className="font-bold text-neutral-700">
                          {demo.estimated_duration}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-neutral-100 pb-2">
                        <span className="font-medium text-neutral-400">
                          Stack:
                        </span>
                        <span className="font-bold text-neutral-700">
                          {(demo.tech_stack || []).join(", ")}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-neutral-400 block mb-1">
                          Scope:
                        </span>
                        <p className="bg-neutral-50 p-2 rounded-lg text-xs leading-relaxed border border-neutral-100">
                          {demo.scope}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const token = user?.accessToken;
                        window.open(
                          `http://127.0.0.1:8000/api/v1/proposals/${demo.id}/export${token ? `?token=${token}` : ""}`,
                          "_blank",
                        );
                      }}
                      className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/95 shadow-md transition-all text-sm"
                    >
                      Select this Demo & Export PDF
                    </button>
                  </div>
                ))}

                {generatedDemos.length === 0 && !isDemosLoading && (
                  <div className="col-span-2 text-center p-12 bg-white rounded-3xl border border-dashed border-neutral-200 text-neutral-400 font-medium">
                    No demos generated yet. Complete the chat wizard first.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* NEW PROPOSAL REQUEST DIALOG MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/40 backdrop-blur-sm">
          <div className="bg-white border border-neutral-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 w-full max-w-xl shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-neutral-50 text-neutral-400"
            >
              <X size={16} />
            </button>
            <h3 className="font-headline-md text-xl font-semibold text-navy-accent mb-6">
              Create Scoping Request
            </h3>

            <form
              onSubmit={handleCreateRequest}
              className="space-y-4 font-body-md text-sm font-medium text-neutral-700"
            >
              <div>
                <label className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="e.g. Zenith Retail Portal"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block mb-1">
                  Business Domain
                </label>
                <input
                  type="text"
                  required
                  value={newProjDomain}
                  onChange={(e) => setNewProjDomain(e.target.value)}
                  placeholder="e.g. E-Commerce"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block mb-1">
                  Project Description
                </label>
                <div className="relative">
                  <textarea
                    required
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    placeholder="Describe target features..."
                    rows={3}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 outline-none focus:border-primary resize-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={handleModalVoiceClick}
                    className={`absolute bottom-2.5 right-2.5 p-1.5 rounded-full transition-colors ${
                      isListeningModal 
                        ? "bg-red-100 text-red-500 animate-pulse" 
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                    title={isListeningModal ? "Stop listening" : "Start voice dictation"}
                  >
                    <Mic size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block mb-1">
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={newProjBudget}
                    onChange={(e) => setNewProjBudget(e.target.value)}
                    placeholder="e.g. 75000"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block mb-1">
                    Timeline
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjTimeline}
                    onChange={(e) => setNewProjTimeline(e.target.value)}
                    placeholder="e.g. 12 Weeks"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block mb-1">
                    Preferred Technology
                  </label>
                  <input
                    type="text"
                    value={newProjTech}
                    onChange={(e) => setNewProjTech(e.target.value)}
                    placeholder="React, Node.js"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block mb-1">
                    Communication Type
                  </label>
                  <select
                    value={newProjComm}
                    onChange={(e) => setNewProjComm(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-primary"
                  >
                    <option value="Slack">Slack Workspace</option>
                    <option value="Discord">Discord Channel</option>
                    <option value="Email">Email Thread</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-primary-container text-navy-accent hover:shadow-md transition-colors"
                >
                  Generate Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROPOSAL REQUEST DETAILS MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/40 backdrop-blur-sm">
          <div className="bg-white border border-neutral-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 w-full max-w-xl shadow-xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-neutral-50 text-neutral-400"
            >
              <X size={16} />
            </button>
            <span className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
              Request Information
            </span>
            <h3 className="font-headline-md text-xl font-semibold text-navy-accent mt-1">
              {selectedRequest.name}
            </h3>

            <div className="mt-6 space-y-4 font-body-md text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-neutral-100">
                <div>
                  <span className="font-label-caps text-on-surface-variant block font-semibold uppercase text-[11px] tracking-[0.05em]">
                    Business Domain
                  </span>
                  <span className="text-neutral-800 font-semibold">
                    {selectedRequest.domain}
                  </span>
                </div>
                <div>
                  <span className="font-label-caps text-on-surface-variant block font-semibold uppercase text-[11px] tracking-[0.05em]">
                    Target Budget
                  </span>
                  <span className="text-neutral-800 font-semibold">
                    ${Number(selectedRequest.budget || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-label-caps text-on-surface-variant block font-semibold uppercase text-[11px] tracking-[0.05em] mb-1">
                  Description
                </span>
                <p className="text-neutral-600 leading-relaxed bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  {selectedRequest.desc}
                </p>
              </div>

              {selectedRequest.transcript && (
                <div>
                  <span className="font-label-caps text-on-surface-variant block font-semibold uppercase text-[11px] tracking-[0.05em] mb-1">
                    Transcript & Extracted JSON
                  </span>
                  <pre className="text-[13px] text-primary bg-primary-container/20 p-3 rounded-xl border border-primary-container/50 overflow-x-auto font-mono leading-relaxed">
                    {JSON.stringify(
                      {
                        projectName: selectedRequest.name,
                        domain: selectedRequest.domain,
                        preferredTech: selectedRequest.tech.split(", "),
                        estimatedBudget: selectedRequest.budget,
                        timeline: selectedRequest.timeline,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
