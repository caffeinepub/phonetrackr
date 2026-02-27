import { useState } from "react";
import { Loader2, Phone, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useQueryClient } from "@tanstack/react-query";

export default function LoginPage() {
  const { login, loginStatus, identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const handleLogin = async () => {
    setError(null);
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        login();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Login failed";
        if (message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        } else {
          setError(message);
        }
      }
    }
  };

  return (
    <div className="page-content-auth flex flex-col min-h-full">
      {/* Header brand area */}
      <div className="gradient-red px-6 pt-16 pb-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-10 bg-white" />
        <div className="absolute top-12 -right-4 w-24 h-24 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full opacity-10 bg-white" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm overflow-hidden">
              <img
                src="/assets/generated/phonetrackr-icon-transparent.dim_128x128.png"
                alt="PhoneTrackr"
                className="w-8 h-8 object-contain drop-shadow-sm"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">PhoneTrackr</h1>
              <p className="text-white/70 text-xs font-medium">Professional Tracking</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white leading-tight mb-2">
            Track numbers with confidence
          </h2>
          <p className="text-white/80 text-sm leading-relaxed">
            Monitor, manage, and analyze phone activity in real-time.
          </p>

          <div className="mt-4 inline-block bg-white/15 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2">
            <p className="text-white text-sm font-semibold text-center">
              Number 1 East African 🇹🇿🇺🇬🇰🇪🇷🇼🇨🇩 Tracking App
            </p>
          </div>
        </div>
      </div>

      {/* Features list */}
      <div className="px-6 py-8 flex-1">
        <div className="space-y-4 mb-10">
          {[
            { icon: Shield, label: "Secure & Private", desc: "End-to-end encrypted data" },
            { icon: Phone, label: "Real-Time Tracking", desc: "Instant location updates" },
            { icon: Zap, label: "Instant Alerts", desc: "Never miss an event" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Login Section */}
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-foreground">Get Started</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in securely with Internet Identity
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full h-13 text-base font-semibold rounded-xl shadow-red transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ height: "52px" }}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-5 w-5" />
                Sign In with Internet Identity
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Powered by Internet Computer Protocol
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 pb-8 text-center">
        <p className="text-xs text-muted-foreground">
          © 2026. Built with ❤️ using{" "}
          <a href="https://caffeine.ai" className="text-primary hover:underline font-medium">
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
