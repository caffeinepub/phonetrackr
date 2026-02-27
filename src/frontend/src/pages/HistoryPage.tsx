import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing } from "lucide-react";
import { useMemo } from "react";
import { useGetTrackedNumbers } from "../hooks/useQueries";

type CallType = "incoming" | "outgoing" | "missed";

interface CallEntry {
  id: string;
  callType: CallType;
  number: string;
  duration: string;
  timestamp: Date;
}

interface StaticCallDef {
  id: string;
  callType: CallType;
  number: string;
  duration: string;
  hoursAgo: number;
}

// Static fake call entries using varied Tanzanian numbers
const STATIC_CALLS: StaticCallDef[] = [
  {
    id: "s1",
    callType: "incoming",
    number: "+255615037284",
    duration: "2:13",
    hoursAgo: 1,
  },
  {
    id: "s2",
    callType: "outgoing",
    number: "+255743081956",
    duration: "0:52",
    hoursAgo: 2,
  },
  {
    id: "s3",
    callType: "missed",
    number: "+255682530917",
    duration: "0:00",
    hoursAgo: 3,
  },
  {
    id: "s4",
    callType: "outgoing",
    number: "+255758306142",
    duration: "5:01",
    hoursAgo: 5,
  },
  {
    id: "s5",
    callType: "incoming",
    number: "+255671049823",
    duration: "1:44",
    hoursAgo: 9,
  },
  {
    id: "s6",
    callType: "missed",
    number: "+255774038261",
    duration: "0:00",
    hoursAgo: 12,
  },
  {
    id: "s7",
    callType: "incoming",
    number: "+255624891306",
    duration: "3:22",
    hoursAgo: 26,
  },
  {
    id: "s8",
    callType: "outgoing",
    number: "+255762495038",
    duration: "4:18",
    hoursAgo: 30,
  },
  {
    id: "s9",
    callType: "incoming",
    number: "+255651274908",
    duration: "0:47",
    hoursAgo: 48,
  },
  {
    id: "s10",
    callType: "missed",
    number: "+255714290863",
    duration: "0:00",
    hoursAgo: 51,
  },
  {
    id: "s11",
    callType: "outgoing",
    number: "+255783620495",
    duration: "6:14",
    hoursAgo: 72,
  },
  {
    id: "s12",
    callType: "incoming",
    number: "+255788301462",
    duration: "2:55",
    hoursAgo: 96,
  },
];

function buildCallsFromStatic(
  trackedNumbers?: { phoneNumber: string }[],
): CallEntry[] {
  const now = new Date();
  const base: CallEntry[] = STATIC_CALLS.map((c: StaticCallDef) => ({
    id: c.id,
    callType: c.callType,
    number: c.number,
    duration: c.duration,
    timestamp: new Date(now.getTime() - c.hoursAgo * 60 * 60 * 1000),
  }));

  // Mix in tracked numbers if any
  if (trackedNumbers && trackedNumbers.length > 0) {
    const types: CallType[] = ["incoming", "outgoing", "missed"];
    const extraDurations = ["1:12", "3:05", "0:00", "2:41", "0:29"];
    const extraOffsets = [7, 18, 38, 60, 90];

    trackedNumbers.slice(0, 3).forEach((n, i) => {
      const callType = types[i % 3];
      base.push({
        id: `tracked-${i}`,
        callType,
        number: n.phoneNumber,
        duration:
          callType === "missed"
            ? "0:00"
            : extraDurations[i % extraDurations.length],
        timestamp: new Date(
          now.getTime() -
            extraOffsets[i % extraOffsets.length] * 60 * 60 * 1000,
        ),
      });
    });
  }

  return base.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

function getDateLabel(date: Date): string {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(
    startOfToday.getTime() - 24 * 60 * 60 * 1000,
  );
  const entryDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  if (entryDay.getTime() === startOfToday.getTime()) return "Today";
  if (entryDay.getTime() === startOfYesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function CallIcon({ callType }: { callType: CallType }) {
  if (callType === "incoming") {
    return (
      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
        <PhoneIncoming className="w-4 h-4 text-green-600" />
      </div>
    );
  }
  if (callType === "outgoing") {
    return (
      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <PhoneOutgoing className="w-4 h-4 text-blue-600" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
      <PhoneMissed className="w-4 h-4 text-red-500" />
    </div>
  );
}

export default function HistoryPage() {
  const { data: trackedNumbers } = useGetTrackedNumbers();

  const allCalls = useMemo(
    () => buildCallsFromStatic(trackedNumbers),
    [trackedNumbers],
  );

  // Group calls by date label
  const grouped = useMemo(() => {
    const groups: { label: string; calls: CallEntry[] }[] = [];
    const labelMap = new Map<string, CallEntry[]>();

    for (const call of allCalls) {
      const label = getDateLabel(call.timestamp);
      if (!labelMap.has(label)) {
        labelMap.set(label, []);
        groups.push({ label, calls: labelMap.get(label)! });
      }
      labelMap.get(label)!.push(call);
    }

    return groups;
  }, [allCalls]);

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mx-4 mt-4 mb-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary-light flex items-center justify-center">
          <Phone className="w-3.5 h-3.5 text-primary" />
        </div>
        <h2 className="text-base font-bold text-foreground">Calls</h2>
        <span className="ml-auto text-xs text-muted-foreground font-medium">
          {allCalls.length} records
        </span>
      </div>

      {/* Grouped call list */}
      <div className="mx-4 mb-6 space-y-4">
        {grouped.map((group) => (
          <div key={group.label}>
            {/* Date section header */}
            <div className="mb-1 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </span>
            </div>

            {/* Calls in this group */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
              {group.calls.map((call, idx) => (
                <div
                  key={call.id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    idx !== group.calls.length - 1
                      ? "border-b border-border"
                      : ""
                  }`}
                >
                  <CallIcon callType={call.callType} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground mono truncate">
                      {call.number}
                    </p>
                    <p className="text-xs mt-0.5">
                      {call.callType === "missed" ? (
                        <span className="text-red-500 font-medium">
                          Missed Call
                        </span>
                      ) : (
                        <span className="text-muted-foreground capitalize">
                          {call.callType}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-foreground mono">
                      {call.duration}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatTime(call.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
