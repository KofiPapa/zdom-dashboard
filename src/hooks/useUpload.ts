import { useState, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { createDocument, updateDocument } from "../lib/api";
import { uploadFile } from "../lib/storage";
import { getMediaType } from "@shared/utils";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
} from "@shared/constants";

export interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "processing" | "done" | "error";
  error?: string;
}

export function useUpload() {
  const { user, profile } = useAuth();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const cancelFnsRef = useRef<Map<string, () => void>>(new Map());

  const updateUpload = useCallback(
    (id: string, updates: Partial<UploadItem>) => {
      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
      );
    },
    []
  );

  const validateFile = useCallback((file: File): string | null => {
    const allAllowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
    if (!allAllowed.includes(file.type)) {
      return `Unsupported file type: ${file.type}`;
    }
    if (file.type.startsWith("image/") && file.size > MAX_IMAGE_SIZE) {
      return `Image exceeds max size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`;
    }
    if (file.type.startsWith("video/") && file.size > MAX_VIDEO_SIZE) {
      return `Video exceeds max size of ${MAX_VIDEO_SIZE / 1024 / 1024}MB`;
    }
    return null;
  }, []);

  const processUpload = useCallback(
    async (item: UploadItem) => {
      if (!profile?.organizationId || !user?.uid) return;

      const orgId = profile.organizationId;

      // Validate
      const validationError = validateFile(item.file);
      if (validationError) {
        updateUpload(item.id, { status: "error", error: validationError });
        return;
      }

      try {
        // Create Firestore media doc first
        updateUpload(item.id, { status: "uploading" });

        const mediaType = getMediaType(item.file.type);
        const mediaId = await createDocument("media", {
          name: item.file.name,
          organizationId: orgId,
          uploadedBy: user.uid,
          type: mediaType,
          mimeType: item.file.type,
          fileSize: item.file.size,
          dimensions: { width: 0, height: 0 },
          duration: null,
          storageUrl: "",
          downloadUrl: "",
          thumbnailUrl: "",
          tags: [],
        });

        // Upload to Storage
        const { promise, cancel } = uploadFile(
          orgId,
          mediaId,
          item.file,
          (progress) => {
            updateUpload(item.id, { progress });
          }
        );

        cancelFnsRef.current.set(item.id, cancel);

        const { storageUrl, downloadUrl } = await promise;

        cancelFnsRef.current.delete(item.id);

        // Update Firestore doc with URLs
        updateUpload(item.id, { status: "processing", progress: 100 });

        await updateDocument("media", mediaId, {
          storageUrl,
          downloadUrl,
          thumbnailUrl: downloadUrl,
        });

        updateUpload(item.id, { status: "done", progress: 100 });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed";
        if (message.includes("canceled")) {
          updateUpload(item.id, { status: "error", error: "Upload cancelled" });
        } else {
          updateUpload(item.id, { status: "error", error: message });
        }
      }
    },
    [profile?.organizationId, user?.uid, validateFile, updateUpload]
  );

  const uploadFiles = useCallback(
    (files: File[]) => {
      const newItems: UploadItem[] = files.map((file) => ({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        file,
        progress: 0,
        status: "pending" as const,
      }));

      setUploads((prev) => [...prev, ...newItems]);

      // Process each upload
      newItems.forEach((item) => {
        processUpload(item);
      });
    },
    [processUpload]
  );

  const cancelUpload = useCallback((id: string) => {
    const cancelFn = cancelFnsRef.current.get(id);
    if (cancelFn) {
      cancelFn();
      cancelFnsRef.current.delete(id);
    }
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads((prev) =>
      prev.filter((u) => u.status !== "done" && u.status !== "error")
    );
  }, []);

  return { uploadFiles, uploads, cancelUpload, clearCompleted };
}
