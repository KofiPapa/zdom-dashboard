import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  subscribeToCollection,
  mediaQuery,
  updateDocument,
  deleteDocument,
} from "../lib/api";
import { deleteFile } from "../lib/storage";
import type { Media } from "@shared/types/firestore-schema";

export function useMedia() {
  const { profile } = useAuth();
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.organizationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToCollection<Media>(
      "media",
      mediaQuery(profile.organizationId),
      (data) => {
        setMedia(data);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [profile?.organizationId]);

  return { media, loading };
}

export function useMediaActions() {
  const updateMedia = useCallback(
    async (id: string, data: Partial<Media>) => {
      await updateDocument("media", id, data);
    },
    []
  );

  const deleteMedia = useCallback(
    async (id: string, storageUrl: string) => {
      // Delete from Storage first, then Firestore
      if (storageUrl) {
        try {
          await deleteFile(storageUrl);
        } catch (error) {
          // If the storage file doesn't exist, continue with Firestore deletion
          console.warn("Storage file deletion failed:", error);
        }
      }
      await deleteDocument("media", id);
    },
    []
  );

  const deleteMultipleMedia = useCallback(
    async (items: { id: string; storageUrl: string }[]) => {
      await Promise.all(
        items.map((item) => deleteMedia(item.id, item.storageUrl))
      );
    },
    [deleteMedia]
  );

  return { updateMedia, deleteMedia, deleteMultipleMedia };
}
