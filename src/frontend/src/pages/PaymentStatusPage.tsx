import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentStatusPageProps {
  status: "success" | "failure";
  onBack: () => void;
}

export default function PaymentStatusPage({ status, onBack }: PaymentStatusPageProps) {
  const isSuccess = status === "success";

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-xs animate-slide-up">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
          isSuccess ? "bg-emerald-50" : "bg-red-50"
        }`}>
          {isSuccess ? (
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          ) : (
            <XCircle className="w-10 h-10 text-red-500" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          {isSuccess ? "Payment Successful!" : "Payment Failed"}
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          {isSuccess
            ? "Your subscription has been activated. Enjoy your new plan!"
            : "Something went wrong with your payment. Please try again."}
        </p>

        <Button onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </Button>
      </div>
    </div>
  );
}
