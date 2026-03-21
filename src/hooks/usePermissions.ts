import { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";

export type UserRole = "owner" | "admin" | "editor" | "viewer";

export function usePermissions() {
  const { profile } = useAuth();

  return useMemo(() => {
    const role = (profile?.role as UserRole) || "viewer";

    const isOwner = role === "owner";
    const isAdmin = role === "admin";
    const isEditor = role === "editor";

    // owner: everything
    // admin: manage screens, content, users (except owner), all CRUD
    // editor: manage media, templates, playlists, schedules. No screen/user management.
    // viewer: read-only

    const canManageScreens = isOwner || isAdmin;
    const canManageUsers = isOwner || isAdmin;
    const canEditContent = isOwner || isAdmin || isEditor;
    const canDeleteOrg = isOwner;
    const canInviteUsers = isOwner || isAdmin;

    return {
      canManageScreens,
      canManageUsers,
      canEditContent,
      canDeleteOrg,
      canInviteUsers,
      isOwner,
      isAdmin,
      role,
    };
  }, [profile?.role]);
}
