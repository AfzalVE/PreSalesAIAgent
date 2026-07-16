import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save, User, Mail, Phone, Building2, ShieldCheck, CheckCircle2, X } from "lucide-react";
import FloatingBackground from "../components/common/FloatingBackground";

export default function EditUser() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = location.state || {
    name: "Dipti Bhowmik",
    email: "dipti@gmail.com",
    phone: "+1 (555) 234-5678",
    company: "PreSales AI Internal",
    role: "Admin",
    status: "Active",
  };

  const [formData, setFormData] = useState(user);
  const [showNotification, setShowNotification] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setShowNotification(true);
    setTimeout(() => {
      navigate(-1);
    }, 900);
  };

  return (
    <div className="relative min-h-[calc(100vh-73px)] py-12 px-4 font-sans">
      <FloatingBackground />

      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200/60">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors bg-white px-3.5 py-2 rounded-xl border border-neutral-200 shadow-sm"
          >
            <ArrowLeft size={15} />
            Back to Directory
          </button>

          <span className="text-[10px] uppercase font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-100 tracking-wider">
            Account Governance Studio
          </span>
        </div>

        {/* Edit Form Card */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-8 shadow-soft relative overflow-hidden">
          <div className="flex items-center space-x-4 pb-6 border-b border-neutral-100">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-600 text-xl flex-shrink-0">
              {(formData.name || "U").charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-black font-display text-neutral-900 tracking-tight">
                Edit Account Profile: {formData.name}
              </h2>
              <p className="text-xs text-neutral-500 font-medium mt-0.5">
                Update administrative role assignments, contact credentials, and session permissions.
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="mt-6 space-y-6 text-xs font-semibold text-neutral-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <User size={13} className="text-brand-500" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-800 outline-none focus:border-brand-500 focus:bg-white transition-all font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Mail size={13} className="text-brand-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-800 outline-none focus:border-brand-500 focus:bg-white transition-all font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Phone size={13} className="text-brand-500" />
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone || "+1 (555) 000-0000"}
                  onChange={handleChange}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-800 outline-none focus:border-brand-500 focus:bg-white transition-all font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Building2 size={13} className="text-brand-500" />
                  Company / Organization
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company || "PreSales AI Internal"}
                  onChange={handleChange}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-800 outline-none focus:border-brand-500 focus:bg-white transition-all font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-brand-500" />
                  Privilege Role Assignment
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-800 outline-none focus:border-brand-500 focus:bg-white transition-all font-semibold cursor-pointer"
                >
                  <option value="Admin">Admin (Full Portal Authority)</option>
                  <option value="Manager">Manager (Client & Proposal Operations)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-brand-500" />
                  Account Access Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-800 outline-none focus:border-brand-500 focus:bg-white transition-all font-semibold cursor-pointer"
                >
                  <option value="Active">Active (Full Access Allowed)</option>
                  <option value="Inactive">Inactive (Suspended Login)</option>
                </select>
              </div>
            </div>

            {/* Notification Banner when saved */}
            {showNotification && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center space-x-3 animate-in fade-in duration-200">
                <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                <span className="font-bold">Account profile modifications saved successfully! Redirecting...</span>
              </div>
            )}

            <div className="pt-5 border-t border-neutral-200/80 flex items-center justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold text-sm transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex h-11 px-8 items-center justify-center rounded-full bg-primary-container font-button-text text-sm font-semibold text-navy-accent transition-all duration-200 hover:shadow-md active:translate-y-px gap-2 shadow-sm"
              >
                <Save size={16} className="text-primary" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}