import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";

// Generic Firestore helpers
export async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as T;
}

export async function getDocuments<T>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
}

export async function createDocument(collectionName: string, data: DocumentData): Promise<string> {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateDocument(
  collectionName: string,
  id: string,
  data: Partial<DocumentData>
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  await deleteDoc(doc(db, collectionName, id));
}

/**
 * Subscribe to a Firestore collection with real-time updates.
 * Uses simple where() filter only (no orderBy) to avoid composite index
 * requirements. Sorting is done client-side.
 */
export function subscribeToCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: T[]) => void
) {
  // Filter out orderBy constraints to avoid composite index issues
  // Sort client-side instead
  const filterOnly = constraints.filter(
    (c) => (c as { type?: string }).type !== "orderBy"
  );
  const q = query(collection(db, collectionName), ...filterOnly);
  return onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
      // Sort by createdAt desc client-side
      data.sort((a: any, b: any) => {
        const aTime = a.createdAt?.seconds || a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.seconds || b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      callback(data);
    },
    (error) => {
      console.error(`Error listening to ${collectionName}:`, error);
      // Fallback: try one-time fetch without orderBy
      const fallbackQuery = query(collection(db, collectionName), ...filterOnly);
      getDocs(fallbackQuery)
        .then((snapshot) => {
          const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
          callback(data);
        })
        .catch((fallbackError) => {
          console.error(`Fallback fetch for ${collectionName} also failed:`, fallbackError);
          callback([]);
        });
    }
  );
}

export function subscribeToDocument<T>(
  collectionName: string,
  id: string,
  callback: (data: T | null) => void
) {
  const docRef = doc(db, collectionName, id);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
        return;
      }
      callback({ id: docSnap.id, ...docSnap.data() } as T);
    },
    (error) => {
      console.error(`Error listening to ${collectionName}/${id}:`, error);
      // Fallback: try one-time fetch
      getDoc(docRef)
        .then((docSnap) => {
          if (!docSnap.exists()) {
            callback(null);
            return;
          }
          callback({ id: docSnap.id, ...docSnap.data() } as T);
        })
        .catch(() => callback(null));
    }
  );
}

// Collection-specific query helpers (where filter only, sorting done client-side)
export function screensQuery(orgId: string) {
  return [where("organizationId", "==", orgId)] as QueryConstraint[];
}

export function mediaQuery(orgId: string) {
  return [where("organizationId", "==", orgId)] as QueryConstraint[];
}

export function playlistsQuery(orgId: string) {
  return [where("organizationId", "==", orgId)] as QueryConstraint[];
}

export function schedulesQuery(orgId: string) {
  return [where("organizationId", "==", orgId)] as QueryConstraint[];
}
