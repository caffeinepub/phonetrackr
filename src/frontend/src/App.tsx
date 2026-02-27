import { useState, useEffect } from "react";
import { LayoutDashboard, Phone, Clock, CreditCard, LogOut, Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useQueryClient } from "@tanstack/react-query";
import { useGetCallerUserProfile } from "./hooks/useQueries";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TrackPage from "./pages/TrackPage";
import HistoryPage from "./pages/HistoryPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentStatusPage from "./pages/PaymentStatusPage";
import ProfileSetupModal from "./components/ProfileSetupModal";

type Tab = "dashboard" | "track" | "history" | "payment";

const NAV_ITEMS: { id: Tab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "track", label: "Track", icon: Phone },
  { id: "history", label: "History", icon: Clock },
  { id: "payment", label: "Payment", icon: CreditCard },
];

function AppHeader({ onLogout, activeTab }: { onLogout: () => void; activeTab: Tab }) {
  const TAB_TITLES: Record<Tab, string> = {
    dashboard: "PhoneTrackr",
    track: "Track Numbers",
    history: "Tracking History",
    payment: "Subscription",
  };

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Phone className="w-3.5 h-3.5 text-white" />
          </div>
          <h1 className="text-base font-bold text-foreground tracking-tight">{TAB_TITLES[activeTab]}</h1>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-red-50 hover:text-primary transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}

function BottomNav({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (tab: Tab) => void }) {
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
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                isActive ? "bg-primary-light" : ""
              }`}>
                <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <span className={`text-[10px] font-semibold leading-none ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}>
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

function AuthenticatedApp() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleNavigate = (tab: string) => {
    setActiveTab(tab as Tab);
  };

  return (
    <>
      <AppHeader onLogout={handleLogout} activeTab={activeTab} />

      <main className="page-content">
        {activeTab === "dashboard" && <DashboardPage onNavigate={handleNavigate} />}
        {activeTab === "track" && <TrackPage />}
        {activeTab === "history" && <HistoryPage />}
        {activeTab === "payment" && <PaymentPage />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {showProfileSetup && (
        <ProfileSetupModal
          onComplete={() => queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] })}
        />
      )}
    </>
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

  // Handle payment status routes
  if (route === "/payment-success") {
    return (
      <div className="app-shell">
        <div className="phone-frame">
          <PaymentStatusPage status="success" onBack={() => {
            window.history.pushState({}, "", "/");
            setRoute("/");
          }} />
        </div>
        <Toaster position="top-center" />
      </div>
    );
  }

  if (route === "/payment-failure") {
    return (
      <div className="app-shell">
        <div className="phone-frame">
          <PaymentStatusPage status="failure" onBack={() => {
            window.history.pushState({}, "", "/");
            setRoute("/");
          }} />
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
          <AuthenticatedApp />
        )}
      </div>
      <Toaster position="top-center" />
    </div>
  );
}
