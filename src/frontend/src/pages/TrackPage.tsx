import { useState } from "react";
import { Plus, Trash2, Phone, ChevronDown, MapPin, Loader2, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { PhoneStatus, type TrackedNumber } from "../backend";
import {
  useGetTrackedNumbers,
  useAddTrackedNumber,
  useRemoveTrackedNumber,
  useUpdateNumberStatus,
  useAddTrackingEvent,
} from "../hooks/useQueries";

function StatusBadge({ status }: { status: PhoneStatus }) {
  if (status === PhoneStatus.active) return <span className="badge-active text-xs font-medium px-2 py-0.5 rounded-full">Active</span>;
  if (status === PhoneStatus.pending) return <span className="badge-pending text-xs font-medium px-2 py-0.5 rounded-full">Pending</span>;
  return <span className="badge-inactive text-xs font-medium px-2 py-0.5 rounded-full">Inactive</span>;
}

function AddEventForm({
  numberId,
  onClose,
}: {
  numberId: bigint;
  onClose: () => void;
}) {
  const [location, setLocation] = useState("");
  const [eventType, setEventType] = useState("located");
  const addEvent = useAddTrackingEvent();

  const handleSubmit = async () => {
    if (!location.trim()) {
      toast.error("Please enter a location");
      return;
    }
    try {
      await addEvent.mutateAsync({ numberId, location: location.trim(), eventType });
      toast.success("Event added successfully");
      setLocation("");
      onClose();
    } catch {
      toast.error("Failed to add event");
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3 animate-slide-up">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add Event</p>
      <div>
        <Label className="text-xs mb-1.5 block">Location</Label>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., New York, NY"
          className="h-9 text-sm"
        />
      </div>
      <div>
        <Label className="text-xs mb-1.5 block">Event Type</Label>
        <Select value={eventType} onValueChange={setEventType}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="located">Located</SelectItem>
            <SelectItem value="missed">Missed</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={addEvent.isPending}
          className="flex-1 h-8 text-xs"
        >
          {addEvent.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          Add Event
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onClose}
          className="h-8 text-xs px-3"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function TrackedNumberCard({ number }: { number: TrackedNumber }) {
  const [showEventForm, setShowEventForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const removeNumber = useRemoveTrackedNumber();
  const updateStatus = useUpdateNumberStatus();

  const handleRemove = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    try {
      await removeNumber.mutateAsync(number.id);
      toast.success("Number removed");
    } catch {
      toast.error("Failed to remove number");
    }
  };

  const handleStatusChange = async (value: string) => {
    try {
      await updateStatus.mutateAsync({ numberId: number.id, status: value as PhoneStatus });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-xs p-4 animate-fade-in card-hover">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-foreground mono truncate">{number.phoneNumber}</p>
            {number.nickname && (
              <p className="text-xs text-muted-foreground truncate">{number.nickname}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge status={number.status} />
          <button
            type="button"
            onClick={handleRemove}
            disabled={removeNumber.isPending}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              confirmDelete
                ? "bg-red-100 text-red-600"
                : "bg-secondary text-muted-foreground hover:bg-red-50 hover:text-red-500"
            }`}
            title={confirmDelete ? "Click again to confirm" : "Remove number"}
          >
            {removeNumber.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2 mt-3">
        <Select value={number.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PhoneStatus.active}>Active</SelectItem>
            <SelectItem value={PhoneStatus.pending}>Pending</SelectItem>
            <SelectItem value={PhoneStatus.inactive}>Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowEventForm((v) => !v)}
          className="h-8 text-xs px-3 gap-1.5 shrink-0"
        >
          <MapPin className="w-3.5 h-3.5" />
          Event
          <ChevronDown className={`w-3 h-3 transition-transform ${showEventForm ? "rotate-180" : ""}`} />
        </Button>
      </div>

      {confirmDelete && (
        <p className="text-xs text-red-500 mt-2 font-medium">Tap again to confirm removal</p>
      )}

      {showEventForm && (
        <AddEventForm
          numberId={number.id}
          onClose={() => setShowEventForm(false)}
        />
      )}
    </div>
  );
}

export default function TrackPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nickname, setNickname] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { data: trackedNumbers, isLoading } = useGetTrackedNumbers();
  const addNumber = useAddTrackedNumber();

  const handleAddNumber = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number");
      return;
    }
    try {
      await addNumber.mutateAsync({ phoneNumber: phoneNumber.trim(), nickname: nickname.trim() });
      setShowSuccessMessage(true);
      setPhoneNumber("");
      setNickname("");
    } catch {
      toast.error("Failed to add number");
    }
  };

  return (
    <div className="animate-slide-up">
      {/* Add Number Form */}
      <div className="mx-4 mt-4 bg-card rounded-2xl border border-border shadow-xs p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-primary-light flex items-center justify-center">
            <Plus className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Add New Number</h3>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs mb-1.5 block text-muted-foreground">Phone Number *</Label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="h-10 text-sm mono"
            />
          </div>
          <div>
            <Label className="text-xs mb-1.5 block text-muted-foreground">Nickname (optional)</Label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g., Mom, Work"
              className="h-10 text-sm"
            />
          </div>
          <Button
            onClick={handleAddNumber}
            disabled={addNumber.isPending || !phoneNumber.trim()}
            className="w-full h-10 text-sm font-semibold shadow-red"
          >
            {addNumber.isPending ? (
              <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Adding...</>
            ) : (
              <><Plus className="mr-2 w-4 h-4" /> Track Number</>
            )}
          </Button>

          {showSuccessMessage && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-4 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                  <svg aria-label="Imefanikiwa" className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-green-700 mb-1">Success!</p>
                  <p className="text-sm text-green-800 leading-relaxed">
                    You have successfully enabled communication tracking. Make a payment of{" "}
                    <span className="font-bold">56,000 Tzs</span>{" "}
                    to continue this service for one month.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSuccessMessage(false)}
                    className="mt-2 text-xs text-green-600 underline hover:text-green-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tracked Numbers List */}
      <div className="mx-4 mt-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
            Tracked Numbers
          </h3>
          {!isLoading && (
            <span className="text-xs text-muted-foreground font-medium">
              {trackedNumbers?.length ?? 0} total
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-36 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !trackedNumbers || trackedNumbers.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mx-auto mb-4">
              <PhoneOff className="w-8 h-8 text-primary" />
            </div>
            <p className="font-semibold text-foreground">No numbers tracked yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add a phone number above to start tracking
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trackedNumbers.map((number) => (
              <TrackedNumberCard key={number.id.toString()} number={number} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
