import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Check, KeyRound, Mail, Phone, Building2, User, ArrowLeft, RefreshCw } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import FloatingBackground from "../components/common/FloatingBackground";

export default function Landing() {
  const { setUser, setActiveStep } = useAppStore();
  
  // Single entrance validation
  const [entranceInput, setEntranceInput] = useState("");
  const [isValidEntrance, setIsValidEntrance] = useState(false);
  const [entranceError, setEntranceError] = useState("");

  // View states: "entrance" | "login" | "register" | "otp" | "forgot"
  const [view, setView] = useState("entrance");
  const [otpPurpose, setOtpPurpose] = useState("login"); // "login" | "register" | "forgot"
  
  // Login Form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  
  // Register Form
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regCompany, setRegCompany] = useState("");
  const [regPhone, setRegPhone] = useState("");

  // Forgot Password
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // OTP Verification state
  const [otpCode, setOtpCode] = useState("");
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const [otpStatus, setOtpStatus] = useState(""); // "" | "verifying" | "success" | "error"

  const [error, setError] = useState("");

  const validateEntrance = (value) => {
    setEntranceInput(value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9]{7,15}$/;

    if (!value) {
      setEntranceError("");
      setIsValidEntrance(false);
      return;
    }

    if (emailRegex.test(value) || phoneRegex.test(value)) {
      setEntranceError("");
      setIsValidEntrance(true);
    } else {
      setEntranceError("Please enter a valid email or phone number.");
      setIsValidEntrance(false);
    }
  };

  const handleEntranceContinue = () => {
    if (!isValidEntrance) return;
    setError("");
    
    // If it's a test email, go to login. Else, go to registration.
    if (entranceInput.includes("acme") || entranceInput.includes("hello") || entranceInput.includes("admin")) {
      setEmail(entranceInput);
      setView("login");
    } else {
      setRegEmail(entranceInput);
      setRegPhone(entranceInput.match(/^\+?[0-9]/) ? entranceInput : "");
      setView("register");
    }
  };

  const startOtpResendTimer = () => {
    setOtpResendTimer(30);
    const interval = setInterval(() => {
      setOtpResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setOtpPurpose("login");
    setView("otp");
    startOtpResendTimer();
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regPassword || !regCompany || !regPhone) {
      setError("All fields are required.");
      return;
    }
    setError("");
    setOtpPurpose("register");
    setView("otp");
    startOtpResendTimer();
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError("Please enter your email.");
      return;
    }
    setError("");
    setOtpPurpose("forgot");
    setView("otp");
    startOtpResendTimer();
  };

  const handleOtpVerify = (e) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      setError("Please enter a valid OTP code.");
      return;
    }
    setError("");
    setOtpStatus("verifying");

    setTimeout(() => {
      if (otpCode === "1234") {
        setOtpStatus("success");
        setTimeout(() => {
          if (otpPurpose === "forgot") {
            setView("reset-password");
            setOtpStatus("");
            setOtpCode("");
          } else {
            setUser({ 
              emailOrPhone: email || regEmail, 
              fullName: regFullName || "Alex Rivera", 
              companyName: regCompany || "Zenith Brands Ltd",
              isVerified: true 
            });
            setActiveStep(1); // Proceed to Onboarding
          }
        }, 1000);
      } else {
        setOtpStatus("error");
        setError("Invalid OTP code. Use test code: 1234");
      }
    }, 1200);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    alert("Password updated successfully!");
    setView("login");
  };

  return (
    <div className="relative min-h-[calc(100vh-73px)] flex items-center justify-center px-4 overflow-hidden py-12">
      <FloatingBackground />

      <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10 py-12">
        
        {/* Animated Brand Header */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-100/50 shadow-sm mb-6"
          >
            <Sparkles size={13} className="text-brand-500 animate-pulse" />
            <span className="text-xs font-semibold text-brand-700 tracking-tight">
              AI Proposal Engine Active
            </span>
          </motion.div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black font-display tracking-tight text-neutral-900 leading-none max-w-3xl mx-auto">
            Ready to See What We Can Build Together?
          </h1>
          <p className="text-base sm:text-lg text-neutral-500 font-medium max-w-xl mx-auto mt-4 leading-relaxed">
            Start your discovery phase. We'll generate an AI blueprint tailored to your bespoke needs.
          </p>
        </div>

        {/* Auth Card Container */}
        <div className="max-w-md mx-auto w-full bg-white/80 backdrop-blur-md border border-neutral-200/80 rounded-3xl p-8 shadow-premium text-left">
          <AnimatePresence mode="wait">
            
            {/* ENTRANCE GATE */}
            {view === "entrance" && (
              <motion.div
                key="entrance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-white border border-neutral-200 rounded-2xl p-3 shadow-soft flex items-center gap-2">
                  <input
                    type="text"
                    value={entranceInput}
                    onChange={(e) => validateEntrance(e.target.value)}
                    placeholder="Email Address or Phone Number"
                    className="flex-1 bg-transparent text-xs font-semibold outline-none px-2 text-neutral-800"
                  />
                  <button
                    onClick={handleEntranceContinue}
                    disabled={!isValidEntrance}
                    className={`h-10 px-5 rounded-xl text-xs font-bold flex items-center justify-center transition-all duration-200 ${
                      isValidEntrance
                        ? "bg-brand-500 text-white hover:bg-brand-600 shadow-md cursor-pointer"
                        : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                    }`}
                  >
                    Continue
                    <ArrowRight size={14} className="ml-1.5" />
                  </button>
                </div>
                {entranceError && <p className="text-[10px] font-bold text-red-500 pl-2">{entranceError}</p>}
                
                <p className="text-[10px] text-neutral-400 text-center font-medium mt-2">
                  Use email <strong className="text-neutral-500 font-bold">onboarding@acme.com</strong> to simulate existing login. Any other email triggers sign up.
                </p>
              </motion.div>
            )}

            {/* 1. LOGIN VIEW */}
            {view === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="flex items-center space-x-2 mb-6">
                  <button
                    onClick={() => { setEntranceInput(""); setIsValidEntrance(false); setView("entrance"); }}
                    className="p-1.5 rounded-lg hover:bg-neutral-50 text-neutral-500 transition-colors"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <h3 className="text-lg font-bold text-neutral-800 tracking-tight">Login to Workspace</h3>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Email Address</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-3.5 text-neutral-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:bg-white focus:border-brand-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Password</label>
                    <div className="relative">
                      <KeyRound size={14} className="absolute left-3.5 top-3.5 text-neutral-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:bg-white focus:border-brand-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center space-x-2 text-neutral-600 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-neutral-300 text-brand-500 focus:ring-brand-500"
                      />
                      <span>Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => { setError(""); setView("forgot"); }}
                      className="text-brand-600 font-bold hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {error && <p className="text-[10px] font-bold text-red-500">{error}</p>}

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center justify-center transition-all duration-200 shadow-md shadow-brand-500/10 cursor-pointer"
                  >
                    Authenticate
                    <ArrowRight size={14} className="ml-1.5" />
                  </button>
                </form>
              </motion.div>
            )}

            {/* 2. REGISTER VIEW */}
            {view === "register" && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="flex items-center space-x-2 mb-6">
                  <button
                    onClick={() => { setEntranceInput(""); setIsValidEntrance(false); setView("entrance"); }}
                    className="p-1.5 rounded-lg hover:bg-neutral-50 text-neutral-500 transition-colors"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <h3 className="text-lg font-bold text-neutral-800 tracking-tight">Create Corporate Account</h3>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Full Name</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3.5 top-3.5 text-neutral-400" />
                      <input
                        type="text"
                        required
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="Alex Rivera"
                        className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:bg-white focus:border-brand-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Company Name</label>
                    <div className="relative">
                      <Building2 size={14} className="absolute left-3.5 top-3.5 text-neutral-400" />
                      <input
                        type="text"
                        required
                        value={regCompany}
                        onChange={(e) => setRegCompany(e.target.value)}
                        placeholder="Zenith Brands Ltd"
                        className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:bg-white focus:border-brand-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-3.5 text-neutral-400" />
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+1 555-0199"
                        className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:bg-white focus:border-brand-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Email Address</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-3.5 text-neutral-400" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:bg-white focus:border-brand-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Password</label>
                    <div className="relative">
                      <KeyRound size={14} className="absolute left-3.5 top-3.5 text-neutral-400" />
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:bg-white focus:border-brand-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {error && <p className="text-[10px] font-bold text-red-500">{error}</p>}

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center justify-center transition-all duration-200 shadow-md shadow-brand-500/10 cursor-pointer"
                  >
                    Register Workspace
                    <ArrowRight size={14} className="ml-1.5" />
                  </button>
                </form>
              </motion.div>
            )}

            {/* 3. OTP VERIFICATION VIEW */}
            {view === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="flex items-center space-x-2 mb-6">
                  <button
                    onClick={() => { setError(""); setView(otpPurpose === "forgot" ? "forgot" : otpPurpose === "register" ? "register" : "login"); }}
                    className="p-1.5 rounded-lg hover:bg-neutral-50 text-neutral-500 transition-colors"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <h3 className="text-lg font-bold text-neutral-800 tracking-tight">Email OTP Verification</h3>
                </div>

                <p className="text-xs text-neutral-500 font-medium leading-relaxed mb-6">
                  We've simulated sending a security code to your email. Enter code <strong className="text-neutral-800 font-bold">1234</strong> to verify your account.
                </p>

                <form onSubmit={handleOtpVerify} className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-2 text-center">4-Digit Security Code</label>
                    <input
                      type="text"
                      maxLength={4}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="••••"
                      className="w-full text-center text-xl font-bold tracking-widest bg-neutral-50 border border-neutral-200 rounded-xl py-3.5 outline-none focus:bg-white focus:border-brand-500 transition-all duration-200"
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-neutral-400 font-semibold">Didn't receive code?</span>
                    {otpResendTimer > 0 ? (
                      <span className="text-neutral-400 font-bold">Resend in {otpResendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={startOtpResendTimer}
                        className="text-brand-600 font-bold hover:underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  {otpStatus === "verifying" && (
                    <div className="flex items-center justify-center space-x-2 text-xs text-brand-600 font-semibold py-2">
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Verifying securely...</span>
                    </div>
                  )}

                  {otpStatus === "success" && (
                    <div className="flex items-center justify-center space-x-2 text-xs text-green-600 font-bold py-2">
                      <Check size={14} strokeWidth={3} />
                      <span>Security verification successful!</span>
                    </div>
                  )}

                  {error && <p className="text-[10px] font-bold text-red-500 text-center">{error}</p>}

                  <button
                    type="submit"
                    disabled={otpStatus === "verifying" || otpStatus === "success"}
                    className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center justify-center transition-all duration-200 shadow-md shadow-brand-500/10 cursor-pointer disabled:opacity-50"
                  >
                    Verify Code
                  </button>
                </form>
              </motion.div>
            )}

            {/* 4. FORGOT PASSWORD VIEW */}
            {view === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="flex items-center space-x-2 mb-6">
                  <button
                    onClick={() => { setError(""); setView("login"); }}
                    className="p-1.5 rounded-lg hover:bg-neutral-50 text-neutral-500 transition-colors"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <h3 className="text-lg font-bold text-neutral-800 tracking-tight">Forgot Password</h3>
                </div>

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Registered Email</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-3.5 text-neutral-400" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:bg-white focus:border-brand-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {error && <p className="text-[10px] font-bold text-red-500">{error}</p>}

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center justify-center transition-all duration-200 shadow-md shadow-brand-500/10 cursor-pointer"
                  >
                    Send OTP Code
                    <ArrowRight size={14} className="ml-1.5" />
                  </button>
                </form>
              </motion.div>
            )}

            {/* 5. RESET PASSWORD VIEW */}
            {view === "reset-password" && (
              <motion.div
                key="reset-password"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <h3 className="text-lg font-bold text-neutral-800 tracking-tight mb-6">Choose New Password</h3>
                
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-brand-500 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-brand-500 transition-all duration-200"
                    />
                  </div>

                  {error && <p className="text-[10px] font-bold text-red-500">{error}</p>}

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center justify-center transition-all duration-200 shadow-md shadow-brand-500/10 cursor-pointer"
                  >
                    Update Password
                  </button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
