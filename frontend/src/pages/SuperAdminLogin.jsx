import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Sparkles, ArrowRight, Mail, Lock, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import FloatingBackground from "../components/common/FloatingBackground";
import Threads from "../components/common/Threads";
import RotatingText from "../components/common/RotatingText";

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const { setUser } = useAppStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Hardcoded credentials
  const SUPER_ADMIN_EMAIL = "superadmin@ve.com";
  const SUPER_ADMIN_PASSWORD = "Super@123";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 650));

    if (email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
      const loggedInUser = {
        emailOrPhone: email,
        role: "super-admin",
        isVerified: true,
      };

      setUser(loggedInUser);
      navigate("/super-admin-dashboard");
    } else {
      setError("Invalid Super Admin Email or Password");
      setSubmitting(false);
    }
  };

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
            className="space-y-stack-lg hidden lg:block"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-md">
              <Sparkles size={16} className="text-primary animate-pulse" />
              <span className="font-label-caps text-primary tracking-wider uppercase font-bold text-[11px]">
                Master Control Platform
              </span>
            </div>

            <div className="space-y-6">
              <h1 className="font-display-lg text-5xl lg:text-7xl text-navy-accent leading-[1.05] text-left flex flex-col items-start font-extrabold tracking-tight">
                <span>Govern your</span>
                <RotatingText
                  texts={[
                    "Workspaces",
                    "Security",
                    "System",
                    "Permissions"
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
                Access root controls, configure system-wide parameters, and oversee the entire digital delivery ecosystem.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 pt-6">
              <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-6 shadow-xl shadow-primary/5 hover:-translate-y-1 transition-transform duration-300">
                <div className="text-3xl font-extrabold text-navy-accent font-display tracking-tight">100%</div>
                <div className="text-xs font-bold text-on-surface-variant mt-2 font-label-caps uppercase tracking-wider">
                  Uptime
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-6 shadow-xl shadow-primary/5 hover:-translate-y-1 transition-transform duration-300">
                <div className="text-3xl font-extrabold text-navy-accent font-display tracking-tight">256-bit</div>
                <div className="text-xs font-bold text-on-surface-variant mt-2 font-label-caps uppercase tracking-wider">
                  Encryption
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-6 shadow-xl shadow-primary/5 hover:-translate-y-1 transition-transform duration-300">
                <div className="text-3xl font-extrabold text-navy-accent font-display tracking-tight">Zero</div>
                <div className="text-xs font-bold text-on-surface-variant mt-2 font-label-caps uppercase tracking-wider">
                  Breaches
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
                  <h2 className="font-headline-md text-2xl font-semibold text-[#0a0a0a]">Super Admin</h2>
                  <p className="mt-2 font-body-md text-sm text-[#5a5a5c]">
                    Secure access to the master workspace.
                  </p>
                </div>
                
                <button
                  onClick={() => navigate("/admin/login")}
                  className="h-9 w-9 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-neutral-100 transition-colors"
                  title="Return to Admin Login"
                >
                  <X size={16} className="text-neutral-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-[#3a3a3c]">
                    Email
                  </label>

                  <div className="relative mt-2">
                    <Mail
                      size={16}
                      className="absolute left-4 top-[14px] text-[#a8a8aa]"
                    />

                    <input
                      type="email"
                      placeholder="superadmin@ve.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 w-full rounded-md border border-[#e5e5e5] bg-white pl-11 pr-4 font-body-md text-base text-[#0a0a0a] outline-none transition-all duration-200 placeholder:text-[#a8a8aa] focus:border-2 focus:border-[#00d4a4]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-[#3a3a3c]">
                    Password
                  </label>

                  <div className="relative mt-2">
                    <Lock
                      size={16}
                      className="absolute left-4 top-[14px] text-[#a8a8aa]"
                    />

                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 w-full rounded-md border border-[#e5e5e5] bg-white pl-11 pr-4 font-body-md text-base text-[#0a0a0a] outline-none transition-all duration-200 placeholder:text-[#a8a8aa] focus:border-2 focus:border-[#00d4a4]"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-[10px] font-bold text-red-500 text-center">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 flex h-11 w-full items-center justify-center rounded-full bg-primary-container font-button-text text-sm font-semibold uppercase text-navy-accent transition-all duration-200 hover:shadow-md active:translate-y-px"
                >
                  {submitting ? (
                    "Authenticating..."
                  ) : (
                    <>
                      Authenticate
                      <ArrowRight size={16} className="ml-2" />
                    </>
                  )}
                </button>

                <div className="mt-8 border-t border-neutral-100 pt-6 text-center">
                  <p className="font-label-caps text-[10px] tracking-wider text-neutral-400 uppercase mb-3">
                    Demo Credentials
                  </p>
                  <p className="font-body-md text-xs text-neutral-600">
                    Email: <span className="text-primary font-bold ml-1">superadmin@ve.com</span>
                  </p>
                  <p className="font-body-md text-xs text-neutral-600 mt-1">
                    Password: <span className="text-primary font-bold ml-1">Super@123</span>
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