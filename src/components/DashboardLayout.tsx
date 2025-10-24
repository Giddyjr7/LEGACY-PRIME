import { useState, useRef, useEffect } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  User,
  Settings,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  // Dropdown state and ref
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const menuItems = [
    { name: "Overview", icon: <LayoutDashboard size={18} />, path: "/dashboard" },
    { name: "Deposit", icon: <ArrowDownCircle size={18} />, path: "/dashboard/deposit" },
    { name: "Withdraw", icon: <ArrowUpCircle size={18} />, path: "/dashboard/withdraw" },
    { name: "Transactions", icon: <Clock size={18} />, path: "/dashboard/transactions" },
    { name: "Settings", icon: <Settings size={18} />, path: "/dashboard/settings" },
    { name: "Profile", icon: <User size={18} />, path: "/dashboard/profile" },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 transform border-r border-border bg-card transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between py-6 px-4 border-b border-border">
          <h1 className="text-lg font-bold">
            <span className="text-white">Legacy</span>
            <span className="text-crypto-purple">Prime</span>
          </h1>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
          <nav className="flex flex-col p-4 space-y-2 mt-8">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-muted text-foreground" : "hover:bg-muted"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:ml-64">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-[1.35rem] lg:px-6">
          {/* Mobile sidebar toggle */}
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>

          {/* Page title */}
          <h2 className="text-lg font-semibold">Welcome Giddy</h2>

          {/* Profile section (dummy) */}
          <div className="relative flex items-center gap-3" ref={dropdownRef}>
            <img
              src="https://avatars.dicebear.com/api/identicon/giddyjr7.svg"
              alt="Profile"
              className="h-8 w-8 rounded-full border border-border object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                // fallback to initials avatar if the image fails to load
                target.onerror = null;
                target.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="#7c3aed"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="28" fill="#fff" font-family="Arial,Helvetica,sans-serif">GJ</text></svg>`);
              }}
            />
            <span className="text-sm font-medium">Giddyjr7</span>
            <button
              type="button"
              className="focus:outline-none"
              onClick={() => setDropdownOpen((open) => !open)}
              aria-label="Open profile menu"
            >
              <ChevronDown size={18} className="text-muted-foreground" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-12 z-50 w-44 rounded-lg border border-border bg-card shadow-lg py-2 animate-fade-in">
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/dashboard/profile');
                  }}
                >
                  Profile
                </button>
                <Link
                  to="/dashboard/settings"
                  className="block px-4 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  Change Password
                </Link>
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors text-destructive"
                  onClick={async () => {
                    setDropdownOpen(false);
                    try {
                      await logout();
                    } catch (e) {
                      // ignore - logout should clear local tokens regardless
                    }
                    navigate('/');
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Outlet for nested pages */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
