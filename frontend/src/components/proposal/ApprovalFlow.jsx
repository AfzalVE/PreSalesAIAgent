import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, CheckCircle2, FileText, FileCode, Layers, Cpu, Code2, Database, ShieldAlert, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function ApprovalFlow() {
  const { activeProposal, projectData } = useAppStore();
  const [downloading, setDownloading] = useState(null);
  
  // POC Tabs: "architecture" | "modules" | "apis" | "database" | "deployment"
  const [activePocTab, setActivePocTab] = useState("architecture");

  const triggerDownload = (type) => {
    setDownloading(type);
    setTimeout(() => {
      setDownloading(null);
      if (type === "Proposal Document") {
        const dummyContent = `Pre-Sales Platform Proposal\n========================\nProject: ${projectData.name || "Zenith Retail Portal"}\nDomain: ${projectData.domain || "E-Commerce"}\nBudget: $${(activeProposal.budget || 0).toLocaleString()}\nTimeline: ${activeProposal.timeline || "12 Weeks"}\nTeam Size: ${(activeProposal.team || []).length} Engineers\n\nScope Description:\n${activeProposal.description || "Core requirements implementation."}\n\nFeatures:\n${(activeProposal.features || []).map(f => `- ${typeof f === 'object' ? f.name : f}`).join("\n")}`;
        const blob = new Blob([dummyContent], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `Proposal_${(projectData.name || "Project").replace(/\s+/g, "_")}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const dummyPoc = `// Pre-Sales Platform Generated POC Codebase\n// Project: ${projectData.name || "Zenith Retail Portal"}\n\nexport const config = {\n  domain: "${projectData.domain || "E-Commerce"}",\n  techStack: ${JSON.stringify(activeProposal.architecture?.services || ["React", "Node.js"])},\n  database: "${activeProposal.architecture?.databases?.[0] || "PostgreSQL"}"\n};`;
        const blob = new Blob([dummyPoc], { type: "text/javascript" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `POC_${(projectData.name || "Project").replace(/\s+/g, "_")}.js`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }, 800);
  };


  // Mock employee values derived for Resource Allocation
  const allocatedResources = (activeProposal.team || []).map((t, idx) => ({
    name: t.name || "",
    role: t.role || "Developer",
    hours: idx === 0 ? 40 : idx === 1 ? 35 : 20,
    duration: activeProposal.timeline || "12 Weeks",
    cost: (idx === 0 ? 95 : idx === 1 ? 75 : 65) * (idx === 0 ? 40 : idx === 1 ? 35 : 20)
  }));

  const totalHours = allocatedResources.reduce((sum, r) => sum + r.hours, 0);
  const totalAllocatedCost = allocatedResources.reduce((sum, r) => sum + r.cost, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      
      {/* Celebration Header */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-4"
      >
        <div className="w-16 h-16 rounded-full bg-brand-50 mx-auto flex items-center justify-center text-brand-500 shadow-sm border border-brand-100/50">
          <CheckCircle2 size={32} className="text-brand-500" />
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-neutral-900 leading-none">
          Congratulations! Your Blueprint is Active.
        </h2>
        <p className="text-sm text-neutral-500 max-w-xl mx-auto leading-relaxed font-medium">
          The technical architecture, team configurations, and timeline schedules have been validated and approved. Access your final POC files and allocations below.
        </p>
      </motion.div>

      {/* 1. Final Proposal Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Approved specs card */}
        <div className="lg:col-span-8 bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
              <div className="flex items-center space-x-2">
                <FileText size={16} className="text-brand-500" />
                <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Final Proposal Package Summary</h4>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-brand-50 text-brand-600 text-[10px] font-bold">
                <Sparkles size={10} className="mr-1" />
                AI Generated
              </span>
            </div>

            <div className="space-y-4 text-xs font-semibold text-neutral-600">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-neutral-400 block uppercase text-[9px] font-bold">Project Name</span>
                  <span className="text-neutral-800 font-bold text-sm block">{projectData.name || "Zenith Retail Portal"}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block uppercase text-[9px] font-bold">Final Cost / Est</span>
                  <span className="text-brand-600 font-extrabold text-sm block">${activeProposal.budget.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-neutral-400 block uppercase text-[9px] font-bold">Project Timeline</span>
                  <span className="text-neutral-800 font-bold text-sm block">{activeProposal.timeline}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block uppercase text-[9px] font-bold">Approval Date</span>
                  <span className="text-neutral-800 font-bold text-sm block">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              <div>
                <span className="text-neutral-400 block uppercase text-[9px] font-bold mb-2">Scope Checklist</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(activeProposal.features || []).map((f, idx) => {
                    const isObj = typeof f === 'object' && f !== null;
                    const name = isObj ? f.name : f;
                    const isActive = isObj ? f.status === "active" : true;
                    return (
                      <div key={idx} className="flex items-center space-x-1.5 p-2 bg-neutral-50 rounded-xl border border-neutral-100">
                        <CheckCircle2 size={12} className={isActive ? "text-brand-500" : "text-neutral-300"} />
                        <span className={`text-[10px] truncate ${isActive ? "text-neutral-800" : "text-neutral-400 line-through"}`}>{name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-[11px] font-bold text-neutral-400">
            <span>System Status: Signed & Verified</span>
            <span className="text-brand-600">Contract Version v1.0.0</span>
          </div>
        </div>

        {/* Action triggers card */}
        <div className="lg:col-span-4 bg-neutral-900 text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-400/10 rounded-full blur-xl pointer-events-none" />

          <div>
            <h4 className="text-xs font-semibold text-white/95 uppercase tracking-wider mb-4">Delivery Deliverables</h4>
            
            <div className="space-y-3">
              <button 
                onClick={() => triggerDownload("Proposal Document")}
                disabled={downloading !== null}
                className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-between border border-white/5 disabled:opacity-50"
              >
                <span className="flex items-center">
                  <FileText size={14} className="mr-2 text-brand-400" />
                  {downloading === "Proposal Document" ? "Generating..." : (activeProposal.docx_url ? "Download Proposal DOCX" : "Download Proposal PDF")}

                </span>
                <Download size={14} />
              </button>

              <button 
                onClick={() => triggerDownload("Proof-of-Concept")}
                disabled={downloading !== null}
                className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-between border border-white/5 disabled:opacity-50"
              >
                <span className="flex items-center">
                  <FileCode size={14} className="mr-2 text-brand-400" />
                  {downloading === "Proof-of-Concept" ? "Creating sandbox..." : "View POC Codebase"}
                </span>
                <Download size={14} />
              </button>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <button 
              onClick={() => alert("Connecting with Proflo Delivery Team...")}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200/80 text-xs font-bold flex items-center justify-center transition-colors shadow-sm"
            >
              Contact Team
            </button>
            <button 
              onClick={() => alert("Redirecting to meeting scheduler...")}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-bold flex items-center justify-center transition-colors shadow-md"
            >
              <Calendar size={14} className="mr-1.5" />
              Schedule Kickoff Call
            </button>
          </div>
        </div>
      </div>

      {/* 2. POC Document Viewer Tabbed Layout */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-soft space-y-6">
        <div>
          <h3 className="text-sm font-bold text-neutral-800 tracking-tight">Simulated Proof-of-Concept Viewer</h3>
          <p className="text-xs text-neutral-400 mt-0.5">Mock architecture sandbox, DB schema structures, and API specs.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center overflow-x-auto whitespace-nowrap scrollbar-none gap-2 border-b border-neutral-100 pb-3 text-xs font-semibold text-neutral-400 max-w-full">
          {[
            { id: "architecture", label: "Architecture", icon: Layers },
            { id: "modules", label: "Modules", icon: Cpu },
            { id: "apis", label: "APIs Spec", icon: Code2 },
            { id: "database", label: "Database Design", icon: Database },
            { id: "deployment", label: "Deployment Plan", icon: ShieldAlert }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activePocTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActivePocTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl transition-all duration-200 ${
                  isSelected ? 'bg-neutral-900 text-white shadow-sm' : 'hover:bg-neutral-50 hover:text-neutral-700'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab display */}
        <div className="text-xs">
          {activePocTab === "architecture" && (
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">System Topologies Diagram</span>
              <div className="bg-neutral-50 border border-neutral-200/60 rounded-2xl p-6 flex flex-col items-center justify-center text-neutral-400">
                {/* SVG diagram placeholder styled cleanly */}
                <svg className="w-full max-w-md h-36" viewBox="0 0 400 150">
                  <rect x="10" y="50" width="100" height="50" rx="10" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="2" />
                  <text x="60" y="80" textAnchor="middle" fill="#3f3f46" fontWeight="bold" fontSize="10">Web Client</text>
                  
                  <line x1="110" y1="75" x2="160" y2="75" stroke="#a1a1aa" strokeWidth="2" strokeDasharray="4" />
                  
                  <rect x="160" y="30" width="100" height="90" rx="10" fill="#0d9488" fillOpacity="0.05" stroke="#0d9488" strokeWidth="2" />
                  <text x="210" y="65" textAnchor="middle" fill="#0f766e" fontWeight="bold" fontSize="10">API Gateway</text>
                  <text x="210" y="85" textAnchor="middle" fill="#71717a" fontSize="9">Scoping Router</text>

                  <line x1="260" y1="75" x2="310" y2="75" stroke="#a1a1aa" strokeWidth="2" strokeDasharray="4" />

                  <rect x="310" y="50" width="80" height="50" rx="10" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="2" />
                  <text x="350" y="80" textAnchor="middle" fill="#3f3f46" fontWeight="bold" fontSize="10">Postgres</text>
                </svg>
                <span className="text-[10px] font-bold text-neutral-500 mt-2">Dynamic Kong Gateway Failover Topologies</span>
              </div>
            </div>
          )}

          {activePocTab === "modules" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-2xl space-y-2">
                <span className="font-bold text-neutral-800 block">auth-guard-v1</span>
                <p className="text-[11px] text-neutral-500 leading-relaxed">OAuth2 authorization middleware pipelines with built-in telemetry auditing.</p>
              </div>
              <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-2xl space-y-2">
                <span className="font-bold text-neutral-800 block">recommend-engine-v2</span>
                <p className="text-[11px] text-neutral-500 leading-relaxed">Pinecone semantic index mapping for vector recommendation queries.</p>
              </div>
              <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-2xl space-y-2">
                <span className="font-bold text-neutral-800 block">billing-worker-v1</span>
                <p className="text-[11px] text-neutral-500 leading-relaxed">Stripe Webhooks event consumers for transaction accounting.</p>
              </div>
            </div>
          )}

          {activePocTab === "apis" && (
            <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 font-bold uppercase tracking-wider">
                    <th className="py-3">Method</th>
                    <th className="py-3">Path</th>
                    <th className="py-3">Description</th>
                    <th className="py-3">Auth Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-600">
                  <tr>
                    <td className="py-3"><span className="px-2 py-0.5 rounded bg-green-50 text-green-700 font-bold uppercase text-[9px]">POST</span></td>
                    <td className="py-3 font-mono text-neutral-800">/api/v1/auth/login</td>
                    <td className="py-3">User session token authentication.</td>
                    <td className="py-3">No</td>
                  </tr>
                  <tr>
                    <td className="py-3"><span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold uppercase text-[9px]">GET</span></td>
                    <td className="py-3 font-mono text-neutral-800">/api/v1/recommend/size</td>
                    <td className="py-3">Retrieve clothing recommendations.</td>
                    <td className="py-3">Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activePocTab === "database" && (
            <div className="bg-neutral-50 border border-neutral-200/60 rounded-2xl p-6 text-center space-y-4">
              <span className="font-bold text-neutral-800 block">Entity-Relationship Schema Diagram</span>
              <div className="max-w-md mx-auto p-4 bg-white border border-neutral-200 rounded-xl shadow-sm text-left font-mono text-[10px] text-neutral-600 space-y-2">
                <div><span className="text-blue-600">TABLE</span> users &#123; id UUID [PK], email VARCHAR, status VARCHAR &#125;</div>
                <div><span className="text-blue-600">TABLE</span> proposals &#123; id UUID [PK], user_id UUID [FK], cost INTEGER &#125;</div>
              </div>
            </div>
          )}

          {activePocTab === "deployment" && (
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">AWS Orchestration Flow</span>
              <div className="flex flex-col sm:flex-row items-center gap-2 font-semibold text-neutral-600">
                <div className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200">Github Commit</div>
                <div className="text-neutral-300">➔</div>
                <div className="px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200">Lint & Build Action</div>
                <div className="text-neutral-300">➔</div>
                <div className="px-3 py-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-600">Push to AWS Fargate</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Resource Allocation Details Table */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-soft space-y-4">
        <div>
          <h3 className="text-sm font-bold text-neutral-800 tracking-tight">Consolidated Team Resource Allocations</h3>
          <p className="text-xs text-neutral-400 mt-0.5">Assigned employees, billing rates, and effort logs.</p>
        </div>

        <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-left border-collapse text-xs min-w-[550px]">
            <thead>
              <tr className="border-b border-neutral-100 text-neutral-400 font-bold uppercase tracking-wider">
                <th className="py-4">Employee</th>
                <th className="py-4">Role</th>
                <th className="py-4">Allocated Hours / Wk</th>
                <th className="py-4">Duration</th>
                <th className="py-4 text-right">Estimated Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700 font-medium">
              {allocatedResources.map((res, idx) => (
                <tr key={idx}>
                  <td className="py-4 font-bold text-neutral-800">{res.name}</td>
                  <td className="py-4 text-neutral-500">{res.role}</td>
                  <td className="py-4">{res.hours} hrs</td>
                  <td className="py-4 text-neutral-500">{res.duration}</td>
                  <td className="py-4 text-right font-bold">${res.cost.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-neutral-50/50 font-bold text-neutral-900 border-t border-neutral-200">
                <td className="py-4 pl-4" colSpan={2}>Total Resource Aggregates</td>
                <td className="py-4">{totalHours} Hours Total</td>
                <td className="py-4"></td>
                <td className="py-4 text-right pr-4 text-brand-600">${totalAllocatedCost.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
