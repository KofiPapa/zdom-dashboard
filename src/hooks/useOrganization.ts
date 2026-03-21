import { useAuth } from "../contexts/AuthContext";

export function useOrganization() {
  const { organization } = useAuth();
  return { organization };
}
