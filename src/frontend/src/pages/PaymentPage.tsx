import { Check, Zap, Star, Crown, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { SubscriptionPlan, type ShoppingItem } from "../backend";
import {
  useGetSubscriptionPlan,
  useSetSubscriptionPlan,
  useCreateCheckoutSession,
  useIsStripeConfigured,
} from "../hooks/useQueries";

const PLANS = [
  {
    id: SubscriptionPlan.basic,
    name: "Basic",
    price: "Free",
    period: "",
    icon: Zap,
    description: "Perfect for getting started",
    features: [
      "Up to 2 numbers tracked",
      "Basic tracking history",
      "Standard support",
    ],
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    borderColor: "border-border",
  },
  {
    id: SubscriptionPlan.pro,
    name: "Pro",
    price: "$9.99",
    period: "/mo",
    icon: Star,
    description: "For active users",
    features: [
      "Up to 10 numbers tracked",
      "Full tracking history",
      "Priority support",
      "Event analytics",
    ],
    color: "text-primary",
    bgColor: "bg-primary-light",
    borderColor: "border-primary/20",
    priceInCents: 999n,
  },
  {
    id: SubscriptionPlan.premium,
    name: "Premium",
    price: "$19.99",
    period: "/mo",
    icon: Crown,
    description: "For power users",
    features: [
      "Unlimited numbers tracked",
      "Full tracking history",
      "Advanced analytics",
      "Priority support",
      "API access",
    ],
    color: "text-primary",
    bgColor: "bg-primary-light",
    borderColor: "border-primary/20",
    priceInCents: 1999n,
    highlighted: true,
  },
] as const;

export default function PaymentPage() {
  const { data: currentPlan, isLoading: planLoading } = useGetSubscriptionPlan();
  const { data: stripeConfigured } = useIsStripeConfigured();
  const setSubscriptionPlan = useSetSubscriptionPlan();
  const createCheckoutSession = useCreateCheckoutSession();

  const handleSelectPlan = async (planId: SubscriptionPlan) => {
    if (planId === currentPlan) return;

    if (planId === SubscriptionPlan.basic) {
      try {
        await setSubscriptionPlan.mutateAsync(SubscriptionPlan.basic);
        toast.success("Switched to Basic plan");
      } catch {
        toast.error("Failed to update plan");
      }
      return;
    }

    if (!stripeConfigured) {
      toast.error("Payment is not configured yet. Please contact support.");
      return;
    }

    const plan = PLANS.find((p) => p.id === planId);
    if (!plan || !("priceInCents" in plan)) return;

    const items: ShoppingItem[] = [
      {
        productName: `PhoneTrackr ${plan.name} Plan`,
        currency: "usd",
        quantity: 1n,
        priceInCents: plan.priceInCents,
        productDescription: plan.description,
      },
    ];

    try {
      const session = await createCheckoutSession.mutateAsync(items);
      if (!session?.url) throw new Error("Stripe session missing url");
      window.location.href = session.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Payment failed";
      toast.error(message);
    }
  };

  const isProcessing = setSubscriptionPlan.isPending || createCheckoutSession.isPending;

  return (
    <div className="animate-slide-up">
      {/* Current plan banner */}
      <div className="mx-4 mt-4 bg-primary/5 border border-primary/20 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-red flex items-center justify-center shrink-0">
            {planLoading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : currentPlan === SubscriptionPlan.premium ? (
              <Crown className="w-5 h-5 text-white" />
            ) : currentPlan === SubscriptionPlan.pro ? (
              <Star className="w-5 h-5 text-white" />
            ) : (
              <Zap className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Current Plan</p>
            {planLoading ? (
              <Skeleton className="h-5 w-20 mt-0.5" />
            ) : (
              <p className="font-bold text-foreground capitalize">
                {currentPlan ?? SubscriptionPlan.basic} Plan
              </p>
            )}
          </div>
          <div className="ml-auto">
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Stripe not configured notice */}
      {stripeConfigured === false && (
        <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            Paid plans require Stripe configuration. Contact an admin to enable payments.
          </p>
        </div>
      )}

      {/* Plan Cards */}
      <div className="mx-4 mt-4 mb-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Choose a Plan</h3>

        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.id || (!currentPlan && plan.id === SubscriptionPlan.basic);
          const isHighlighted = "highlighted" in plan && plan.highlighted;

          return (
            <div
              key={plan.id}
              className={`relative bg-card rounded-2xl border shadow-xs overflow-hidden transition-all ${
                isHighlighted
                  ? "border-primary/30 ring-1 ring-primary/20"
                  : "border-border"
              } ${isCurrent ? "ring-1 ring-primary/30" : ""}`}
            >
              {isHighlighted && (
                <div className="gradient-red px-4 py-1.5 flex items-center justify-center">
                  <p className="text-xs text-white font-semibold tracking-wider uppercase">
                    Most Popular
                  </p>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${plan.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${plan.color}`} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                    {plan.period && (
                      <span className="text-xs text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                </div>

                {/* Feature list */}
                <ul className="space-y-1.5 mb-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                      </div>
                      <span className="text-xs text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {isCurrent ? (
                  <div className="w-full h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-700">Current Plan</span>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isProcessing || planLoading}
                    variant={isHighlighted ? "default" : "outline"}
                    className={`w-full h-9 text-sm font-semibold ${isHighlighted ? "shadow-red" : ""}`}
                  >
                    {isProcessing && createCheckoutSession.isPending ? (
                      <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Processing...</>
                    ) : (
                      `Select ${plan.name}`
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="px-4 pb-6 text-center">
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
