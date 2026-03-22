import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "./firebase";

export interface UploadResult {
  storageUrl: string;
  downloadUrl: string;
}

/**
 * Uploads a file to Firebase Storage with progress tracking.
 * Files are stored at: organizations/{orgId}/media/{mediaId}_{fileName}
 */
export function uploadFile(
  orgId: string,
  mediaId: string,
  file: File,
  onProgress?: (progress: number) => void
): { promise: Promise<UploadResult>; cancel: () => void } {
  const storagePath = `organizations/${orgId}/media/${mediaId}_${file.name}`;
  const storageRef = ref(storage, storagePath);
  const metadata = { contentType: file.type };
  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  let cancelled = false;

  const promise = new Promise<UploadResult>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        if (cancelled) return;
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        onProgress?.(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            storageUrl: storagePath,
            downloadUrl,
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });

  const cancel = () => {
    cancelled = true;
    uploadTask.cancel();
  };

  return { promise, cancel };
}

/**
 * Deletes a file from Firebase Storage by its storage path.
 */
export async function deleteFile(storagePath: string): Promise<void> {
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
}
