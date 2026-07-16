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
import FloatingBackground from "../components/common/FloatingBackground";
import Threads from "../components/common/Threads";
import RotatingText from "../components/common/RotatingText";

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

export default function AdminLogin({ onLogin, onCancel, isModal }) {
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
    <div className="relative min-h-screen overflow-hidden bg-[#fafafa]">
      <FloatingBackground />
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.15] transform-gpu">
        <Threads
          color={[0.0, 0.42, 0.36]}
          amplitude={1.2}
          distance={0.2}
          enableMouseInteraction={true}
        />
      </div>

      <div className="relative z-10 min-h-screen max-w-container-max mx-auto px-6 md:px-margin-desktop">
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-screen py-16">
          {/* LEFT SIDE */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-stack-lg"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-md">
              <Sparkles size={16} className="text-primary animate-pulse" />
              <span className="font-label-caps text-primary tracking-wider uppercase font-bold text-[11px]">
                Internal Operations Platform
              </span>
            </div>

            <div className="space-y-6">
              <h1 className="font-display-lg text-5xl lg:text-7xl text-navy-accent leading-[1.05] text-left flex flex-col items-start font-extrabold tracking-tight">
                <span>Manage your</span>
                <RotatingText
                  texts={[
                    "Proposals",
                    "Teams",
                    "Delivery",
                    "Operations"
                  ]}
                  mainClassName="text-primary overflow-hidden py-1 justify-start"
                  staggerFrom="last"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-120%" }}
                  staggerDuration={0.025}
                  splitLevelClassName="overflow-hidden pb-1"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  rotationInterval={3000}
                  splitBy="characters"
                  auto
                  loop
                />
              </h1>

              <p className="font-body-lg text-on-surface-variant max-w-xl text-lg leading-relaxed text-left">
                Access proposal generation workflows, resource allocation, project onboarding, cost estimation, and delivery planning from a unified, intelligent workspace.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 pt-6">
              <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-6 shadow-xl shadow-primary/5 hover:-translate-y-1 transition-transform duration-300">
                <div className="text-3xl font-extrabold text-navy-accent font-display tracking-tight">500+</div>
                <div className="text-xs font-bold text-on-surface-variant mt-2 font-label-caps uppercase tracking-wider">
                  Proposals
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-6 shadow-xl shadow-primary/5 hover:-translate-y-1 transition-transform duration-300">
                <div className="text-3xl font-extrabold text-navy-accent font-display tracking-tight">120+</div>
                <div className="text-xs font-bold text-on-surface-variant mt-2 font-label-caps uppercase tracking-wider">
                  Resources
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-6 shadow-xl shadow-primary/5 hover:-translate-y-1 transition-transform duration-300">
                <div className="text-3xl font-extrabold text-navy-accent font-display tracking-tight">24/7</div>
                <div className="text-xs font-bold text-on-surface-variant mt-2 font-label-caps uppercase tracking-wider">
                  AI Agents
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT SIDE */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-[430px] mx-auto bg-white border border-neutral-200 shadow-2xl z-10 overflow-hidden rounded-xl px-6 py-8 text-left sm:px-10 sm:py-10"
          >
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="font-headline-md text-2xl font-semibold text-[#0a0a0a]">Sign in</h2>
                  <p className="mt-2 font-body-md text-sm text-[#5a5a5c]">
                    Access the administrative workspace.
                  </p>
                </div>

                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="h-9 w-9 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-100 transition-colors"
                  >
                    <X size={16} className="text-neutral-500" />
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-[#3a3a3c]">
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
                    className="h-11 w-full rounded-md border border-[#e5e5e5] bg-white px-4 font-body-md text-base text-[#0a0a0a] outline-none transition-all duration-200 placeholder:text-[#a8a8aa] focus:border-2 focus:border-[#00d4a4]"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-[#3a3a3c]">
                    Password
                  </label>

                  <div className="relative">
                    <KeyRound
                      size={14}
                      className="absolute left-3.5 top-3.5 text-[#a8a8aa]"
                    />

                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="h-11 w-full rounded-md border border-[#e5e5e5] bg-white pl-10 pr-4 font-body-md text-base text-[#0a0a0a] outline-none transition-all duration-200 placeholder:text-[#a8a8aa] focus:border-2 focus:border-[#00d4a4]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-[#3a3a3c]">
                    Role
                  </label>

                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="h-11 w-full rounded-md border border-[#e5e5e5] bg-white px-4 font-body-md text-base text-[#0a0a0a] outline-none transition-all duration-200 focus:border-2 focus:border-[#00d4a4]"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.role} value={r.role}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {error && <p className="text-[10px] font-bold text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 flex h-11 w-full items-center justify-center rounded-full bg-primary-container font-button-text text-sm font-semibold uppercase text-navy-accent transition-all duration-200 hover:shadow-md active:translate-y-px"
                >
                  {submitting ? (
                    "Signing in..."
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={16} className="ml-2" />
                    </>
                  )}
                </button>

                <div className="pt-4 border-t border-neutral-100">
                  <p className="font-body-md text-xs text-[#5a5a5c]">Demo accounts:</p>

                  <div className="mt-2 space-y-1 font-body-md text-xs text-neutral-600">
                    <div>super@corp.com</div>
                    <div>manager@corp.com</div>
                    <div>admin@corp.com</div>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <p className="font-body-md text-sm text-[#5a5a5c]">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => window.location.href = "/admin/sign-up"}
                      className="text-primary font-bold hover:underline ml-1"
                    >
                      Sign up here
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
