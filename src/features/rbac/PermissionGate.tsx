import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useRbacStore } from './useRbacStore';
import type { Permission } from './roles';

export function useHasPermission(permission: Permission): boolean {
  return useRbacStore((s) => s.hasPermission(permission));
}

export function LockedMessage({ permission }: { permission?: Permission }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/40">
      <Lock size={12} />
      <span>{permission ? `Requires "${permission}" permission` : 'You do not have access to this'}</span>
    </div>
  );
}

interface PermissionGateProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ permission, children, fallback }: PermissionGateProps) {
  const allowed = useHasPermission(permission);
  if (allowed) return <>{children}</>;
  return <>{fallback ?? <LockedMessage permission={permission} />}</>;
}

export default PermissionGate;
