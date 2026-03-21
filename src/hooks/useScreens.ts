import { useState, useEffect, useCallback } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import {
  subscribeToCollection,
  subscribeToDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  screensQuery,
} from "../lib/api";
import { db } from "../lib/firebase";
import type { Screen } from "@shared/types/firestore-schema";

export function useScreens() {
  const { profile } = useAuth();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.organizationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToCollection<Screen>(
      "screens",
      screensQuery(profile.organizationId),
      (data) => {
        setScreens(data);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [profile?.organizationId]);

  return { screens, loading };
}

export function useScreen(screenId: string | undefined) {
  const [screen, setScreen] = useState<Screen | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!screenId) {
      setScreen(null);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToDocument<Screen>(
      "screens",
      screenId,
      (data) => {
        setScreen(data);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [screenId]);

  return { screen, loading };
}

export function useScreenActions() {
  const { profile, user } = useAuth();

  const addScreen = useCallback(
    async (data: {
      name: string;
      location: string;
      orientation: string;
      resolution: { width: number; height: number };
      tags: string[];
    }) => {
      if (!profile?.organizationId || !user) {
        throw new Error("Not authenticated");
      }

      const screenId = await createDocument("screens", {
        ...data,
        organizationId: profile.organizationId,
        isPaired: false,
        pairingCode: "",
        pairingCodeExpiresAt: null,
        status: "offline",
        lastHeartbeat: null,
        currentPlaylistId: null,
        currentScheduleId: null,
        deviceInfo: {
          model: "",
          os: "",
          appVersion: "",
          ipAddress: "",
        },
      });

      return screenId;
    },
    [profile?.organizationId, user]
  );

  const updateScreen = useCallback(
    async (screenId: string, data: Partial<Screen>) => {
      await updateDocument("screens", screenId, data);
    },
    []
  );

  const deleteScreen = useCallback(async (screenId: string) => {
    await deleteDocument("screens", screenId);
  }, []);

  const assignPlaylist = useCallback(
    async (screenId: string, playlistId: string | null) => {
      await updateDocument("screens", screenId, {
        currentPlaylistId: playlistId,
      });
    },
    []
  );

  const sendCommand = useCallback(
    async (
      screenId: string,
      command: { type: string; payload?: Record<string, unknown> }
    ) => {
      const commandsRef = collection(db, "screens", screenId, "commands");
      await addDoc(commandsRef, {
        ...command,
        status: "pending",
        createdAt: serverTimestamp(),
      });
    },
    []
  );

  return {
    addScreen,
    updateScreen,
    deleteScreen,
    assignPlaylist,
    sendCommand,
  };
}
