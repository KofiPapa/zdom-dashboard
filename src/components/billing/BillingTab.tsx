import { useState } from "react";
import { useBilling } from "../../hooks/useBilling";
import { PlanModal } from "./PlanModal";
import toast from "react-hot-toast";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-100 text-green-700" },
  trialing: { label: "Trial", className: "bg-blue-100 text-blue-700" },
  past_due: { label: "Past Due", className: "bg-red-100 text-red-700" },
  canceled: { label: "Canceled", className: "bg-slate-100 text-slate-600" },
  expired: { label: "Expired", className: "bg-slate-100 text-slate-600" },
};

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  starter: 12,
  pro: 20,
};

export default function BillingTab() {
  const { subscription, loading, openPortal } = useBilling();
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      await openPortal();
    } catch {
      toast.error("Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const plan = subscription?.plan || "free";
  const status = subscription?.subscriptionStatus;
  const statusBadge = status ? STATUS_BADGES[status] || STATUS_BADGES.active : null;
  const maxScreens = subscription?.maxScreens || 1;
  const screensUsed = 0; // Would come from org data
  const screensPercent = Math.min(100, Math.round((screensUsed / maxScreens) * 100));
  const monthlyCost = PLAN_PRICES[plan] || 0;
  const interval = subscription?.interval || "month";
  const quantity = subscription?.quantity || 1;

  const renewalDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Current Plan</h3>
            <p className="text-sm text-slate-500 mt-1">
              Manage your subscription and billing details
            </p>
          </div>
          <div className="flex items-center gap-2">
            {statusBadge && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}
              >
                {statusBadge.label}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan Name */}
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Plan</p>
            <p className="text-2xl font-bold text-slate-900 capitalize">{plan}</p>
            {plan !== "free" && (
              <p className="text-sm text-slate-500 mt-1">
                ${monthlyCost * quantity}/{interval === "year" ? "yr" : "mo"}
                {quantity > 1 && ` (${quantity} units)`}
              </p>
            )}
          </div>

          {/* Screens Used */}
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Screens</p>
            <p className="text-2xl font-bold text-slate-900">
              {screensUsed}{" "}
              <span className="text-sm font-normal text-slate-400">/ {maxScreens}</span>
            </p>
            <div className="mt-2 w-full bg-slate-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  screensPercent > 90
                    ? "bg-red-500"
                    : screensPercent > 70
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                }`}
                style={{ width: `${screensPercent}%` }}
              />
            </div>
          </div>

          {/* Renewal Date */}
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">
              {subscription?.cancelAtPeriodEnd ? "Expires" : "Renews"}
            </p>
            <p className="text-lg font-semibold text-slate-900">{renewalDate || "N/A"}</p>
            {subscription?.cancelAtPeriodEnd && (
              <p className="text-xs text-red-500 mt-1">Subscription will not renew</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowPlanModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Change Plan
        </button>
        {plan !== "free" && (
          <button
            onClick={handleManageSubscription}
            disabled={portalLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            {portalLoading ? "Opening..." : "Manage Subscription"}
          </button>
        )}
      </div>

      {/* Plan Modal */}
      {showPlanModal && <PlanModal onClose={() => setShowPlanModal(false)} />}
    </div>
  );
}
