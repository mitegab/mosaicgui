import { useState, type ReactNode } from "react";
import { Check, X, ShieldCheck, UserPlus, Trash2, Eye } from "lucide-react";
import { Panel } from "../../components/ui/Panel";
import { Button } from "../../components/ui/Button";
import { cn } from "../../utils/cn";
import { ALL_PERMISSIONS, BUILTIN_ROLES } from "./roles";
import { useRbacStore } from "./useRbacStore";
import { useHasPermission } from "./PermissionGate";

function RoleBadge({
  color,
  children,
}: {
  color: string;
  children: ReactNode;
}) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: `${color}22`, color }}
    >
      {children}
    </span>
  );
}

function RoleSwitcher() {
  const currentUserRole = useRbacStore((s) => s.currentUserRole);
  const setCurrentUserRole = useRbacStore((s) => s.setCurrentUserRole);

  return (
    <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
      <Eye size={13} className="text-white/40" />
      <span className="text-xs text-white/50">Preview as:</span>
      <select
        value={currentUserRole}
        onChange={(e) => setCurrentUserRole(e.target.value)}
        className="select bg-transparent !border-0 !p-0 !pr-5 text-xs font-semibold text-white/80"
        style={{ background: "transparent" }}
      >
        {BUILTIN_ROLES.map((role) => (
          <option
            key={role.id}
            value={role.id}
            className="bg-surface-900 text-white"
          >
            {role.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function MatrixTable() {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03]">
            <th className="px-3 py-2 font-medium text-white/40">Permission</th>
            {BUILTIN_ROLES.map((role) => (
              <th key={role.id} className="px-3 py-2 text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="font-semibold" style={{ color: role.color }}>
                    {role.name}
                  </span>
                  <RoleBadge color={role.color}>Built-in</RoleBadge>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ALL_PERMISSIONS.map((permission, index) => (
            <tr
              key={permission}
              className={cn(
                "border-b border-white/5 last:border-0",
                index % 2 === 1 && "bg-white/[0.015]",
              )}
            >
              <td className="px-3 py-1.5 font-mono text-[11px] text-white/60">
                {permission}
              </td>
              {BUILTIN_ROLES.map((role) => {
                const granted = role.permissions.includes(permission);
                return (
                  <td key={role.id} className="px-3 py-1.5 text-center">
                    {granted ? (
                      <Check size={14} className="mx-auto text-emerald-400" />
                    ) : (
                      <X size={14} className="mx-auto text-white/15" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "invited" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
        status === "active"
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-amber-500/15 text-amber-300",
      )}
    >
      {status === "active" ? "Active" : "Invited"}
    </span>
  );
}

function MemberManagement() {
  const members = useRbacStore((s) => s.members);
  const updateMemberRole = useRbacStore((s) => s.updateMemberRole);
  const removeMember = useRbacStore((s) => s.removeMember);
  const inviteMember = useRbacStore((s) => s.inviteMember);
  const canManageUsers = useHasPermission("users:manage");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");

  const handleInvite = () => {
    if (!inviteEmail.trim() || !canManageUsers) return;
    inviteMember(inviteEmail.trim(), inviteRole);
    setInviteEmail("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-white/40">
          Members
        </h3>
        {!canManageUsers && (
          <span className="text-[10px] text-white/30">
            Read-only — you lack "users:manage"
          </span>
        )}
      </div>

      <ul className="space-y-1.5">
        {members.map((member) => {
          const role = BUILTIN_ROLES.find((r) => r.id === member.roleId);
          return (
            <li
              key={member.id}
              className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.02] px-3 py-2"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-[10px] font-semibold text-teal-300">
                {member.avatarInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-white/80">
                  {member.name}
                </div>
                <div className="truncate text-[10px] text-white/40">
                  {member.email}
                </div>
              </div>
              <StatusBadge status={member.status} />
              <select
                value={member.roleId}
                disabled={!canManageUsers}
                onChange={(e) => updateMemberRole(member.id, e.target.value)}
                className="select h-7 w-28 !py-0 text-[11px] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {BUILTIN_ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => removeMember(member.id)}
                disabled={!canManageUsers}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/30 hover:bg-danger-500/10 hover:text-danger-400 disabled:cursor-not-allowed disabled:opacity-30"
                title="Remove member"
              >
                <Trash2 size={13} />
              </button>
              {role && <RoleBadge color={role.color}>{role.name}</RoleBadge>}
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-2 rounded-md border border-dashed border-white/10 p-2.5">
        <UserPlus size={14} className="shrink-0 text-white/40" />
        <input
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          disabled={!canManageUsers}
          placeholder="invite@company.com"
          className="input h-8 flex-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
        />
        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value)}
          disabled={!canManageUsers}
          className="select h-8 w-28 text-xs disabled:cursor-not-allowed disabled:opacity-40"
        >
          {BUILTIN_ROLES.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="primary"
          onClick={handleInvite}
          disabled={!canManageUsers || !inviteEmail.trim()}
        >
          Invite
        </Button>
      </div>
    </div>
  );
}

export function PermissionMatrix() {
  return (
    <Panel
      title="Roles & Permissions"
      subtitle="Manage what each role can access"
      action={
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-teal-400" />
          <RoleSwitcher />
        </div>
      }
      bodyClassName="p-3 space-y-5"
    >
      <MatrixTable />
      <MemberManagement />
    </Panel>
  );
}

export default PermissionMatrix;
