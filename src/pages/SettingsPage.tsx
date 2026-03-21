import { useState, useEffect } from "react";
import {
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlineCreditCard,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineMail,
  HiOutlineX,
} from "react-icons/hi";
import { where, doc, updateDoc, deleteDoc, collection, getDocs, query } from "firebase/firestore";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { getFunctions, httpsCallable } from "firebase/functions";
import PageHeader from "../components/common/PageHeader";
import Badge from "../components/common/Badge";
import ConfirmDialog from "../components/common/ConfirmDialog";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";
import { usePermissions, type UserRole } from "../hooks/usePermissions";
import { subscribeToCollection } from "../lib/api";
import { db } from "../lib/firebase";
import app from "../lib/firebase";
import BillingTab from "../components/billing/BillingTab";

const functions = getFunctions(app);

type SettingsTab = "organization" | "team" | "billing";

interface TeamMember {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: { toDate?: () => Date; seconds?: number } | null;
}

interface OrgSettings {
  defaultOrientation: string;
  defaultTimezone: string;
  brandColors: {
    primary: string;
    secondary: string;
  };
}

const PLAN_BADGES: Record<string, { label: string; variant: "info" | "online" | "warning" }> = {
  free: { label: "Free", variant: "info" },
  starter: { label: "Starter", variant: "info" },
  pro: { label: "Pro", variant: "online" },
  enterprise: { label: "Enterprise", variant: "warning" },
};

const ORIENTATION_OPTIONS = [
  { value: "landscape", label: "Landscape" },
  { value: "portrait", label: "Portrait" },
  { value: "landscape-flipped", label: "Landscape (Flipped)" },
  { value: "portrait-flipped", label: "Portrait (Flipped)" },
];

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

function getRoleBadgeVariant(role: string): "info" | "online" | "warning" | "offline" {
  const map: Record<string, "info" | "online" | "warning" | "offline"> = {
    owner: "warning",
    admin: "info",
    editor: "online",
    viewer: "offline",
  };
  return map[role] || "offline";
}

function formatMemberDate(ts: { toDate?: () => Date; seconds?: number } | null | undefined): string {
  if (!ts) return "Unknown";
  try {
    const date = ts.toDate ? ts.toDate() : new Date((ts.seconds || 0) * 1000);
    return format(date, "MMM d, yyyy");
  } catch {
    return "Unknown";
  }
}

// ─── Organization Tab ────────────────────────────────────────────────

function OrganizationTab() {
  const { organization } = useAuth();
  const { canDeleteOrg, isOwner, isAdmin } = usePermissions();
  const canEdit = isOwner || isAdmin;

  const [orgName, setOrgName] = useState(organization?.name || "");
  const [orientation, setOrientation] = useState("landscape");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [secondaryColor, setSecondaryColor] = useState("#1e40af");
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [deleteStep, setDeleteStep] = useState(0); // 0=none, 1=first confirm, 2=second confirm
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Load org settings
  useEffect(() => {
    if (!organization?.id) return;

    const loadSettings = async () => {
      try {
        const orgDoc = await getDocs(
          query(collection(db, "organizations"), where("__name__", "==", organization.id))
        );
        if (!orgDoc.empty) {
          const data = orgDoc.docs[0].data();
          const settings = data.settings as OrgSettings | undefined;
          if (settings) {
            setOrientation(settings.defaultOrientation || "landscape");
            setTimezone(settings.defaultTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
            setPrimaryColor(settings.brandColors?.primary || "#2563eb");
            setSecondaryColor(settings.brandColors?.secondary || "#1e40af");
          }
        }
      } catch (err) {
        console.error("Failed to load org settings:", err);
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, [organization?.id]);

  const handleSave = async () => {
    if (!organization?.id || !canEdit) return;
    setSaving(true);
    try {
      const orgRef = doc(db, "organizations", organization.id);
      await updateDoc(orgRef, {
        name: orgName,
        "settings.defaultOrientation": orientation,
        "settings.defaultTimezone": timezone,
        "settings.brandColors.primary": primaryColor,
        "settings.brandColors.secondary": secondaryColor,
      });
      toast.success("Organization settings saved");
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!organization?.id || !canDeleteOrg) return;
    try {
      await deleteDoc(doc(db, "organizations", organization.id));
      toast.success("Organization deleted");
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete organization:", err);
      toast.error("Failed to delete organization");
    } finally {
      setDeleteStep(0);
      setDeleteConfirmText("");
    }
  };

  const planInfo = PLAN_BADGES[organization?.plan || "free"] || PLAN_BADGES.free;

  if (loadingSettings) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Org Name & Plan */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">General</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Organization Name
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                disabled={!canEdit}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
              <Badge variant={planInfo.variant}>{planInfo.label} Plan</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Default Orientation
              </label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
                disabled={!canEdit}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
              >
                {ORIENTATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Default Timezone
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                disabled={!canEdit}
                placeholder="America/New_York"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Brand Colors */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Brand Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={!canEdit}
                className="w-10 h-10 rounded border border-slate-300 cursor-pointer disabled:cursor-not-allowed"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                disabled={!canEdit}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Secondary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                disabled={!canEdit}
                className="w-10 h-10 rounded border border-slate-300 cursor-pointer disabled:cursor-not-allowed"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                disabled={!canEdit}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
              />
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Danger Zone — Owner Only */}
      {canDeleteOrg && (
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
          <p className="text-sm text-slate-500 mb-4">
            Permanently delete this organization and all associated data. This action cannot be undone.
          </p>

          {deleteStep === 0 && (
            <button
              onClick={() => setDeleteStep(1)}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50"
            >
              Delete Organization
            </button>
          )}

          {deleteStep === 1 && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-red-700 mb-3">
                Are you sure? This will permanently delete your organization, all screens, media,
                playlists, schedules, and team members.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteStep(2)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Yes, I want to delete
                </button>
                <button
                  onClick={() => setDeleteStep(0)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {deleteStep === 2 && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-red-700 mb-2">
                Final confirmation: type <span className="font-bold">{organization?.name}</span> to
                confirm deletion.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={organization?.name}
                className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteOrg}
                  disabled={deleteConfirmText !== organization?.name}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Permanently Delete
                </button>
                <button
                  onClick={() => {
                    setDeleteStep(0);
                    setDeleteConfirmText("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Team Members Tab ────────────────────────────────────────────────

function TeamMembersTab() {
  const { profile, organization } = useAuth();
  const { canManageUsers, canInviteUsers, isOwner } = usePermissions();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("viewer");
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

  const [confirmRemove, setConfirmRemove] = useState<TeamMember | null>(null);

  // Subscribe to team members
  useEffect(() => {
    if (!organization?.id) return;

    const unsubscribe = subscribeToCollection<TeamMember>(
      "users",
      [where("organizationId", "==", organization.id)],
      (data) => {
        setMembers(data);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [organization?.id]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setInviting(true);
    try {
      const inviteUser = httpsCallable<
        { email: string; role: string },
        { inviteId: string }
      >(functions, "inviteUser");

      const result = await inviteUser({ email: inviteEmail.trim(), role: inviteRole });
      toast.success(`Invite sent to ${inviteEmail}. Invite code: ${result.data.inviteId}`);
      setInviteEmail("");
      setInviteRole("viewer");
      setShowInviteModal(false);
    } catch (err: any) {
      const message = err?.message || "Failed to send invite";
      toast.error(message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    setRemovingId(member.id);
    try {
      const removeUser = httpsCallable<{ userId: string }, { success: boolean }>(
        functions,
        "removeUser"
      );
      await removeUser({ userId: member.id });
      toast.success(`${member.displayName} has been removed`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove member");
    } finally {
      setRemovingId(null);
      setConfirmRemove(null);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: UserRole) => {
    setChangingRoleId(memberId);
    try {
      const changeUserRole = httpsCallable<
        { userId: string; newRole: string },
        { success: boolean }
      >(functions, "changeUserRole");
      await changeUserRole({ userId: memberId, newRole });
      toast.success("Role updated successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to change role");
    } finally {
      setChangingRoleId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      {/* Header with invite button */}
      {canInviteUsers && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Invite Member
          </button>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                  Member
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                  Role
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                  Joined
                </th>
                {canManageUsers && (
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {members.map((member) => {
                const isSelf = member.id === profile?.id;
                const isMemberOwner = member.role === "owner";
                const canChangeThisRole = canManageUsers && !isSelf && !isMemberOwner;
                const canRemoveThis = canManageUsers && !isSelf && !isMemberOwner;
                // Admins can't change other admins
                const adminCantManage = !isOwner && member.role === "admin";

                return (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                          {(member.displayName || member.email || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {member.displayName}
                            {isSelf && (
                              <span className="ml-2 text-xs text-slate-400">(you)</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {canChangeThisRole && !adminCantManage ? (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleChangeRole(member.id, e.target.value as UserRole)
                          }
                          disabled={changingRoleId === member.id}
                          className="px-2 py-1 border border-slate-300 rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          {isMemberOwner && " (immutable)"}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatMemberDate(member.createdAt)}
                    </td>
                    {canManageUsers && (
                      <td className="px-6 py-4 text-right">
                        {canRemoveThis && !adminCantManage ? (
                          <button
                            onClick={() => setConfirmRemove(member)}
                            disabled={removingId === member.id}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Remove member"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300">--</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {members.length === 0 && (
                <tr>
                  <td colSpan={canManageUsers ? 4 : 3} className="px-6 py-12 text-center text-sm text-slate-400">
                    No team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Remove Dialog */}
      <ConfirmDialog
        open={!!confirmRemove}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${confirmRemove?.displayName || "this member"} from the organization? They will lose access immediately.`}
        confirmLabel="Remove"
        onConfirm={() => confirmRemove && handleRemoveMember(confirmRemove)}
        onCancel={() => setConfirmRemove(null)}
      />

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowInviteModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Invite Team Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-400">
                  {inviteRole === "admin" && "Can manage screens, content, and users."}
                  {inviteRole === "editor" && "Can manage media, playlists, and schedules."}
                  {inviteRole === "viewer" && "Read-only access to the dashboard."}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {inviting ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings Page (Main) ────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("organization");

  const tabs: { id: SettingsTab; label: string; icon: typeof HiOutlineOfficeBuilding }[] = [
    { id: "organization", label: "Organization", icon: HiOutlineOfficeBuilding },
    { id: "team", label: "Team Members", icon: HiOutlineUserGroup },
    { id: "billing", label: "Billing", icon: HiOutlineCreditCard },
  ];

  return (
    <div>
      <PageHeader title="Settings" description="Manage your organization and team" />

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "organization" && <OrganizationTab />}
      {activeTab === "team" && <TeamMembersTab />}
      {activeTab === "billing" && <BillingTab />}
    </div>
  );
}
