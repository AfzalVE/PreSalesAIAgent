import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  PlusCircle,
  Send,
  Eye,
  X,
  Mic,
  LogOut,
  MessageSquare,
  FileDown,
  CheckCircle,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import FloatingBackground from "../components/common/FloatingBackground";
import AnimatedCard from "../components/common/AnimatedCard";
import { AudioRecorder, transcribeWithWhisper } from "../utils/audioRecorder";

const API = import.meta.env.VITE_API_BASE_URL;

export default function ClientPortal() {
  const {
    activeProposal,
    projectData,
    resetStore,
    updateProjectData,
    adminProposals,
    user,
    isDemoReady,
    setIsDemoReady,
    generatedDemos,
    setActiveProposalForPreview,
    generateProposalsFromBackend,
  } = useAppStore();
  const navigate = useNavigate();

  // Navigation: "overview" | "dev-chats" | "chat"
  const [activeTab, setActiveTab] = useState("overview");

  // ─── Developer Chats States ──────────────────────────────────────────────
  const [devConversations, setDevConversations] = useState([]);
  const [activeDevChatId, setActiveDevChatId] = useState(null);
  const [activeDevChatName, setActiveDevChatName] = useState("");
  const [devChatHistory, setDevChatHistory] = useState([]);
  const [isDevChatsLoading, setIsDevChatsLoading] = useState(false);

  // ─── AI Chat States ──────────────────────────────────────────────────────
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
  const audioRecorderChatRef = useRef(null);

  // ─── Proposals / Overview States ────────────────────────────────────────
  const [requestsList, setRequestsList] = useState([]);
  const [viewingProposal, setViewingProposal] = useState(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);
  const [generatingPocId, setGeneratingPocId] = useState(null); // proposal group id being generated
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

  // ─── Approve ────────────────────────────────────────────────────────────
  const handleApproveProposal = async (proposalId) => {
    // Optimistic update: immediately reflect approval in local state
    useAppStore.setState((state) => ({
      adminProposals: (state.adminProposals || []).map((p) =>
        p.id === proposalId ? { ...p, status: "Approved" } : p
      ),
    }));
    try {
      const response = await fetch(`${API}/api/v1/proposals/${proposalId}/select`, {
        method: "POST",
      });
      if (!response.ok) {
        console.error("Failed to approve proposal");
        fetchClientData();
      } else {
        fetchClientData();
      }
    } catch (err) {
      console.error("Error approving proposal:", err);
      fetchClientData();
    }
  };

  // ─── Download PDF ────────────────────────────────────────────────────────
  const handleDownloadPdf = async (proposalId, projectName) => {
    if (downloadingPdfId) return;
    setDownloadingPdfId(proposalId);
    try {
      const response = await fetch(`${API}/api/v1/proposals/${proposalId}/download`);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName || "Proposal"}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error:", err);
      window.open(`${API}/api/v1/proposals/${proposalId}/download`, "_blank");
    } finally {
      setDownloadingPdfId(null);
    }
  };

  // ─── View POC: fetch full rich data from backend and navigate ───────────
  const [loadingPocId, setLoadingPocId] = useState(null);

  const handleViewPoc = async (prop) => {
    if (loadingPocId) return;
    setLoadingPocId(prop.id);
    try {
      // Fetch the full rich proposal data from the backend (includes executive_summary,
      // key_features, deliverables, acceptance_criteria, architecture, roadmap, etc.)
      const res = await fetch(`${API}/api/v1/proposals/${prop.id}/poc`);
      if (!res.ok) throw new Error("Failed to fetch POC data");
      const fullData = await res.json();
      // fullData shape: { mvp, full, inferred_project_name, inferred_business_domain,
      //                   inferred_project_description, preferred_technology }
      useAppStore.setState({ activeProposal: fullData });
      navigate("/proposal-preview");
    } catch (err) {
      console.error("View POC error:", err);
      alert("Failed to load proposal preview. Please try again.");
    } finally {
      setLoadingPocId(null);
    }
  };

  // ─── Generate Proposal (for a request) ──────────────────────────────────
  const handleGenerateProposal = async (req) => {
    if (generatingPocId === req.id) return;
    setGeneratingPocId(req.id);
    try {
      // Populate project data and run the generation pipeline
      updateProjectData({
        name: req.name,
        domain: req.domain,
        description: req.desc,
        budget: req.budget,
        timeline: req.timeline,
      });
      // Small delay to let store update
      await new Promise((r) => setTimeout(r, 100));
      const result = await generateProposalsFromBackend();
      if (result.success) {
        navigate("/proposal-preview");
      } else {
        alert(`Generation failed: ${result.error || "Please try again."}`);
      }
    } catch (err) {
      console.error("Generate proposal error:", err);
      alert("Failed to generate proposal. Please try again.");
    } finally {
      setGeneratingPocId(null);
    }
  };

  // ─── Fetch Data ─────────────────────────────────────────────────────────
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

      // 1. Fetch Proposal Requests
      const reqsRes = await fetch(
        `${API}/api/v1/proposal-requests${queryString}`
      );
      if (reqsRes.ok) {
        const reqsData = await reqsRes.json();
        const formattedReqs = reqsData.map((req) => ({
          id: req.id,
          name: req.project_name || "Untitled Project",
          domain: req.business_domain || "Enterprise",
          budget: Number(req.budget) || 0,
          timeline: req.estimated_duration || req.timeline || "TBD",
          status:
            req.status === "COMPLETED"
              ? "Generated"
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
        }));
        setRequestsList(formattedReqs);
      }

      // 2. Fetch Proposals
      const propsRes = await fetch(
        `${API}/api/v1/proposals/all${queryString}`
      );
      if (propsRes.ok) {
        const propsData = await propsRes.json();
        if (propsData && Array.isArray(propsData)) {
          useAppStore.setState({ adminProposals: propsData });
        }
      }
    } catch (err) {
      console.error("Failed to fetch client portal data:", err);
    } finally {
      setIsDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "overview") {
      fetchClientData();
    }
  }, [activeTab]);

  // Fetch Dev Conversations when switching to dev-chats tab
  useEffect(() => {
    if (activeTab === "dev-chats") {
      const fetchDevChats = async () => {
        setIsDevChatsLoading(true);
        try {
          const currentUser = useAppStore.getState().user;
          const currentUserId = (
            currentUser?.id || currentUser?.user_id || ""
          ).trim();
          let storedId = localStorage.getItem("clientId") || "";
          storedId = storedId.replace(/client_/g, "");
          const clientIdStr = currentUserId
            ? `client_${currentUserId}`
            : `client_${storedId || crypto.randomUUID()}`;

          const res = await fetch(
            `${API}/api/v1/chats/conversations/${clientIdStr}`
          );
          if (res.ok) {
            const data = await res.json();
            setDevConversations(data);
          }
        } catch (err) {
          console.error("Failed to fetch developer conversations:", err);
        } finally {
          setIsDevChatsLoading(false);
        }
      };
      fetchDevChats();
    }
  }, [activeTab]);

  const handleSelectDevChat = async (empId, empName) => {
    setActiveDevChatId(empId);
    setActiveDevChatName(empName);
    try {
      const currentUser = useAppStore.getState().user;
      const currentUserId = (
        currentUser?.id || currentUser?.user_id || ""
      ).trim();
      let storedId = localStorage.getItem("clientId") || "";
      storedId = storedId.replace(/client_/g, "");
      const clientIdStr = currentUserId
        ? `client_${currentUserId}`
        : `client_${storedId || crypto.randomUUID()}`;

      const res = await fetch(
        `${API}/api/v1/chats/history/${clientIdStr}/${empId}`
      );
      if (res.ok) {
        const data = await res.json();
        setDevChatHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch developer chat history:", err);
    }
  };

  const handleLogout = () => {
    if (resetStore) resetStore();
    navigate("/");
  };

  const handleNewProposal = () => {
    navigate("/onboarding");
  };

  // ─── AI Chat ─────────────────────────────────────────────────────────────
  const handleSelectChatRequest = async (req) => {
    setChatRequestId(req.id);
    try {
      const res = await fetch(
        `${API}/api/v1/proposal-requests/${req.id}/conversations`
      );
      if (res.ok) {
        const convos = await res.json();
        if (convos && convos.length > 0) {
          setChatLog(
            convos.map((c) => ({
              sender:
                c.sender === "client" || c.sender === "user" ? "user" : "ai",
              text: c.text,
            }))
          );
          return;
        }
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
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
    setChatLog((prev) => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const payload = {
        text: userText,
        client_id: user?.id || user?.user_id,
      };
      if (chatRequestId) payload.request_id = chatRequestId;

      const res = await fetch(`${API}/api/v1/ai-agent/extract-requirements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.request_id) setChatRequestId(data.request_id);

      let reply =
        "I've extracted your requirements and updated the project scope in the database.";
      if (data.follow_up_message) reply = data.follow_up_message;

      if (data.is_ready_for_proposal) {
        setIsDemoReady(true);
        reply +=
          "\n\n✨ **Status:** I have all the information I need! I am generating your proposal now.";
        fetchClientData();
      }

      setChatLog((prev) => [...prev, { sender: "ai", text: reply }]);

      updateProjectData({
        name: data.project_name || projectData.name,
        budget: data.client_budget || projectData.budget,
        timeline: data.timeline_weeks
          ? `${data.timeline_weeks} Weeks`
          : projectData.timeline,
      });

      await fetchClientData();
    } catch (err) {
      setChatLog((prev) => [
        ...prev,
        { sender: "ai", text: "Error connecting to AI service." },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const toggleVoiceRecording = async () => {
    if (isRecordingVoice) {
      setIsRecordingVoice(false);
      try {
        if (audioRecorderChatRef.current) {
          const audioBlob = await audioRecorderChatRef.current.stop();
          const transcript = await transcribeWithWhisper(audioBlob);
          if (transcript && transcript.trim()) {
            setChatInput((prev) =>
              prev ? prev + " " + transcript.trim() : transcript.trim()
            );
          }
        }
      } catch (err) {
        console.error("Whisper Chat Transcription error:", err);
        alert(`Transcription error: ${err.message || "Failed to process audio"}`);
      }
      return;
    }
    try {
      const recorder = new AudioRecorder();
      await recorder.start();
      audioRecorderChatRef.current = recorder;
      setIsRecordingVoice(true);
    } catch (err) {
      alert(err.message || "Failed to start microphone.");
    }
  };

  // ─── Derived stats ───────────────────────────────────────────────────────
  const clientProposals = adminProposals || [];
  const totalRequestsCount = requestsList.length;
  const approvedCount = clientProposals.filter(
    (p) => p.status === "Approved" || p.status === "Completed"
  ).length;
  const pendingCount = clientProposals.filter(
    (p) => p.status !== "Approved" && p.status !== "Completed"
  ).length;
  const totalEstimatedBudget = clientProposals
    .filter((p) => p.status === "Approved" || p.status === "Completed")
    .reduce((sum, p) => sum + (Number(p.budget) || 0), 0);

  // ─── Spinner SVG helper ───────────────────────────────────────────────────
  const Spinner = ({ className = "h-4 w-4" }) => (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8z"
      />
    </svg>
  );

  return (
    <div className="relative min-h-[calc(100vh-73px)] overflow-hidden py-12 px-4 bg-surface">
      <FloatingBackground />
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-[9] min-h-full overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,107,93,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,107,93,0.06)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-70" />
        <div className="absolute left-[-8rem] top-[-5rem] h-[34rem] w-[34rem] animate-float-slow rounded-full bg-primary-container/60 blur-[85px]" />
        <div className="absolute right-[-7rem] top-[12%] h-[36rem] w-[36rem] animate-float-medium rounded-full bg-primary/25 blur-[105px]" />
        <div className="absolute left-[24%] top-[42%] h-[32rem] w-[32rem] animate-pulse-subtle rounded-full bg-secondary-container/60 blur-[95px]" />
        <div className="absolute bottom-[-10rem] right-[18%] h-[42rem] w-[42rem] animate-float-slow rounded-full bg-primary-container/50 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        {/* ── Dashboard Header ─────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-outline-variant/30">
          <div>
            <h2 className="font-display-lg text-4xl md:text-5xl font-semibold text-navy-accent tracking-tight leading-tight">
              Pre Sales Dashboard
            </h2>
            <p className="font-body-md text-base text-on-surface-variant mt-1">
              Create project requirements, manage generated drafts, and
              negotiate with our AI broker.
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-2 sm:gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button
              onClick={handleNewProposal}
              className="inline-flex items-center px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl bg-primary-container text-navy-accent font-button-text text-xs sm:text-sm font-semibold hover:shadow-md transition-all duration-200 cursor-pointer flex-1 sm:flex-initial justify-center"
            >
              <PlusCircle size={14} className="mr-1.5 flex-shrink-0" />
              <span>New Proposal Request</span>
            </button>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <div className="flex items-center overflow-x-auto whitespace-nowrap scrollbar-none w-fit gap-1 sm:gap-2 border border-neutral-200/80 bg-neutral-100/70 p-1.5 rounded-2xl font-button-text text-xs sm:text-sm font-medium self-start shadow-inner relative z-10 backdrop-blur-sm max-w-full">
          {[
            { id: "overview", label: "Overview" },
            { id: "dev-chats", label: "Developer Chats" },
            { id: "chat", label: "AI Assistant Chat" },
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

        {/* ══════════════════════════════════════════════════════════════
            1. OVERVIEW TAB
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {isDashboardLoading ? (
              <div className="space-y-8 animate-pulse">
                {/* Stats Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white/60 border border-neutral-200/50 rounded-2xl p-6 h-32" />
                  ))}
                </div>
                {/* Directory Skeleton */}
                <div className="bg-white/60 border border-neutral-200/50 rounded-3xl p-6 h-[400px]" />
              </div>
            ) : (
              <>
                {/* ── Stat Cards ─────────────────────────────────────── */}
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

            {/* ── Full-Width Proposals Directory ───────────────────── */}
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-soft">
              <h3 className="font-headline-md text-lg font-semibold text-navy-accent pb-4 border-b border-neutral-100 mb-6">
                Your Proposals Directory
              </h3>

              {!clientProposals || clientProposals.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-container/30 flex items-center justify-center mb-4">
                    <Zap size={28} className="text-primary" />
                  </div>
                  <p className="font-body-md text-sm text-on-surface-variant italic">
                    No proposals generated yet. Submit a request to begin
                    scoring & estimation.
                  </p>
                  <button
                    onClick={handleNewProposal}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all"
                  >
                    <PlusCircle size={16} />
                    Start a New Request
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* MVP Proposals Section (Left) */}
                  <div>
                    <h4 className="font-body-md text-base font-semibold text-navy-accent mb-4 pl-3 border-l-4 border-amber-400">
                      MVP Proposals
                    </h4>
                    {clientProposals.filter(p => p.proposalType?.toUpperCase() === "MVP").length === 0 ? (
                      <p className="text-sm text-neutral-500 italic p-4 bg-neutral-50 rounded-xl border border-neutral-100">No MVP proposals available.</p>
                    ) : (
                      <div className="flex flex-col gap-5">
                        {clientProposals
                          .filter(p => p.proposalType?.toUpperCase() === "MVP")
                          .map((prop) => (
                            <ProposalCard
                              key={prop.id}
                              prop={prop}
                              downloadingPdfId={downloadingPdfId}
                              loadingPocId={loadingPocId}
                              onViewPoc={handleViewPoc}
                              onDownload={handleDownloadPdf}
                              onApprove={handleApproveProposal}
                              Spinner={Spinner}
                            />
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Full Proposals Section (Right) */}
                  <div>
                    <h4 className="font-body-md text-base font-semibold text-navy-accent mb-4 pl-3 border-l-4 border-primary">
                      Full Proposals
                    </h4>
                    {clientProposals.filter(p => p.proposalType?.toUpperCase() === "FULL").length === 0 ? (
                      <p className="text-sm text-neutral-500 italic p-4 bg-neutral-50 rounded-xl border border-neutral-100">No Full proposals available.</p>
                    ) : (
                      <div className="flex flex-col gap-5">
                        {clientProposals
                          .filter(p => p.proposalType?.toUpperCase() === "FULL")
                          .map((prop) => (
                            <ProposalCard
                              key={prop.id}
                              prop={prop}
                              downloadingPdfId={downloadingPdfId}
                              loadingPocId={loadingPocId}
                              onViewPoc={handleViewPoc}
                              onDownload={handleDownloadPdf}
                              onApprove={handleApproveProposal}
                              Spinner={Spinner}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            </>
          )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            2. DEVELOPER CHATS TAB
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "dev-chats" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Conversations Sidebar */}
            <div className="lg:col-span-4 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft space-y-4">
              <h4 className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                Your Developer Contacts
              </h4>
              <div className="space-y-2">
                {isDevChatsLoading ? (
                  <p className="text-sm text-neutral-500">
                    Loading contacts...
                  </p>
                ) : devConversations.length === 0 ? (
                  <p className="text-sm text-neutral-500 italic py-2">
                    No active developer conversations found.
                  </p>
                ) : (
                  devConversations.map((convo) => (
                    <button
                      key={convo.employee_id}
                      onClick={() =>
                        handleSelectDevChat(
                          convo.employee_id,
                          convo.employee_name
                        )
                      }
                      className={`w-full p-3.5 rounded-xl border text-left hover:bg-neutral-50/50 transition-all duration-200 ${
                        activeDevChatId === convo.employee_id
                          ? "border-primary bg-primary-container/20 ring-1 ring-primary"
                          : "border-neutral-100"
                      }`}
                    >
                      <span className="font-body-md text-sm font-semibold text-navy-accent block truncate">
                        {convo.employee_name}
                      </span>
                      <span className="font-body-md text-xs text-on-surface-variant mt-1 block truncate">
                        {convo.last_message}
                      </span>
                      <span className="font-body-md text-[10px] text-neutral-400 mt-1 block">
                        {convo.last_message_time}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat History Pane */}
            <div className="lg:col-span-8 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft flex flex-col justify-between min-h-[500px]">
              {activeDevChatId ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <div>
                      <span className="font-body-md text-base font-semibold text-navy-accent block">
                        Chat History with {activeDevChatName}
                      </span>
                      <span className="text-xs text-neutral-500">
                        Read-only history view
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        navigate(
                          `/client/resource-contact?employeeId=${activeDevChatId}&employeeName=${encodeURIComponent(
                            activeDevChatName
                          )}`
                        )
                      }
                      className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-primary text-white font-button-text text-xs font-semibold hover:bg-primary/90 transition-all duration-200 shadow-sm"
                    >
                      Resume Live Chat
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto my-4 space-y-4">
                    {devChatHistory.length === 0 ? (
                      <div className="flex justify-center p-12 text-neutral-400 text-sm">
                        Loading history...
                      </div>
                    ) : (
                      devChatHistory.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${
                            msg.sender === "client"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div className="flex flex-col max-w-[80%]">
                            <div
                              className={`px-4 py-3 rounded-2xl font-body-md text-sm leading-relaxed ${
                                msg.sender === "client"
                                  ? "bg-navy-accent text-white rounded-tr-none"
                                  : "bg-neutral-50 text-neutral-800 border border-neutral-100 rounded-tl-none"
                              }`}
                            >
                              {msg.text.startsWith("[AUDIO_CALL:") ? (
                                <span className="flex items-center text-xs opacity-90">
                                  <Mic size={12} className="mr-2" /> Audio Call
                                  Recorded
                                </span>
                              ) : msg.text.startsWith("[VIDEO_CALL:") ? (
                                <span className="flex items-center text-xs opacity-90">
                                  <Eye size={12} className="mr-2" /> Video Call
                                  Recorded
                                </span>
                              ) : (
                                msg.text
                              )}
                            </div>
                            <span
                              className={`text-[10px] text-neutral-400 mt-1 ${
                                msg.sender === "client"
                                  ? "text-right"
                                  : "text-left"
                              }`}
                            >
                              {msg.time}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm font-medium flex-col gap-2">
                  <MessageSquare size={32} className="opacity-20" />
                  <p>Select a developer contact from the left to view history.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            3. AI CHAT TAB (kept intact — navigates to /broker)
        ══════════════════════════════════════════════════════════════ */}
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

              <div className="flex-1 overflow-y-auto my-4 space-y-4 max-h-[250px]">
                {chatLog.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.sender === "user" ? "justify-end" : "justify-start"
                    }`}
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
                      className={isRecordingVoice ? "text-white" : "text-primary"}
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
      </div>

      {/* ── Viewing Proposal Specs Modal ───────────────────────────── */}
      {viewingProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-elevation-4 border border-outline-variant/30">
            <div className="flex justify-between items-start mb-6 border-b border-outline-variant/30 pb-4">
              <div>
                <h3 className="font-headline-md text-2xl font-bold text-on-surface">
                  {viewingProposal.projectName} Specs
                </h3>
                <p className="text-on-surface-variant font-body-md text-sm mt-1">
                  Review the technical specifications for this proposal.
                </p>
              </div>
              <button
                onClick={() => setViewingProposal(null)}
                className="p-2 rounded-full hover:bg-surface-variant/50 text-on-surface-variant transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-6 text-on-surface font-body-md">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-variant/20 p-4 rounded-xl border border-outline-variant/20">
                  <span className="font-label-caps text-[11px] font-semibold tracking-wider uppercase text-on-surface-variant block mb-1">
                    Timeline
                  </span>
                  <span className="font-semibold text-primary">
                    {viewingProposal.timeline}
                  </span>
                </div>
                <div className="bg-surface-variant/20 p-4 rounded-xl border border-outline-variant/20">
                  <span className="font-label-caps text-[11px] font-semibold tracking-wider uppercase text-on-surface-variant block mb-1">
                    Budget
                  </span>
                  <span className="font-semibold text-primary">
                    ${Number(viewingProposal.budget || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-label-caps text-[11px] font-semibold tracking-wider uppercase text-on-surface-variant block mb-2">
                  Tech Stack
                </span>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(viewingProposal.techStack)
                    ? viewingProposal.techStack.map((tech, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-secondary-container/50 text-on-secondary-container rounded-lg text-sm font-medium border border-secondary-container"
                        >
                          {tech}
                        </span>
                      ))
                    : (
                        <span className="px-2.5 py-1 bg-secondary-container/50 text-on-secondary-container rounded-lg text-sm font-medium border border-secondary-container">
                          {viewingProposal.techStack || "Modern Stack"}
                        </span>
                      )}
                </div>
              </div>

              {viewingProposal.features && viewingProposal.features.length > 0 && (
                <div>
                  <span className="font-label-caps text-[11px] font-semibold tracking-wider uppercase text-on-surface-variant block mb-2">
                    Key Features & Scope
                  </span>
                  <ul className="list-disc pl-5 space-y-1.5 text-[15px] text-on-surface/80">
                    {viewingProposal.features.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {viewingProposal.team && viewingProposal.team.length > 0 && (
                <div>
                  <span className="font-label-caps text-[11px] font-semibold tracking-wider uppercase text-on-surface-variant block mb-2">
                    Proposed Team
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewingProposal.team.map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/30 bg-surface"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{m.name}</div>
                          <div className="text-xs text-on-surface-variant">
                            {m.role}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-8 pt-6 border-t border-outline-variant/30 flex justify-end">
              <button
                onClick={() => setViewingProposal(null)}
                className="px-6 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Proposal Card Component ─────────────────────────────────────────────────
function ProposalCard({ prop, downloadingPdfId, loadingPocId, onViewPoc, onDownload, onApprove, Spinner }) {
  const isApproved = prop.status === "Approved" || prop.status === "Completed";
  const isDownloading = downloadingPdfId === prop.id;
  const isLoadingPoc = loadingPocId === prop.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white border border-neutral-200/80 rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300 flex flex-col gap-4"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-0.5 rounded-full font-label-caps text-[10px] font-bold uppercase tracking-wider ${
                prop.proposalType?.toUpperCase() === "MVP"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-primary-container/40 text-primary border border-primary-container"
              }`}
            >
              {prop.proposalType || "Proposal"}
            </span>
            {isApproved && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-label-caps text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle size={10} />
                Approved
              </span>
            )}
          </div>
          <h4 className="font-semibold text-navy-accent text-[15px] leading-tight truncate">
            {prop.projectName}
          </h4>
        </div>
        <span className="font-bold text-primary text-lg whitespace-nowrap">
          ${Number(prop.budget || 0).toLocaleString()}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-neutral-500 font-medium">
        <span>{prop.timeline}</span>
        {prop.techStack && prop.techStack.length > 0 && (
          <>
            <span className="text-neutral-300">•</span>
            <span className="truncate max-w-[240px]">
              {prop.techStack.slice(0, 4).join(", ")}
              {prop.techStack.length > 4 && ` +${prop.techStack.length - 4}`}
            </span>
          </>
        )}
      </div>

      {/* Actions row */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-neutral-100">
        {/* View POC */}
        <button
          onClick={() => onViewPoc(prop)}
          disabled={isLoadingPoc}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            isLoadingPoc
              ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          }`}
          title="View POC (MVP & Full)"
        >
          {isLoadingPoc ? (
            <>
              <Spinner className="h-3 w-3" />
              Loading...
            </>
          ) : (
            <>
              <Eye size={13} />
              View POC
            </>
          )}
        </button>

        {/* Download PDF */}
        <button
          onClick={() => onDownload(prop.id, prop.projectName)}
          disabled={isDownloading}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            isDownloading
              ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
              : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
          }`}
          title="Download PDF"
        >
          {isDownloading ? (
            <>
              <Spinner className="h-3 w-3" />
              Generating...
            </>
          ) : (
            <>
              <FileDown size={13} />
              Download PDF
            </>
          )}
        </button>

        {/* Approve */}
        {!isApproved && (
          <button
            onClick={() => onApprove(prop.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 text-xs font-semibold transition-colors ml-auto"
            title="Approve Proposal"
          >
            <CheckCircle size={13} />
            Approve
          </button>
        )}
        {isApproved && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 text-green-600 border border-green-100 text-xs font-semibold ml-auto">
            <CheckCircle size={13} />
            Approved
          </span>
        )}
      </div>
    </motion.div>
  );
}
