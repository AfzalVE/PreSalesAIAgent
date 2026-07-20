import { useState, useEffect } from "react";
import { Eye, EyeOff, Save, CheckCircle, ArrowLeft } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const { user, setUser } = useAppStore();
  const navigate = useNavigate();
  
  // Profile State
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: ""
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);

  useEffect(() => {
    if (user?.accessToken) {
      fetchProfile();
    } else {
      navigate("/");
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/me`, {
        headers: {
          "Authorization": `Bearer ${user.accessToken}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setProfileData({
          full_name: data.full_name || "",
          email: data.email?.includes("@phone-auth.local") ? "" : data.email || "",
          phone: data.phone || ""
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess(false);
    setProfileLoading(true);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.accessToken}`
        },
        body: JSON.stringify({
          full_name: profileData.full_name,
          email: profileData.email || null,
          phone: profileData.phone || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to update profile details");
      
      setUser({
        ...user,
        fullName: data.full_name,
        emailOrPhone: data.email || data.phone
      });

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess(false);
    
    if (!currentPassword || !newPassword) {
      setPwdError("Please fill in both password fields");
      return;
    }
    
    setPwdLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.accessToken}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to change password");
      
      setPwdSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setPwdSuccess(false), 3000);
    } catch (err) {
      setPwdError(err.message);
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-start justify-center p-6 sm:p-12 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden mt-8">
        
        {/* Header */}
        <div className="p-8 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-500"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-navy-accent flex items-center gap-3">
              <span className="text-3xl">👤</span> User Profile
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 grid md:grid-cols-2 gap-12">
          
          {/* Left Column: Personal Details */}
          <div>
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <h3 className="text-sm font-bold text-navy-accent mb-4 uppercase tracking-widest border-b border-neutral-100 pb-2">Personal Details</h3>
              
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                  className="w-full h-11 border border-neutral-200 rounded-lg px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-neutral-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Provide email to authenticate"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="w-full h-11 border border-neutral-200 rounded-lg px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-neutral-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  className="w-full h-11 border border-neutral-200 rounded-lg px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-neutral-50 focus:bg-white"
                />
              </div>

              {profileError && <p className="text-xs font-bold text-red-500">{profileError}</p>}
              {profileSuccess && (
                <p className="text-xs font-bold text-green-600 flex items-center gap-1">
                  <CheckCircle size={14} /> Profile updated successfully!
                </p>
              )}

              <button
                type="submit"
                disabled={profileLoading}
                className="w-full h-12 mt-4 bg-navy-accent text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-navy-accent/90 disabled:opacity-70 transition-all cursor-pointer shadow-md"
              >
                <Save size={16} /> {profileLoading ? "Saving..." : "Save Details"}
              </button>
            </form>
          </div>

          {/* Right Column: Password */}
          <div>
            <form onSubmit={handleChangePassword} className="space-y-5">
              <h3 className="text-sm font-bold text-navy-accent mb-4 uppercase tracking-widest border-b border-neutral-100 pb-2">Change Password</h3>
              
              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full h-11 border border-neutral-200 rounded-lg pl-4 pr-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-neutral-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 inset-y-0 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-11 border border-neutral-200 rounded-lg pl-4 pr-10 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-neutral-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 inset-y-0 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {pwdError && <p className="text-xs font-bold text-red-500">{pwdError}</p>}
              {pwdSuccess && (
                <p className="text-xs font-bold text-green-600 flex items-center gap-1">
                  <CheckCircle size={14} /> Password changed successfully!
                </p>
              )}

              <button
                type="submit"
                disabled={pwdLoading}
                className="w-full h-12 mt-4 bg-neutral-200 text-navy-accent rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-neutral-300 disabled:opacity-70 transition-all cursor-pointer"
              >
                <Save size={16} /> {pwdLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
