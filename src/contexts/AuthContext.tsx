import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import * as authLib from "../lib/auth";

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: string;
  organizationId: string;
}

interface OrganizationData {
  id: string;
  name: string;
  plan: string;
  maxScreens: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  organization: OrganizationData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, displayName: string, orgName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async (firebaseUser: User) => {
      // Retry logic: on sign-up, the user doc may not exist yet (race condition)
      const maxRetries = 3;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as UserProfile;
            setProfile(userData);
            // Fetch organization
            try {
              const orgDoc = await getDoc(doc(db, "organizations", userData.organizationId));
              if (orgDoc.exists()) {
                setOrganization({ id: orgDoc.id, ...orgDoc.data() } as OrganizationData);
              }
            } catch (orgError) {
              console.warn("Error loading organization, will retry:", orgError);
              if (attempt < maxRetries - 1) {
                await new Promise((r) => setTimeout(r, 1000));
                continue;
              }
            }
            return; // success
          } else if (attempt < maxRetries - 1) {
            // Doc doesn't exist yet — wait and retry (sign-up race condition)
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          } else {
            // After retries, create profile (Google sign-in without existing profile)
            const orgId = firebaseUser.uid + "_org";
            await setDoc(doc(db, "organizations", orgId), {
              name: firebaseUser.displayName ? `${firebaseUser.displayName}'s Org` : "My Organization",
              ownerId: firebaseUser.uid,
              plan: "free",
              maxScreens: 3,
              createdAt: serverTimestamp(),
              settings: {
                defaultOrientation: "landscape",
                defaultTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                brandColors: { primary: "#2563eb", secondary: "#1e40af" },
              },
            });
            await setDoc(doc(db, "users", firebaseUser.uid), {
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || "User",
              role: "owner",
              organizationId: orgId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            setProfile({
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "User",
              role: "owner",
              organizationId: orgId,
            });
            setOrganization({
              id: orgId,
              name: firebaseUser.displayName ? `${firebaseUser.displayName}'s Org` : "My Organization",
              plan: "free",
              maxScreens: 3,
            });
            return;
          }
        } catch (error) {
          if (attempt < maxRetries - 1) {
            console.warn(`Profile load attempt ${attempt + 1} failed, retrying...`, error);
            await new Promise((r) => setTimeout(r, 1000));
          } else {
            console.error("Error loading user profile after retries:", error);
          }
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadProfile(firebaseUser);
      } else {
        setProfile(null);
        setOrganization(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    await authLib.signIn(email, password);
  };

  const handleSignInWithGoogle = async () => {
    await authLib.signInWithGoogle();
  };

  const handleSignUp = async (email: string, password: string, displayName: string, orgName: string) => {
    await authLib.signUp(email, password, displayName, orgName);
  };

  const handleSignOut = async () => {
    await authLib.signOut();
    setProfile(null);
    setOrganization(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        organization,
        loading,
        signIn: handleSignIn,
        signInWithGoogle: handleSignInWithGoogle,
        signUp: handleSignUp,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
