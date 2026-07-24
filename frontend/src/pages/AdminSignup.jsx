import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Sparkles, ArrowRight, X } from "lucide-react";
import FloatingBackground from "../components/common/FloatingBackground";
import Threads from "../components/common/Threads";
import RotatingText from "../components/common/RotatingText";
import { apiFetch } from "../utils/api";

export default function AdminSignup({ onCancel, isModal }) {
  const navigate = useNavigate();

 const [formData, setFormData] = useState({
  full_name: "",
  email: "",
  password: "",
  company_name: "",
  phone: "",
  role: "admin",
});
  
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // If Super Admin is selected, redirect to Super Admin Login
    if (name === "role" && value === "super-admin") {
      navigate("/super-admin-login");
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
if (!/^[0-9]{10}$/.test(formData.phone)) {
  alert("Please enter a valid 10-digit phone number.");
  return;
}
    setSubmitting(true);
    
    try {
      const roleToSubmit = formData.role.toUpperCase(); // Ensure role matches backend Enum (ADMIN, MANAGER)

 await apiFetch("/admin/requests/request-access", {
  method: "POST",
  body: JSON.stringify({
    full_name: formData.full_name,
    email: formData.email,
    password: formData.password,
    company_name: formData.company_name,
    phone: formData.phone,
    role: roleToSubmit,
  }),
});

     alert(
  "Request submitted successfully.\n\nYour account is pending Super Admin approval.\nYou will be able to log in after approval."
);
      navigate("/admin/login");
    } catch (err) {
      alert(`Registration Failed: ${err.message}`);
    } finally {
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
                Internal Operations Platform
              </span>
            </div>

            <div className="space-y-6">
              <h1 className="font-display-lg text-5xl lg:text-7xl text-navy-accent leading-[1.05] text-left flex flex-col items-start font-extrabold tracking-tight">
                <span>Manage our</span>
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
                Register as an administrator to manage proposals, oversee resources, and accelerate your digital delivery operations.
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
            className="w-full max-w-[480px] mx-auto bg-white border border-neutral-200 shadow-2xl z-10 overflow-hidden rounded-xl px-6 py-8 text-left sm:px-10 sm:py-10"
          >
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="font-headline-md text-2xl font-semibold text-[#0a0a0a]">Register Admin</h2>
                  <p className="mt-2 font-body-md text-sm text-[#5a5a5c]">
                    Create your workspace account.
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
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="h-11 w-full rounded-md border border-[#e5e5e5] bg-white px-4 font-body-md text-base text-[#0a0a0a] outline-none transition-all duration-200 placeholder:text-[#a8a8aa] focus:border-2 focus:border-[#00d4a4]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-[#3a3a3c]">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-11 w-full rounded-md border border-[#e5e5e5] bg-white px-4 font-body-md text-base text-[#0a0a0a] outline-none transition-all duration-200 placeholder:text-[#a8a8aa] focus:border-2 focus:border-[#00d4a4]"
                    required
                  />
                </div>
<div>
  <label className="mb-2 block font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-[#3a3a3c]">
    Company Name
  </label>

  <input
    type="text"
    name="company_name"
    placeholder="Company Name"
    value={formData.company_name}
    onChange={handleChange}
    className="h-11 w-full rounded-md border border-[#e5e5e5] bg-white px-4 font-body-md text-base text-[#0a0a0a] outline-none transition-all duration-200 placeholder:text-[#a8a8aa] focus:border-2 focus:border-[#00d4a4]"
    required
  />
</div>
<div>
  <label className="mb-2 block font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-[#3a3a3c]">
    Phone Number
  </label>

  <input
    type="text"
    name="phone"
    placeholder="Phone Number"
    value={formData.phone}
    onChange={handleChange}
    className="h-11 w-full rounded-md border border-[#e5e5e5] bg-white px-4 font-body-md text-base text-[#0a0a0a] outline-none transition-all duration-200 placeholder:text-[#a8a8aa] focus:border-2 focus:border-[#00d4a4]"
    required
  />
</div>
                <div>
                  <label className="mb-2 block font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-[#3a3a3c]">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="h-11 w-full rounded-md border border-[#e5e5e5] bg-white px-4 font-body-md text-base text-[#0a0a0a] outline-none transition-all duration-200 placeholder:text-[#a8a8aa] focus:border-2 focus:border-[#00d4a4]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-[#3a3a3c]">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="h-11 w-full rounded-md border border-[#e5e5e5] bg-white px-4 font-body-md text-base text-[#0a0a0a] outline-none transition-all duration-200 focus:border-2 focus:border-[#00d4a4]"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="super-admin">Super Admin</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 flex h-11 w-full items-center justify-center rounded-full bg-primary-container font-button-text text-sm font-semibold uppercase text-navy-accent transition-all duration-200 hover:shadow-md active:translate-y-px"
                >
                  {submitting ? (
                    "Registering..."
                  ) : (
                    <>
                      Create Account
                      <ArrowRight size={16} className="ml-2" />
                    </>
                  )}
                </button>

                <div className="pt-5 text-center">
                  <p className="font-body-md text-sm text-[#5a5a5c]">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/admin/login")}
                      className="text-primary font-bold hover:underline ml-1"
                    >
                      Log in here
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