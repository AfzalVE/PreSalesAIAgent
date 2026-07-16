import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  UserCog,
  LayoutDashboard,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
  Search,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  PlusCircle,
  X,
  Save,
  User,
  Mail,
  Phone,
  Building2,
  Sliders,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  LogOut
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import FloatingBackground from "../components/common/FloatingBackground";
import MetricCard from "../components/common/MetricCard";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { usersList = [], toggleUserStatusOnBackend, resetStore } = useAppStore();

  const handleLogout = () => {
    resetStore();
    navigate("/");
  };

  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "admins" | "managers" | "settings"
  const [search, setSearch] = useState("");

  // Pre-seeded + dynamic super admin directory state
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Dipti Bhowmik",
      email: "dipti@gmail.com",
      phone: "+1 (555) 234-5678",
      role: "Admin",
      company: "PreSales AI Internal",
      status: "Active",
    },
    {
      id: 2,
      name: "Rahul Sharma",
      email: "rahul@gmail.com",
      phone: "+1 (555) 345-6789",
      role: "Manager",
      company: "Enterprise Ops Team",
      status: "Inactive",
    },
    {
      id: 3,
      name: "Anushka Das",
      email: "anushka@gmail.com",
      phone: "+1 (555) 456-7890",
      role: "Admin",
      company: "Core Governance",
      status: "Active",
    },
    {
      id: 4,
      name: "Vikram Mehta",
      email: "vikram.mehta@enterprise.com",
      phone: "+1 (555) 567-8901",
      role: "Manager",
      company: "Solutions Architecture Dept",
      status: "Active",
    },
    {
      id: 5,
      name: "Sneha Kapoor",
      email: "sneha.k@cloudworks.io",
      phone: "+1 (555) 678-9012",
      role: "Admin",
      company: "Security Compliance Group",
      status: "Active",
    }
  ]);

  // Merge store usersList into display if not already present
  const mergedUsers = [...users];
  usersList.forEach((storeUser, idx) => {
    if (!mergedUsers.some((u) => u.email.toLowerCase() === (storeUser.email || "").toLowerCase())) {
      mergedUsers.push({
        id: 100 + idx,
        name: storeUser.name || "Workspace Admin",
        email: storeUser.email || `user${idx}@client.com`,
        phone: storeUser.phone || "+1 (555) 000-0000",
        role: storeUser.role || "Manager",
        company: storeUser.company || "Client Workspace",
        status: storeUser.status || "Active",
      });
    }
  });

  // Floating Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // When set, floating Edit form opens

  // Add Account form data
  const [newAccount, setNewAccount] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Admin",
    company: "",
    status: "Active",
  });

  // Edit Account form data
  const [editFormData, setEditFormData] = useState({
    id: null,
    name: "",
    email: "",
    phone: "",
    role: "Admin",
    company: "",
    status: "Active",
  });

  // Interactive Governance Settings state
  const [settingsState, setSettingsState] = useState({
    mfa: true,
    ipWhitelist: false,
    sessionTimeout: true,
    auditRetention: true,
    backupEncryption: true,
  });

  const toggleSetting = (key) => {
    setSettingsState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleOpenEditModal = (user) => {
    setEditFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "+1 (555) 000-0000",
      role: user.role,
      company: user.company || "Core Operations",
      status: user.status,
    });
    setEditingUser(user);
  };

  const handleUpdateUser = (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUser.id
          ? {
            ...u,
            name: editFormData.name,
            email: editFormData.email,
            phone: editFormData.phone,
            role: editFormData.role,
            company: editFormData.company,
            status: editFormData.status,
          }
          : u
      )
    );

    // Call store/backend sync if available
    if (toggleUserStatusOnBackend && editingUser.status !== editFormData.status) {
      toggleUserStatusOnBackend(editFormData.email);
    }

    setEditingUser(null);
  };

  const toggleStatus = (id, email) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id
          ? {
            ...user,
            status: user.status === "Active" ? "Inactive" : "Active",
          }
          : user
      )
    );
    if (toggleUserStatusOnBackend && email) {
      toggleUserStatusOnBackend(email);
    }
  };

  const deleteUser = (id) => {
    if (window.confirm("Are you sure you want to delete this administrative account?")) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const handleCreateAccount = (e) => {
    e.preventDefault();
    if (!newAccount.name || !newAccount.email) return;
    const created = {
      id: Date.now(),
      name: newAccount.name,
      email: newAccount.email,
      phone: newAccount.phone || "+1 (555) 123-4567",
      role: newAccount.role,
      company: newAccount.company || "Internal Operations",
      status: newAccount.status,
    };
    setUsers([created, ...users]);
    setShowAddModal(false);
    setNewAccount({ name: "", email: "", phone: "", role: "Admin", company: "", status: "Active" });
  };

  const filteredUsers = mergedUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.company && user.company.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    if (activeTab === "admins" && user.role !== "Admin") return false;
    if (activeTab === "managers" && user.role !== "Manager") return false;
    return true;
  });

  return (
    <div className="relative min-h-[calc(100vh-73px)] py-12 px-4 md:px-8 font-sans">
      <FloatingBackground />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        {/* Editorial Header */}
        <div className="pb-6 border-b border-neutral-200/60 flex flex-col 2xl:flex-row 2xl:items-center justify-between w-full gap-5">
          <div className="flex-shrink-0">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display text-neutral-900 tracking-tight leading-none">
              Super Admin Control Center
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-medium">
              Oversee corporate workspaces, administrators, managers, and security governance.
            </p>
          </div>

          {/* Sub-tab Navigation with Moveable Select Effect & Inline Logout */}
          <div className="flex items-center overflow-x-auto whitespace-nowrap scrollbar-none w-full 2xl:w-auto gap-1 border border-neutral-200/80 bg-neutral-100/70 p-1.5 rounded-2xl text-xs sm:text-sm font-semibold self-start shadow-inner relative z-10 backdrop-blur-sm max-w-full">
            {[
              { id: "overview", label: "Overview" },
              { id: "admins", label: `Admins (${mergedUsers.filter((u) => u.role === "Admin").length})` },
              { id: "managers", label: `Managers (${mergedUsers.filter((u) => u.role === "Manager").length})` },
              { id: "settings", label: "Governance & Settings" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-bold transition-colors duration-200 z-10 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                    isActive ? "text-navy-accent font-extrabold shadow-xs" : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="superAdminActiveTab"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                      className="absolute inset-0 bg-primary-container rounded-xl shadow-md border border-primary/40 -z-10"
                    />
                  )}
                  {tab.label}
                </button>
              );
            })}

            {/* Logout Option Inline in Same Tab Box */}
            <button
              onClick={handleLogout}
              title="Sign out of Super Admin Portal"
              className="relative px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-bold transition-all duration-200 text-red-600 hover:bg-red-100/80 hover:text-red-700 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap flex-shrink-0 ml-auto sm:ml-0.5 2xl:ml-1"
            >
              <LogOut size={14} className="text-red-500 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        {activeTab !== "settings" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total System Directory"
              value={mergedUsers.length}
              subtext="All registered governance accounts"
              icon={Users}
              colorClass="text-brand-500"
              delay={0}
            />
            <MetricCard
              title="System Administrators"
              value={mergedUsers.filter((u) => u.role === "Admin").length}
              subtext="Elevated corporate portal access"
              icon={UserCog}
              colorClass="text-indigo-500"
              delay={0.1}
            />
            <MetricCard
              title="Account Managers"
              value={mergedUsers.filter((u) => u.role === "Manager").length}
              subtext="Operational client supervision"
              icon={LayoutDashboard}
              colorClass="text-amber-500"
              delay={0.2}
            />
            <MetricCard
              title="Active Status Rate"
              value={`${Math.round(
                (mergedUsers.filter((u) => u.status === "Active").length / (mergedUsers.length || 1)) * 100
              )}%`}
              subtext={`${mergedUsers.filter((u) => u.status === "Active").length} verified live sessions`}
              icon={CheckCircle}
              colorClass="text-emerald-500"
              delay={0.3}
            />
          </div>
        )}

        {/* Governance Catalog Table View */}
        {activeTab !== "settings" && (
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 md:p-8 shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-neutral-800 tracking-tight flex items-center">
                <Users size={20} className="text-brand-500 mr-2" />
                {activeTab === "overview"
                  ? "Registered Account Directory"
                  : activeTab === "admins"
                    ? "System Administrators Directory"
                    : "Account Managers Directory"}{" "}
                ({filteredUsers.length})
              </h3>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search accounts or department..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-neutral-800 outline-none focus:border-brand-500 transition-colors w-64 sm:w-72 shadow-inner"
                  />
                </div>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm transition-colors inline-flex items-center gap-2 shadow-sm"
                >
                  <PlusCircle size={16} className="text-brand-400" />
                  Add Account
                </button>
              </div>
            </div>

            <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-left border-collapse text-sm min-w-[650px]">
                <thead>
                  <tr className="border-b border-neutral-200/80 text-neutral-400 font-bold uppercase tracking-wider text-xs">
                    <th className="py-4 px-2">Account Profile</th>
                    <th className="py-4 px-2">Email Address</th>
                    <th className="py-4 px-2">Privilege Tier</th>
                    <th className="py-4 px-2">Organization / Dept</th>
                    <th className="py-4 px-2">Status</th>
                    <th className="py-4 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-4 px-2 font-bold text-neutral-900 flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-600 text-sm flex-shrink-0 shadow-xs">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <span className="block font-bold text-neutral-900 text-sm">{user.name}</span>
                          <span className="text-xs text-neutral-400 font-normal">{user.phone || "+1 (555) 000-0000"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-neutral-600 font-medium text-sm">{user.email}</td>
                      <td className="py-4 px-2">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold ${user.role === "Admin"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-neutral-600 text-sm">{user.company || "Core Operations"}</td>
                      <td className="py-4 px-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-red-50 text-red-700 border border-red-100"
                            }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="px-3 py-1.5 rounded-xl bg-neutral-100 text-neutral-800 hover:bg-neutral-200 transition-colors inline-flex items-center gap-1.5 font-bold text-xs shadow-xs"
                        >
                          <Pencil size={14} className="text-neutral-600" />
                          Edit
                        </button>
                        <button
                          onClick={() => toggleStatus(user.id, user.email)}
                          className={`px-3 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1.5 font-bold text-xs shadow-xs ${user.status === "Active"
                              ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60"
                            }`}
                        >
                          {user.status === "Active" ? <XCircle size={14} /> : <CheckCircle size={14} />}
                          {user.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors inline-flex items-center gap-1.5 font-bold text-xs border border-red-200/60 shadow-xs"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-10 text-center text-neutral-400 font-semibold italic text-base">
                        No administrative or managerial accounts found matching your query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Governance & Settings View */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-8 shadow-soft space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-neutral-100">
                <div className="p-3 rounded-2xl bg-brand-50 text-brand-600">
                  <KeyRound size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 text-lg">Security & Authentication</h4>
                  <p className="text-sm text-neutral-500 font-medium">Configure corporate sign-in & MFA enforcement</p>
                </div>
              </div>

              <div className="space-y-4 pt-1 text-sm font-semibold text-neutral-700">
                <div
                  onClick={() => toggleSetting("mfa")}
                  className="flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100/80 rounded-2xl border border-neutral-200/80 cursor-pointer transition-colors"
                >
                  <div>
                    <span className="block font-bold text-neutral-900">Multi-Factor Authentication (MFA)</span>
                    <span className="text-xs text-neutral-400 font-normal">Require 2FA for all admin logins</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${settingsState.mfa
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-neutral-200 text-neutral-600"
                        }`}
                    >
                      {settingsState.mfa ? "Enabled" : "Disabled"}
                    </span>
                    {settingsState.mfa ? (
                      <ToggleRight size={26} className="text-brand-500" />
                    ) : (
                      <ToggleLeft size={26} className="text-neutral-400" />
                    )}
                  </div>
                </div>

                <div
                  onClick={() => toggleSetting("ipWhitelist")}
                  className="flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100/80 rounded-2xl border border-neutral-200/80 cursor-pointer transition-colors"
                >
                  <div>
                    <span className="block font-bold text-neutral-900">Strict IP Address Whitelisting</span>
                    <span className="text-xs text-neutral-400 font-normal">Restrict access to verified corporate subnets</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${settingsState.ipWhitelist
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-neutral-200 text-neutral-600"
                        }`}
                    >
                      {settingsState.ipWhitelist ? "Enabled" : "Disabled"}
                    </span>
                    {settingsState.ipWhitelist ? (
                      <ToggleRight size={26} className="text-brand-500" />
                    ) : (
                      <ToggleLeft size={26} className="text-neutral-400" />
                    )}
                  </div>
                </div>

                <div
                  onClick={() => toggleSetting("sessionTimeout")}
                  className="flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100/80 rounded-2xl border border-neutral-200/80 cursor-pointer transition-colors"
                >
                  <div>
                    <span className="block font-bold text-neutral-900">Automatic Session Timeout</span>
                    <span className="text-xs text-neutral-400 font-normal">Force re-authentication after 30 mins inactivity</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${settingsState.sessionTimeout
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-neutral-200 text-neutral-600"
                        }`}
                    >
                      {settingsState.sessionTimeout ? "Active" : "Off"}
                    </span>
                    {settingsState.sessionTimeout ? (
                      <ToggleRight size={26} className="text-brand-500" />
                    ) : (
                      <ToggleLeft size={26} className="text-neutral-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-neutral-200/80 rounded-3xl p-8 shadow-soft space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-neutral-100">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 text-lg">Audit & Compliance Parameters</h4>
                  <p className="text-sm text-neutral-500 font-medium">System compliance and retention parameters</p>
                </div>
              </div>

              <div className="space-y-4 pt-1 text-sm font-semibold text-neutral-700">
                <div
                  onClick={() => toggleSetting("auditRetention")}
                  className="flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100/80 rounded-2xl border border-neutral-200/80 cursor-pointer transition-colors"
                >
                  <div>
                    <span className="block font-bold text-neutral-900">Enterprise Audit Log Retention</span>
                    <span className="text-xs text-neutral-400 font-normal">Retain immutable activity records for 365 days</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${settingsState.auditRetention
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-neutral-200 text-neutral-600"
                        }`}
                    >
                      {settingsState.auditRetention ? "Enforced" : "Disabled"}
                    </span>
                    {settingsState.auditRetention ? (
                      <ToggleRight size={26} className="text-indigo-600" />
                    ) : (
                      <ToggleLeft size={26} className="text-neutral-400" />
                    )}
                  </div>
                </div>

                <div
                  onClick={() => toggleSetting("backupEncryption")}
                  className="flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100/80 rounded-2xl border border-neutral-200/80 cursor-pointer transition-colors"
                >
                  <div>
                    <span className="block font-bold text-neutral-900">Automated Database Encryption</span>
                    <span className="text-xs text-neutral-400 font-normal">AES-256 encryption at rest for all workspace data</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${settingsState.backupEncryption
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-neutral-200 text-neutral-600"
                        }`}
                    >
                      {settingsState.backupEncryption ? "Active" : "Off"}
                    </span>
                    {settingsState.backupEncryption ? (
                      <ToggleRight size={26} className="text-indigo-600" />
                    ) : (
                      <ToggleLeft size={26} className="text-neutral-400" />
                    )}
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-indigo-700">
                    <ShieldAlert size={14} /> System Health & Backup Status
                  </span>
                  <p>All governance policies are actively synced with the high-availability failover cluster.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING EDIT USER MODAL ABOVE DASHBOARD */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-neutral-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 w-full max-w-xl shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-5 right-5 p-2 rounded-xl hover:bg-neutral-100 text-neutral-400 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center space-x-4 pb-5 border-b border-neutral-100">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-600 text-lg flex-shrink-0 shadow-sm">
                {(editFormData.name || "U").charAt(0)}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-100 tracking-wider">
                  Edit Mode
                </span>
                <h3 className="text-xl font-black font-display text-neutral-900 mt-1">
                  Modify Account: {editingUser.name}
                </h3>
              </div>
            </div>

            <form onSubmit={handleUpdateUser} className="mt-6 space-y-5 text-sm font-semibold text-neutral-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-neutral-400 uppercase tracking-wider text-xs block mb-1.5 flex items-center gap-1.5">
                    <User size={14} className="text-brand-500" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm text-neutral-900 outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 uppercase tracking-wider text-xs block mb-1.5 flex items-center gap-1.5">
                    <Mail size={14} className="text-brand-500" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm text-neutral-900 outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 uppercase tracking-wider text-xs block mb-1.5 flex items-center gap-1.5">
                    <Phone size={14} className="text-brand-500" />
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm text-neutral-900 outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 uppercase tracking-wider text-xs block mb-1.5 flex items-center gap-1.5">
                    <Building2 size={14} className="text-brand-500" />
                    Department / Organization
                  </label>
                  <input
                    type="text"
                    value={editFormData.company}
                    onChange={(e) => setEditFormData({ ...editFormData, company: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm text-neutral-900 outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 uppercase tracking-wider text-xs block mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-brand-500" />
                    Privilege Role
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm text-neutral-900 outline-none focus:border-brand-500 focus:bg-white transition-colors cursor-pointer"
                  >
                    <option value="Admin">Admin (Full Portal Authority)</option>
                    <option value="Manager">Manager (Client & Proposal Operations)</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 uppercase tracking-wider text-xs block mb-1.5 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-brand-500" />
                    Access Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm text-neutral-900 outline-none focus:border-brand-500 focus:bg-white transition-colors cursor-pointer"
                  >
                    <option value="Active">Active (Permitted Login)</option>
                    <option value="Inactive">Inactive (Suspended Account)</option>
                  </select>
                </div>
              </div>

              <div className="pt-5 border-t border-neutral-200/80 flex items-center space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold text-sm transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex h-11 flex-1 items-center justify-center rounded-full bg-primary-container font-button-text text-sm font-semibold text-navy-accent transition-all duration-200 hover:shadow-md active:translate-y-px gap-2 shadow-sm"
                >
                  <Save size={16} className="text-primary" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLOATING ADD ACCOUNT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-neutral-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl hover:bg-neutral-100 text-neutral-400 transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-bold text-neutral-900 font-display mb-1">Provision New Account</h3>
            <p className="text-sm text-neutral-500 font-medium mb-6">
              Assign administrative privileges to new enterprise staff.
            </p>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-sm font-semibold text-neutral-700">
              <div>
                <label className="text-neutral-400 uppercase tracking-wider text-xs block mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm text-neutral-900 outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-neutral-400 uppercase tracking-wider text-xs block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul@enterprise.com"
                  value={newAccount.email}
                  onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm text-neutral-900 outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-neutral-400 uppercase tracking-wider text-xs block mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 123-4567"
                  value={newAccount.phone}
                  onChange={(e) => setNewAccount({ ...newAccount, phone: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm text-neutral-900 outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 uppercase tracking-wider text-xs block mb-1.5">
                    Privilege Role
                  </label>
                  <select
                    value={newAccount.role}
                    onChange={(e) => setNewAccount({ ...newAccount, role: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm text-neutral-900 outline-none cursor-pointer"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 uppercase tracking-wider text-xs block mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={newAccount.status}
                    onChange={(e) => setNewAccount({ ...newAccount, status: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm text-neutral-900 outline-none cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-neutral-400 uppercase tracking-wider text-xs block mb-1.5">
                  Department / Organization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Solutions Operations"
                  value={newAccount.company}
                  onChange={(e) => setNewAccount({ ...newAccount, company: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm text-neutral-900 outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div className="pt-5 border-t border-neutral-200/80 flex items-center space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold text-sm transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex h-11 flex-1 items-center justify-center rounded-full bg-primary-container font-button-text text-sm font-semibold text-navy-accent transition-all duration-200 hover:shadow-md active:translate-y-px gap-2 shadow-sm"
                >
                  <PlusCircle size={16} className="text-primary" />
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}