import { useState, useEffect, useCallback } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import app from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";

const functions = getFunctions(app);

export interface SubscriptionDetails {
  plan: string;
  maxScreens: number;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd?: boolean;
  trialEnd: string | null;
  priceId?: string;
  interval?: string;
  quantity?: number;
}

export function useBilling() {
  const { organization } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const getStatus = httpsCallable<void, SubscriptionDetails>(
        functions,
        "getSubscriptionStatus"
      );
      const result = await getStatus();
      setSubscription(result.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch subscription";
      setError(message);
      // Fallback to org data
      if (organization) {
        setSubscription({
          plan: organization.plan || "free",
          maxScreens: organization.maxScreens || 1,
          subscriptionStatus: null,
          currentPeriodEnd: null,
          trialEnd: null,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const openCheckout = useCallback(async (plan: string, quantity = 1, interval: "monthly" | "annual" = "monthly") => {
    const createSession = httpsCallable<
      { plan: string; quantity: number; interval: string },
      { url: string }
    >(functions, "createCheckoutSession");
    const result = await createSession({ plan, quantity, interval });
    if (result.data.url) {
      window.location.href = result.data.url;
    }
  }, []);

  const openPortal = useCallback(async () => {
    const createPortal = httpsCallable<void, { url: string }>(
      functions,
      "createCustomerPortalSession"
    );
    const result = await createPortal();
    if (result.data.url) {
      window.location.href = result.data.url;
    }
  }, []);

  const updateQuantity = useCallback(
    async (quantity: number) => {
      const update = httpsCallable<{ quantity: number }, { success: boolean; maxScreens: number }>(
        functions,
        "updateSubscriptionQuantity"
      );
      const result = await update({ quantity });
      await fetchSubscription();
      return result.data;
    },
    [fetchSubscription]
  );

  return {
    subscription,
    loading,
    error,
    openCheckout,
    openPortal,
    updateQuantity,
    refetch: fetchSubscription,
  };
}
