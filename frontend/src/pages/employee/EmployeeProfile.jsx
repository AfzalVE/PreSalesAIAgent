import { useState, useEffect } from "react";
import { apiFetch } from "../../utils/api";
import { CheckCircle2, Loader2, Code2, Briefcase, Building2, Clock, AlertCircle } from "lucide-react";

export default function EmployeeProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const [profile, setProfile] = useState({
    id: "",
    full_name: "",
    employee_code: "",
    designation: "",
    department: "",
    skill_names: "",
    experience_years: 0,
    hourly_cost: 0,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/employee/profile/");
      setProfile(data);
    } catch (err) {
      setError("Failed to load profile. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg("");

    try {
      await apiFetch("/employee/profile/", {
        method: "PUT",
        body: JSON.stringify({
          designation: profile.designation,
          department: profile.department,
          skill_names: profile.skill_names,
          experience_years: parseInt(profile.experience_years) || 0,
        }),
      });
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-navy-accent">My Profile</h1>
        <p className="text-neutral-500 mt-2 font-body-md">
          Manage your personal details and technical stack.
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-xl shadow-primary/5 overflow-hidden">
        {/* Header Banner */}
        <div className="h-32 bg-gradient-to-r from-primary/20 via-[#00d4a4]/20 to-primary/5 flex items-end px-8 pb-6">
          <div className="flex items-center gap-4 translate-y-12">
            <div className="h-24 w-24 bg-white rounded-2xl shadow-lg border border-neutral-100 flex items-center justify-center text-4xl font-display font-bold text-primary">
              {profile.full_name?.charAt(0) || "D"}
            </div>
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-navy-accent">{profile.full_name}</h2>
              <div className="flex items-center gap-2 text-sm text-neutral-600 font-medium">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                  {profile.employee_code}
                </span>
                <span>•</span>
                <span>{profile.designation}</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-8 pt-16 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2 border border-red-100">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium flex items-center gap-2 border border-green-100">
              <CheckCircle2 size={18} />
              {successMsg}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Designation */}
            <div>
              <label className="flex items-center gap-2 text-xs font-label-caps uppercase tracking-wider text-neutral-500 mb-2 font-semibold">
                <Briefcase size={14} /> Designation
              </label>
              <input
                type="text"
                value={profile.designation}
                onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md"
              />
            </div>

            {/* Department */}
            <div>
              <label className="flex items-center gap-2 text-xs font-label-caps uppercase tracking-wider text-neutral-500 mb-2 font-semibold">
                <Building2 size={14} /> Department
              </label>
              <input
                type="text"
                value={profile.department}
                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md"
              />
            </div>

            {/* Experience Years */}
            <div>
              <label className="flex items-center gap-2 text-xs font-label-caps uppercase tracking-wider text-neutral-500 mb-2 font-semibold">
                <Clock size={14} /> Years of Experience
              </label>
              <input
                type="number"
                min="0"
                value={profile.experience_years}
                onChange={(e) => setProfile({ ...profile, experience_years: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md"
              />
            </div>

            {/* Read-Only: Hourly Cost */}
            <div>
              <label className="flex items-center gap-2 text-xs font-label-caps uppercase tracking-wider text-neutral-500 mb-2 font-semibold">
                Hourly Cost (Read Only)
              </label>
              <div className="w-full h-11 px-4 rounded-xl border border-neutral-100 bg-neutral-100 text-neutral-500 flex items-center font-body-md cursor-not-allowed">
                ${profile.hourly_cost}/hr
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs font-label-caps uppercase tracking-wider text-neutral-500 mb-2 font-semibold">
              <Code2 size={14} /> Technical Stack
            </label>
            <p className="text-xs text-neutral-400 mb-3">Comma separated list of technologies (e.g. React, Node.js, Python)</p>
            <textarea
              value={profile.skill_names}
              onChange={(e) => setProfile({ ...profile, skill_names: e.target.value })}
              rows={3}
              className="w-full p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-full hover:shadow-lg hover:shadow-primary/20 active:translate-y-px transition-all disabled:opacity-70"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
