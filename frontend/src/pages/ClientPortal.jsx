import { useState, useEffect } from 'react';
import { PlusCircle, Send, Trash2, Eye, Filter, RefreshCw, X, Mic, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import FloatingBackground from '../components/common/FloatingBackground';
import AnimatedCard from '../components/common/AnimatedCard';

export default function ClientPortal() {
  const { activeProposal, projectData, resetStore, updateProjectData } = useAppStore();
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

  // Filtering states for requests list
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRequest, setSelectedRequest] = useState(null);

  // AI Chat simulation inside dashboard
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState([
    { sender: "ai", text: "Welcome to the real-time scoping assistant. Feel free to refine your requirements here." }
  ]);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatRequestId, setChatRequestId] = useState(null);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(prev => (prev + " " + transcript).trim());
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

  // Mock list of client's proposal requests
  const [requestsList, setRequestsList] = useState([
    {
      id: "req-1",
      name: "Zenith Retail Portal",
      domain: "E-Commerce",
      budget: 85000,
      timeline: "12 Weeks",
      status: "Approved",
      createdDate: "14 Jul 2026",
      tech: "React, Node.js, PostgreSQL",
      desc: "Premium boutique storefront with AI sizing recommendations.",
      transcript: "User: We want a high end retail storefront... System: Extracting sizing recommendations..."
    },
    {
      id: "req-2",
      name: "Fintech Vault Dashboard",
      domain: "Finance",
      budget: 120000,
      timeline: "16 Weeks",
      status: "Draft",
      createdDate: "15 Jul 2026",
      tech: "Next.js, Go, Redis",
      desc: "Secure vault dashboard for corporate accounts.",
      transcript: ""
    }
  ]);

  const { adminProposals } = useAppStore(); // Load existing admin-curated proposals for review


  const handleRestart = () => {
    resetStore();
    navigate('/'); // Restart journey
  };

  const handleLogout = () => {
    if (resetStore) resetStore();
    navigate('/');
  };

  const handleCreateRequest = (e) => {
    e.preventDefault();
    const newReq = {
      id: `req-${Date.now()}`,
      name: newProjName,
      domain: newProjDomain,
      budget: parseInt(newProjBudget, 10) || 50000,
      timeline: newProjTimeline || "10 Weeks",
      status: "Draft",
      createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      tech: newProjTech,
      desc: newProjDesc,
      transcript: "Manual request entry."
    };

    setRequestsList([newReq, ...requestsList]);
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

  const handleDeleteRequest = (id) => {
    setRequestsList(requestsList.filter(r => r.id !== id));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userText = chatInput.trim();
    const userMsg = { sender: "user", text: userText };
    setChatLog(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const payload = { text: userText };
      if (chatRequestId) {
        payload.request_id = chatRequestId;
      }

      const res = await fetch("http://127.0.0.1:8000/api/v1/ai-agent/extract-requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.request_id) {
        setChatRequestId(data.request_id);
      }

      let reply = "I've extracted your requirements and updated the project scope.";
      if (data.follow_up_message) {
        reply = data.follow_up_message;
      }

      setChatLog(prev => [...prev, { sender: "ai", text: reply }]);

      updateProjectData({
        name: data.project_name || projectData.name,
        budget: data.client_budget || projectData.budget,
        timeline: data.timeline_weeks ? `${data.timeline_weeks} Weeks` : projectData.timeline
      });

    } catch (err) {
      setChatLog(prev => [...prev, { sender: "ai", text: "Error connecting to AI service." }]);
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
              <p className="font-body-md text-base text-on-surface-variant mt-1">Create project requirements, manage generated drafts, and negotiate with our AI broker.</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 sm:gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl bg-primary-container text-navy-accent font-button-text text-xs sm:text-sm font-semibold hover:shadow-md transition-all duration-200 cursor-pointer flex-1 sm:flex-initial justify-center"
            >
              <PlusCircle size={14} className="mr-1.5 flex-shrink-0" />
              <span>New Proposal Request</span>
            </button>
            <button
              onClick={handleRestart}
              className="inline-flex items-center px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl bg-navy-accent text-white font-button-text text-xs sm:text-sm font-semibold hover:bg-navy-accent/90 shadow-md transition-all duration-200 cursor-pointer flex-1 sm:flex-initial justify-center"
            >
              <span>Restart Intake Wizard</span>
            </button>
            <button
              onClick={handleLogout}
              title="Sign out of Client Portal"
              className="inline-flex items-center justify-center px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl bg-red-50 text-red-600 font-button-text text-xs sm:text-sm font-semibold hover:bg-red-100 hover:text-red-700 border border-red-200/60 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer gap-1.5 w-full sm:w-auto"
            >
              <LogOut size={14} className="text-red-500 flex-shrink-0" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs & Inline Logout */}
        <div className="flex items-center overflow-x-auto whitespace-nowrap scrollbar-none w-full 2xl:w-auto gap-1 border border-neutral-200/80 bg-neutral-100/70 p-1.5 rounded-2xl font-button-text text-xs sm:text-sm font-medium self-start shadow-inner relative z-10 backdrop-blur-sm max-w-full">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0 ${activeTab === "overview" ? 'bg-white text-neutral-900 shadow-sm font-bold' : 'text-neutral-500 hover:text-neutral-900'
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0 ${activeTab === "requests" ? 'bg-white text-neutral-900 shadow-sm font-bold' : 'text-neutral-500 hover:text-neutral-900'
              }`}
          >
            Proposal Requests
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0 ${activeTab === "chat" ? 'bg-white text-neutral-900 shadow-sm font-bold' : 'text-neutral-500 hover:text-neutral-900'
              }`}
          >
            AI Assistant Chat
          </button>

          {/* Logout Option Inline exactly matching Admin / Super Admin portals */}
          <button
            onClick={handleLogout}
            title="Sign out of Client Portal"
            className="relative px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-bold transition-all duration-200 text-red-600 hover:bg-red-100/80 hover:text-red-700 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap flex-shrink-0 ml-auto"
          >
            <LogOut size={14} className="text-red-500 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>

        {/* 1. OVERVIEW VIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Overview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnimatedCard className="p-6">
                <span className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block">Active Requests</span>
                <span className="font-display-lg text-3xl font-semibold text-navy-accent mt-1 block">3</span>
                <p className="font-body-md text-sm text-on-surface-variant mt-2">Scoping verified via voice</p>
              </AnimatedCard>

              <AnimatedCard className="p-6">
                <span className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block">Pending Proposals</span>
                <span className="font-display-lg text-3xl font-semibold text-navy-accent mt-1 block">2</span>
                <p className="font-body-md text-sm text-on-surface-variant mt-2">Under broker review</p>
              </AnimatedCard>

              <AnimatedCard className="p-6">
                <span className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block">Approved Proposals</span>
                <span className="font-display-lg text-3xl font-semibold text-primary mt-1 block">1</span>
                <p className="font-body-md text-sm text-on-surface-variant mt-2">Contract locked & signed</p>
              </AnimatedCard>

              <AnimatedCard className="p-6">
                <span className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block">Total Estimated Budget</span>
                <span className="font-display-lg text-3xl font-semibold text-navy-accent mt-1 block">$205,000</span>
                <p className="font-body-md text-sm text-on-surface-variant mt-2">Consolidated project cost</p>
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
                    <span className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-primary bg-primary-container/40 px-2 py-0.5 rounded">Active Phase</span>
                    <h4 className="font-body-md text-base font-semibold text-navy-accent mt-1">1. Intake Modeling & Discovery</h4>
                    <p className="font-body-md text-sm text-on-surface-variant mt-0.5">Specifications extracted: {projectData.name || "Zenith Retail Portal"}</p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-primary ring-4 ring-primary-container" />
                    <span className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant bg-neutral-100 px-2 py-0.5 rounded">Completed</span>
                    <h4 className="font-body-md text-base font-semibold text-navy-accent mt-1">2. Proposal Negotiation & Balancing</h4>
                    <p className="font-body-md text-sm text-on-surface-variant mt-0.5">Budget holds at ${activeProposal.budget.toLocaleString()} for {activeProposal.timeline}</p>
                  </div>
                </div>
              </div>

              {/* Proposals Review Section */}
              <div className="lg:col-span-6 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft space-y-4">
                <h3 className="font-headline-md text-lg font-semibold text-navy-accent pb-3 border-b border-neutral-100">
                  Your Proposals Directory
                </h3>
                <div className="space-y-3">
                  {adminProposals.map((prop) => (
                    <div key={prop.id} className="p-4 bg-neutral-50 border border-neutral-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-body-md text-sm font-semibold text-navy-accent block">{prop.projectName}</span>
                          <span className="font-body-md text-sm text-on-surface-variant">{prop.timeline} • {prop.techStack.join(', ')}</span>
                        </div>
                        <span className="font-body-md text-sm font-semibold text-primary">${prop.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-neutral-200/60 font-body-md text-sm font-semibold">
                        <span className={`px-2 py-0.5 rounded ${prop.status === 'Approved' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                          {prop.status}
                        </span>
                        <div className="space-x-2">
                          <button
                            onClick={() => alert(`Reviewing proposal: ${prop.projectName}`)}
                            className="text-primary hover:underline"
                          >
                            View Specs
                          </button>
                          <button
                            onClick={() => alert(`Downloading final package for ${prop.projectName}`)}
                            className="text-neutral-700 hover:underline"
                          >
                            Download PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
                <h3 className="font-headline-md text-lg font-semibold text-navy-accent">Your Proposal Requests</h3>
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
                      .filter(r => statusFilter === "All" || r.status === statusFilter)
                      .map((req) => (
                        <tr key={req.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-4 font-semibold text-navy-accent">{req.name}</td>
                          <td className="py-4 text-neutral-500 font-medium">{req.domain}</td>
                          <td className="py-4 font-semibold text-navy-accent">${req.budget.toLocaleString()}</td>
                          <td className="py-4 text-neutral-500 font-medium">{req.timeline}</td>
                          <td className="py-4">
                            <span className={`px-2.5 py-0.5 rounded-full font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] ${req.status === "Approved" ? "bg-primary-container/40 text-primary border border-primary-container" : "bg-neutral-100 text-neutral-500"
                              }`}>
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
                                navigate('/compare');
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
              <h4 className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">Chat History & Blueprints</h4>
              <div className="space-y-2">
                {requestsList.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => {
                      setChatLog(prev => [...prev, {
                        sender: "ai",
                        text: `Loaded details for: "${req.name}". Let's discuss scope items.`
                      }]);
                    }}
                    className="w-full p-3.5 rounded-xl border border-neutral-100 text-left hover:bg-neutral-50/50 transition-all duration-200"
                  >
                    <span className="font-body-md text-sm font-semibold text-navy-accent block">{req.name}</span>
                    <span className="font-body-md text-sm text-on-surface-variant mt-0.5 block">{req.domain} • ${req.budget.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Box */}
            <div className="lg:col-span-8 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft flex flex-col justify-between min-h-[450px]">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <span className="font-body-md text-base font-semibold text-navy-accent">Scoping Assistant Chat</span>
                <span className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-primary bg-primary-container/40 px-2 py-0.5 rounded">AI Broker Engine Online</span>
              </div>

              {/* Messages feed */}
              <div className="flex-1 overflow-y-auto my-4 space-y-4 max-h-[250px]">
                {chatLog.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl font-body-md text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-neutral-900 text-white rounded-tr-none' : 'bg-neutral-50 text-neutral-800 border border-neutral-100 rounded-tl-none'
                      }`}>
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
                    className={`p-2.5 rounded-xl transition-all duration-200 relative ${isRecordingVoice
                        ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-200'
                        : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                      }`}
                    title="Speak to Broker"
                  >
                    {isRecordingVoice && (
                      <span className="absolute inset-0 rounded-xl bg-red-400 opacity-50 animate-ping pointer-events-none" />
                    )}
                    <Mic size={14} className={isRecordingVoice ? 'text-white' : 'text-primary'} />
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
            <h3 className="font-headline-md text-xl font-semibold text-navy-accent mb-6">Create Scoping Request</h3>

            <form onSubmit={handleCreateRequest} className="space-y-4 font-body-md text-sm font-medium text-neutral-700">
              <div>
                <label className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block mb-1">Project Name</label>
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
                <label className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block mb-1">Business Domain</label>
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
                <label className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block mb-1">Project Description</label>
                <textarea
                  required
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Describe target features..."
                  rows={3}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block mb-1">Budget ($)</label>
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
                  <label className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block mb-1">Timeline</label>
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
                  <label className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block mb-1">Preferred Technology</label>
                  <input
                    type="text"
                    value={newProjTech}
                    onChange={(e) => setNewProjTech(e.target.value)}
                    placeholder="React, Node.js"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant block mb-1">Communication Type</label>
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
            <span className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant">Request Information</span>
            <h3 className="font-headline-md text-xl font-semibold text-navy-accent mt-1">{selectedRequest.name}</h3>

            <div className="mt-6 space-y-4 font-body-md text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-neutral-100">
                <div>
                  <span className="font-label-caps text-on-surface-variant block font-semibold uppercase text-[11px] tracking-[0.05em]">Business Domain</span>
                  <span className="text-neutral-800 font-semibold">{selectedRequest.domain}</span>
                </div>
                <div>
                  <span className="font-label-caps text-on-surface-variant block font-semibold uppercase text-[11px] tracking-[0.05em]">Target Budget</span>
                  <span className="text-neutral-800 font-semibold">${selectedRequest.budget.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className="font-label-caps text-on-surface-variant block font-semibold uppercase text-[11px] tracking-[0.05em] mb-1">Description</span>
                <p className="text-neutral-600 leading-relaxed bg-neutral-50 p-3 rounded-xl border border-neutral-100">{selectedRequest.desc}</p>
              </div>

              {selectedRequest.transcript && (
                <div>
                  <span className="font-label-caps text-on-surface-variant block font-semibold uppercase text-[11px] tracking-[0.05em] mb-1">Transcript & Extracted JSON</span>
                  <pre className="text-[13px] text-primary bg-primary-container/20 p-3 rounded-xl border border-primary-container/50 overflow-x-auto font-mono leading-relaxed">
                    {JSON.stringify({
                      projectName: selectedRequest.name,
                      domain: selectedRequest.domain,
                      preferredTech: selectedRequest.tech.split(", "),
                      estimatedBudget: selectedRequest.budget,
                      timeline: selectedRequest.timeline
                    }, null, 2)}
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
