import { useState } from 'react';
import { PlusCircle, Send, Trash2, Eye, Filter, RefreshCw, X, Mic } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import FloatingBackground from '../components/common/FloatingBackground';
import AnimatedCard from '../components/common/AnimatedCard';

export default function ClientPortal() {
  const { activeProposal, projectData, resetStore, setActiveStep, updateProjectData } = useAppStore();

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
    setActiveStep(0); // Restart journey
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { sender: "user", text: chatInput };
    setChatLog(prev => [...prev, userMsg]);
    setChatInput("");

    setTimeout(() => {
      setChatLog(prev => [...prev, {
        sender: "ai",
        text: `Scoping updated. Adjusting metadata criteria for: "${userMsg.text}".`
      }]);
    }, 1000);
  };

  const toggleVoiceRecording = () => {
    setIsRecordingVoice(!isRecordingVoice);
    if (!isRecordingVoice) {
      setTimeout(() => {
        setChatLog(prev => [...prev, {
          sender: "user",
          text: "Integrated dynamic billing engine with multi-currency subscriptions."
        }]);
        setIsRecordingVoice(false);
      }, 3000);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-73px)] py-12 px-4">
      <FloatingBackground />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        
        {/* Editorial Wise Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-neutral-200/60">
          <div>
            <h2 className="text-3xl md:text-5xl font-black font-display text-neutral-900 tracking-tight leading-none">
              Client Workspace Dashboard
            </h2>
            <p className="text-sm text-neutral-500 mt-1 font-medium">Create project requirements, manage generated drafts, and negotiate with our AI broker.</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-brand-500 text-white font-semibold text-xs hover:bg-brand-600 shadow-md transition-all duration-200"
            >
              <PlusCircle size={14} className="mr-1.5" />
              New Proposal Request
            </button>
            <button
              onClick={handleRestart}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-neutral-950 text-white font-semibold text-xs hover:bg-neutral-800 shadow-md transition-all duration-200"
            >
              Restart Intake Wizard
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex space-x-1.5 border border-neutral-200 bg-neutral-50 p-1.5 rounded-2xl text-xs font-semibold w-fit">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl transition-all duration-200 ${
              activeTab === "overview" ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 rounded-xl transition-all duration-200 ${
              activeTab === "requests" ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Proposal Requests
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2 rounded-xl transition-all duration-200 ${
              activeTab === "chat" ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            AI Assistant Chat
          </button>
        </div>

        {/* 1. OVERVIEW VIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Overview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnimatedCard className="p-6">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Active Requests</span>
                <span className="text-3xl font-extrabold text-neutral-900 mt-1 block">3</span>
                <p className="text-[10px] text-neutral-400 mt-2 font-medium">Scoping verified via voice</p>
              </AnimatedCard>

              <AnimatedCard className="p-6">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Pending Proposals</span>
                <span className="text-3xl font-extrabold text-neutral-900 mt-1 block">2</span>
                <p className="text-[10px] text-neutral-400 mt-2 font-medium">Under broker review</p>
              </AnimatedCard>

              <AnimatedCard className="p-6">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Approved Proposals</span>
                <span className="text-3xl font-extrabold text-brand-600 mt-1 block">1</span>
                <p className="text-[10px] text-neutral-400 mt-2 font-medium">Contract locked & signed</p>
              </AnimatedCard>

              <AnimatedCard className="p-6">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">Total Estimated Budget</span>
                <span className="text-3xl font-extrabold text-neutral-900 mt-1 block">$205,000</span>
                <p className="text-[10px] text-neutral-400 mt-2 font-medium">Consolidated project cost</p>
              </AnimatedCard>
            </div>

            {/* Dynamic Status Timeline & Recent Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Timeline */}
              <div className="lg:col-span-6 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft space-y-6">
                <h3 className="text-sm font-bold text-neutral-800 tracking-tight pb-3 border-b border-neutral-100 font-display">
                  Active Build Status Tracker
                </h3>
                
                <div className="relative pl-6 border-l border-neutral-100 space-y-6">
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-brand-500 ring-4 ring-brand-100" />
                    <span className="text-[9px] uppercase font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">Active Phase</span>
                    <h4 className="text-sm font-bold text-neutral-800 mt-1">1. Intake Modeling & Discovery</h4>
                    <p className="text-xs text-neutral-500 mt-0.5">Specifications extracted: {projectData.name || "Zenith Retail Portal"}</p>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-brand-500 ring-4 ring-brand-100" />
                    <span className="text-[9px] uppercase font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">Completed</span>
                    <h4 className="text-sm font-bold text-neutral-800 mt-1">2. Proposal Negotiation & Balancing</h4>
                    <p className="text-xs text-neutral-500 mt-0.5">Budget holds at ${activeProposal.budget.toLocaleString()} for {activeProposal.timeline}</p>
                  </div>
                </div>
              </div>

              {/* Proposals Review Section */}
              <div className="lg:col-span-6 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft space-y-4">
                <h3 className="text-sm font-bold text-neutral-800 tracking-tight pb-3 border-b border-neutral-100 font-display">
                  Your Proposals Directory
                </h3>
                <div className="space-y-3">
                  {adminProposals.map((prop) => (
                    <div key={prop.id} className="p-4 bg-neutral-50 border border-neutral-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-bold text-neutral-900 block">{prop.projectName}</span>
                          <span className="text-[10px] text-neutral-500 font-medium">{prop.timeline} • {prop.techStack.join(', ')}</span>
                        </div>
                        <span className="text-xs font-bold text-brand-600">${prop.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-neutral-200/60 text-[10px] font-bold">
                        <span className={`px-2 py-0.5 rounded ${prop.status === 'Approved' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                          {prop.status}
                        </span>
                        <div className="space-x-2">
                          <button
                            onClick={() => alert(`Reviewing proposal: ${prop.projectName}`)}
                            className="text-brand-600 hover:underline"
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
                <h3 className="text-lg font-bold text-neutral-800 tracking-tight">Your Proposal Requests</h3>
                <div className="flex items-center space-x-2 text-xs">
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

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 text-neutral-400 font-bold uppercase tracking-wider">
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
                          <td className="py-4 font-bold text-neutral-800">{req.name}</td>
                          <td className="py-4 text-neutral-500 font-medium">{req.domain}</td>
                          <td className="py-4 font-bold text-neutral-900">${req.budget.toLocaleString()}</td>
                          <td className="py-4 text-neutral-500 font-medium">{req.timeline}</td>
                          <td className="py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              req.status === "Approved" ? "bg-brand-50 text-brand-600 border border-brand-100" : "bg-neutral-100 text-neutral-500"
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
                                setActiveStep(4); // Switch to evolve comparison
                              }}
                              className="p-1.5 rounded bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
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
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Chat History & Blueprints</h4>
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
                    <span className="text-xs font-bold text-neutral-800 block">{req.name}</span>
                    <span className="text-[10px] text-neutral-400 mt-0.5 block">{req.domain} • ${req.budget.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Box */}
            <div className="lg:col-span-8 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft flex flex-col justify-between min-h-[450px]">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <span className="text-xs font-bold text-neutral-800">Scoping Assistant Chat</span>
                <span className="text-[9px] uppercase font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">AI Broker Engine Online</span>
              </div>

              {/* Messages feed */}
              <div className="flex-1 overflow-y-auto my-4 space-y-4 max-h-[250px]">
                {chatLog.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user' ? 'bg-neutral-900 text-white rounded-tr-none' : 'bg-neutral-50 text-neutral-800 border border-neutral-100 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons & form input */}
              <div className="space-y-4 pt-3 border-t border-neutral-100">
                {isRecordingVoice && (
                  <div className="flex items-center justify-center space-x-2 text-xs text-brand-600 font-bold bg-brand-50 py-2 rounded-xl animate-pulse">
                    <Mic size={14} className="animate-bounce" />
                    <span>Listening to your voice inputs... Click Stop to finish.</span>
                  </div>
                )}
                
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2 bg-neutral-50 border border-neutral-200 rounded-xl p-1">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Refine proposal parameters here..."
                    className="flex-1 bg-transparent py-2.5 px-3 text-xs outline-none text-neutral-800"
                  />
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={`p-2.5 rounded-lg transition-colors ${isRecordingVoice ? 'bg-red-500 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                  >
                    <Mic size={14} />
                  </button>
                  <button
                    type="submit"
                    className="p-2.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
          <div className="bg-white border border-neutral-200 rounded-3xl p-8 w-full max-w-xl shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-neutral-50 text-neutral-400"
            >
              <X size={16} />
            </button>
            <h3 className="text-xl font-bold text-neutral-950 font-display mb-6">Create Scoping Request</h3>

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs font-semibold text-neutral-700">
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="e.g. Zenith Retail Portal"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Business Domain</label>
                <input
                  type="text"
                  required
                  value={newProjDomain}
                  onChange={(e) => setNewProjDomain(e.target.value)}
                  placeholder="e.g. E-Commerce"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Project Description</label>
                <textarea
                  required
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Describe target features..."
                  rows={3}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Budget ($)</label>
                  <input
                    type="number"
                    required
                    value={newProjBudget}
                    onChange={(e) => setNewProjBudget(e.target.value)}
                    placeholder="e.g. 75000"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Timeline</label>
                  <input
                    type="text"
                    required
                    value={newProjTimeline}
                    onChange={(e) => setNewProjTimeline(e.target.value)}
                    placeholder="e.g. 12 Weeks"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Preferred Technology</label>
                  <input
                    type="text"
                    value={newProjTech}
                    onChange={(e) => setNewProjTech(e.target.value)}
                    placeholder="React, Node.js"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Communication Type</label>
                  <select
                    value={newProjComm}
                    onChange={(e) => setNewProjComm(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-brand-500"
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
                  className="flex-1 py-3 rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
          <div className="bg-white border border-neutral-200 rounded-3xl p-8 w-full max-w-xl shadow-xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-neutral-50 text-neutral-400"
            >
              <X size={16} />
            </button>
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Request Information</span>
            <h3 className="text-xl font-bold font-display text-neutral-950 mt-1">{selectedRequest.name}</h3>

            <div className="mt-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-100">
                <div>
                  <span className="text-neutral-400 block font-bold uppercase text-[9px]">Business Domain</span>
                  <span className="text-neutral-800 font-semibold">{selectedRequest.domain}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block font-bold uppercase text-[9px]">Target Budget</span>
                  <span className="text-neutral-800 font-semibold">${selectedRequest.budget.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className="text-neutral-400 block font-bold uppercase text-[9px] mb-1">Description</span>
                <p className="text-neutral-600 leading-relaxed bg-neutral-50 p-3 rounded-xl border border-neutral-100">{selectedRequest.desc}</p>
              </div>

              {selectedRequest.transcript && (
                <div>
                  <span className="text-neutral-400 block font-bold uppercase text-[9px] mb-1">Transcript & Extracted JSON</span>
                  <pre className="text-[10px] text-brand-600 bg-brand-50/50 p-3 rounded-xl border border-brand-100/50 overflow-x-auto font-mono">
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
