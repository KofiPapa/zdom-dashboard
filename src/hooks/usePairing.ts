import { useState, useEffect, useCallback } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { subscribeToDocument } from "../lib/api";
import type { Screen } from "@shared/types/firestore-schema";
import app from "../lib/firebase";

const functions = getFunctions(app);

interface PairingState {
  code: string;
  expiresAt: Date | null;
  isPaired: boolean;
  loading: boolean;
  error: string | null;
}

export function usePairing(screenId: string | null) {
  const [state, setState] = useState<PairingState>({
    code: "",
    expiresAt: null,
    isPaired: false,
    loading: false,
    error: null,
  });

  const generateCode = useCallback(async () => {
    if (!screenId) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const generatePairingCode = httpsCallable<
        { screenId: string },
        { code: string; expiresAt: string }
      >(functions, "generatePairingCode");

      const result = await generatePairingCode({ screenId });

      setState((prev) => ({
        ...prev,
        code: result.data.code,
        expiresAt: new Date(result.data.expiresAt),
        loading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          err instanceof Error ? err.message : "Failed to generate pairing code",
      }));
    }
  }, [screenId]);

  // Listen for pairing completion
  useEffect(() => {
    if (!screenId || !state.code) return;

    const unsubscribe = subscribeToDocument<Screen>(
      "screens",
      screenId,
      (screen) => {
        if (screen?.isPaired) {
          setState((prev) => ({ ...prev, isPaired: true }));
        }
      }
    );

    return unsubscribe;
  }, [screenId, state.code]);

  const reset = useCallback(() => {
    setState({
      code: "",
      expiresAt: null,
      isPaired: false,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    generateCode,
    reset,
  };
}
