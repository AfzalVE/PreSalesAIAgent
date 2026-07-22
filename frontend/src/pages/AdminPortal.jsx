import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  LogOut,
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import EmployeeCard from "../components/admin/EmployeeCard";

const AVAILABLE_SKILLS = [
  "React", "TypeScript", "Node.js", "Python", "OpenAI API", "AWS", "Docker", "Figma",
  "Kubernetes", "GraphQL", "Tailwind CSS", "Terraform", "PostgreSQL", "Cypress"
];
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
    uploadEmployeePdfOnBackend,
    sendEmployeeChatOnBackend,
    createEmployeeOnBackend,
    toggleUserStatusOnBackend,
    verifyUserOnBackend,
    resetStore,
    employeeChats = [],
  } = useAppStore();

  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (resetStore) resetStore();
    navigate("/");
  };

  // Navigation tabs: "dashboard" | "proposals" | "staff" | "users" | "otplogs"
  const [activeTab, setActiveTab] = useState("dashboard");

  const ADMIN_PATHS = {
    "/admin/dashboard": "dashboard",
    "/admin/proposal-console": "proposals",
    "/admin/bench-management": "staff",
    "/admin/users-catalog": "users",
    "/admin/otp": "otplogs",
    "/admin/chats": "chats"
  };

  useEffect(() => {
    const tab = ADMIN_PATHS[location.pathname];
    if (tab) {
      setActiveTab(tab);
    } else if (location.pathname === "/admin" || location.pathname === "/admin/") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [location.pathname, navigate]);

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
  const [editPassword, setEditPassword] = useState("");
  const [editPdfPath, setEditPdfPath] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [selectedThreadIndex, setSelectedThreadIndex] = useState(0);
  const [adminChatInput, setAdminChatInput] = useState("");

  // Create employee modal states
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [newEmployeeCode, setNewEmployeeCode] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newDesignation, setNewDesignation] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newExperienceYears, setNewExperienceYears] = useState(0);
  const [newHourlyCost, setNewHourlyCost] = useState(50.0);
  const [newSkills, setNewSkills] = useState([]);
  const [newSkillLevel, setNewSkillLevel] = useState("INTERMEDIATE");
  const [newPassword, setNewPassword] = useState("Employee123!");
  const [newEmployeeError, setNewEmployeeError] = useState("");

  const getDummyThreads = () => {
    if (employeeChats && employeeChats.length > 0) {
      return employeeChats;
    }
    const empNames = employees.length > 0 
      ? employees.map(e => e.name) 
      : ["John Doe", "Jane Miller", "Dave Wilson", "Sarah Connor", "James Bond"];
    
    return [
      {
        clientName: "Alice Johnson",
        companyName: "Acme Corp",
        employeeName: empNames[0] || "John Doe",
        employeeRole: "Senior Backend Engineer",
        messages: [
          { sender: "client", text: "Hi, I looked at the technical proposal. Will we use Python for the API?", time: "10:15 AM" },
          { sender: "employee", text: "Yes Alice! We are planning to build the API using Python and FastAPI. It provides high performance and asynchronous support out-of-the-box, which fits Acme's scalability needs.", time: "10:17 AM" },
          { sender: "client", text: "Excellent. What about the database migration strategy? We have a lot of legacy users.", time: "10:20 AM" },
          { sender: "employee", text: "We will use Alembic for smooth version-controlled migrations. I will also write a custom data-seeding pipeline to safely map legacy data columns into the new schema without any downtime.", time: "10:22 AM" }
        ]
      },
      {
        clientName: "Charlie Brown",
        companyName: "Pineapple Inc",
        employeeName: empNames[1] || "Jane Miller",
        employeeRole: "Senior Frontend Engineer",
        messages: [
          { sender: "client", text: "Hello! We want a highly responsive interface with motion effects. Is React/Tailwind suitable?", time: "Yesterday" },
          { sender: "employee", text: "Hi Charlie, absolutely! React combined with Tailwind CSS allows us to build extremely fast components with custom micro-animations (using Framer Motion or GSAP). It will look very premium.", time: "Yesterday" },
          { sender: "client", text: "Can we review the mockups tomorrow?", time: "Yesterday" },
          { sender: "employee", text: "Sure! I've uploaded the PDF review containing our style guidelines and page mockups in the system. I will walk you through it tomorrow.", time: "Yesterday" }
        ]
      },
      {
        clientName: "Alice Johnson",
        companyName: "Acme Corp",
        employeeName: empNames[2] || "Dave Wilson",
        employeeRole: "Solutions Architect",
        messages: [
          { sender: "client", text: "Dave, what is our infrastructure plan for deployment?", time: "2 days ago" },
          { sender: "employee", text: "Hi Alice, we are going with AWS EKS (Kubernetes) for hosting. It handles automatic scaling, and our microservices will communicate securely via VPC peering.", time: "2 days ago" },
          { sender: "client", text: "Sounds robust. Are there any security concerns?", time: "2 days ago" },
          { sender: "employee", text: "We are putting a Web Application Firewall (WAF) in place, and all APIs will be routed through HTTPS. I'm aligning with DevOps to test this next week.", time: "2 days ago" }
        ]
      }
    ];
  };

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
    setEditPassword(emp.password || "");
    setEditPdfPath(emp.pdfPath || "");
    setPdfFile(null);
  };

  const handleSaveEmployee = async () => {
    if (!selectedEmployee) return;
    setPdfUploading(true);
    let currentPdfPath = editPdfPath;

    // Handle PDF upload if selected
    if (pdfFile && uploadEmployeePdfOnBackend) {
      const res = await uploadEmployeePdfOnBackend(selectedEmployee.id, pdfFile);
      if (res && res.success) {
        currentPdfPath = res.pdfPath;
      }
    }

    if (updateEmployeeOnBackend) {
      await updateEmployeeOnBackend(selectedEmployee.id, {
        availability: editAvailability,
        currentAllocation: editAllocation,
        availableHours: parseInt(editHours, 10) || 0,
        skills: editSkills,
        benchStatus: editBenchStatus,
        password: editPassword,
        pdfPath: currentPdfPath
      });
    }
    setPdfUploading(false);
    setSelectedEmployee(null);
  };

  const handleSendAdminChatMessage = async () => {
    if (!adminChatInput.trim()) return;
    const threads = getDummyThreads();
    const thread = threads[selectedThreadIndex];
    if (!thread) return;

    if (sendEmployeeChatOnBackend) {
      // Acting as the employee/admin in the chat thread
      const res = await sendEmployeeChatOnBackend(
        thread.employeeId,
        thread.clientId,
        "EMPLOYEE",
        adminChatInput.trim()
      );
      if (res && res.success) {
        setAdminChatInput("");
      }
    }
  };

  const handleOpenAddEmployeeModal = () => {
    const nextCodeNum = employees.length + 1;
    const paddedNum = String(nextCodeNum).padStart(3, "0");
    setNewEmployeeCode(`EMP-${paddedNum}`);
    setNewFullName("");
    setNewDesignation("");
    setNewDepartment("Engineering");
    setNewExperienceYears(5);
    setNewHourlyCost(80.0);
    setNewSkills([]);
    setNewSkillLevel("INTERMEDIATE");
    setNewPassword("Employee123!");
    setNewEmployeeError("");
    setIsAddEmployeeModalOpen(true);
  };

  const handleCreateEmployee = async () => {
    if (!newEmployeeCode || !newFullName || !newDesignation || !newDepartment) {
      setNewEmployeeError("Please fill in all required fields.");
      return;
    }
    setNewEmployeeError("");

    if (createEmployeeOnBackend) {
      const res = await createEmployeeOnBackend({
        employee_code: newEmployeeCode,
        full_name: newFullName,
        designation: newDesignation,
        department: newDepartment,
        experience_years: parseInt(newExperienceYears, 10) || 0,
        hourly_cost: parseFloat(newHourlyCost) || 0.0,
        daily_capacity_hours: 8,
        allocated_hours: 0,
        available_hours: 8,
        bench_status: true,
        global_bench: true,
        employment_status: "ACTIVE",
        skill_names: newSkills.join(", ") || "Python",
        skill_level: newSkillLevel,
        years_experience: parseInt(newExperienceYears, 10) || 0,
        password: newPassword
      });

      if (res && res.success) {
        setIsAddEmployeeModalOpen(false);
      } else {
        setNewEmployeeError(res?.error || "Failed to create employee.");
      }
    }
  };

  const toggleNewSkill = (skill) => {
    if (newSkills.includes(skill)) {
      setNewSkills(newSkills.filter((s) => s !== skill));
    } else {
      setNewSkills([...newSkills, skill]);
    }
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
    <div className="relative min-h-[calc(100vh-73px)] py-12 px-4 md:px-8 font-sans">
      <FloatingBackground />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        <div className="pb-6 border-b border-neutral-200/60 flex flex-col md:flex-row md:items-center justify-between w-full gap-5">
          <div className="flex-shrink-0">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-neutral-900 tracking-tight leading-none">
              Resource Operations Studio
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-medium">
              Manage corporate employee benches, resource allocations, and proposal conversion charts.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 font-sans text-xs sm:text-sm font-semibold hover:bg-red-100 shadow-sm transition-all duration-200 cursor-pointer justify-center"
            >
              <LogOut size={14} className="mr-1.5 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation on its own row to prevent overlapping/clipping */}
        <div className="flex items-center overflow-x-auto whitespace-nowrap w-full gap-1 border border-neutral-200/80 bg-neutral-100/70 p-1.5 rounded-2xl text-xs sm:text-sm font-semibold self-start shadow-inner relative z-10 backdrop-blur-sm max-w-full">
          {[
            { id: "dashboard", label: "Dashboard", path: "/admin/dashboard" },
            { id: "proposals", label: "Proposals Console", path: "/admin/proposal-console" },
            { id: "staff", label: "Bench Management", path: "/admin/bench-management" },
            { id: "users", label: "Users Catalog", path: "/admin/users-catalog" },
            { id: "chats", label: "Client-Staff Chats", path: "/admin/chats" },
            { id: "otplogs", label: "OTP Log Viewer", path: "/admin/otp" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`relative px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-bold transition-colors duration-200 z-10 cursor-pointer whitespace-nowrap flex-shrink-0 ${isActive ? "text-navy-accent font-extrabold shadow-xs" : "text-neutral-500 hover:text-neutral-800"
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="adminPortalActiveTab"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    className="absolute inset-0 bg-primary-container rounded-xl shadow-md border border-primary/40 -z-10"
                  />
                )}
                {tab.label}
              </button>
            );
          })}

          {/* Logout Option Inline in Same Tab Box exactly matching Super Admin */}
          <button
            onClick={handleLogout}
            title="Sign out of Admin Portal"
            className="relative px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-bold transition-all duration-200 text-red-600 hover:bg-red-100/80 hover:text-red-700 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap flex-shrink-0 ml-auto sm:ml-0.5 2xl:ml-1"
          >
            <LogOut size={14} className="text-red-500 flex-shrink-0" />
            <span>Logout</span>
          </button>
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

              <div className="overflow-x-auto w-full -mx-6 sm:mx-0 px-6 sm:px-0">
                <table className="w-full text-left border-collapse text-xs min-w-[650px]">
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
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${prop.status === "Approved"
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
              <div className="flex items-center justify-between w-full md:w-auto">
                <div className="flex items-center space-x-2">
                  <Users size={16} className="text-neutral-400" />
                  <h4 className="text-sm font-bold text-neutral-800 tracking-tight">
                    Staffing Catalog ({filteredEmployees.length})
                  </h4>
                </div>
                <button
                  onClick={handleOpenAddEmployeeModal}
                  className="ml-4 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-soft flex items-center cursor-pointer"
                >
                  + Add Employee
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* Bench selector */}
                <div className="flex items-center space-x-1.5 border border-neutral-200 rounded-xl p-1 bg-neutral-50">
                  <button
                    onClick={() => setFilterMode("all")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${filterMode === "all"
                        ? "bg-white text-neutral-800 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-800"
                      }`}
                  >
                    All Staff
                  </button>
                  <button
                    onClick={() => setFilterMode("bench")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${filterMode === "bench"
                        ? "bg-white text-neutral-800 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-800"
                      }`}
                  >
                    On Bench
                  </button>
                  <button
                    onClick={() => setFilterMode("allocated")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${filterMode === "allocated"
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
                    {AVAILABLE_SKILLS.map((skill) => (
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

            <div className="overflow-x-auto w-full -mx-6 sm:mx-0 px-6 sm:px-0">
              <table className="w-full text-left border-collapse text-xs min-w-[650px]">
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

        {/* CLIENT-STAFF DUMMY CHATS VIEW */}
        {activeTab === "chats" && (
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-soft space-y-6">
            <div className="flex items-center space-x-2 pb-4 border-b border-neutral-100">
              <Users size={18} className="text-brand-500" />
              <h3 className="text-lg font-bold text-neutral-800 tracking-tight">
                Client-Staff Discussion Channels
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
              {/* Threads Column */}
              <div className="border border-neutral-200 rounded-2xl p-4 bg-neutral-50/50 space-y-3 overflow-y-auto max-h-[600px]">
                <h4 className="text-xs uppercase font-bold text-neutral-400 tracking-wider mb-2 px-1">
                  Active Channels
                </h4>
                {getDummyThreads().map((thread, idx) => {
                  const isSelected = selectedThreadIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedThreadIndex(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col space-y-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-brand-55 border-brand-200 shadow-sm"
                          : "bg-white border-neutral-200 hover:border-neutral-350"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-neutral-850">
                          {thread.clientName}
                        </span>
                        <span className="text-[9px] text-neutral-400 font-semibold">
                          {thread.messages[thread.messages.length - 1].time}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-neutral-400 font-medium">
                          {thread.companyName}
                        </span>
                        <span className="text-brand-600 font-semibold">
                          with {thread.employeeName}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500 truncate w-full mt-0.5 italic">
                        "{thread.messages[thread.messages.length - 1].text}"
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Chat Log Window Column */}
              <div className="lg:col-span-2 border border-neutral-200 rounded-2xl flex flex-col bg-white overflow-hidden max-h-[600px]">
                {/* Header */}
                <div className="bg-neutral-50 p-4 border-b border-neutral-200 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-850">
                      Channel: {getDummyThreads()[selectedThreadIndex]?.clientName} ({getDummyThreads()[selectedThreadIndex]?.companyName})
                    </h4>
                    <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
                      Assigned Resource: <span className="font-bold text-brand-600">{getDummyThreads()[selectedThreadIndex]?.employeeName}</span> ({getDummyThreads()[selectedThreadIndex]?.employeeRole})
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-150 rounded-full px-2.5 py-0.5 text-[9px] font-bold text-green-700 uppercase tracking-wider">
                    Live Session
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto min-h-[350px] bg-neutral-50/20">
                  {getDummyThreads()[selectedThreadIndex]?.messages.map((msg, mIdx) => {
                    const isClient = msg.sender === "client";
                    return (
                      <div
                        key={mIdx}
                        className={`flex ${isClient ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-3 shadow-xs text-xs leading-relaxed ${
                            isClient
                              ? "bg-white border border-neutral-200 text-neutral-850 rounded-tl-none"
                              : "bg-brand-500 text-white rounded-tr-none"
                          }`}
                        >
                          <div className="flex justify-between items-center space-x-4 mb-1 text-[9px]">
                            <span className={isClient ? "font-bold text-brand-600" : "font-bold text-brand-200"}>
                              {isClient ? getDummyThreads()[selectedThreadIndex]?.clientName : getDummyThreads()[selectedThreadIndex]?.employeeName}
                            </span>
                            <span className={isClient ? "text-neutral-400 font-medium" : "text-brand-200 font-medium"}>
                              {msg.time}
                            </span>
                          </div>
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Active Chat Footer */}
                <div className="p-3 border-t border-neutral-200 bg-neutral-50 flex items-center space-x-2">
                  <input
                    type="text"
                    value={adminChatInput}
                    onChange={(e) => setAdminChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendAdminChatMessage();
                    }}
                    placeholder="Type your response as employee/admin..."
                    className="flex-1 bg-white border border-neutral-200 rounded-xl px-3.5 py-2 text-[10px] outline-none text-neutral-700 font-medium focus:border-brand-500"
                  />
                  <button
                    onClick={handleSendAdminChatMessage}
                    className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    Send
                  </button>
                </div>
              </div>
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

            <div className="overflow-x-auto w-full -mx-6 sm:mx-0 px-6 sm:px-0">
              <table className="w-full text-left border-collapse text-xs min-w-[650px]">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-neutral-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl relative"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-neutral-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl relative"
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

                {/* Password and PDF Upload */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">
                      Direct Employee Password
                    </label>
                    <input
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-brand-500"
                      placeholder="e.g. Employee123!"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">
                      Resume PDF
                    </label>
                    <div className="flex flex-col space-y-1">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setPdfFile(e.target.files[0])}
                        className="w-full text-[10px] bg-neutral-50 border border-neutral-200 rounded-xl px-2 py-1.5 outline-none file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-semibold file:bg-neutral-200 file:text-neutral-700 hover:file:bg-neutral-300 cursor-pointer"
                      />
                      {editPdfPath && (
                        <a
                          href={`${import.meta.env.VITE_API_BASE_URL || ''}${editPdfPath}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-brand-600 font-bold hover:underline inline-flex items-center mt-1"
                        >
                          <FileText size={10} className="mr-1" /> View Resume PDF
                        </a>
                      )}
                    </div>
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
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${editBenchStatus ? "bg-brand-500" : "bg-neutral-200"
                      }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${editBenchStatus ? "translate-x-6" : "translate-x-0"
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
                    {AVAILABLE_SKILLS.map((skill) => {
                      const isSelected = editSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleEditSkill(skill)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${isSelected
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

      {/* ADD NEW EMPLOYEE MODAL */}
      <AnimatePresence>
        {isAddEmployeeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-neutral-200 rounded-3xl p-6 w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-xl relative"
            >
              <button
                onClick={() => setIsAddEmployeeModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-neutral-50 text-neutral-400 transition-colors"
              >
                <X size={16} />
              </button>

              <div className="space-y-6">
                <div className="pb-4 border-b border-neutral-100">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    Add New Resource
                  </span>
                  <h3 className="text-xl font-bold text-neutral-900">
                    Create Employee Profile
                  </h3>
                </div>

                {newEmployeeError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-3.5 py-2.5 rounded-xl text-xs font-semibold">
                    {newEmployeeError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">
                      Employee Code *
                    </label>
                    <input
                      type="text"
                      value={newEmployeeCode}
                      onChange={(e) => setNewEmployeeCode(e.target.value)}
                      className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-brand-500"
                      placeholder="e.g. EMP-006"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-brand-500"
                      placeholder="e.g. Robert Downey"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">
                      Designation *
                    </label>
                    <input
                      type="text"
                      value={newDesignation}
                      onChange={(e) => setNewDesignation(e.target.value)}
                      className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-brand-500"
                      placeholder="e.g. Senior Machine Learning Engineer"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">
                      Department *
                    </label>
                    <select
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-brand-500"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Quality Assurance">Quality Assurance</option>
                      <option value="Sales">Sales</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">
                      Years of Experience *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newExperienceYears}
                      onChange={(e) => setNewExperienceYears(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">
                      Hourly Cost ($) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newHourlyCost}
                      onChange={(e) => setNewHourlyCost(parseFloat(e.target.value) || 0.0)}
                      className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">
                      Skill Level
                    </label>
                    <select
                      value={newSkillLevel}
                      onChange={(e) => setNewSkillLevel(e.target.value)}
                      className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-brand-500"
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="EXPERT">Expert</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">
                      Portal Password
                    </label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-2">
                    Select Technical Skills
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_SKILLS.map((skill) => {
                      const isSelected = newSkills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleNewSkill(skill)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${isSelected
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

                <div className="flex items-center space-x-3 pt-4 border-t border-neutral-100">
                  <button
                    onClick={() => setIsAddEmployeeModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-600 text-xs font-semibold hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateEmployee}
                    className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors"
                  >
                    Create Profile
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
