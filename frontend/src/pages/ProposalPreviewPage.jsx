import { useEffect, useState } from "react";
import * as mammoth from "mammoth";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  Cpu,
  ShieldAlert,
  Sparkles,
  Clock3,
  DollarSign,
  Briefcase,
  FileText,
  ArrowRightLeft,
  Layers,
  Star,
  CheckCircle2,
  Package,
  ListChecks
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import FloatingBackground from "../components/common/FloatingBackground";
import { useAppStore } from "../store/useAppStore";

export default function ProposalPreviewPage() {
  const navigate = useNavigate();
  const { activeProposal, selectProposalFromBackend, user } = useAppStore();
  const [viewMode, setViewMode] = useState("mvp"); // 'mvp' or 'full'
  const [isGenerating, setIsGenerating] = useState(false);
  const [docHtml, setDocHtml] = useState(null);

  useEffect(() => {
    console.log("========== Proposal Response ==========");
    console.log(activeProposal);
    console.log("=======================================");
  }, [activeProposal]);

  const proposal = activeProposal?.[viewMode];

  const handleProceedToSign = async () => {
    const idToSelect = proposal?.id;
    if (!idToSelect) return;

    setIsGenerating(true);
    const res = await selectProposalFromBackend(idToSelect);

    if (res.success && res.docx_url && res.docx_url !== "#") {
      try {
        const token = user?.accessToken;
        const headers = token ? { "Authorization": `Bearer ${token}` } : {};
        const docRes = await fetch(`http://localhost:8000/api/v1/proposals/${idToSelect}/download`, { headers });
        if (docRes.ok) {
          const arrayBuffer = await docRes.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setDocHtml(result.value);
        }
      } catch (err) {
        console.error("Failed to render docx:", err);
      }
    }
    setIsGenerating(false);
  };

  const handleDownload = (e) => {
    e.preventDefault();
    const idToSelect = proposal?.id;
    if (!idToSelect) return;

    const token = user?.accessToken;
    // Direct browser navigation with token query param fallback
    window.location.href = `http://localhost:8000/api/v1/proposals/${idToSelect}/download${token ? `?token=${token}` : ""}`;
  };

  if (!activeProposal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-xl font-semibold text-neutral-600">
          No proposal generated yet.
        </h2>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-73px)] py-12 px-4">
      <FloatingBackground />

      <div className="max-w-6xl mx-auto relative z-10 space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/onboarding")}
              className="p-2 rounded-xl border bg-white hover:bg-neutral-50"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">
              Proposal Preview
            </span>
          </div>
        </div>

        {/* Page Heading */}
        <div className="text-center space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black text-neutral-900"
          >
            AI Generated Proposal
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-3xl mx-auto text-neutral-500 leading-7"
          >
            Review the details of your requested project, including our proposed technical solution,
            development roadmap, resource allocation, and budget requirements below.
          </motion.p>
        </div>

        {/* Toggle / Tabs */}
        <div className="flex justify-center -mt-2 mb-4">
          <div className="bg-white p-1.5 rounded-full border border-neutral-200 inline-flex shadow-sm">
            <button
              onClick={() => setViewMode("mvp")}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${viewMode === "mvp" ? "bg-primary text-white shadow-md" : "text-neutral-500 hover:text-neutral-900"
                }`}
            >
              Minimum Viable Product (MVP)
            </button>
            <button
              onClick={() => setViewMode("full")}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${viewMode === "full" ? "bg-primary text-white shadow-md" : "text-neutral-500 hover:text-neutral-900"
                }`}
            >
              Full Product Version
            </button>
          </div>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-8 space-y-10"
        >
          {/* ======================================================= */}
          {/* Project Information */}
          {/* ======================================================= */}
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary" size={20} />
              <h2 className="text-xl font-bold text-neutral-900">
                Project Overview
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl border bg-neutral-50 p-5">
                <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                  Project Name
                </p>
                <h3 className="mt-2 text-xl font-bold text-neutral-900">
                  {activeProposal.inferred_project_name}
                </h3>
              </div>
              <div className="rounded-2xl border bg-neutral-50 p-5">
                <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                  Business Domain
                </p>
                <h3 className="mt-2 text-xl font-bold text-neutral-900">
                  {activeProposal.inferred_business_domain}
                </h3>
              </div>
            </div>
            <div className="rounded-2xl border bg-neutral-50 p-5">
              <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold mb-3">
                Project Description
              </p>
              <p className="text-sm leading-7 text-neutral-700 whitespace-pre-line">
                {activeProposal.inferred_project_description}
              </p>
            </div>
          </div>

          {/* ======================================================= */}
          {/* Preferred Technology */}
          {/* ======================================================= */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Cpu className="text-primary" size={20} />
              <h2 className="text-xl font-bold">
                Preferred Technologies
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {(activeProposal.preferred_technology || []).map((technology, index) => (
                <span
                  key={index}
                  className="px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm"
                >
                  {technology}
                </span>
              ))}
            </div>
          </div>

          {/* ======================================================= */}
          {/* Budget & Timeline Grid */}
          {/* ======================================================= */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border p-6 bg-gradient-to-br from-primary/5 to-white">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="text-primary" size={20} />
                <span className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">
                  Estimated Budget
                </span>
              </div>
              <h2 className="text-3xl font-black text-primary">
                ${Number(proposal?.estimated_cost || activeProposal.budget || 0).toLocaleString()}
              </h2>
            </div>
            <div className="rounded-2xl border p-6 bg-gradient-to-br from-blue-50 to-white">
              <div className="flex items-center gap-2 mb-3">
                <Clock3 className="text-blue-600" size={20} />
                <span className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">
                  Estimated Timeline
                </span>
              </div>
              <h2 className="text-3xl font-black text-neutral-900">
                {proposal?.estimated_duration ?? activeProposal.timeline}
              </h2>
            </div>
            <div className="rounded-2xl border p-6 bg-gradient-to-br from-emerald-50 to-white">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="text-emerald-600" size={20} />
                <span className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">
                  Proposal Type
                </span>
              </div>
              <h2 className="text-3xl font-black text-neutral-900">
                {proposal?.proposal_type || viewMode.toUpperCase()}
              </h2>
            </div>
          </div>

          {/* ======================================================= */}
          {/* Executive Summary */}
          {/* ======================================================= */}
          {proposal?.executive_summary && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <FileText className="text-primary" size={20} />
                <h2 className="text-xl font-bold text-neutral-900">
                  Executive Summary
                </h2>
              </div>
              <div className="rounded-2xl border bg-neutral-50 p-6">
                <p className="text-sm leading-8 whitespace-pre-line text-neutral-700">
                  {proposal.executive_summary}
                </p>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* Proposed Scope */}
          {/* ======================================================= */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <FileText className="text-primary" size={20} />
              <h2 className="text-xl font-bold text-neutral-900">
                Proposed Solution & Scope
              </h2>
            </div>
            <div className="rounded-2xl border bg-neutral-50 p-6">
              <p className="text-sm leading-8 whitespace-pre-line text-neutral-700">
                {proposal?.scope}
              </p>
            </div>
          </div>

          {/* ======================================================= */}
          {/* Key Features */}
          {/* ======================================================= */}
          {proposal?.key_features && proposal.key_features.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Star className="text-primary" size={20} />
                <h2 className="text-xl font-bold text-neutral-900">
                  Key Features
                </h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {proposal.key_features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm">
                    <CheckCircle2 className="text-emerald-500 mt-1 flex-shrink-0" size={16} />
                    <span className="text-sm text-neutral-700 leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* Technology Stack */}
          {/* ======================================================= */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Cpu className="text-primary" size={20} />
              <h2 className="text-xl font-bold">
                Recommended Technology Stack
              </h2>
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
              {Object.entries(proposal?.tech_stack || {}).map(([layer, technology]) => (
                <motion.div
                  key={layer}
                  whileHover={{ y: -3 }}
                  className="rounded-2xl border bg-white p-5 shadow-sm"
                >
                  <p className="text-[11px] uppercase tracking-widest text-neutral-400 font-semibold">
                    {layer}
                  </p>
                  <h3 className="mt-3 text-lg font-bold text-neutral-900">
                    {technology}
                  </h3>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ======================================================= */}
          {/* Solution Architecture */}
          {/* ======================================================= */}
          {proposal?.architecture && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Layers className="text-primary" size={20} />
                <h2 className="text-xl font-bold text-neutral-900">
                  Solution Architecture
                </h2>
              </div>
              <div className="rounded-2xl border bg-neutral-50 p-6">
                <p className="text-sm leading-8 whitespace-pre-line text-neutral-700">
                  {proposal.architecture}
                </p>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* Development Timeline */}
          {/* ======================================================= */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Clock3 size={20} className="text-primary" />
              <h2 className="text-xl font-bold">
                Development Roadmap
              </h2>
            </div>
            <div className="space-y-4">
              {(proposal?.timeline_phases || []).map((phase, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -2 }}
                  className="rounded-2xl border bg-white shadow-sm p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900">
                        {phase.Phase}
                      </h3>
                      <p className="text-sm text-neutral-500 mt-1">
                        {phase.Duration}
                      </p>
                    </div>
                    <div className="px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      Phase {index + 1}
                    </div>
                  </div>
                  <div className="mt-5">
                    <p className="text-sm leading-7 text-neutral-700">
                      {phase.Output}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ======================================================= */}
          {/* Deliverables */}
          {/* ======================================================= */}
          {proposal?.deliverables && proposal.deliverables.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Package className="text-primary" size={20} />
                <h2 className="text-xl font-bold text-neutral-900">
                  Deliverables
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {proposal.deliverables.map((deliverable, index) => (
                  <span key={index} className="px-4 py-2 rounded-xl border bg-white text-sm text-neutral-700 shadow-sm">
                    {deliverable}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* Resource Requirements */}
          {/* ======================================================= */}
          {proposal?.resource_requirements && proposal.resource_requirements.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Briefcase size={20} className="text-primary" />
                <h2 className="text-xl font-bold">
                  Recommended Resource Allocation
                </h2>
              </div>
              <div className="grid lg:grid-cols-2 gap-5">
                {proposal.resource_requirements.map((resource, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ y: -2 }}
                    className="rounded-2xl border bg-white shadow-sm p-6"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-neutral-900">
                        {resource.role}
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {resource.count} Required
                      </span>
                    </div>
                    <div className="mt-5 space-y-3">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-neutral-400 font-semibold">
                          Minimum Experience
                        </p>
                        <p className="font-semibold text-neutral-800 mt-1">
                          {resource.minimum_experience} Years
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-neutral-400 font-semibold mb-2">
                          Required Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(resource.skills || []).map((skill, skillIndex) => (
                            <span
                              key={skillIndex}
                              className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-semibold"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* Assumptions */}
          {/* ======================================================= */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-primary" />
              <h2 className="text-xl font-bold">
                Project Assumptions
              </h2>
            </div>
            <div className="rounded-2xl border bg-neutral-50 p-6">
              <p className="text-sm leading-8 whitespace-pre-line text-neutral-700">
                {proposal?.assumptions || "No assumptions available."}
              </p>
            </div>
          </div>

          {/* ======================================================= */}
          {/* Risks & Mitigation */}
          {/* ======================================================= */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <ShieldAlert size={20} className="text-red-500" />
              <h2 className="text-xl font-bold">
                Risks & Mitigation
              </h2>
            </div>
            <div className="rounded-2xl border bg-red-50 p-6">
              <p className="text-sm leading-8 whitespace-pre-line text-neutral-700">
                {proposal?.risks || "No risks identified."}
              </p>
            </div>
          </div>

          {/* ======================================================= */}
          {/* Acceptance Criteria */}
          {/* ======================================================= */}
          {proposal?.acceptance_criteria && proposal.acceptance_criteria.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <ListChecks className="text-primary" size={20} />
                <h2 className="text-xl font-bold text-neutral-900">
                  Acceptance Criteria
                </h2>
              </div>
              <ul className="rounded-2xl border bg-neutral-50 p-6 space-y-3">
                {proposal.acceptance_criteria.map((criteria, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <span className="text-sm leading-relaxed text-neutral-700">{criteria}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ======================================================= */}
          {/* Key Differences */}
          {/* ======================================================= */}
          {activeProposal?.key_differences && activeProposal.key_differences.length > 0 && (
            <div className="space-y-6 pt-4 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="text-primary" size={20} />
                <h2 className="text-xl font-bold text-neutral-900">
                  MVP vs Full Product Differences
                </h2>
              </div>
              <div className="grid lg:grid-cols-2 gap-5">
                {activeProposal.key_differences.map((diff, index) => (
                  <div key={index} className="rounded-2xl border bg-white shadow-sm p-5 space-y-4">
                    <h3 className="text-[11px] uppercase tracking-widest text-primary font-bold">
                      {diff.category}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-neutral-500 mb-1">MVP</p>
                        <p className="text-sm text-neutral-800 leading-relaxed">{diff.mvp}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-neutral-500 mb-1">Full Product</p>
                        <p className="text-sm text-neutral-800 leading-relaxed">{diff.full}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* Action Buttons */}
          {/* ======================================================= */}
          <div className="flex flex-col md:flex-row justify-center gap-5 pt-6">
            <button
              onClick={() => navigate("/onboarding")}
              className="px-8 py-4 rounded-full border border-neutral-300 font-semibold hover:border-neutral-800 transition"
            >
              Edit Project Details
            </button>
            {activeProposal?.docx_url && activeProposal.docx_url !== "#" ? (
              <button
                onClick={handleDownload}
                className="px-10 py-4 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2"
              >
                Download Document
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleProceedToSign}
                disabled={isGenerating}
                className="px-10 py-4 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isGenerating ? "Generating..." : "Create Final Proposal"}
                {!isGenerating && <ChevronRight size={18} />}
              </button>
            )}
          </div>

          {/* ======================================================= */}
          {/* Document Preview */}
          {/* ======================================================= */}
          {docHtml && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 border-t border-neutral-100 pt-10"
            >
              <div className="flex items-center gap-2 mb-6">
                <FileText className="text-primary" size={24} />
                <h2 className="text-2xl font-bold text-neutral-900">
                  Final Document Preview
                </h2>
              </div>
              <div 
                className="bg-white rounded-xl border border-neutral-200 p-8 shadow-inner overflow-hidden"
              >
                {/* We use basic CSS since tailwind typography might not be installed */}
                <div 
                  className="docx-preview text-sm leading-relaxed text-neutral-800 space-y-4"
                  dangerouslySetInnerHTML={{ __html: docHtml }} 
                />
              </div>
              <style dangerouslySetInnerHTML={{__html: `
                .docx-preview h1 { font-size: 1.875rem; font-weight: 800; margin-top: 2rem; margin-bottom: 1rem; color: #171717; }
                .docx-preview h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.75rem; margin-bottom: 0.75rem; color: #171717; }
                .docx-preview h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #171717; }
                .docx-preview p { margin-bottom: 1rem; }
                .docx-preview ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
                .docx-preview table { width: 100%; border-collapse: collapse; margin-top: 1rem; margin-bottom: 1rem; }
                .docx-preview th, .docx-preview td { border: 1px solid #e5e5e5; padding: 0.75rem; text-align: left; }
                .docx-preview th { background-color: #f9fafb; font-weight: 600; }
              `}} />
            </motion.div>
          )}

        </motion.div>
      </div>
    </div>
  );
}