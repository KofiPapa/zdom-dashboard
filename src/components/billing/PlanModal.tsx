import { useState } from "react";
import { HiOutlineX, HiOutlineCheck } from "react-icons/hi";
import { useBilling } from "../../hooks/useBilling";
import toast from "react-hot-toast";

interface PlanModalProps {
  onClose: () => void;
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    screens: 1,
    features: ["1 screen", "Basic templates", "Community support"],
  },
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 12,
    annualPrice: 10,
    screens: 5,
    features: [
      "5 screens per unit",
      "All templates",
      "Custom branding",
      "Email support",
      "Analytics",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 20,
    annualPrice: 16,
    screens: 20,
    popular: true,
    features: [
      "20 screens per unit",
      "All templates",
      "Custom branding",
      "Priority support",
      "Advanced analytics",
      "API access",
      "Team management",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: null,
    annualPrice: null,
    screens: null,
    features: [
      "Unlimited screens",
      "Dedicated support",
      "Custom integrations",
      "SLA",
      "SSO / SAML",
      "On-premise option",
    ],
  },
];

const PRICE_IDS: Record<string, string> = {
  starter_monthly: import.meta.env.VITE_STRIPE_STARTER_MONTHLY_PRICE_ID || "",
  starter_annual: import.meta.env.VITE_STRIPE_STARTER_ANNUAL_PRICE_ID || "",
  pro_monthly: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID || "",
  pro_annual: import.meta.env.VITE_STRIPE_PRO_ANNUAL_PRICE_ID || "",
};

export function PlanModal({ onClose }: PlanModalProps) {
  const { subscription, openCheckout } = useBilling();
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const [quantity, setQuantity] = useState(1);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const currentPlan = subscription?.plan || "free";

  const handleSelectPlan = async (planId: string) => {
    if (planId === "free" || planId === "enterprise") return;

    const priceKey = `${planId}_${interval}`;
    const priceId = PRICE_IDS[priceKey];

    if (!priceId) {
      toast.error("Price configuration not found. Please contact support.");
      return;
    }

    setCheckoutLoading(planId);
    try {
      await openCheckout(priceId, quantity);
    } catch {
      toast.error("Failed to start checkout");
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Choose a Plan</h2>
            <p className="text-sm text-slate-500 mt-1">
              Select the plan that best fits your needs
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Interval Toggle */}
        <div className="flex items-center justify-center gap-3 py-6">
          <span
            className={`text-sm font-medium ${interval === "monthly" ? "text-slate-900" : "text-slate-400"}`}
          >
            Monthly
          </span>
          <button
            onClick={() => setInterval(interval === "monthly" ? "annual" : "monthly")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              interval === "annual" ? "bg-blue-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                interval === "annual" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${interval === "annual" ? "text-slate-900" : "text-slate-400"}`}
          >
            Annual
            <span className="ml-1 text-xs text-green-600 font-medium">Save ~20%</span>
          </span>
        </div>

        {/* Quantity Input */}
        <div className="flex items-center justify-center gap-3 pb-4">
          <label className="text-sm font-medium text-slate-700">Screen units:</label>
          <input
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 pt-2">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const price =
              interval === "annual" ? plan.annualPrice : plan.monthlyPrice;
            const isPopular = "popular" in plan && plan.popular;

            return (
              <div
                key={plan.id}
                className={`relative rounded-lg border-2 p-5 flex flex-col ${
                  isPopular
                    ? "border-blue-500 shadow-md"
                    : isCurrent
                      ? "border-green-500"
                      : "border-slate-200"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>

                <div className="mt-3 mb-4">
                  {price !== null ? (
                    <>
                      <span className="text-3xl font-bold text-slate-900">
                        ${price * quantity}
                      </span>
                      <span className="text-sm text-slate-500">
                        /{interval === "annual" ? "mo" : "mo"}
                      </span>
                      {quantity > 1 && (
                        <p className="text-xs text-slate-400 mt-1">
                          ${price}/unit x {quantity} units
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="text-xl font-bold text-slate-900">Custom</span>
                  )}
                </div>

                {plan.screens !== null && (
                  <p className="text-sm text-slate-600 mb-3">
                    Up to {plan.screens * quantity} screens
                  </p>
                )}

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                      <HiOutlineCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.id === "enterprise" ? (
                  <a
                    href="mailto:sales@example.com"
                    className="w-full py-2 text-sm font-medium text-center text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                  >
                    Contact Sales
                  </a>
                ) : isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg cursor-default"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={checkoutLoading === plan.id || plan.id === "free"}
                    className={`w-full py-2 text-sm font-medium rounded-lg disabled:opacity-50 ${
                      plan.id === "free"
                        ? "text-slate-500 bg-slate-100 border border-slate-200 cursor-default"
                        : "text-white bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {checkoutLoading === plan.id
                      ? "Redirecting..."
                      : plan.id === "free"
                        ? "Free Forever"
                        : currentPlan !== "free" && PLANS.findIndex((p) => p.id === plan.id) < PLANS.findIndex((p) => p.id === currentPlan)
                          ? "Downgrade"
                          : "Upgrade"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
