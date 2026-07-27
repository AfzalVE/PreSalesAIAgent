import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { User, MessageSquare, LogOut, Code2, Menu, X } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import FloatingBackground from "../../components/common/FloatingBackground";

export default function EmployeeDashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useAppStore();

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    navigate("/admin/login");
  };

  const navItems = [
    { name: "My Profile", path: "/employee/profile", icon: User },
    { name: "Client Chats", path: "/employee/chats", icon: MessageSquare },
  ];

  return (
    <div className="relative min-h-screen bg-[#fafafa] flex overflow-hidden">
      <FloatingBackground />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-neutral-200 bg-white/70 backdrop-blur-xl z-20">
        <div className="p-6 border-b border-neutral-100 flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Code2 className="text-primary" size={20} />
          </div>
          <div>
            <h2 className="font-headline-md text-base font-bold text-navy-accent">Dev Portal</h2>
            <p className="font-body-md text-xs text-neutral-500">{user?.name || "Developer"}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-body-md text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold shadow-sm border border-primary/10"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-navy-accent"
                }`}
              >
                <item.icon size={18} className={isActive ? "text-primary" : "text-neutral-500"} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-body-md text-sm text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-16 border-b border-neutral-200 bg-white/70 backdrop-blur-xl z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Code2 className="text-primary" size={20} />
          <h2 className="font-headline-md text-sm font-bold text-navy-accent">Dev Portal</h2>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-neutral-600">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute inset-0 top-16 bg-white/95 backdrop-blur-xl z-30 flex flex-col p-4 border-t border-neutral-200">
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-body-md text-base transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold border border-primary/10"
                      : "text-neutral-600 active:bg-neutral-100"
                  }`}
                >
                  <item.icon size={20} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-body-md text-base text-red-600 active:bg-red-50 mt-4"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 pt-16 md:pt-0 h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8 h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
