import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  KeyRound,
  ShieldAlert,
  UserCheck,
  Sparkles,
  ArrowRight,
  X,
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";

const ROLE_OPTIONS = [
  { role: "super-admin", label: "Super Admin", icon: ShieldAlert },
  { role: "admin", label: "Admin", icon: UserCheck },
  { role: "manager", label: "Manager", icon: UserCheck },
];

function pickInitialRoleFromEmail(email) {
  const e = (email || "").toLowerCase();
  if (
    e.includes("super") ||
    e.includes("root") ||
    e.includes("owner") ||
    e.includes("admin")
  )
    return "super-admin";
  if (e.includes("manager") || e.includes("mgr")) return "manager";
  return "admin";
}

export default function AdminLogin({ onLogin, onCancel }) {
  const { setUser } = useAppStore();

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const initialHint = useMemo(() => {
    return "Use any credentials (mock). Try: super@corp.com, manager@corp.com";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!emailOrPhone || !password) {
      setError("Please enter email/phone and password.");
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 650));

    const inferredRole = pickInitialRoleFromEmail(emailOrPhone);
    const effectiveRole = role || inferredRole;

    setUser({
      emailOrPhone,
      isVerified: true,
      role: effectiveRole,
    });

    setSubmitting(false);
    onLogin({ role: effectiveRole, emailOrPhone });
  };

  const RoleIcon =
    ROLE_OPTIONS.find((r) => r.role === role)?.icon || ShieldAlert;

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Mintlify Hero Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#87a8c8] via-[#dfe5e6] to-[#f5e9d8]" />

      <div className="relative z-10 min-h-screen max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-20 items-center min-h-screen py-16">
          {/* LEFT SIDE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 bg-white">
              <Sparkles size={14} className="text-[#00d4a4]" />
              <span className="text-sm font-medium text-neutral-700">
                Internal Operations Platform
              </span>
            </div>

            <div className="space-y-5">
              <h1 className="text-5xl lg:text-7xl font-semibold tracking-[-2px] text-black leading-[0.95]">
                Manage proposals,
                <br />
                teams, and delivery.
              </h1>

              <p className="text-lg text-neutral-600 max-w-xl leading-relaxed">
                Access proposal generation workflows, resource allocation,
                project onboarding, cost estimation, and delivery planning from
                a unified workspace.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 pt-4">
              <div className="bg-white border border-neutral-200 rounded-xl p-5">
                <div className="text-2xl font-semibold text-black">500+</div>
                <div className="text-sm text-neutral-500 mt-1">
                  Proposals Generated
                </div>
              </div>

              <div className="bg-white border border-neutral-200 rounded-xl p-5">
                <div className="text-2xl font-semibold text-black">120+</div>
                <div className="text-sm text-neutral-500 mt-1">
                  Active Resources
                </div>
              </div>

              <div className="bg-white border border-neutral-200 rounded-xl p-5">
                <div className="text-2xl font-semibold text-black">24/7</div>
                <div className="text-sm text-neutral-500 mt-1">
                  AI Assistance
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <div className="px-4 py-2 rounded-full bg-white border border-neutral-200 text-sm text-neutral-700">
                Proposal Automation
              </div>

              <div className="px-4 py-2 rounded-full bg-white border border-neutral-200 text-sm text-neutral-700">
                Resource Matching
              </div>

              <div className="px-4 py-2 rounded-full bg-white border border-neutral-200 text-sm text-neutral-700">
                Cost Estimation
              </div>
            </div>
          </motion.div>

          {/* RIGHT SIDE */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md mx-auto"
          >
            <div className="bg-white border border-neutral-200 rounded-xl p-8 shadow-[0_24px_48px_-8px_rgba(0,0,0,0.12)]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-semibold text-black">Sign in</h2>

                  <p className="text-sm text-neutral-500 mt-2">
                    Access the administrative workspace.
                  </p>
                </div>

                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="h-9 w-9 rounded-full border border-neutral-200 flex items-center justify-center"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email or Phone
                  </label>

                  <input
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEmailOrPhone(v);
                      setRole(pickInitialRoleFromEmail(v));
                    }}
                    placeholder="name@company.com"
                    className="w-full h-11 px-4 rounded-md border border-neutral-200 bg-white focus:border-[#00d4a4] outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Password
                  </label>

                  <div className="relative">
                    <KeyRound
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                    />

                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full h-11 pl-11 pr-4 rounded-md border border-neutral-200 bg-white focus:border-[#00d4a4] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Role
                  </label>

                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-11 px-4 rounded-md border border-neutral-200 bg-white focus:border-[#00d4a4] outline-none"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.role} value={r.role}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {error && <div className="text-sm text-red-500">{error}</div>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 rounded-full bg-black text-white text-sm font-medium flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    "Signing in..."
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-neutral-100">
                  <p className="text-xs text-neutral-500">Demo accounts:</p>

                  <div className="mt-2 space-y-1 text-xs text-neutral-600">
                    <div>super@corp.com</div>
                    <div>manager@corp.com</div>
                    <div>admin@corp.com</div>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
