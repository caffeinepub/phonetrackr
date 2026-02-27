import { useMemo } from "react";
import { Phone, Clock, ChevronRight, MapPin, PhoneOff, WifiOff, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetTrackedNumbers, useGetFullHistory } from "../hooks/useQueries";

function timeAgo(timestamp: bigint): string {
  const now = Date.now();
  const eventTime = Number(timestamp / BigInt(1_000_000));
  const diffMs = now - eventTime;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}

function isToday(timestamp: bigint): boolean {
  const eventTime = Number(timestamp / BigInt(1_000_000));
  const today = new Date();
  const eventDate = new Date(eventTime);
  return (
    today.getFullYear() === eventDate.getFullYear() &&
    today.getMonth() === eventDate.getMonth() &&
    today.getDate() === eventDate.getDate()
  );
}

function EventTypeBadge({ type }: { type: string }) {
  const lower = type.toLowerCase();
  if (lower === "located") return <span className="badge-located text-xs font-medium px-2 py-0.5 rounded-full">Located</span>;
  if (lower === "missed") return <span className="badge-missed text-xs font-medium px-2 py-0.5 rounded-full">Missed</span>;
  return <span className="badge-offline text-xs font-medium px-2 py-0.5 rounded-full">Offline</span>;
}

function EventTypeIcon({ type }: { type: string }) {
  const lower = type.toLowerCase();
  if (lower === "located") return <MapPin className="w-4 h-4 text-emerald-600" />;
  if (lower === "missed") return <PhoneOff className="w-4 h-4 text-red-600" />;
  return <WifiOff className="w-4 h-4 text-gray-500" />;
}

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { identity } = useInternetIdentity();
  const { data: trackedNumbers, isLoading: numbersLoading } = useGetTrackedNumbers();
  const { data: history, isLoading: historyLoading } = useGetFullHistory();

  const todayCount = useMemo(
    () => history?.filter((e) => isToday(e.timestamp)).length ?? 0,
    [history]
  );

  const recentActivity = useMemo(
    () =>
      [...(history ?? [])]
        .sort((a, b) => Number(b.timestamp - a.timestamp))
        .slice(0, 5),
    [history]
  );

  const principalStr = identity?.getPrincipal().toString() ?? "";
  const shortId = principalStr ? principalStr.slice(0, 8) + "..." : "User";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="animate-slide-up">
      {/* Welcome Card */}
      <div className="mx-4 mt-4 rounded-2xl gradient-red p-5 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute bottom-2 right-8 w-16 h-16 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-white/80" />
            <span className="text-white/80 text-xs font-medium uppercase tracking-wider">Welcome back</span>
          </div>
          <h2 className="text-xl font-bold text-white leading-tight mb-1">
            Hello, {shortId}
          </h2>
          <p className="text-white/70 text-sm">{today}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mx-4 mt-3 grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-4 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
              <Phone className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Tracked</span>
          </div>
          {numbersLoading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <p className="text-3xl font-bold text-foreground">{trackedNumbers?.length ?? 0}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">Numbers</p>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Today</span>
          </div>
          {historyLoading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <p className="text-3xl font-bold text-foreground">{todayCount}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">Events</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mx-4 mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onNavigate("track")}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 px-4 text-sm font-semibold active:scale-[0.98] transition-transform shadow-red"
        >
          <Phone className="w-4 h-4" />
          Add Number
        </button>
        <button
          type="button"
          onClick={() => onNavigate("history")}
          className="flex items-center justify-center gap-2 bg-card border border-border text-foreground rounded-xl py-3 px-4 text-sm font-semibold active:scale-[0.98] transition-transform shadow-card"
        >
          <Clock className="w-4 h-4" />
          View History
        </button>
      </div>

      {/* Recent Activity */}
      <div className="mx-4 mt-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Recent Activity</h3>
          <button
            type="button"
            onClick={() => onNavigate("history")}
            className="text-xs text-primary font-semibold flex items-center gap-0.5"
          >
            See all <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {historyLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl p-4 border border-border">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="bg-card rounded-xl p-8 border border-border text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add a number to start tracking
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((event) => (
              <div
                key={event.id.toString()}
                className="bg-card rounded-xl p-4 border border-border shadow-xs animate-fade-in"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <EventTypeIcon type={event.eventType} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground truncate mono">
                        {event.phoneNumber}
                      </p>
                      <EventTypeBadge type={event.eventType} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground truncate">{event.location}</p>
                      <span className="text-muted-foreground">·</span>
                      <p className="text-xs text-muted-foreground shrink-0">{timeAgo(event.timestamp)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
