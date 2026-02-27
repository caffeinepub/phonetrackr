import { useState } from "react";
import { User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SubscriptionPlan } from "../backend";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

interface ProfileSetupModalProps {
  onComplete: () => void;
}

export default function ProfileSetupModal({ onComplete }: ProfileSetupModalProps) {
  const [name, setName] = useState("");
  const saveProfile = useSaveCallerUserProfile();

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    try {
      await saveProfile.mutateAsync({ plan: SubscriptionPlan.basic });
      toast.success("Profile created!");
      onComplete();
    } catch {
      toast.error("Failed to save profile");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm p-6 animate-slide-up">
        <div className="w-14 h-14 rounded-2xl gradient-red flex items-center justify-center mx-auto mb-4">
          <User className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-center text-foreground mb-1">Welcome to PhoneTrackr!</h2>
        <p className="text-sm text-center text-muted-foreground mb-6">
          Set up your profile to get started
        </p>

        <div className="space-y-4">
          <div>
            <Label className="text-sm mb-2 block">Your Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="h-11"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saveProfile.isPending || !name.trim()}
            className="w-full h-11 font-semibold shadow-red"
          >
            {saveProfile.isPending ? (
              <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              "Get Started"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
