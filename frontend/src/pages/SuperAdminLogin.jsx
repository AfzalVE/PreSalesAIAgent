import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Lock, Mail, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import FloatingBackground from "../components/common/FloatingBackground";

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const { setUser } = useAppStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Hardcoded credentials
  const SUPER_ADMIN_EMAIL = "superadmin@ve.com";
  const SUPER_ADMIN_PASSWORD = "Super@123";

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (
      email === SUPER_ADMIN_EMAIL &&
      password === SUPER_ADMIN_PASSWORD
    ) {
      const loggedInUser = {
        emailOrPhone: email,
        role: "super-admin",
        isVerified: true,
      };

      // Save user in Zustand
      setUser(loggedInUser);

      // Optional: Save in localStorage
      localStorage.setItem("user", JSON.stringify(loggedInUser));

      // Redirect to Dashboard
     navigate("/super-admin-dashboard");
    } else {
      setError("Invalid Super Admin Email or Password");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-100 overflow-hidden">
      <FloatingBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-xl p-8 z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={34} className="text-teal-600" />
          </div>

          <h1 className="text-3xl font-bold">
            Super Admin Login
          </h1>

          <p className="text-gray-500 mt-2 text-sm">
            Secure access to the Admin Dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-gray-600">
              Email
            </label>

            <div className="relative mt-2">
              <Mail
                size={18}
                className="absolute left-4 top-4 text-gray-400"
              />

              <input
                type="email"
                placeholder="Enter Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600">
              Password
            </label>

            <div className="relative mt-2">
              <Lock
                size={18}
                className="absolute left-4 top-4 text-gray-400"
              />

              <input
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl font-semibold flex justify-center items-center gap-2 transition"
          >
            Login
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-8 border-t pt-5 text-center">
          <p className="text-xs text-gray-500">
            Demo Credentials
          </p>

          <p className="text-sm font-semibold mt-2">
            Email:
            <span className="text-teal-600">
              {" "}superadmin@ve.com
            </span>
          </p>

          <p className="text-sm font-semibold">
            Password:
            <span className="text-teal-600">
              {" "}Super@123
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}