import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

const googleProvider = new GoogleAuthProvider();

export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result;
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  orgName: string
) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  await updateProfile(user, { displayName });

  // Create organization
  const orgRef = doc(db, "organizations", user.uid + "_org");
  await setDoc(orgRef, {
    name: orgName,
    ownerId: user.uid,
    plan: "free",
    maxScreens: 3,
    createdAt: serverTimestamp(),
    settings: {
      defaultOrientation: "landscape",
      defaultTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      brandColors: { primary: "#2563eb", secondary: "#1e40af" },
    },
  });

  // Create user document
  await setDoc(doc(db, "users", user.uid), {
    email: user.email,
    displayName,
    role: "owner",
    organizationId: orgRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return credential;
}

export async function signOut() {
  return firebaseSignOut(auth);
}
