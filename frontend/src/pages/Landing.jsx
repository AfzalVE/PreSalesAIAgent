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
  Menu,
  Sparkles,
  ShieldCheck,
  DollarSign,
  Eye,
  EyeOff,
  Lock,
  Cpu,
  Layers,
  Activity,
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { useNavigate } from "react-router-dom";
import CardSwap, { Card } from "../components/common/CardSwap";
import FlowingMenu from "../components/common/FlowingMenu";
import Dock from "../components/common/Dock";
import Threads from "../components/common/Threads";
import RotatingText from "../components/common/RotatingText";
import AdminLogin from "./AdminLogin";
import { ThreeDot } from "react-loading-indicators";

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
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime - delay;
      if (progress < 0) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      const percentage = Math.min(progress / duration, 1);
      const easeOut = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);

      setCount(end * easeOut);

      if (percentage < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, delay, start]);

  return (
    <span>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
};

export default function Landing({ onAdminClick }) {
  const { user, setUser, resetStore } = useAppStore();
  const navigate = useNavigate();

  const [activeNav, setActiveNav] = useState("platform");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Single entrance validation
  const [entranceInput, setEntranceInput] = useState("");
  const [isValidEntrance, setIsValidEntrance] = useState(false);
  const [entranceError, setEntranceError] = useState("");

  // View states: "entrance" | "login" | "register" | "otp" | "forgot" | "reset-password"
  const [view, setView] = useState("register");
  const [otpPurpose, setOtpPurpose] = useState("login"); // "login" | "register" | "forgot"

  // Login Form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Register Form
  const [isPhone, setIsPhone] = useState(false);
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regCountryCode, setRegCountryCode] = useState("US +1");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regCompanyName, setRegCompanyName] = useState("");
  const [isNotRobot, setIsNotRobot] = useState(false);

  // Forgot Password
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // OTP Verification state
  const [otpCode, setOtpCode] = useState("");
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const [otpStatus, setOtpStatus] = useState(""); // "" | "verifying" | "success" | "error"
  const [pendingToken, setPendingToken] = useState("");
  const [verifiedUserData, setVerifiedUserData] = useState(null);
  const [floatingLoader, setFloatingLoader] = useState({
    active: false,
    text: "",
  });

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
      },
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

  const handleEntranceContinue = async () => {
    if (!isValidEntrance) return;
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/check-email?email=${encodeURIComponent(entranceInput)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Failed to check email status");
      }

      if (data.exists && data.is_verified) {
        setEmail(entranceInput);
        setView("login");
      } else {
        setRegEmail(entranceInput);
        setView("register");
      }
    } catch (err) {
      setRegEmail(entranceInput);
      setView("register");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (regEmail) {
        setIsPhone(!regEmail.includes("@") && /\d/.test(regEmail));
      } else {
        setIsPhone(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [regEmail]);

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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setOtpStatus("verifying");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/user-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed.");
      }

      if (data.otp_required === false) {
        setOtpStatus("success");
        setFloatingLoader({
          active: true,
          text: "Authentication Confirmed! Launching Workspace...",
        });
        setTimeout(() => {
          setFloatingLoader({ active: false, text: "" });
          setUser({
            emailOrPhone: data.email,
            fullName: data.full_name,
            companyName: data.company_name || "Sovereign Enterprise",
            role: data.role,
            isVerified: true,
            accessToken: data.access_token,
          });
          const targetPath =
            data.role === "super-admin" ||
            data.email?.toLowerCase().includes("superadmin")
              ? "/super-admin-dashboard"
              : data.role === "admin"
                ? "/admin"
                : "/client-portal";
          navigate(targetPath);
        }, 500);
        return;
      }

      setPendingToken(data.pending_token);
      setOtpPurpose("login");
      setFloatingLoader({
        active: true,
        text: "Dispatching Security Verification Code...",
      });
      setTimeout(() => {
        setFloatingLoader({ active: false, text: "" });
        setView("otp");
        setOtpStatus("");
        setOtpCode("");
        startOtpResendTimer();
      }, 400);
    } catch (err) {
      setOtpStatus("");
      setError(err.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regEmail) {
      setError("Please enter your email or phone number.");
      return;
    }
    setError("");
    setOtpStatus("verifying");

    // Generate mock OTP for demo
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();

    setPendingToken(mockOtp);
    setOtpPurpose("demo-login");
    setFloatingLoader({
      active: true,
      text: "Dispatching Security Verification Code...",
    });
    setTimeout(() => {
      setFloatingLoader({ active: false, text: "" });
      setView("otp");
      setOtpStatus("");
      setOtpCode("");
      startOtpResendTimer();
    }, 400);
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

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      setError("Please enter a valid OTP code.");
      return;
    }
    setError("");
    setOtpStatus("verifying");

    if (otpPurpose === "demo-login") {
      if (otpCode !== pendingToken) {
        setOtpStatus("error");
        setError("Invalid OTP code. Please try again.");
        return;
      }
      setOtpStatus("success");
      setFloatingLoader({
        active: true,
        text: "Security Verified! Initializing Workspace...",
      });
      setTimeout(() => {
        setFloatingLoader({ active: false, text: "" });
        setUser({
          emailOrPhone: regEmail,
          fullName: "",
          companyName: "Sovereign Enterprise",
          role: "client",
          isVerified: true,
          accessToken: "demo-token",
        });
        const targetPath = regEmail?.toLowerCase().includes("superadmin")
          ? "/super-admin-dashboard"
          : regEmail?.toLowerCase().includes("admin")
            ? "/admin"
            : "/onboarding";
        navigate(targetPath);
      }, 500);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pending_token: pendingToken,
            otp: otpCode,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Invalid OTP code.");
      }
      setOtpStatus("success");
      setFloatingLoader({
        active: true,
        text: "Security Verified! Initializing Workspace...",
      });
      setTimeout(() => {
        setFloatingLoader({ active: false, text: "" });
        if (otpPurpose === "forgot") {
          setView("reset-password");
          setOtpStatus("");
          setOtpCode("");
        } else {
          setUser({
            emailOrPhone: data.email,
            fullName: data.full_name,
            companyName:
              data.company_name || regCompanyName || "Sovereign Enterprise",
            role: data.role,
            isVerified: true,
            accessToken: data.access_token,
          });
          const targetPath =
            data.role === "super-admin" ||
            data.email?.toLowerCase().includes("superadmin")
              ? "/super-admin-dashboard"
              : data.role === "admin"
                ? "/admin"
                : "/onboarding";
          navigate(targetPath);
        }
      }, 500);
    } catch (err) {
      setOtpStatus("error");
      setError(err.message || "Invalid OTP code.");
    }
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
    if (user?.isVerified) {
      if (
        user.role === "super-admin" ||
        user.emailOrPhone?.toLowerCase().includes("superadmin")
      ) {
        navigate("/super-admin-dashboard");
      } else if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/onboarding");
      }
      return;
    }
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
          will-change: transform, opacity;
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
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
          will-change: transform;
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        @keyframes float {
          0% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(100px, 50px, 0) scale(1.1); }
          100% { transform: translate3d(-50px, 100px, 0) scale(0.9); }
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
        <div className="flex flex-wrap justify-between items-center px-4 sm:px-6 md:px-margin-desktop py-3 sm:py-4 max-w-container-max mx-auto gap-3">
          <div
            className="flex items-center gap-2 cursor-pointer flex-shrink-0"
            onClick={() => {
              setActiveNav("platform");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <img
              src="/ve.png"
              alt="Pre Sales Platform"
              className="h-8 sm:h-9 w-auto object-contain"
            />
            <span className="font-display-lg text-lg sm:text-2xl text-navy-accent font-extrabold tracking-tight">
              Pre Sales Platform
            </span>
          </div>
          <div className="hidden md:flex items-center gap-stack-lg relative">
            <button
              onClick={() => {
                setActiveNav("platform");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`font-body-md font-semibold py-1 cursor-pointer transition-colors ${
                activeNav === "platform"
                  ? "text-navy-accent border-b-2 border-primary"
                  : "text-on-surface-variant hover:text-navy-accent border-b-2 border-transparent"
              }`}
            >
              Platform
            </button>
            <button
              onClick={() => {
                setActiveNav("services");
                document
                  .getElementById("services")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`font-body-md font-semibold py-1 cursor-pointer transition-colors ${
                activeNav === "services"
                  ? "text-navy-accent border-b-2 border-primary"
                  : "text-on-surface-variant hover:text-navy-accent border-b-2 border-transparent"
              }`}
            >
              Services
            </button>
            <button
              onClick={() => {
                setActiveNav("about");
                document
                  .getElementById("footer")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`font-body-md font-semibold py-1 cursor-pointer transition-colors ${
                activeNav === "about"
                  ? "text-navy-accent border-b-2 border-primary"
                  : "text-on-surface-variant hover:text-navy-accent border-b-2 border-transparent"
              }`}
            >
              About
            </button>
          </div>
          <div className="hidden md:flex items-center flex-wrap gap-2 sm:gap-3 justify-end ml-auto">
            {user?.isVerified ? (
              <>
                <span className="text-xs font-semibold text-navy-accent bg-neutral-100 px-2.5 sm:px-3 py-1.5 rounded-lg border border-neutral-200 truncate max-w-[150px] sm:max-w-none">
                  {user.fullName || user.emailOrPhone}
                </span>
                <button
                  onClick={() => {
                    if (
                      user.role === "super-admin" ||
                      user.emailOrPhone?.toLowerCase().includes("superadmin")
                    ) {
                      navigate("/super-admin-dashboard");
                    } else if (user.role === "admin") {
                      navigate("/admin");
                    } else {
                      navigate("/client-portal");
                    }
                  }}
                  className="bg-primary-container text-navy-accent px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-button-text shadow-sm hover:shadow-md transition-all font-semibold text-xs cursor-pointer whitespace-nowrap"
                >
                  Client Dashboard
                </button>
                <button
                  onClick={resetStore}
                  className="border border-red-200 bg-red-50 text-red-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-button-text hover:bg-red-100 transition-all font-semibold text-xs shadow-sm hover:shadow-md cursor-pointer whitespace-nowrap"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/admin/login")}
                  className="border border-outline/30 bg-white/50 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-button-text hover:bg-white transition-all text-navy-accent font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 text-xs sm:text-sm cursor-pointer whitespace-nowrap"
                >
                  Admin Login
                </button>
                <button
                  onClick={() => triggerAuthFlow("register")}
                  className="bg-primary-container text-navy-accent px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-button-text shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold text-xs sm:text-sm cursor-pointer whitespace-nowrap"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center ml-auto">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-navy-accent"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-outline-variant/20 shadow-lg p-4 flex flex-col gap-4 animate-in slide-in-from-top-2 z-50">
            <div className="flex flex-col gap-2 border-b border-outline-variant/20 pb-4">
              <button
                onClick={() => {
                  setActiveNav("platform");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  setIsMobileMenuOpen(false);
                }}
                className={`text-left font-body-md font-semibold py-2 transition-colors ${activeNav === "platform" ? "text-primary" : "text-on-surface-variant"}`}
              >
                Platform
              </button>
              <button
                onClick={() => {
                  setActiveNav("services");
                  document
                    .getElementById("services")
                    ?.scrollIntoView({ behavior: "smooth" });
                  setIsMobileMenuOpen(false);
                }}
                className={`text-left font-body-md font-semibold py-2 transition-colors ${activeNav === "services" ? "text-primary" : "text-on-surface-variant"}`}
              >
                Services
              </button>
              <button
                onClick={() => {
                  setActiveNav("about");
                  document
                    .getElementById("footer")
                    ?.scrollIntoView({ behavior: "smooth" });
                  setIsMobileMenuOpen(false);
                }}
                className={`text-left font-body-md font-semibold py-2 transition-colors ${activeNav === "about" ? "text-primary" : "text-on-surface-variant"}`}
              >
                About
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {user?.isVerified ? (
                <>
                  <span className="text-sm font-semibold text-navy-accent bg-neutral-100 px-3 py-2 rounded-lg border border-neutral-200">
                    {user.fullName || user.emailOrPhone}
                  </span>
                  <button
                    onClick={() => {
                      if (
                        user.role === "super-admin" ||
                        user.emailOrPhone?.toLowerCase().includes("superadmin")
                      ) {
                        navigate("/super-admin-dashboard");
                      } else if (user.role === "admin") {
                        navigate("/admin");
                      } else {
                        navigate("/client-portal");
                      }
                    }}
                    className="bg-primary-container text-navy-accent px-4 py-2 rounded-lg font-button-text shadow-sm hover:shadow-md transition-all font-semibold text-sm w-full text-center"
                  >
                    Client Dashboard
                  </button>
                  <button
                    onClick={resetStore}
                    className="border border-red-200 bg-red-50 text-red-700 px-4 py-2 rounded-lg font-button-text hover:bg-red-100 transition-all font-semibold text-sm shadow-sm hover:shadow-md w-full text-center"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      navigate("/admin/login");
                      setIsMobileMenuOpen(false);
                    }}
                    className="border border-outline/30 bg-white px-4 py-2.5 rounded-lg font-button-text hover:bg-neutral-50 transition-all text-navy-accent font-medium shadow-sm w-full text-center"
                  >
                    Admin Login
                  </button>
                  <button
                    onClick={() => {
                      triggerAuthFlow("register");
                      setIsMobileMenuOpen(false);
                    }}
                    className="bg-primary-container text-navy-accent px-4 py-2.5 rounded-lg font-button-text shadow-sm hover:shadow-md transition-all font-bold text-sm w-full text-center"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="relative z-10">
        {/* Subtle WebGL Threads Background */}
        <div className="absolute inset-x-0 top-0 h-[850px] pointer-events-none z-0 opacity-[0.25] transform-gpu">
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
                onClick={() => triggerAuthFlow("register")}
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
                />{" "}
              </p>
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
                  Comprehensive Engine for technical Documentation.
                </h2>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="font-button-text text-navy-accent group flex items-center gap-2 hover:text-primary transition-colors text-lg font-bold cursor-pointer"
              >
                Explore Platform{" "}
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                  arrow_right_alt
                </span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
              <div
                onClick={() => triggerAuthFlow("register")}
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
                onClick={() => triggerAuthFlow("register")}
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
                onClick={() => triggerAuthFlow("register")}
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
                onClick={() => triggerAuthFlow("register")}
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
                  onClick={() => triggerAuthFlow("register")}
                  className="bg-white aspect-square rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center gap-3 group hover:border-primary hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
                    <svg
                      role="img"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-8 h-8 fill-current text-[#00D8FF]"
                    >
                      <title>React</title>
                      <path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z" />
                    </svg>
                  </div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">
                    React
                  </span>
                </div>
                <div
                  onClick={() => triggerAuthFlow("register")}
                  className="bg-white aspect-square rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center gap-3 group hover:border-primary hover:-translate-y-1 transition-all duration-300 translate-y-6 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
                    <svg
                      role="img"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-8 h-8 fill-current text-[#3776AB]"
                    >
                      <title>Python</title>
                      <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z" />
                    </svg>
                  </div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">
                    Python
                  </span>
                </div>
                <div
                  onClick={() => triggerAuthFlow("register")}
                  className="bg-white aspect-square rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center gap-3 group hover:border-primary hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
                    <svg
                      role="img"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-8 h-8 fill-current text-black"
                    >
                      <title>Vercel</title>
                      <path d="m12 1.608 12 20.784H0Z" />
                    </svg>
                  </div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">
                    Vercel
                  </span>
                </div>
                <div
                  onClick={() => triggerAuthFlow("register")}
                  className="bg-white aspect-square rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center gap-3 group hover:border-primary hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
                    <svg
                      role="img"
                      viewBox="0 0 16 16"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-8 h-8 fill-current text-[#10A37F]"
                    >
                      <title>OpenAI</title>
                      <path d="M14.949 6.547a3.94 3.94 0 0 0-.348-3.273 4.11 4.11 0 0 0-4.4-1.934A4.1 4.1 0 0 0 8.423.2 4.15 4.15 0 0 0 6.305.086a4.1 4.1 0 0 0-1.891.948 4.04 4.04 0 0 0-1.158 1.753 4.1 4.1 0 0 0-1.563.679A4 4 0 0 0 .554 4.72a3.99 3.99 0 0 0 .502 4.731 3.94 3.94 0 0 0 .346 3.274 4.11 4.11 0 0 0 4.402 1.933c.382.425.852.764 1.377.995.526.231 1.095.35 1.67.346 1.78.002 3.358-1.132 3.901-2.804a4.1 4.1 0 0 0 1.563-.68 4 4 0 0 0 1.14-1.253 3.99 3.99 0 0 0-.506-4.716m-6.097 8.406a3.05 3.05 0 0 1-1.945-.694l.096-.054 3.23-1.838a.53.53 0 0 0 .265-.455v-4.49l1.366.778q.02.011.025.035v3.722c-.003 1.653-1.361 2.992-3.037 2.996m-6.53-2.75a2.95 2.95 0 0 1-.36-2.01l.095.057L5.29 12.09a.53.53 0 0 0 .527 0l3.949-2.246v1.555a.05.05 0 0 1-.022.041L6.473 13.3c-1.454.826-3.311.335-4.15-1.098m-.85-6.94A3.02 3.02 0 0 1 3.07 3.949v3.785a.51.51 0 0 0 .262.451l3.93 2.237-1.366.779a.05.05 0 0 1-.048 0L2.585 9.342a2.98 2.98 0 0 1-1.113-4.094zm11.216 2.571L8.747 5.576l1.362-.776a.05.05 0 0 1 .048 0l3.265 1.86a3 3 0 0 1 1.173 1.207 2.96 2.96 0 0 1-.27 3.2 3.05 3.05 0 0 1-1.36.997V8.279a.52.52 0 0 0-.276-.445m1.36-2.015-.097-.057-3.226-1.855a.53.53 0 0 0-.53 0L6.249 6.153V4.598a.04.04 0 0 1 .019-.04L9.533 2.7a3.07 3.07 0 0 1 3.257.139c.474.325.843.778 1.066 1.303.223.526.289 1.103.191 1.664zM5.503 8.575 4.139 7.8a.05.05 0 0 1-.026-.037V4.049c0-.57.166-1.127.476-1.607s.752-.864 1.275-1.105a3.08 3.08 0 0 1-1.503-2.617c0-.206.022-.407.06-.603z" />
                    </svg>
                  </div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">
                    OpenAI
                  </span>
                </div>
                <div
                  onClick={() => triggerAuthFlow("register")}
                  className="bg-white aspect-square rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center gap-3 group hover:border-primary hover:-translate-y-1 transition-all duration-300 translate-y-6 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
                    <svg
                      role="img"
                      viewBox="0 0 640 512"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-9 h-9 fill-current text-[#FF9900]"
                    >
                      <title>Amazon AWS</title>
                      <path d="M180.41 203.01c-.72 22.65 10.6 32.68 10.88 39.05a8.164 8.164 0 0 1-4.1 6.27l-12.8 8.96a10.66 10.66 0 0 1-5.63 1.92c-.43-.02-8.19 1.83-20.48-25.61a78.608 78.608 0 0 1-62.61 29.45c-16.28.89-60.4-9.24-58.13-56.21-1.59-38.28 34.06-62.06 70.93-60.05 7.1.02 21.6.37 46.99 6.27v-15.62c2.69-26.46-14.7-46.99-44.81-43.91-2.4.01-19.4-.5-45.84 10.11-7.36 3.38-8.3 2.82-10.75 2.82-7.41 0-4.36-21.48-2.94-24.2 5.21-6.4 35.86-18.35 65.94-18.18a76.857 76.857 0 0 1 55.69 17.28 70.285 70.285 0 0 1 17.67 52.36l-.01 69.29zM93.99 235.4c32.43-.47 46.16-19.97 49.29-30.47 2.46-10.05 2.05-16.41 2.05-27.4-9.67-2.32-23.59-4.85-39.56-4.87-15.15-1.14-42.82 5.63-41.74 32.26-1.24 16.79 11.12 31.4 29.96 30.48zm170.92 23.05c-7.86.72-11.52-4.86-12.68-10.37l-49.8-164.65c-.97-2.78-1.61-5.65-1.92-8.58a4.61 4.61 0 0 1 3.86-5.25c.24-.04-2.13 0 22.25 0 8.78-.88 11.64 6.03 12.55 10.37l35.72 140.83 33.16-140.83c.53-3.22 2.94-11.07 12.8-10.24h17.16c2.17-.18 11.11-.5 12.68 10.37l33.42 142.63L420.98 80.1c.48-2.18 2.72-11.37 12.68-10.37h19.72c.85-.13 6.15-.81 5.25 8.58-.43 1.85 3.41-10.66-52.75 169.9-1.15 5.51-4.82 11.09-12.68 10.37h-18.69c-10.94 1.15-12.51-9.66-12.68-10.75L328.67 110.7l-32.78 136.99c-.16 1.09-1.73 11.9-12.68 10.75h-18.3zm273.48 5.63c-5.88.01-33.92-.3-57.36-12.29a12.802 12.802 0 0 1-7.81-11.91v-10.75c0-8.45 6.2-6.9 8.83-5.89 10.04 4.06 16.48 7.14 28.81 9.6 36.65 7.53 52.77-2.3 56.72-4.48 13.15-7.81 14.19-25.68 5.25-34.95-10.48-8.79-15.48-9.12-53.13-21-4.64-1.29-43.7-13.61-43.79-52.36-.61-28.24 25.05-56.18 69.52-55.95 12.67-.01 46.43 4.13 55.57 15.62 1.35 2.09 2.02 4.55 1.92 7.04v10.11c0 4.44-1.62 6.66-4.87 6.66-7.71-.86-21.39-11.17-49.16-10.75-6.89-.36-39.89.91-38.41 24.97-.43 18.96 26.61 26.07 29.7 26.89 36.46 10.97 48.65 12.79 63.12 29.58 17.14 22.25 7.9 48.3 4.35 55.44-19.08 37.49-68.42 34.44-69.26 34.42zm40.2 104.86c-70.03 51.72-171.69 79.25-258.49 79.25A469.127 469.127 0 0 1 2.83 327.46c-6.53-5.89-.77-13.96 7.17-9.47a637.37 637.37 0 0 0 316.88 84.12 630.22 630.22 0 0 0 241.59-49.55c11.78-5 21.77 7.8 10.12 16.38zm29.19-33.29c-8.96-11.52-59.28-5.38-81.81-2.69-6.79.77-7.94-5.12-1.79-9.47 40.07-28.17 105.88-20.1 113.44-10.63 7.55 9.47-2.05 75.41-39.56 106.91-5.76 4.87-11.27 2.3-8.71-4.1 8.44-21.25 27.39-68.49 18.43-80.02z" />
                    </svg>
                  </div>
                  <span className="font-label-caps text-[10px] text-on-surface-variant font-bold">
                    Amazon
                  </span>
                </div>
                <div
                  onClick={() => triggerAuthFlow("register")}
                  className="bg-white aspect-square rounded-3xl border border-outline-variant/10 shadow-sm flex flex-col items-center justify-center gap-3 group hover:border-primary hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
                    <svg
                      role="img"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-8 h-8 fill-current text-[#47A248]"
                    >
                      <title>MongoDB</title>
                      <path d="M17.193 9.555c-1.264-5.58-4.252-7.414-4.573-8.115-.28-.394-.53-.954-.735-1.44-.036.495-.055.685-.523 1.184-.723.566-4.438 3.682-4.74 10.02-.282 5.912 4.27 9.435 4.888 9.884l.07.05A73.49 73.49 0 0111.91 24h.481c.114-1.032.284-2.056.51-3.07.417-.296.604-.463.85-.693a11.342 11.342 0 003.639-8.464c.01-.814-.103-1.662-.197-2.218zm-5.336 8.195s0-8.291.275-8.29c.213 0 .49 10.695.49 10.695-.381-.045-.765-1.76-.765-2.405z" />
                    </svg>
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
              {/* <button
                onClick={() => triggerAuthFlow("register")}
                className="bg-navy-accent text-white px-12 py-5 rounded-2xl font-button-text text-xl hover:bg-navy-accent/90 shadow-xl transition-all font-bold"
              >
                Schedule Live Demo
              </button> */}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        id="footer"
        className="bg-white border-t border-outline-variant/30 pt-16 relative z-10"
      >
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
              Virtual Employee Pvt. Ltd. delivers cutting-edge AI, software
              development, and digital solutions that help businesses innovate,
              scale, and succeed.
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
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  className="w-10 h-10 rounded-full border border-navy-accent bg-navy-accent text-white flex items-center justify-center hover:bg-primary hover:border-primary transition-all"
                  href="#!"
                  aria-label="Facebook"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                  </svg>
                </a>
                <a
                  className="w-10 h-10 rounded-full border border-navy-accent bg-navy-accent text-white flex items-center justify-center hover:bg-primary hover:border-primary transition-all"
                  href="#!"
                  aria-label="LinkedIn"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a
                  className="w-10 h-10 rounded-full border border-navy-accent bg-navy-accent text-white flex items-center justify-center hover:bg-primary hover:border-primary transition-all"
                  href="#!"
                  aria-label="YouTube"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.524 3.545 12 3.545 12 3.545s-7.525 0-9.388.51a3.002 3.002 0 0 0-2.11 2.108C0 8.029 0 12 0 12s0 3.971.502 5.837a3.003 3.003 0 0 0 2.11 2.108c1.863.51 9.388.51 9.388.51s7.525 0 9.388-.51a3.002 3.002 0 0 0 2.11-2.108C24 15.971 24 12 24 12s0-3.971-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
                <a
                  className="w-10 h-10 rounded-full border border-navy-accent bg-navy-accent text-white flex items-center justify-center hover:bg-primary hover:border-primary transition-all"
                  href="#!"
                  aria-label="Instagram"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
                  ? "max-w-[430px] rounded-xl px-6 py-8 text-left sm:px-10 sm:py-10 max-h-[90vh] overflow-y-auto"
                  : "max-w-md rounded-3xl p-8 text-left max-h-[90vh] overflow-y-auto"
              }`}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors z-20 cursor-pointer"
              >
                <X size={20} />
              </button>

              {/* Floating Pill Loader Overlay with Blur Background */}
              <AnimatePresence>
                {(floatingLoader.active ||
                  otpStatus === "verifying" ||
                  otpStatus === "success") && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/70 backdrop-blur-lg rounded-xl sm:rounded-3xl"
                  >
                    <div className="mb-4">
                      <ThreeDot
                        variant="pulsate"
                        color="#006b5d"
                        size="medium"
                        text=""
                        textColor=""
                      />
                    </div>
                    <p className="font-headline-md text-navy-accent font-bold text-lg text-center px-6">
                      {floatingLoader.text ||
                        (otpStatus === "verifying"
                          ? view === "otp"
                            ? "Verifying security code..."
                            : "Authenticating securely..."
                          : otpStatus === "success"
                            ? "Security verification successful!"
                            : "Please wait...")}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

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
                    <div className="text-center mb-8">
                      <h3 className="font-headline-md text-2xl font-semibold text-[#0a0a0a]">
                        Login to Workspace
                      </h3>
                      <p className="mt-2 font-body-md text-sm text-[#5a5a5c]">
                        Start your project tomorrow and try your selected expert free for 1 week.
                      </p>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-5">
                      <div>
                        <label className="mb-2 block font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-[#3a3a3c]">
                          Work Email
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="h-11 w-full rounded-md border border-[#e5e5e5] bg-white px-4 font-body-md text-base text-[#0a0a0a] outline-none transition-all duration-200 placeholder:text-[#a8a8aa] focus:border-2 focus:border-[#00d4a4]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-[#3a3a3c]">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showLoginPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-11 w-full rounded-md border border-[#e5e5e5] bg-white pl-4 pr-10 font-body-md text-base text-[#0a0a0a] outline-none transition-all duration-200 placeholder:text-[#a8a8aa] focus:border-2 focus:border-[#00d4a4] [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowLoginPassword(!showLoginPassword)
                            }
                            className="absolute right-3 inset-y-0 flex items-center text-[#a8a8aa] hover:text-[#5a5a5c] transition-colors"
                          >
                            {showLoginPassword ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between font-body-md text-sm">
                        <label className="flex cursor-pointer items-center text-[#5a5a5c]">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 rounded border-[#cfd5dc] text-[#14e1d0] focus:ring-[#14e1d0] mr-3"
                          />
                          <span className="font-medium text-[#0a0a0a]">
                            Remember me
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setError("");
                            setView("forgot");
                          }}
                          className="font-semibold text-[#006b5d] hover:underline"
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
                        disabled={otpStatus === "verifying"}
                        className="mt-2 flex h-11 w-full items-center justify-center rounded-full bg-primary-container font-button-text text-sm font-semibold uppercase text-navy-accent transition-all duration-200 hover:shadow-md active:translate-y-px disabled:cursor-not-allowed disabled:bg-[#e5e5e5] disabled:text-[#a8a8aa]"
                      >
                        {otpStatus === "verifying"
                          ? "Authenticating..."
                          : "Authenticate"}
                      </button>
                      <div className="mt-4 text-center font-body-md text-xs text-[#5a5a5c]">
                        Don't have an account?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setError("");
                            setView("register");
                          }}
                          className="font-semibold text-primary hover:underline"
                        >
                          Sign Up
                        </button>
                      </div>
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
                    <div className="text-center mb-5">
                      <h3 className="font-headline-md text-2xl font-bold text-[#0a0a0a]">
                        Hi there!
                      </h3>
                      <p className="mt-1 font-body-md text-sm text-[#5a5a5c]">
                        Join the network for sovereign enterprise management.
                      </p>
                    </div>

                    <form
                      onSubmit={handleRegisterSubmit}
                      className="space-y-3.5"
                    >
                      <div>
                        <label className="mb-1 block font-label-caps text-xs font-bold uppercase tracking-[0.05em] text-[#3a3a3c]">
                          Email or Phone Number
                        </label>
                        <input
                          type="text"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="name@company.com or (555) 000-0000"
                          className="h-10 w-full rounded-md border border-[#e5e5e5] bg-white px-3.5 font-body-md text-base font-medium text-[#0a0a0a] outline-none transition-all duration-200 placeholder:text-[#a8a8aa] placeholder:font-normal focus:border-2 focus:border-[#00d4a4]"
                        />
                      </div>

                      {error && (
                        <p className="text-xs font-bold text-red-500">
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={otpStatus === "verifying"}
                        className="mt-2.5 flex h-11 w-full items-center justify-center rounded-full bg-primary-container font-button-text text-sm font-bold uppercase text-navy-accent transition-all duration-200 hover:shadow-md active:translate-y-px disabled:cursor-not-allowed disabled:bg-[#e5e5e5] disabled:text-[#a8a8aa]"
                      >
                        {otpStatus === "verifying"
                          ? "Generating..."
                          : "Generate OTP"}
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
                              : otpPurpose === "demo-login" || otpPurpose === "register"
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
                        We've sent a security code to your email. Enter the code
                        below to verify.
                      </p>
                      <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-left">
                        <p className="font-body-md text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">
                            info
                          </span>
                          Dev Mode Hint:
                        </p>
                        {otpPurpose === "demo-login" ? (
                          <p className="mt-1 font-body-md text-[13px] text-amber-900 leading-normal font-bold">
                            Your OTP is: {pendingToken}
                          </p>
                        ) : (
                          <p className="mt-1 font-body-md text-[11px] text-amber-700 leading-normal">
                            If SMTP is not configured, check the backend
                            terminal console for the printed OTP or inspect the{" "}
                            <strong>OTP Logs</strong> in the Admin portal.
                          </p>
                        )}
                      </div>
                    </div>

                    <form onSubmit={handleOtpVerify} className="space-y-5">
                      <div>
                        <label className="mb-2 block text-center font-label-caps text-[11px] font-semibold uppercase tracking-[0.05em] text-[#3a3a3c]">
                          6-Digit Security Code
                        </label>
                        <input
                          type="text"
                          maxLength={6}
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
              <span className="material-symbols-outlined text-base">home</span>
            ),
            label: "Platform",
            isActive: activeNav === "platform",
            onClick: () => {
              setActiveNav("platform");
              window.scrollTo({ top: 0, behavior: "smooth" });
            },
          },
          {
            icon: (
              <span className="material-symbols-outlined text-base">
                construction
              </span>
            ),
            label: "Services",
            isActive: activeNav === "services",
            onClick: () => {
              setActiveNav("services");
              const el = document.getElementById("services");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            },
          },
          {
            icon: (
              <span className="material-symbols-outlined text-base">info</span>
            ),
            label: "About",
            isActive: activeNav === "about",
            onClick: () => {
              setActiveNav("about");
              const el = document.getElementById("footer");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            },
          },
          {
            icon: (
              <span className="material-symbols-outlined text-base">login</span>
            ),
            label: "Client Login",
            isActive: activeNav === "client",
            onClick: () => {
              setActiveNav("client");
              triggerAuthFlow("register");
            },
          },
          {
            icon: (
              <span className="material-symbols-outlined text-base">
                admin_panel_settings
              </span>
            ),
            label: "Admin Login",
            isActive: activeNav === "admin",
            onClick: () => {
              setActiveNav("admin");
              navigate("/admin/login");
            },
          },
        ]}
        panelHeight={52}
        baseItemSize={38}
        magnification={52}
      />
    </div>
  );
}
