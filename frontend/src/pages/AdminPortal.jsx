import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Users,
  Filter,
  BarChart3,
  Cpu,
  Layers,
  X,
  FileText,
  CheckCircle2,
  ChevronRight,
  Check,
  KeyRound,
} from "lucide-react";
import { MOCK_SKILLS } from "../mock/mockData";
import { useAppStore } from "../store/useAppStore";
import EmployeeCard from "../components/admin/EmployeeCard";
import ResourceHeatmap from "../components/admin/ResourceHeatmap";
import FloatingBackground from "../components/common/FloatingBackground";
import MetricCard from "../components/common/MetricCard";
import SkillTag from "../components/common/SkillTag";

export default function AdminPortal() {
  const {
    employees = [],
    adminProposals = [],
    usersList = [],
    otpLogs = [],
    dashboardStats,
    fetchAdminData,
    updateEmployeeOnBackend,
    toggleUserStatusOnBackend,
    verifyUserOnBackend,
  } = useAppStore();

  // Navigation tabs: "dashboard" | "proposals" | "staff" | "users" | "otplogs"
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (fetchAdminData) {
      fetchAdminData();
    }
  }, [fetchAdminData, activeTab]);

  // Filtering states for Staff Bench Tab
  const [filterMode, setFilterMode] = useState("all"); // "all" | "bench" | "allocated"
  const [selectedSkill, setSelectedSkill] = useState("");

  // Detailed Modal states
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Edit employee state (for modal editor)
  const [editAvailability, setEditAvailability] = useState("");
  const [editAllocation, setEditAllocation] = useState(0);
  const [editHours, setEditHours] = useState(0);
  const [editSkills, setEditSkills] = useState([]);
  const [editBenchStatus, setEditBenchStatus] = useState(false);



  // Filtered employees for display
  const filteredEmployees = employees.filter((emp) => {
    if (filterMode === "bench" && !emp.benchStatus) return false;
    if (filterMode === "allocated" && (emp.benchStatus || emp.currentAllocation <= 0)) return false;
    if (selectedSkill && !emp.skills.includes(selectedSkill)) return false;
    return true;
  });

  const handleOpenEmployeeModal = (emp) => {
    setSelectedEmployee(emp);
    setEditAvailability(emp.availability);
    setEditAllocation(emp.currentAllocation);
    setEditHours(emp.availableHours);
    setEditSkills([...emp.skills]);
    setEditBenchStatus(emp.benchStatus);
  };

  const handleSaveEmployee = () => {
    if (!selectedEmployee) return;
    if (updateEmployeeOnBackend) {
      updateEmployeeOnBackend(selectedEmployee.id, {
        availability: editAvailability,
        currentAllocation: editAllocation,
        availableHours: parseInt(editHours, 10) || 0,
        skills: editSkills,
        benchStatus: editBenchStatus,
      });
    }
    setSelectedEmployee(null);
  };

  const toggleEditSkill = (skill) => {
    if (editSkills.includes(skill)) {
      setEditSkills(editSkills.filter((s) => s !== skill));
    } else {
      setEditSkills([...editSkills, skill]);
    }
  };

  const toggleUserStatus = (email) => {
    if (toggleUserStatusOnBackend) {
      toggleUserStatusOnBackend(email);
    }
  };

  const verifyUserManually = (email) => {
    if (verifyUserOnBackend) {
      verifyUserOnBackend(email);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-73px)] py-12 px-4">
      <FloatingBackground />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        {/* Wise Typography Editorial Header */}
        <div className="pb-6 border-b border-neutral-200/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-5xl font-black font-display text-neutral-900 tracking-tight leading-none">
              Resource Operations Studio
            </h2>
            <p className="text-sm text-neutral-500 mt-1 font-medium">
              Manage corporate employee benches, resource allocations, and
              proposal conversion charts.
            </p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex flex-wrap space-x-1.5 border border-neutral-200 bg-neutral-50 p-1.5 rounded-2xl text-xs font-semibold self-start sm:self-center">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                activeTab === "dashboard"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("proposals")}
              className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                activeTab === "proposals"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Proposals Console
            </button>
            <button
              onClick={() => setActiveTab("staff")}
              className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                activeTab === "staff"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Bench Management
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                activeTab === "users"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              Users Catalog
            </button>
            <button
              onClick={() => setActiveTab("otplogs")}
              className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                activeTab === "otplogs"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              OTP Log Viewer
            </button>
          </div>
        </div>

        {/* 1. DASHBOARD VIEW */}
        {activeTab === "dashboard" && (
          <div className="space-y-10">
            {/* Executive Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Proposals Processed"
                value={dashboardStats?.totalProposalsProcessed ?? "..."}
                subtext={dashboardStats?.totalProposalsSubtext ?? "Syncing live pipeline..."}
                icon={BarChart3}
                colorClass="text-brand-500"
                delay={0}
              />
              <MetricCard
                title="Resource Utilization Rate"
                value={dashboardStats?.resourceUtilizationRate ?? "..."}
                subtext={dashboardStats?.resourceUtilizationSubtext ?? "Syncing live resources..."}
                icon={Users}
                colorClass="text-brand-500"
                delay={0.1}
              />
              <MetricCard
                title="Proposal Conversion Efficiency"
                value={dashboardStats?.proposalConversionEfficiency ?? "..."}
                subtext={dashboardStats?.proposalConversionSubtext ?? "Syncing conversion metrics..."}
                icon={Cpu}
                colorClass="text-brand-500"
                delay={0.2}
              />
              <MetricCard
                title="Global Bench Allocation"
                value={dashboardStats?.globalBenchAllocation ?? "..."}
                subtext={dashboardStats?.globalBenchSubtext ?? "Syncing bench status..."}
                icon={Layers}
                colorClass="text-brand-500"
                delay={0.3}
              />
            </div>

            {/* Recharts Analytics Heatmaps Section */}
            <ResourceHeatmap
              monthlyRevenue={dashboardStats?.monthlyRevenue}
              skillDistribution={dashboardStats?.skillDistribution}
            />
          </div>
        )}

        {/* 2. PROPOSALS CONSOLE */}
        {activeTab === "proposals" && (
          <div className="space-y-6">
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-soft">
              <h3 className="text-lg font-bold text-neutral-800 tracking-tight mb-4 flex items-center">
                <FileText size={18} className="text-brand-500 mr-2" />
                Active Client Proposals
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 text-neutral-400 font-bold uppercase tracking-wider">
                      <th className="py-4">Project Name</th>
                      <th className="py-4">Client</th>
                      <th className="py-4">Budget</th>
                      <th className="py-4">Timeline</th>
                      <th className="py-4">Status</th>
                      <th className="py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {adminProposals.map((prop) => (
                      <tr
                        key={prop.id}
                        className="hover:bg-neutral-50/50 transition-colors"
                      >
                        <td className="py-4 font-bold text-neutral-800">
                          {prop.projectName}
                        </td>
                        <td className="py-4 text-neutral-500 font-medium">
                          {prop.clientName}
                        </td>
                        <td className="py-4 font-bold text-brand-600">
                          ${Number(prop.budget || 0).toLocaleString()}
                        </td>
                        <td className="py-4 text-neutral-500 font-medium">
                          {prop.timeline}
                        </td>
                        <td className="py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              prop.status === "Approved"
                                ? "bg-brand-50 text-brand-600 border border-brand-100"
                                : prop.status === "Negotiating"
                                  ? "bg-amber-50 text-amber-600 border border-amber-100"
                                  : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {prop.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => setSelectedProposal(prop)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-neutral-900 text-white font-bold hover:bg-neutral-800 transition-colors"
                          >
                            Details
                            <ChevronRight size={12} className="ml-1" />
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

        {/* 3. BENCH MANAGEMENT */}
        {activeTab === "staff" && (
          <div className="space-y-6">
            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-soft">
              <div className="flex items-center space-x-2">
                <Users size={16} className="text-neutral-400" />
                <h4 className="text-sm font-bold text-neutral-800 tracking-tight">
                  Staffing Catalog ({filteredEmployees.length})
                </h4>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* Bench selector */}
                <div className="flex items-center space-x-1.5 border border-neutral-200 rounded-xl p-1 bg-neutral-50">
                  <button
                    onClick={() => setFilterMode("all")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      filterMode === "all"
                        ? "bg-white text-neutral-800 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    All Staff
                  </button>
                  <button
                    onClick={() => setFilterMode("bench")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      filterMode === "bench"
                        ? "bg-white text-neutral-800 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    On Bench
                  </button>
                  <button
                    onClick={() => setFilterMode("allocated")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      filterMode === "allocated"
                        ? "bg-white text-neutral-800 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    Allocated
                  </button>
                </div>

                {/* Skill dropdown */}
                <div className="flex items-center space-x-1.5 border border-neutral-200 rounded-xl px-2.5 py-1.5 bg-neutral-50">
                  <Filter size={12} className="text-neutral-400" />
                  <select
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    className="bg-transparent font-semibold outline-none text-neutral-700 cursor-pointer text-xs"
                  >
                    <option value="">All Skills</option>
                    {MOCK_SKILLS.map((skill) => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Cards List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredEmployees.map((emp) => (
                  <EmployeeCard
                    key={emp.id}
                    employee={emp}
                    onManage={handleOpenEmployeeModal}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* 4. USERS CATALOG VIEW */}
        {activeTab === "users" && (
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-soft space-y-6">
            <h3 className="text-lg font-bold text-neutral-800 tracking-tight flex items-center">
              <Users size={18} className="text-brand-500 mr-2" />
              Registered Client Workspaces
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 font-bold uppercase tracking-wider">
                    <th className="py-4">Name</th>
                    <th className="py-4">Email</th>
                    <th className="py-4">Role</th>
                    <th className="py-4">Company</th>
                    <th className="py-4">Verification</th>
                    <th className="py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-600">
                  {usersList.map((usr) => (
                    <tr key={usr.email}>
                      <td className="py-4 font-bold text-neutral-800">
                        {usr.name}
                      </td>
                      <td className="py-4">{usr.email}</td>
                      <td className="py-4">{usr.role}</td>
                      <td className="py-4">{usr.company}</td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${usr.verificationStatus === "Verified" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
                        >
                          {usr.verificationStatus}
                        </span>
                      </td>
                      <td className="py-4 text-right space-x-2">
                        {usr.verificationStatus === "Pending" && (
                          <button
                            onClick={() => verifyUserManually(usr.email)}
                            className="px-2.5 py-1 rounded bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => toggleUserStatus(usr.email)}
                          className={`px-2.5 py-1 rounded transition-colors ${usr.status === "Active" ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                        >
                          {usr.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => setSelectedUser(usr)}
                          className="px-2.5 py-1 rounded bg-neutral-100 text-neutral-700 hover:bg-neutral-250 transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. OTP LOG VIEW */}
        {activeTab === "otplogs" && (
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-soft space-y-6">
            <h3 className="text-lg font-bold text-neutral-800 tracking-tight flex items-center">
              <KeyRound size={18} className="text-brand-500 mr-2" />
              OTP Verification Logs
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-400 font-bold uppercase tracking-wider">
                    <th className="py-4">User</th>
                    <th className="py-4">Email</th>
                    <th className="py-4">Purpose</th>
                    <th className="py-4">Verified</th>
                    <th className="py-4">Attempts</th>
                    <th className="py-4 text-right">Expiry Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-600">
                  {otpLogs.map((log, idx) => (
                    <tr key={idx}>
                      <td className="py-4 font-bold text-neutral-800">
                        {log.user}
                      </td>
                      <td className="py-4">{log.email}</td>
                      <td className="py-4">{log.purpose}</td>
                      <td className="py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.verified === "Yes" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                        >
                          {log.verified}
                        </span>
                      </td>
                      <td className="py-4">{log.attempts} attempts</td>
                      <td className="py-4 text-right text-neutral-400">
                        {log.expiryTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* USER DETAILS MODAL */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-neutral-200 rounded-3xl p-8 w-full max-w-md shadow-xl relative"
            >
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-neutral-50 text-neutral-400"
              >
                <X size={16} />
              </button>
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                User Workspace Details
              </span>
              <h3 className="text-xl font-bold font-display text-neutral-900">
                {selectedUser.name}
              </h3>

              <div className="mt-6 space-y-4 text-xs font-semibold text-neutral-600">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-100">
                  <div>
                    <span className="text-neutral-400 block uppercase text-[9px] font-bold">
                      Email Address
                    </span>
                    <span className="text-neutral-800">
                      {selectedUser.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block uppercase text-[9px] font-bold">
                      Role Status
                    </span>
                    <span className="text-neutral-800">
                      {selectedUser.role}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-100">
                  <div>
                    <span className="text-neutral-400 block uppercase text-[9px] font-bold">
                      Company Name
                    </span>
                    <span className="text-neutral-800">
                      {selectedUser.company}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block uppercase text-[9px] font-bold">
                      Verification Status
                    </span>
                    <span className="text-neutral-800">
                      {selectedUser.verificationStatus}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-neutral-400 block uppercase text-[9px] font-bold mb-2">
                    Proposal Generation History
                  </span>
                  <div className="space-y-2">
                    {(selectedUser.proposalHistory || []).length > 0 ? (
                      (selectedUser.proposalHistory || []).map((p, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-neutral-50 border border-neutral-100 rounded-xl"
                        >
                          <span className="text-neutral-800">{p}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-neutral-400 italic font-medium">
                        No proposals generated yet.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PROPOSAL DETAILS MODAL */}
      <AnimatePresence>
        {selectedProposal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-neutral-200 rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl relative"
            >
              <button
                onClick={() => setSelectedProposal(null)}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-neutral-50 text-neutral-400 transition-colors"
              >
                <X size={16} />
              </button>

              <div className="space-y-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    Proposal Details
                  </span>
                  <h3 className="text-2xl font-bold font-display text-neutral-900 mt-1">
                    {selectedProposal.projectName}
                  </h3>
                  <p className="text-xs text-neutral-500 font-semibold mt-0.5">
                    Client: {selectedProposal.clientName} •{" "}
                    {selectedProposal.industry || "Technology & Services"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-100">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-neutral-400 block">
                      Current Budget
                    </label>
                    <span className="text-base font-bold text-brand-600">
                      ${Number(selectedProposal.budget || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-neutral-400 block">
                      Timeline
                    </label>
                    <span className="text-base font-bold text-neutral-800">
                      {selectedProposal.timeline || "12 Weeks"}
                    </span>
                  </div>
                </div>

                {/* Features Checklist */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-2">
                    Scope Features
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {(selectedProposal.features || []).map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-2 p-2 bg-neutral-50 rounded-xl border border-neutral-100"
                      >
                        <CheckCircle2
                          size={12}
                          className="text-brand-500 flex-shrink-0"
                        />
                        <span className="text-neutral-700 font-medium truncate">
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tech Stack */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-2">
                    Tech Stack
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedProposal.techStack || []).map((t) => (
                      <SkillTag key={t} skill={t} />
                    ))}
                  </div>
                </div>

                {/* Suggested vs Assigned Resource Allocations */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] uppercase font-bold text-neutral-400 block">
                      Resource Assignments & Override
                    </label>
                    <span className="text-[9px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                      Custom Client Request Active
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(selectedProposal.team || []).map((member, mIdx) => {
                      const matchingStaff = employees.filter((emp) =>
                        (emp.skills || []).some((sk) =>
                          (selectedProposal.techStack || []).includes(sk),
                        ),
                      );
                      return (
                        <div
                          key={mIdx}
                          className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl flex items-center justify-between text-xs font-semibold text-neutral-700"
                        >
                          <div>
                            <span className="font-bold text-neutral-900 block">
                              {member.name}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-medium">
                              {member.role}
                            </span>
                          </div>

                          {/* Admin Override Dropdown */}
                          <select
                            value={member.name}
                            onChange={(e) => {
                              const selectedName = e.target.value;
                              const selectedStaff = employees.find(
                                (emp) => emp.name === selectedName,
                              );

                              // Create deep copy of selected proposal and update team resource
                              const updatedTeam = [
                                ...(selectedProposal.team || []),
                              ];
                              updatedTeam[mIdx] = {
                                name: selectedName,
                                role: selectedStaff
                                  ? selectedStaff.role
                                  : member.role,
                              };

                              const updatedProposal = {
                                ...selectedProposal,
                                team: updatedTeam,
                              };
                              setSelectedProposal(updatedProposal);
                            }}
                            className="bg-white border border-neutral-200 rounded-lg p-1 text-[10px] font-bold text-neutral-700 outline-none"
                          >
                            <option value={member.name}>
                              {member.name} ({member.role})
                            </option>
                            {matchingStaff.map((emp) => (
                              <option key={emp.id} value={emp.name}>
                                {emp.name} ({emp.role})
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        alert(
                          "Custom client resources accepted and locked in!",
                        );
                        setSelectedProposal(null);
                      }}
                      className="flex-1 py-2 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all duration-200"
                    >
                      Accept Resource Request
                    </button>
                    <button
                      onClick={() => {
                        alert("Resource allocations override applied!");
                        setSelectedProposal(null);
                      }}
                      className="flex-1 py-2 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all duration-200"
                    >
                      Apply Custom Allocation
                    </button>
                  </div>
                </div>

                {/* Version Log */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-2">
                    Negotiation Logs
                  </label>
                  <div className="space-y-2">
                    {(selectedProposal.versions || []).map((v, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl text-xs flex justify-between"
                      >
                        <div>
                          <span className="font-bold text-neutral-800">
                            {v.version}
                          </span>
                          <span className="text-neutral-400 mx-2">|</span>
                          <span className="text-neutral-500 font-medium">
                            {v.desc}
                          </span>
                        </div>
                        <span className="text-neutral-400 font-semibold">
                          {v.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BENCH EMPLOYEE DETAIL / MANAGEMENT MODAL */}
      <AnimatePresence>
        {selectedEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-neutral-200 rounded-3xl p-6 w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-xl relative"
            >
              <button
                onClick={() => setSelectedEmployee(null)}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-neutral-50 text-neutral-400 transition-colors"
              >
                <X size={16} />
              </button>

              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center space-x-4 pb-4 border-b border-neutral-100">
                  <img
                    src={selectedEmployee.avatar}
                    alt={selectedEmployee.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-neutral-200/60"
                  />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                      Manage Resource profile
                    </span>
                    <h3 className="text-xl font-bold text-neutral-900">
                      {selectedEmployee.name}
                    </h3>
                    <p className="text-xs text-brand-600 font-semibold mt-0.5">
                      {selectedEmployee.role} • {selectedEmployee.experience}{" "}
                      Experience
                    </p>
                  </div>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">
                      Availability Status
                    </label>
                    <select
                      value={editAvailability}
                      onChange={(e) => setEditAvailability(e.target.value)}
                      className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-brand-500"
                    >
                      <option value="Available">Available</option>
                      <option value="Partially Available">
                        Partially Available
                      </option>
                      <option value="Fully Allocated">Fully Allocated</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">
                      Available Hours / Wk
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      value={editHours}
                      onChange={(e) =>
                        setEditHours(parseInt(e.target.value, 10) || 0)
                      }
                      className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Allocation slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] uppercase font-bold text-neutral-400 block">
                      Resource Allocation %
                    </label>
                    <span className="text-xs font-bold text-neutral-800">
                      {editAllocation}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={editAllocation}
                    onChange={(e) =>
                      setEditAllocation(parseInt(e.target.value, 10))
                    }
                    className="w-full h-1.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  />
                </div>

                {/* Bench status toggle */}
                <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-100 text-xs">
                  <div>
                    <h5 className="font-bold text-neutral-800">Bench Status</h5>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Toggle if this engineer is currently on bench list
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditBenchStatus(!editBenchStatus)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                      editBenchStatus ? "bg-brand-500" : "bg-neutral-200"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        editBenchStatus ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Skills Matrix Selection */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-2">
                    Technical Skill Matrix
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {MOCK_SKILLS.map((skill) => {
                      const isSelected = editSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleEditSkill(skill)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
                            isSelected
                              ? "bg-brand-50 border-brand-200 text-brand-600 font-bold"
                              : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                          }`}
                        >
                          {isSelected && (
                            <Check size={10} className="mr-1" strokeWidth={3} />
                          )}
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center space-x-3 pt-4 border-t border-neutral-100">
                  <button
                    onClick={() => setSelectedEmployee(null)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 text-xs font-semibold hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEmployee}
                    className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
