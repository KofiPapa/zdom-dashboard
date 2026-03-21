import { useState, useEffect } from "react";
import { HiOutlineX } from "react-icons/hi";
import { useBilling } from "../../hooks/useBilling";

export default function TrialBanner() {
  const { subscription } = useBilling();
  const [dismissed, setDismissed] = useState(false);

  const trialEnd = subscription?.trialEnd ? new Date(subscription.trialEnd) : null;
  const isTrialing = subscription?.subscriptionStatus === "trialing";

  // Calculate days remaining
  const daysRemaining = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Reset dismissed state when entering last 3 days
  useEffect(() => {
    if (daysRemaining <= 3 && dismissed) {
      setDismissed(false);
    }
  }, [daysRemaining, dismissed]);

  if (!isTrialing || !trialEnd || dismissed) {
    return null;
  }

  // Color scheme based on days remaining
  let bgColor: string;
  let textColor: string;
  let borderColor: string;

  if (daysRemaining > 7) {
    bgColor = "bg-blue-50";
    textColor = "text-blue-800";
    borderColor = "border-blue-200";
  } else if (daysRemaining > 3) {
    bgColor = "bg-yellow-50";
    textColor = "text-yellow-800";
    borderColor = "border-yellow-200";
  } else {
    bgColor = "bg-red-50";
    textColor = "text-red-800";
    borderColor = "border-red-200";
  }

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg px-4 py-3 mb-4`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-medium ${textColor}`}>
          {daysRemaining === 0 ? (
            "Your trial expires today! Upgrade now to keep your screens running."
          ) : daysRemaining === 1 ? (
            "Your trial expires tomorrow! Upgrade now to avoid interruption."
          ) : (
            <>
              Your trial ends in <strong>{daysRemaining} days</strong>.{" "}
              {daysRemaining <= 3
                ? "Upgrade now to avoid losing access."
                : "Upgrade to keep all your features."}
            </>
          )}
        </p>
        <div className="flex items-center gap-3 ml-4">
          <a
            href="/settings?tab=billing"
            className={`text-sm font-medium underline ${textColor} hover:opacity-80`}
          >
            Upgrade
          </a>
          {daysRemaining > 3 && (
            <button
              onClick={() => setDismissed(true)}
              className={`p-1 rounded hover:bg-black/5 ${textColor}`}
            >
              <HiOutlineX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
