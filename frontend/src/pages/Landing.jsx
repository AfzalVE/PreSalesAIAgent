import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  KeyRound,
  Mail,
  ArrowLeft,
  RefreshCw,
  X,
  Sparkles,
  ShieldCheck,
  DollarSign,
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import CardSwap, { Card } from "../components/common/CardSwap";
import FlowingMenu from "../components/common/FlowingMenu";
import Dock from "../components/common/Dock";
import Threads from "../components/common/Threads";
import RotatingText from "../components/common/RotatingText";

const countryCodes = [
  "US +1",
  "IN +91",
  "UK +44",
  "CA +1",
  "AU +61",
  "UAE +971",
  "SG +65",
];
const Counter = ({
  end,
  duration = 2000,
  delay = 0,
  suffix = "",
  prefix = "",
  decimals = 0,
  start = false,
}) => {
 

export default function Landing({ onAdminClick }) {
  const { setUser, setActiveStep } = useAppStore();

  // Single entrance validation
  const [entranceInput, setEntranceInput] = useState("");
  const [isValidEntrance, setIsValidEntrance] = useState(false);
  const [entranceError, setEntranceError] = useState("");

  // View states: "entrance" | "login" | "register" | "otp" | "forgot" | "reset-password"
  const [view, setView] = useState("entrance");
  const [otpPurpose, setOtpPurpose] = useState("login"); // "login" | "register" | "forgot"

  // Login Form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Register Form
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regCountryCode, setRegCountryCode] = useState("US +1");
  const [regPhone, setRegPhone] = useState("");
  const [isNotRobot, setIsNotRobot] = useState(false);

  // Forgot Password
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // OTP Verification state
  const [otpCode, setOtpCode] = useState("");
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const [otpStatus, setOtpStatus] = useState(""); // "" | "verifying" | "success" | "error"

  const [error, setError] = useState("");

  // Modal display state
  const [showAuthModal, setShowAuthModal] = useState(false);
const statsRef = useRef(null);

const [startCounter, setStartCounter] = useState(false);

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        setStartCounter(true);
        observer.disconnect();
      }
    },
    {
      threshold: 0.3,
    }
  );

  if (statsRef.current) {
    observer.observe(statsRef.current);
  }

  return () => observer.disconnect();
}, []);
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
    if (
      entranceInput.includes("acme") ||
      entranceInput.includes("hello") ||
      entranceInput.includes("admin")
    ) {
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
    if (!regFullName || !regEmail || !regPhone || !isNotRobot) {
      setError("Please complete all fields and confirm you are not a robot.");
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
              companyName: "Sovereign Enterprise",
              isVerified: true,
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

  // Open auth modal helpers
  const triggerAuthFlow = (initialView = "entrance") => {
    setError("");
    setView(initialView);
    setShowAuthModal(true);
  };

  // Reveal-on-scroll + card hover-border effects (ported 1:1 from the original <script>)
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-12");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll("section").forEach((section) => {
      // Exclude hero for immediate impact
      if (!section.classList.contains("pt-48")) {
        section.classList.add(
          "transition-all",
          "duration-[1200ms]",
          "ease-out",
          "opacity-0",
          "translate-y-12",
        );
        observer.observe(section);
      }
    });

    const cards = document.querySelectorAll(".aspect-square");
    const onEnter = (e) => {
      e.currentTarget.style.borderColor = "rgba(0, 107, 93, 0.4)";
    };
    const onLeave = (e) => {
      e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.05)";
    };
    cards.forEach((card) => {
      card.addEventListener("mouseenter", onEnter);
      card.addEventListener("mouseleave", onLeave);
    });

    return () => {
      observer.disconnect();
      cards.forEach((card) => {
        card.removeEventListener("mouseenter", onEnter);
        card.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  return (
    <div className="relative font-body-md text-on-surface bg-[#f8f9ff] min-h-screen overflow-x-hidden selection:bg-primary-container selection:text-navy-accent">
      {/* Page-scoped local styles */}
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        body {
          background-color: #f8f9ff;
          color: #0b1c30;
          overflow-x: hidden;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(241, 245, 249, 0.8);
          box-shadow: 0 8px 32px 0 rgba(0, 107, 93, 0.05);
        }

        .bg-grid {
          background-image: radial-gradient(circle at 1px 1px, #e2e8f0 1px, transparent 0);
          background-size: 40px 40px;
        }

        .floating-blob {
          position: fixed;
          pointer-events: none;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(0, 255, 225, 0.15) 0%, rgba(0, 107, 93, 0) 70%);
          filter: blur(60px);
          z-index: -1;
          animation: float 20s infinite alternate ease-in-out;
        }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(100px, 50px) scale(1.1); }
          100% { transform: translate(-50px, 100px) scale(0.9); }
        }

        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .ai-border {
          border: 1px solid transparent;
          background-image: linear-gradient(#fff, #fff), linear-gradient(45deg, #00ffe1, #006b5d);
          background-origin: border-box;
          background-clip: padding-box, border-box;
        }

        @keyframes infinite-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-infinite-scroll {
          display: flex;
          width: max-content;
          animation: infinite-scroll 45s linear infinite;
        }
        .animate-infinite-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Subtle Background Decoration */}
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0"></div>
      <div className="floating-blob top-[-200px] left-[-200px]"></div>
      <div
        className="floating-blob bottom-[-200px] right-[-200px]"
        style={{ animationDelay: "-7s" }}
      ></div>

      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-[60] bg-surface/80 backdrop-blur-md border-b border-outline-variant/20 shadow-sm">
        <div className="flex justify-between items-center px-6 md:px-margin-desktop py-4 max-w-container-max mx-auto">
          <div className="flex items-center gap-2">
            <img
              src="/ve.png"
              alt="Pre Sales Platform"
              className="h-9 w-auto object-contain"
            />
            <span className="font-display-lg text-2xl text-navy-accent font-extrabold tracking-tight">
              Pre Sales Platform
            </span>
          </div>
          <div className="hidden md:flex items-center gap-stack-lg">
            <a
              className="font-body-md text-navy-accent font-semibold border-b-2 border-primary py-1"
              href="#"
            >
              Platform
            </a>
            <a
              className="font-body-md text-on-surface-variant hover:text-navy-accent transition-colors py-1"
              href="#services"
            >
              Services
            </a>
            <a
              className="font-body-md text-on-surface-variant hover:text-navy-accent transition-colors py-1"
              href="#pricing"
            >
              Pricing
            </a>
            <a
              className="font-body-md text-on-surface-variant hover:text-navy-accent transition-colors py-1"
              href="#about"
            >
              About
            </a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onAdminClick}
              className="border border-outline/30 bg-white/50 px-4 py-2.5 rounded-lg font-button-text hover:bg-white transition-all text-navy-accent font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 text-sm"
            >
              Admin Login
            </button>
            <button
              onClick={() => triggerAuthFlow("register")}
              className="bg-primary-container text-navy-accent px-6 py-2.5 rounded-lg font-button-text shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold text-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Subtle WebGL Threads Background */}
        <div className="absolute inset-x-0 top-0 h-[850px] pointer-events-none z-0 opacity-[0.25]">
          <Threads
            color={[0.0, 0.42, 0.36]}
            amplitude={1.0}
            distance={0.2}
            enableMouseInteraction={true}
          />
        </div>
        {/* Hero Section */}
        <section className="max-w-container-max mx-auto px-6 md:px-margin-desktop grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pt-48 pb-24">
          <div className="space-y-stack-lg z-10 text-left">
            {/* <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 px-4 py-1.5 rounded-full">
              <span
                className="material-symbols-outlined text-[18px] text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              <span className="font-label-caps text-primary tracking-wider uppercase font-semibold">
                v2.0 Pre-Sales Engine
              </span>
            </div> */}
            <h1 className="font-display-lg text-5xl md:text-7xl text-navy-accent leading-[1.1] text-left flex flex-col items-start">
              <span>AI Proposal</span>
              <RotatingText
                texts={[
                  "Generator",
                  "Estimation Engine",
                  "Scoping Assistant",
                  "Broker Agent",
                ]}
                mainClassName="text-primary overflow-hidden py-0.5 justify-start rounded-lg"
                staggerFrom="first"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.02}
                splitLevelClassName="overflow-hidden pb-0.5"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={2500}
                splitBy="characters"
                auto
                loop
              />
            </h1>
            <p className="font-body-lg text-on-surface-variant max-w-xl text-lg leading-relaxed text-left">
              Empower your sales team with technical documentation, budget
              estimates, and roadmap proposals built in seconds through natural
              language intelligence.
            </p>
            <div className="flex flex-wrap gap-4 pt-6">
              <button
                onClick={() => triggerAuthFlow("register")}
                className="bg-primary-container text-navy-accent px-8 py-4 rounded-xl font-button-text text-lg shadow-lg hover:shadow-primary/20 hover:-translate-y-1 transition-all flex items-center gap-2 font-bold"
              >
                Get Started{" "}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <button
                onClick={() => triggerAuthFlow("entrance")}
                className="border border-outline/30 bg-white/50 px-8 py-4 rounded-xl font-button-text text-lg hover:bg-white transition-all text-navy-accent font-medium"
              >
                Book Consultation
              </button>
            </div>
            <div className="flex items-center gap-6 pt-12">
              <div className="flex -space-x-3">
                <img
                  alt="User profile"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPwX_vsBUyHzGEsMy2hkXB-NzuzV70AAf2CtPxTYsQCYN1eCfPVjtJaxryF9hOUSSzsdKNpZ0w4y5USQ74ROoOGS03tVwkjm_s-EKvkdg7X2fC3ksMdanBzMbkCdVUx_7UbfEJNWD4B2jznTz-5L0-bJYzdnpvaiuaUHqzajNMSYrrWge7V5GaMpD8J8jacg1WvipyoKz4EfRaDILkFMylhsQ6pF9wq9D_q_utCrl03nYTZgcYmthyYA"
                />
                <img
                  alt="User profile"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBb7cckTclbNPfKLyUHsIg21fZuSzxk0pmTGtuRHRBBnMYAXzQSWgx8c5E29q9a6xFr13w_MHTMdBR8kYjor_mhN3R0OViKE4Pf0cM4L9b4II3QHTvmRyyahDpBQS4SZ-bXNaopahFu-WNqR2sxTJroQvU6GC0QHHg97voRVGvpISJYeUsDE2LaknJhlkbh-wxknovT26QWRv3kCQKurzTETgNY8hyu8xg7UcYeCra0jXQo5p_Eu8XkOg"
                />
                <img
                  alt="User profile"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMat_fem2goqob2V5eIj091-PlIe2pCj6g87kqjSVMNd04Otlw_jfHRVRm0nnQC6Lo4-IGcjpvjyLH0KNQ-zBMrT3rQukdmjhFuNb7AUI4Ky247Z4ovWGgFWg9rRHFmnYyOnqqPPZXp6y9qiLc3uhfEk22Zpp8Ewr02qriw34KKoD1JOaMBASSoWhkk0SDIdSkrjnwcSY6pXmwoyw8x-hEL5S61DV6w5UE2DJi3OWtNC_sQ-QYH2_E5g"
                />
              </div>
              <p className="font-body-md text-on-surface-variant">
                <span className="font-bold text-navy-accent">500+</span> teams
                building documentation daily
              </p>
            </div>
          </div>

          {/* Hero Visual Area */}
          <div className="relative mt-12 lg:mt-0 hero-graphic-shadow">
            <div className="glass-card p-8 relative z-10 overflow-hidden rounded-3xl border border-primary-container/70 bg-white/85 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="text-left">
                    <h3 className="font-headline-md text-xl font-semibold text-navy-accent">
                      Pre Sales Dashboard
                    </h3>
                    <p className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-primary">
                      AI ENGINE ACTIVE
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-container animate-pulse"></div>
                  <div
                    className="w-2.5 h-2.5 rounded-full bg-primary/70 animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl max-w-[85%] border border-outline-variant/30 text-left">
                  <p className="text-sm font-body-md text-navy-accent/80 leading-relaxed italic">
                    "Generate a detailed technical proposal for a
                    high-availability Fintech app with cross-chain crypto
                    support."
                  </p>
                </div>
                <div className="bg-primary-container/35 p-5 rounded-2xl self-end ml-auto max-w-[90%] border border-primary-container shadow-sm text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-navy-accent text-sm">
                      settings_suggest
                    </span>
                    <span className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-navy-accent">
                      ARCHITECTING SOLUTION
                    </span>
                  </div>
                  <p className="text-sm font-body-md text-navy-accent font-medium leading-relaxed">
                    Analyzing compliance requirements... Implementing AES-256
                    encryption. Generating roadmap for 12-month delivery phase.
                  </p>
                  <div className="mt-4 h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-3/4 shimmer"></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-white p-5 rounded-2xl border border-primary-container/60 shadow-sm text-left">
                  <p className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant mb-1">
                    Accuracy Score
                  </p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-3xl font-bold text-navy-accent">99.4%</p>
                    <span className="material-symbols-outlined text-primary text-sm">
                      verified
                    </span>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-primary-container/60 shadow-sm text-left">
                  <p className="font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant mb-1">
                    Processing Time
                  </p>
                  <p className="text-3xl font-bold text-navy-accent">0.4s</p>
                </div>
              </div>
            </div>

            {/* Floating Data Elements */}
            <div className="absolute -top-8 -right-8 glass-card p-5 rounded-2xl shadow-2xl z-20 animate-bounce duration-[4000ms] border-primary-container/80 bg-white">
              <span
                className="material-symbols-outlined text-navy-accent text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                cloud_done
              </span>
            </div>
          </div>
        </section>

        {/* Stats Section */}
       <section
  ref={statsRef}
  className="bg-navy-accent py-20 relative overflow-hidden"
>
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-grid"></div>
          <div className="max-w-container-max mx-auto px-6 md:px-margin-desktop grid grid-cols-2 lg:grid-cols-4 gap-12 relative z-10 text-center">
            <div className="space-y-2">
              <p className="text-5xl md:text-6xl font-extrabold text-primary-container">
      <Counter
    end={500}
    suffix="+"
    duration={2600}
    delay={0}
    start={startCounter}
/>        </p>
              <p className="font-label-caps text-white/50 text-xs tracking-widest uppercase">
                Projects Delivered
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-5xl md:text-6xl font-extrabold text-primary-container">
             <Counter
    end={120}
    suffix="+"
    duration={3400}
    delay={300}
    start={startCounter}
/>
              </p>
              <p className="font-label-caps text-white/50 text-xs tracking-widest uppercase">
                Specialist Models
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-5xl md:text-6xl font-extrabold text-primary-container">
               <Counter
    end={98}
    suffix="%"
    duration={4200}
    delay={600}
    start={startCounter}
/>
              </p>
              <p className="font-label-caps text-white/50 text-xs tracking-widest uppercase">
                Customer Retention
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-5xl md:text-6xl font-extrabold text-primary-container">
             <Counter
    end={2.4}
    prefix="$"
    suffix="B"
    decimals={1}
    duration={5200}
    delay={900}
    start={startCounter}
/>
              </p>
              <p className="font-label-caps text-white/50 text-xs tracking-widest uppercase">
                Pipeline Value
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Lifecycle Showcase (CardSwap Component) */}
        <section className="py-32 bg-[#fafaff] border-t border-b border-neutral-100/60 overflow-hidden">
          <div className="max-w-container-max mx-auto px-6 md:px-margin-desktop grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            {/* Left side description */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <span className="font-label-caps text-brand-600 bg-brand-50 px-3 py-1 rounded-full uppercase tracking-wider text-[11px] font-bold">
                Interactive Walkthrough
              </span>
              <h2 className="font-display-lg text-4xl md:text-5xl text-navy-accent leading-tight">
                Watch our AI architect in action.
              </h2>
              <p className="text-on-surface-variant text-base md:text-lg leading-relaxed">
                Hover over the stack or click to pause. Our system seamlessly
                transitions from raw natural language input to production-ready
                team allocations and budget sheets.
              </p>
              <div className="pt-4 flex items-center gap-6">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
                  Realtime Scoping
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  Staff Balancing
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                  Autonomous Broker
                </div>
              </div>
            </div>

            {/* Right side large CardSwap deck */}
            <div className="lg:col-span-7 relative h-[500px] w-full flex items-center justify-center overflow-visible">
              <CardSwap
                width={520}
                height={420}
                cardDistance={50}
                verticalDistance={45}
                delay={3500}
                pauseOnHover={true}
                skewAmount={3}
              >
                {/* Card 1: Intelligent Scoping */}
                <Card className="flex flex-col justify-between border border-neutral-200/80 bg-white/95 rounded-3xl p-8 shadow-2xl">
                  <div className="space-y-4 text-left">
                    <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
                      <div>
                        <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded uppercase tracking-wider">
                          Phase 1: Intelligent Scoping
                        </span>
                        <h4 className="text-lg font-extrabold text-navy-accent mt-1">
                          AI Voice Architect
                        </h4>
                      </div>
                      <Sparkles className="text-brand-500 w-5 h-5 animate-pulse-subtle" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                        Natural Language Request
                      </p>
                      <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 text-xs italic text-neutral-600 leading-relaxed">
                        "We need a secure online banking solution with SAML SSO,
                        high-throughput microservices, and automatic load
                        balancers."
                      </div>
                      <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-100 text-xs font-bold text-brand-700 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
                        Extracted: 5 core features, SAML SSO requirement,
                        high-availability spec.
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-neutral-100 flex justify-between items-center text-xs font-bold text-neutral-400">
                    <span>Confidence: 99.8%</span>
                    <span className="text-brand-600">Parsed in 340ms</span>
                  </div>
                </Card>

                {/* Card 2: Resource Allocation Matrix */}
                <Card className="flex flex-col justify-between border border-neutral-200/80 bg-white/95 rounded-3xl p-8 shadow-2xl">
                  <div className="space-y-4 text-left">
                    <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
                      <div>
                        <span className="text-[10px] font-bold text-primary bg-primary-container/30 px-2.5 py-0.5 rounded uppercase tracking-wider">
                          Phase 2: Resource Balancing
                        </span>
                        <h4 className="text-lg font-extrabold text-navy-accent mt-1">
                          Bench Staff Allocations
                        </h4>
                      </div>
                      <ShieldCheck className="text-primary w-5 h-5" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                        Automated Team Matching
                      </p>
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-xs">
                        <div>
                          <span className="font-bold text-neutral-800 block">
                            Alex Rivera
                          </span>
                          <span className="text-[10px] text-neutral-500">
                            Lead Architect • 9y Exp
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                          100% Match
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-xs">
                        <div>
                          <span className="font-bold text-neutral-800 block">
                            Elena Rostova
                          </span>
                          <span className="text-[10px] text-neutral-500">
                            Senior Full Stack Developer
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                          94% Match
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-neutral-100 flex justify-between items-center text-xs font-bold text-neutral-400">
                    <span>Total cost: $145,000</span>
                    <span className="text-primary">3 developers assigned</span>
                  </div>
                </Card>

                {/* Card 3: Interactive Negotiator */}
                <Card className="flex flex-col justify-between border border-neutral-200/80 bg-white/95 rounded-3xl p-8 shadow-2xl">
                  <div className="space-y-4 text-left">
                    <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
                      <div>
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded uppercase tracking-wider">
                          Phase 3: Autonomous Broker
                        </span>
                        <h4 className="text-lg font-extrabold text-navy-accent mt-1">
                          Real-time Negotiation
                        </h4>
                      </div>
                      <DollarSign className="text-purple-500 w-5 h-5" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                        Active Chat Thread
                      </p>
                      <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs text-purple-800">
                        <strong>Client Proposal:</strong> "Can we reduce the
                        budget by 15% and extend the duration?"
                      </div>
                      <div className="p-3 bg-brand-50/50 rounded-xl border border-brand-100 text-xs text-brand-800 font-semibold">
                        <strong>AI Broker Agent:</strong> "Sure. I have removed
                        Pulumi deployment and allocated 2 part-time devs. Budget
                        adjusted to $123,000."
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-neutral-100 flex justify-between items-center text-xs font-bold text-neutral-400">
                    <span>Draft: v1.3</span>
                    <span className="text-purple-600 font-bold">
                      Proposal Ready
                    </span>
                  </div>
                </Card>
              </CardSwap>
            </div>
          </div>
        </section>

        {/* The Sovereign Way */}
        <section className="py-32 bg-white" id="about">
          <div className="max-w-container-max mx-auto px-6 md:px-margin-desktop">
            <div className="text-center max-w-2xl mx-auto mb-20">
              <span className="font-label-caps text-primary uppercase tracking-[0.2em] font-bold text-xs">
                The Virtual Employee Way
              </span>
              <h2 className="font-display-lg text-4xl md:text-5xl text-navy-accent mt-4">
                Intelligence built on absolute logic.
              </h2>
              <p className="mt-6 text-on-surface-variant font-body-lg text-center">
                We've bridged the gap between complex software engineering and
                high-velocity pre-sales.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group glass-card p-10 rounded-3xl border-outline-variant/10 hover:border-primary/30 hover:shadow-xl transition-all duration-300 text-left">
                <div className="w-14 h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-3xl">
                    diversity_3
                  </span>
                </div>
                <h3 className="font-headline-md text-2xl text-navy-accent mb-4">
                  Who We Are
                </h3>
                <p className="text-on-surface-variant leading-relaxed">
                  A syndicate of elite engineers and product strategists
                  redefining how technical vision is translated into business
                  reality.
                </p>
              </div>
              <div className="group bg-navy-accent p-10 rounded-3xl border border-navy-accent shadow-2xl hover:-translate-y-2 transition-all duration-500 text-left">
                <div className="w-14 h-14 bg-primary-container text-navy-accent rounded-2xl flex items-center justify-center mb-8">
                  <span className="material-symbols-outlined text-3xl">
                    rocket_launch
                  </span>
                </div>
                <h3 className="font-headline-md text-2xl text-white mb-4">
                  Our Mission
                </h3>
                <p className="text-white/70 leading-relaxed">
                  To eliminate manual friction from the sales cycle, enabling
                  every technical team to lead with precision, speed, and
                  authority.
                </p>
              </div>
              <div className="group glass-card p-10 rounded-3xl border-outline-variant/10 hover:border-primary/30 hover:shadow-xl transition-all duration-300 text-left">
                <div className="w-14 h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-3xl">
                    architecture
                  </span>
                </div>
                <h3 className="font-headline-md text-2xl text-navy-accent mb-4">
                  Our Process
                </h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Infinite iteration loops driven by real-world architectural
                  shifts, ensuring our models remain at the bleeding edge of
                  cloud tech.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Capabilities Section */}
        <section className="py-32 bg-surface-container-low" id="services">
          <div className="max-w-container-max mx-auto px-6 md:px-margin-desktop">
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
              <div className="max-w-2xl text-left">
                <span className="font-label-caps text-primary uppercase tracking-[0.2em] font-bold text-xs">
                  Capabilities
                </span>
                <h2 className="font-display-lg text-4xl md:text-5xl text-navy-accent mt-4">
                  Comprehensive Engine for technical Dokumentation.
                </h2>
              </div>
              <a
                className="font-button-text text-navy-accent group flex items-center gap-2 hover:text-primary transition-colors text-lg font-bold"
                href="#"
              >
                Explore Platform{" "}
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                  arrow_right_alt
                </span>
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
              <div
                onClick={() => triggerAuthFlow("entrance")}
                className="glass-card p-8 rounded-3xl border-transparent hover:border-primary/20 hover:bg-white transition-all duration-300 group cursor-pointer text-left"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    neurology
                  </span>
                </div>
                <h4 className="font-headline-md text-xl text-navy-accent mb-4">
                  Deep LLM Training
                </h4>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Proprietary RAG pipelines trained on thousands of
                  enterprise-grade cloud architectures.
                </p>
              </div>
              <div
                onClick={() => triggerAuthFlow("entrance")}
                className="glass-card p-8 rounded-3xl border-transparent hover:border-primary/20 hover:bg-white transition-all duration-300 group cursor-pointer text-left"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    developer_mode_tv
                  </span>
                </div>
                <h4 className="font-headline-md text-xl text-navy-accent mb-4">
                  Enterprise Web
                </h4>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Modern infrastructure plans for Next.js, distributed systems,
                  and edge computation logic.
                </p>
              </div>
              <div
                onClick={() => triggerAuthFlow("entrance")}
                className="glass-card p-8 rounded-3xl border-transparent hover:border-primary/20 hover:bg-white transition-all duration-300 group cursor-pointer text-left"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    cloud_sync
                  </span>
                </div>
                <h4 className="font-headline-md text-xl text-navy-accent mb-4">
                  Multi-Cloud IaC
                </h4>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Automatic generation of Terraform and Pulumi diagrams based on
                  natural language prompts.
                </p>
              </div>
              <div
                onClick={() => triggerAuthFlow("entrance")}
                className="glass-card p-8 rounded-3xl border-transparent hover:border-primary/20 hover:bg-white transition-all duration-300 group cursor-pointer text-left"
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary text-3xl">
                    encrypted
                  </span>
                </div>
                <h4 className="font-headline-md text-xl text-navy-accent mb-4">
                  Security First
                </h4>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Built-in SOC2 and GDPR compliance modeling for every generated
                  technical proposal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Flowing Menu Showcase */}
        <section className="relative w-full h-[550px] overflow-hidden border-t border-b border-neutral-100/60 bg-white">
          <FlowingMenu
            items={[
              {
                link: "#",
                text: "AI Scoping Estimator",
                image:
                  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=300",
              },
              {
                link: "#",
                text: "Resource Matching Matrix",
                image:
                  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=300",
              },
              {
                link: "#",
                text: "Interactive Negotiator",
                image:
                  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=300",
              },
              {
                link: "#",
                text: "Multi-Format Exporting",
                image:
                  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=300",
              },
            ]}
            speed={12}
            textColor="#006b5d"
            bgColor="#ffffff"
            marqueeBgColor="#006b5d"
            marqueeTextColor="#ffffff"
            borderColor="rgba(0, 107, 93, 0.15)"
          />
        </section>

        {/* Technology Grid */}
        <section className="py-32 bg-white">
          <div className="max-w-container-max mx-auto px-6 md:px-margin-desktop">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="z-10 text-left">
                <span className="font-label-caps text-primary uppercase tracking-[0.2em] font-bold text-xs">
                  Our Stack
                </span>
                <h2 className="font-display-lg text-4xl md:text-5xl text-navy-accent mt-4 mb-8">
                  Seamless Integration with the Industry.
                </h2>
                <p className="text-on-surface-variant font-body-lg mb-12 leading-relaxed text-left">
                  Our engine doesn't just "write" — it creates actionable
                  technical assets that plug directly into your existing
                  development workflow.
                </p>
                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span
                        className="material-symbols-outlined text-primary text-sm"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check
                      </span>
                    </div>
                    <div>
                      <p className="font-body-md font-bold text-navy-accent">
                        Real-time Cost Estimation
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        Live market data for AWS, GCP, and Azure service costs.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span
                        className="material-symbols-outlined text-primary text-sm"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check
                      </span>
                    </div>
                    <div>
                      <p className="font-body-md font-bold text-navy-accent">
                        Native Project Management Exports
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        One-click sync to Jira, Linear, and Notion backlogs.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span
                        className="material-symbols-outlined text-primary text-sm"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check
                      </span>
                    </div>
                    <div>
                      <p className="font-body-md font-bold text-navy-accent">
                        BOM (Bill of Materials) Generation
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        Detailed itemized software and license breakdown.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 relative">
                <div className="absolute -inset-4 bg-primary/5 rounded-full blur-3xl -z-10"></div>
                <div
                  onClick={() => triggerAuthFlow("entrance")}
                  className="bg-white aspect-square rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center gap-3 group hover:border-primary hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
                    <span className="font-bold text-xl text-[#00D8FF]">R</span>
                  </div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">
                    React
                  </span>
                </div>
                <div
                  onClick={() => triggerAuthFlow("entrance")}
                  className="bg-white aspect-square rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center gap-3 group hover:border-primary hover:-translate-y-1 transition-all duration-300 translate-y-6 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
                    <span className="font-bold text-xl text-[#3776AB]">Py</span>
                  </div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">
                    Python
                  </span>
                </div>
                <div
                  onClick={() => triggerAuthFlow("entrance")}
                  className="bg-white aspect-square rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center gap-3 group hover:border-primary hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
                    <span className="font-bold text-xl text-black">V</span>
                  </div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">
                    Vercel
                  </span>
                </div>
                <div
                  onClick={() => triggerAuthFlow("entrance")}
                  className="bg-white aspect-square rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center gap-3 group hover:border-primary hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
                    <span className="font-bold text-xl text-primary">AI</span>
                  </div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">
                    OpenAI
                  </span>
                </div>
                <div
                  onClick={() => triggerAuthFlow("entrance")}
                  className="bg-white aspect-square rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center gap-3 group hover:border-primary hover:-translate-y-1 transition-all duration-300 translate-y-6 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
                    <span className="font-bold text-xl text-[#FF9900]">
                      AWS
                    </span>
                  </div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">
                    Amazon
                  </span>
                </div>
                <div
                  onClick={() => triggerAuthFlow("entrance")}
                  className="bg-white aspect-square rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center gap-3 group hover:border-primary hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
                    <span className="font-bold text-xl text-[#47A248]">DB</span>
                  </div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">
                    MongoDB
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Slider */}
        <section className="py-32 bg-navy-accent overflow-hidden relative">
          <div className="max-w-container-max mx-auto px-6 md:px-margin-desktop text-center text-white mb-20">
            <span className="font-label-caps text-primary-container uppercase tracking-[0.2em] font-bold text-xs">
              Validation
            </span>
            <h2 className="font-display-lg text-4xl md:text-5xl mt-4 text-white">
              Endorsed by Global Leaders.
            </h2>
          </div>

          <div className="flex gap-8 px-6 animate-infinite-scroll">
            {[1, 2, 3].map((setIndex) => (
              <div key={setIndex} className="flex gap-8">
                {/* Testimonial 1 */}
                <div className="min-w-[420px] max-w-[420px] bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-sm text-left">
                  <div className="flex gap-1 text-primary-container mb-8">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className="material-symbols-outlined text-lg"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <p className="font-body-lg text-white/90 leading-relaxed mb-10 italic">
                    "Virtual Employee cut our proposal turnaround time from 3
                    days to 15 minutes. The accuracy in cloud infrastructure
                    estimation is frighteningly good."
                  </p>
                  <div className="flex items-center gap-4">
                    <img
                      alt="Marcus Chen"
                      className="w-14 h-14 rounded-full object-cover grayscale"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_k4liAPgNYSMar9B3ssB-3PRmj6PW_2c_rqNRUtiZfU4_j53YngGIE9CGUAIA4suTmo7Mu4B10MgcKGTjHLKxbR1S00Srdf836p0xjO82uUtj7IpJNKsbOWO8PsMPQAbqbrDkg4SoHGCIY_U7G8PUWptnhLnWopXJasp-MqEuXVEGEY-IwwerzcJk1rpmL0y-c1d30AHBtpJdtF8cu9-48HiqQN35koV59b0RfVL9uDnCsO5534wlrA"
                    />
                    <div>
                      <p className="font-bold text-white text-left font-sans">
                        Marcus Chen
                      </p>
                      <p className="text-xs text-white/50 uppercase font-label-caps tracking-widest font-bold text-left">
                        CTO, CloudScale AI
                      </p>
                    </div>
                  </div>
                </div>

                {/* Testimonial 2 */}
                <div className="min-w-[420px] max-w-[420px] bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-sm text-left">
                  <div className="flex gap-1 text-primary-container mb-8">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className="material-symbols-outlined text-lg"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <p className="font-body-lg text-white/90 leading-relaxed mb-10 italic">
                    "The voice-to-proposal feature is a game changer for our
                    field sales team. They can brief a complex architecture
                    while walking to lunch."
                  </p>
                  <div className="flex items-center gap-4">
                    <img
                      alt="Sarah Jenkins"
                      className="w-14 h-14 rounded-full object-cover grayscale"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuByPgaFYaY3oBhP30T5Vg378-o2XZFIk_EUJTeGEldN9k4Z23uhdsp82crFrw93zTFtnLtjU-K5JwIPd7XzerxxGjn8m8wmopqgQ60lwrOaYesID3YvzHeS-e1XLtM0v5ttuG54PDoAcmn6eXOar1yEXOd6dEpBzY9r3iUmcwrllHPSy2HOwDvjAUoB4gNKHAhsbMM_0M0wC_KbkjPZWwaydlcayZQsFLkTtwTiyiAJ54oSIfWtmPSCbA"
                    />
                    <div>
                      <p className="font-bold text-white text-left font-sans">
                        Sarah Jenkins
                      </p>
                      <p className="text-xs text-white/50 uppercase font-label-caps tracking-widest font-bold text-left">
                        VP Sales, Nexus Systems
                      </p>
                    </div>
                  </div>
                </div>

                {/* Testimonial 3 */}
                <div className="min-w-[420px] max-w-[420px] bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-sm text-left">
                  <div className="flex gap-1 text-primary-container mb-8">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className="material-symbols-outlined text-lg"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <p className="font-body-lg text-white/90 leading-relaxed mb-10 italic">
                    "Professional, precise, and visually stunning. Our close
                    rates increased by 40% since switching to Virtual
                    Employee-generated documentation."
                  </p>
                  <div className="flex items-center gap-4">
                    <img
                      alt="Leon Vogt"
                      className="w-14 h-14 rounded-full object-cover grayscale"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDI0iv5j8JZiZyrPT0wMvXE2vrGQ38OEWwCMeauEgJK99ccG59jGb5DDMosDfKjnVOQpG9ndTIqpYqR-IaLALzFEMAfoXz0a8dzB8WBjmHGJmiZkaT0GVlh0sGjAyjMVfVBoxRL6kkRUnTFY3jzHWONu7SnO6TCKfKeyli0qEpC-ruPxpY2pjgacidQA2CZc5vl6vZfPpMqq5qegmD_yVj9fGzf2zDKkrapVOWaJjPsKVuAgxiorZbgzQ"
                    />
                    <div>
                      <p className="font-bold text-white text-left font-sans">
                        Leon Vogt
                      </p>
                      <p className="text-xs text-white/50 uppercase font-label-caps tracking-widest font-bold text-left">
                        Founder, DevStream
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-40 bg-white relative overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-[100px]"></div>
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-[100px]"></div>
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="font-display-lg text-5xl md:text-6xl text-navy-accent mb-8 leading-tight">
              Ready to automate your <br />
              <span className="text-primary italic">Pre-Sales Logic?</span>
            </h2>
            <p className="font-body-lg text-on-surface-variant mb-12 text-xl text-center">
              Join the 500+ agencies and enterprises already building the future
              with Virtual Employee.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <button
                onClick={() => triggerAuthFlow("register")}
                className="bg-primary-container text-navy-accent px-12 py-5 rounded-2xl font-button-text text-xl shadow-xl hover:shadow-primary/30 hover:-translate-y-1 active:translate-y-0 transition-all font-bold"
              >
                Get Started Free
              </button>
              <button
                onClick={() => triggerAuthFlow("entrance")}
                className="bg-navy-accent text-white px-12 py-5 rounded-2xl font-button-text text-xl hover:bg-navy-accent/90 shadow-xl transition-all font-bold"
              >
                Schedule Live Demo
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-outline-variant/30 pt-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-6 md:px-margin-desktop pb-16 max-w-container-max mx-auto">
          <div className="md:col-span-1 space-y-5 text-left">
            <div className="flex items-center gap-2">
              <img
                src="/ve.png"
                alt="Pre Sales Platform"
                className="h-9 w-auto object-contain"
              />
              <span className="font-display-lg text-2xl text-navy-accent font-extrabold tracking-tight">
                Pre Sales Platform
              </span>
            </div>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs">
              Virtual Employee Pvt. Ltd. delivers cutting-edge AI, software development, and digital solutions that help businesses innovate, scale, and succeed.
            </p>
            <div className="space-y-3">
              <h5 className="font-bold text-navy-accent text-sm tracking-tight text-left">
                Discover us on social
              </h5>
              <div className="flex gap-3">
                <a
                  className="w-10 h-10 rounded-full border border-navy-accent bg-navy-accent text-white flex items-center justify-center hover:bg-primary hover:border-primary transition-all"
                  href="#!"
                  aria-label="X"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  className="w-10 h-10 rounded-full border border-navy-accent bg-navy-accent text-white flex items-center justify-center hover:bg-primary hover:border-primary transition-all"
                  href="#!"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                  </svg>
                </a>
                <a
                  className="w-10 h-10 rounded-full border border-navy-accent bg-navy-accent text-white flex items-center justify-center hover:bg-primary hover:border-primary transition-all"
                  href="#!"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a
                  className="w-10 h-10 rounded-full border border-navy-accent bg-navy-accent text-white flex items-center justify-center hover:bg-primary hover:border-primary transition-all"
                  href="#!"
                  aria-label="YouTube"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.524 3.545 12 3.545 12 3.545s-7.525 0-9.388.51a3.002 3.002 0 0 0-2.11 2.108C0 8.029 0 12 0 12s0 3.971.502 5.837a3.003 3.003 0 0 0 2.11 2.108c1.863.51 9.388.51 9.388.51s7.525 0 9.388-.51a3.002 3.002 0 0 0 2.11-2.108C24 15.971 24 12 24 12s0-3.971-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
                <a
                  className="w-10 h-10 rounded-full border border-navy-accent bg-navy-accent text-white flex items-center justify-center hover:bg-primary hover:border-primary transition-all"
                  href="#!"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="md:col-span-1 text-left">
            <h5 className="font-label-caps text-navy-accent text-xs mb-8 uppercase tracking-[0.2em] font-bold">
              Product
            </h5>
            <ul className="space-y-4">
              <li>
                <a
                  className="text-on-surface-variant hover:text-primary transition-colors text-sm"
                  href="#!"
                >
                  Generator Engine
                </a>
              </li>
              <li>
                <a
                  className="text-on-surface-variant hover:text-primary transition-colors text-sm"
                  href="#!"
                >
                  Architecture Library
                </a>
              </li>
              <li>
                <a
                  className="text-on-surface-variant hover:text-primary transition-colors text-sm"
                  href="#!"
                >
                  Cost Estimator
                </a>
              </li>
              <li>
                <a
                  className="text-on-surface-variant hover:text-primary transition-colors text-sm"
                  href="#!"
                >
                  API Access
                </a>
              </li>
            </ul>
          </div>
          <div className="md:col-span-1 text-left">
            <h5 className="font-label-caps text-navy-accent text-xs mb-8 uppercase tracking-[0.2em] font-bold">
              Company
            </h5>
            <ul className="space-y-4">
              <li>
                <a
                  className="text-on-surface-variant hover:text-primary transition-colors text-sm"
                  href="#!"
                >
                  About Our Tech
                </a>
              </li>
              <li>
                <a
                  className="text-on-surface-variant hover:text-primary transition-colors text-sm"
                  href="#!"
                >
                  Our Process
                </a>
              </li>
              <li>
                <a
                  className="text-on-surface-variant hover:text-primary transition-colors text-sm"
                  href="#!"
                >
                  Global Partners
                </a>
              </li>
              <li>
                <a
                  className="text-on-surface-variant hover:text-primary transition-colors text-sm"
                  href="#!"
                >
                  Contact Sales
                </a>
              </li>
            </ul>
          </div>
          <div className="md:col-span-1 text-left">
            <h5 className="font-label-caps text-navy-accent text-xs mb-8 uppercase tracking-[0.2em] font-bold">
              Newsletter
            </h5>
            <p className="text-on-surface-variant text-sm mb-6">
              Receive architectural insights and engine updates.
            </p>
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                alert("Subscribed successfully!");
              }}
            >
              <input
                className="bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-sm p-4 transition-all text-neutral-800"
                placeholder="Enter work email"
                type="email"
                required
              />
              <button
                className="bg-navy-accent text-white p-4 rounded-xl font-button-text hover:bg-navy-accent/90 transition-all font-bold cursor-pointer"
                type="submit"
              >
                Subscribe Now
              </button>
            </form>
          </div>
        </div>
        <div className="max-w-container-max mx-auto px-6 md:px-margin-desktop py-6 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-on-surface-variant text-xs font-medium">
            © 2026 Virtual Employee Pvt. Ltd. All Rights Reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            <a
              className="text-on-surface-variant hover:text-navy-accent text-xs font-bold transition-colors"
              href="#!"
            >
              Privacy Policy
            </a>
            <a
              className="text-on-surface-variant hover:text-navy-accent text-xs font-bold transition-colors"
              href="#!"
            >
              Terms of Service
            </a>
            <a
              className="text-on-surface-variant hover:text-navy-accent text-xs font-bold transition-colors"
              href="#!"
            >
              Security
            </a>
            <a
              className="text-on-surface-variant hover:text-navy-accent text-xs font-bold transition-colors"
              href="#!"
            >
              Subprocessors
            </a>
          </div>
        </div>
      </footer>

      {/* Auth Modal Backdrop and Window */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />

            {/* Simulated Auth Card Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={`relative w-full bg-white border border-neutral-200 shadow-2xl z-10 overflow-hidden ${
                view === "register" || view === "otp"
                  ? "max-w-[430px] rounded-xl px-6 py-8 text-left sm:px-10 sm:py-10"
                  : "max-w-md rounded-3xl p-8 text-left"
              }`}
            >
              {/* Close Button */}
              {view !== "register" && (
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors z-20"
                >
                  <X size={18} />
                </button>
              )}

              <AnimatePresence mode="wait">
                {/* 1. ENTRANCE GATE */}
                {view === "entrance" && (
                  <motion.div
                    key="entrance"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 pt-2"
                  >
                    <h3 className="text-xl font-extrabold text-neutral-900 tracking-tight">
                      Get Started
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                      Enter your details to create an account or access your
                      workspace blueprints.
                    </p>

                    <div className="bg-white border border-neutral-200 rounded-2xl p-2.5 shadow-sm flex items-center gap-2">
                      <input
                        type="text"
                        value={entranceInput}
                        onChange={(e) => validateEntrance(e.target.value)}
                        placeholder="Email Address or Phone Number"
                        className="flex-1 bg-transparent text-xs font-semibold outline-none px-2 text-neutral-800 font-sans"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && isValidEntrance) {
                            handleEntranceContinue();
                          }
                        }}
                      />
                      <button
                        onClick={handleEntranceContinue}
                        disabled={!isValidEntrance}
                        className={`h-9 px-4 rounded-xl text-xs font-bold flex items-center justify-center transition-all duration-200 ${
                          isValidEntrance
                            ? "bg-primary text-white hover:bg-primary/90 shadow-md cursor-pointer"
                            : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                        }`}
                      >
                        Continue
                        <ArrowRight size={13} className="ml-1" />
                      </button>
                    </div>
                    {entranceError && (
                      <p className="text-[10px] font-bold text-red-500 pl-2">
                        {entranceError}
                      </p>
                    )}

                    <p className="text-[10px] text-neutral-400 text-center font-medium mt-2 leading-relaxed">
                      Use email{" "}
                      <strong className="text-neutral-600 font-bold">
                        onboarding@acme.com
                      </strong>{" "}
                      to simulate existing login. Any other email triggers sign
                      up.
                    </p>
                  </motion.div>
                )}

                {/* 2. LOGIN VIEW */}
                {view === "login" && (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="pt-2"
                  >
                    <div className="flex items-center space-x-2 mb-4">
                      <button
                        onClick={() => {
                          setEntranceInput("");
                          setIsValidEntrance(false);
                          setView("entrance");
                        }}
                        className="p-1.5 rounded-lg hover:bg-neutral-50 text-neutral-500 transition-colors"
                      >
                        <ArrowLeft size={14} />
                      </button>
                      <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
                        Login to Workspace
                      </h3>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail
                            size={14}
                            className="absolute left-3.5 top-3.5 text-neutral-400"
                          />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:bg-white focus:border-primary transition-all duration-200 text-neutral-800 font-sans"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <KeyRound
                            size={14}
                            className="absolute left-3.5 top-3.5 text-neutral-400"
                          />
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:bg-white focus:border-primary transition-all duration-200 text-neutral-800 font-sans"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <label className="flex items-center space-x-2 text-neutral-600 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="rounded border-neutral-300 text-primary focus:ring-primary"
                          />
                          <span>Remember me</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setError("");
                            setView("forgot");
                          }}
                          className="text-primary font-bold hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>

                      {error && (
                        <p className="text-[10px] font-bold text-red-500">
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer font-sans"
                      >
                        Authenticate
                        <ArrowRight size={14} className="ml-1.5" />
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* 3. REGISTER VIEW */}
                {view === "register" && (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="font-sans"
                  >
                    <div className="text-center mb-8">
                      <h3 className="font-headline-md text-2xl font-semibold text-[#0a0a0a]">
                        Get In Touch
                      </h3>
                      <p className="mt-2 font-body-md text-sm text-[#5a5a5c]">
                        Join the network for sovereign enterprise management.
                      </p>
                    </div>

                    <form onSubmit={handleRegisterSubmit} className="space-y-5">
                      <div>
                        <label className="mb-2 block font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-[#3a3a3c]">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                          placeholder="John Doe"
                          className="h-11 w-full rounded-md border border-[#e5e5e5] bg-white px-4 font-body-md text-base text-[#0a0a0a] outline-none transition-all duration-200 placeholder:text-[#a8a8aa] focus:border-2 focus:border-[#00d4a4]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-[#3a3a3c]">
                          Work Email
                        </label>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="h-11 w-full rounded-md border border-[#e5e5e5] bg-white px-4 font-body-md text-base text-[#0a0a0a] outline-none transition-all duration-200 placeholder:text-[#a8a8aa] focus:border-2 focus:border-[#00d4a4]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-[#3a3a3c]">
                          Phone Number
                        </label>
                        <div className="flex h-11 overflow-hidden rounded-md border border-[#e5e5e5] bg-white focus-within:border-2 focus-within:border-[#00d4a4]">
                          <select
                            value={regCountryCode}
                            onChange={(e) => setRegCountryCode(e.target.value)}
                            className="w-[104px] shrink-0 border-0 border-r border-[#e5e5e5] bg-[#f7f7f7] px-3 font-body-md text-sm font-medium text-[#0a0a0a] outline-none focus:ring-0"
                          >
                            {countryCodes.map((country) => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            required
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            placeholder="(555) 000-0000"
                            className="min-w-0 flex-1 border-0 bg-transparent px-4 font-body-md text-base text-[#0a0a0a] outline-none placeholder:text-[#a8a8aa] focus:ring-0"
                          />
                        </div>
                      </div>

                      <label className="flex h-14 cursor-pointer items-center rounded-md border border-[#e5e5e5] bg-white px-4">
                        <input
                          type="checkbox"
                          checked={isNotRobot}
                          onChange={(e) => setIsNotRobot(e.target.checked)}
                          className="h-4 w-4 rounded border-[#cfd5dc] text-[#14e1d0] focus:ring-[#14e1d0]"
                        />
                        <span className="ml-3 font-body-md text-sm font-medium text-[#0a0a0a]">
                          I'm not a robot
                        </span>
                        <div className="ml-auto flex flex-col items-center font-label-caps text-[8px] font-semibold uppercase leading-tight text-[#888888]">
                          <span className="material-symbols-outlined text-[18px] text-[#888888]">
                            cached
                          </span>
                          Recaptcha
                        </div>
                      </label>

                      {error && (
                        <p className="text-[10px] font-bold text-red-500">
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="mt-2 flex h-11 w-full items-center justify-center rounded-full bg-primary-container font-button-text text-sm font-semibold uppercase text-navy-accent transition-all duration-200 hover:shadow-md active:translate-y-px"
                      >
                        Sign Up
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* 4. OTP VERIFICATION VIEW */}
                {view === "otp" && (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="font-sans"
                  >
                    <div className="mb-8 text-center">
                      <button
                        onClick={() => {
                          setError("");
                          setView(
                            otpPurpose === "forgot"
                              ? "forgot"
                              : otpPurpose === "register"
                                ? "register"
                                : "login",
                          );
                        }}
                        className="absolute left-5 top-5 rounded-full border border-[#e5e5e5] bg-white p-2 text-[#5a5a5c] transition-colors hover:bg-[#f7f7f7] hover:text-[#0a0a0a]"
                      >
                        <ArrowLeft size={14} />
                      </button>
                      <h3 className="font-headline-md text-2xl font-semibold text-[#0a0a0a]">
                        Security Verification
                      </h3>
                      <p className="mt-2 font-body-md text-sm text-[#5a5a5c]">
                        We've simulated sending a security code. Enter test code{" "}
                        <strong className="font-semibold text-[#0a0a0a]">
                          1234
                        </strong>{" "}
                        to verify your account.
                      </p>
                    </div>

                    <form onSubmit={handleOtpVerify} className="space-y-5">
                      <div>
                        <label className="mb-2 block text-center font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-[#3a3a3c]">
                          4-Digit Security Code
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          required
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="••••"
                          className="h-11 w-full rounded-md border border-[#e5e5e5] bg-white px-4 text-center font-body-md text-xl font-semibold tracking-[0.35em] text-[#0a0a0a] outline-none transition-all duration-200 placeholder:text-[#a8a8aa] focus:border-2 focus:border-[#00d4a4]"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1 font-body-md text-sm">
                        <span className="font-medium text-[#5a5a5c]">
                          Didn't receive code?
                        </span>
                        {otpResendTimer > 0 ? (
                          <span className="font-semibold text-[#888888]">
                            Resend in {otpResendTimer}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={startOtpResendTimer}
                            className="font-semibold text-[#006b5d] hover:underline"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>

                      {otpStatus === "verifying" && (
                        <div className="flex items-center justify-center space-x-2 py-2 font-body-md text-sm font-medium text-[#006b5d]">
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Verifying securely...</span>
                        </div>
                      )}

                      {otpStatus === "success" && (
                        <div className="flex items-center justify-center space-x-2 py-2 font-body-md text-sm font-semibold text-[#00b48a]">
                          <Check size={14} strokeWidth={3} />
                          <span>Security verification successful!</span>
                        </div>
                      )}

                      {error && (
                        <p className="text-center font-body-md text-sm font-semibold text-[#d45656]">
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={
                          otpStatus === "verifying" || otpStatus === "success"
                        }
                        className="flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-primary-container font-button-text text-sm font-semibold text-navy-accent transition-all duration-200 hover:shadow-md active:translate-y-px disabled:cursor-not-allowed disabled:bg-[#e5e5e5] disabled:text-[#a8a8aa]"
                      >
                        Verify Code
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* 5. FORGOT PASSWORD VIEW */}
                {view === "forgot" && (
                  <motion.div
                    key="forgot"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="pt-2"
                  >
                    <div className="flex items-center space-x-2 mb-4">
                      <button
                        onClick={() => {
                          setError("");
                          setView("login");
                        }}
                        className="p-1.5 rounded-lg hover:bg-neutral-50 text-neutral-500 transition-colors"
                      >
                        <ArrowLeft size={14} />
                      </button>
                      <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
                        Forgot Password
                      </h3>
                    </div>

                    <form onSubmit={handleForgotSubmit} className="space-y-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                          Registered Email
                        </label>
                        <div className="relative">
                          <Mail
                            size={14}
                            className="absolute left-3.5 top-3.5 text-neutral-400"
                          />
                          <input
                            type="email"
                            required
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="you@company.com"
                            className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:bg-white focus:border-primary transition-all duration-200 text-neutral-800 font-sans"
                          />
                        </div>
                      </div>

                      {error && (
                        <p className="text-[10px] font-bold text-red-500">
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer font-sans"
                      >
                        Send OTP Code
                        <ArrowRight size={14} className="ml-1.5" />
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* 6. RESET PASSWORD VIEW */}
                {view === "reset-password" && (
                  <motion.div
                    key="reset-password"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="pt-2"
                  >
                    <h3 className="text-lg font-bold text-neutral-900 tracking-tight mb-4">
                      Choose New Password
                    </h3>

                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-primary transition-all duration-200 text-neutral-800 font-sans"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full text-xs font-semibold bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-primary transition-all duration-200 text-neutral-800 font-sans"
                        />
                      </div>

                      {error && (
                        <p className="text-[10px] font-bold text-red-500">
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer font-sans"
                      >
                        Update Password
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Dock
        items={[
          {
            icon: (
              <span className="material-symbols-outlined text-neutral-600 text-base">
                home
              </span>
            ),
            label: "Home",
            onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
          },
          {
            icon: (
              <span className="material-symbols-outlined text-neutral-600 text-base">
                info
              </span>
            ),
            label: "About",
            onClick: () => {
              const el = document.getElementById("about");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            },
          },
          {
            icon: (
              <span className="material-symbols-outlined text-neutral-600 text-base">
                construction
              </span>
            ),
            label: "Capabilities",
            onClick: () => {
              const el = document.getElementById("services");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            },
          },
          {
            icon: (
              <span className="material-symbols-outlined text-neutral-600 text-base">
                login
              </span>
            ),
            label: "Client Portal",
            onClick: () => triggerAuthFlow("entrance"),
          },
          {
            icon: (
              <span className="material-symbols-outlined text-neutral-600 text-base">
                admin_panel_settings
              </span>
            ),
            label: "Admin Portal",
            onClick: onAdminClick,
          },
        ]}
        panelHeight={52}
        baseItemSize={38}
        magnification={52}
      />
    </div>
  );
}
}
