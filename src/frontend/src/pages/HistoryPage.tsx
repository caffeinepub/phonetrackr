import { useState, useMemo } from "react";
import { MapPin, PhoneOff, WifiOff, Clock, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetFullHistory, useGetTrackedNumbers } from "../hooks/useQueries";

function formatTimestamp(timestamp: bigint): string {
  const ms = Number(timestamp / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function EventTypeIcon({ type }: { type: string }) {
  const lower = type.toLowerCase();
  if (lower === "located") {
    return (
      <div className="w-9 h-9 rounded-xl badge-located flex items-center justify-center shrink-0">
        <MapPin className="w-4 h-4" />
      </div>
    );
  }
  if (lower === "missed") {
    return (
      <div className="w-9 h-9 rounded-xl badge-missed flex items-center justify-center shrink-0">
        <PhoneOff className="w-4 h-4" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-xl badge-inactive flex items-center justify-center shrink-0">
      <WifiOff className="w-4 h-4" />
    </div>
  );
}

function EventTypeBadge({ type }: { type: string }) {
  const lower = type.toLowerCase();
  if (lower === "located") return <span className="badge-located text-xs font-medium px-2 py-0.5 rounded-full capitalize">{type}</span>;
  if (lower === "missed") return <span className="badge-missed text-xs font-medium px-2 py-0.5 rounded-full capitalize">{type}</span>;
  return <span className="badge-offline text-xs font-medium px-2 py-0.5 rounded-full capitalize">{type}</span>;
}

export default function HistoryPage() {
  const [filterNumber, setFilterNumber] = useState<string>("all");
  const { data: history, isLoading: historyLoading } = useGetFullHistory();
  const { data: trackedNumbers } = useGetTrackedNumbers();

  const filteredHistory = useMemo(() => {
    const sorted = [...(history ?? [])].sort((a, b) => Number(b.timestamp - a.timestamp));
    if (filterNumber === "all") return sorted;
    return sorted.filter((e) => e.phoneNumber === filterNumber);
  }, [history, filterNumber]);

  // Build a map of phone number -> nickname
  const nicknameMap = useMemo(() => {
    const map = new Map<string, string>();
    trackedNumbers?.forEach((n) => {
      if (n.nickname) map.set(n.phoneNumber, n.nickname);
    });
    return map;
  }, [trackedNumbers]);

  return (
    <div className="animate-slide-up">
      {/* Filter Bar */}
      <div className="mx-4 mt-4">
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-3">
          <div className="w-7 h-7 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
            <Filter className="w-3.5 h-3.5 text-primary" />
          </div>
          <Select value={filterNumber} onValueChange={setFilterNumber}>
            <SelectTrigger className="h-8 text-sm flex-1 border-0 shadow-none bg-transparent focus:ring-0">
              <SelectValue placeholder="Filter by number" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Numbers</SelectItem>
              {trackedNumbers?.map((n) => (
                <SelectItem key={n.id.toString()} value={n.phoneNumber}>
                  {n.nickname ? `${n.nickname} (${n.phoneNumber})` : n.phoneNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Event Count */}
      <div className="mx-4 mt-3 mb-3">
        <p className="text-xs text-muted-foreground font-medium">
          {historyLoading ? "Loading..." : `${filteredHistory.length} events`}
        </p>
      </div>

      {/* History List */}
      <div className="mx-4 mb-4 space-y-2">
        {historyLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center mx-auto mb-3">
              <Clock className="w-7 h-7 text-primary" />
            </div>
            <p className="font-semibold text-foreground">No events found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filterNumber !== "all"
                ? "No events for this number"
                : "Start tracking to see history"}
            </p>
          </div>
        ) : (
          filteredHistory.map((event, idx) => (
            <div
              key={event.id.toString()}
              className="bg-card rounded-xl border border-border p-4 shadow-xs animate-fade-in"
              style={{ animationDelay: `${Math.min(idx * 30, 150)}ms` }}
            >
              <div className="flex items-start gap-3">
                <EventTypeIcon type={event.eventType} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground mono truncate">{event.phoneNumber}</p>
                      {nicknameMap.get(event.phoneNumber) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {nicknameMap.get(event.phoneNumber)}
                        </p>
                      )}
                    </div>
                    <EventTypeBadge type={event.eventType} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground truncate">{event.location}</p>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground">{formatTimestamp(event.timestamp)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
