import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  CreditCard,
  LayoutDashboard,
  Loader2,
  LogOut,
  Phone,
  Settings,
  Shield,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile, useIsCallerAdmin } from "./hooks/useQueries";

import ProfileSetupModal from "./components/ProfileSetupModal";
import AdminDashboard from "./pages/AdminDashboard";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import LoginPage from "./pages/LoginPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentStatusPage from "./pages/PaymentStatusPage";
import TrackPage from "./pages/TrackPage";

type Tab = "dashboard" | "track" | "history" | "payment";

const NAV_ITEMS: {
  id: Tab;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "track", label: "Track", icon: Phone },
  { id: "history", label: "Calls", icon: Clock },
  { id: "payment", label: "Payment", icon: CreditCard },
];

function AppHeader({
  onLogout,
  activeTab,
  onAdminClick,
  isAdmin,
}: {
  onLogout: () => void;
  activeTab: Tab;
  onAdminClick?: () => void;
  isAdmin?: boolean;
}) {
  const TAB_TITLES: Record<Tab, string> = {
    dashboard: "PhoneTrackr",
    track: "Track Numbers",
    history: "Call History",
    payment: "Subscription",
  };

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Phone className="w-3.5 h-3.5 text-white" />
          </div>
          <h1 className="text-base font-bold text-foreground tracking-tight">
            {TAB_TITLES[activeTab]}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && onAdminClick && (
            <button
              type="button"
              onClick={onAdminClick}
              className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary-light hover:text-primary transition-colors"
              title="Admin Dashboard"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-red-50 hover:text-primary transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
}

function BottomNav({
  activeTab,
  onTabChange,
}: { activeTab: Tab; onTabChange: (tab: Tab) => void }) {
  return (
    <nav className="bottom-nav">
      <div className="h-full grid grid-cols-4">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  isActive ? "bg-primary-light" : ""
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                />
              </div>
              <span
                className={`text-[10px] font-semibold leading-none ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function AuthenticatedApp({
  onNavigateAdmin,
}: { onNavigateAdmin: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();

  const isAuthenticated = !!identity;
  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleNavigate = (tab: string) => {
    setActiveTab(tab as Tab);
  };

  return (
    <>
      <AppHeader
        onLogout={handleLogout}
        activeTab={activeTab}
        onAdminClick={onNavigateAdmin}
        isAdmin={isAdmin === true}
      />

      <main className="page-content">
        {activeTab === "dashboard" && (
          <DashboardPage onNavigate={handleNavigate} />
        )}
        {activeTab === "track" && <TrackPage />}
        {activeTab === "history" && <HistoryPage />}
        {activeTab === "payment" && <PaymentPage />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {showProfileSetup && (
        <ProfileSetupModal
          onComplete={() =>
            queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] })
          }
        />
      )}
    </>
  );
}

const ADMIN_PASSWORD = "08122m";
const ADMIN_SESSION_KEY = "adminAuth";

function AdminRoute() {
  const [adminPasswordOk, setAdminPasswordOk] = useState<boolean>(
    () => sessionStorage.getItem(ADMIN_SESSION_KEY) === "1",
  );
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!adminPasswordOk) {
      inputRef.current?.focus();
    }
  }, [adminPasswordOk]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
      setAdminPasswordOk(true);
      setError("");
    } else {
      setError("Incorrect password. Try again.");
      setPasswordInput("");
      inputRef.current?.focus();
    }
  };

  if (adminPasswordOk) {
    return (
      <div className="min-h-screen bg-background">
        <AdminDashboard />
        <Toaster position="top-center" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card className="border-border shadow-xl overflow-hidden">
          <div className="h-1.5 w-full bg-primary" />
          <CardHeader className="pb-2 pt-8 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Admin Access
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Enter password to continue
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-4 pb-8 px-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Input
                  ref={inputRef}
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (error) setError("");
                  }}
                  className={`h-12 text-center text-lg tracking-widest ${
                    error
                      ? "border-destructive focus-visible:ring-destructive"
                      : "border-input focus-visible:ring-primary"
                  }`}
                  autoComplete="current-password"
                />
                {error && (
                  <p className="text-sm text-destructive text-center font-medium">
                    {error}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="h-12 w-full bg-primary hover:bg-primary/90 text-white font-semibold text-base"
              >
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Toaster position="top-center" />
    </div>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [route, setRoute] = useState<string>(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const isAuthenticated = !!identity;

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    setRoute(path);
  };

  // Admin route — full screen, password-gated
  if (route === "/admin") {
    return <AdminRoute />;
  }

  // Handle payment status routes
  if (route === "/payment-success") {
    return (
      <div className="app-shell">
        <div className="phone-frame">
          <PaymentStatusPage status="success" onBack={() => navigateTo("/")} />
        </div>
        <Toaster position="top-center" />
      </div>
    );
  }

  if (route === "/payment-failure") {
    return (
      <div className="app-shell">
        <div className="phone-frame">
          <PaymentStatusPage status="failure" onBack={() => navigateTo("/")} />
        </div>
        <Toaster position="top-center" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="phone-frame">
        {isInitializing ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl gradient-red flex items-center justify-center">
              <Phone className="w-7 h-7 text-white" />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          </div>
        ) : !isAuthenticated ? (
          <LoginPage />
        ) : (
          <AuthenticatedApp onNavigateAdmin={() => navigateTo("/admin")} />
        )}
      </div>
      <Toaster position="top-center" />
    </div>
  );
}
