import { create } from 'zustand';
import { BUILTIN_ROLES, type Permission } from './roles';

export interface Member {
  id: string;
  name: string;
  email: string;
  roleId: string;
  avatarInitials: string;
  joinedAt: string;
  status: 'active' | 'invited';
}

interface RbacState {
  currentUserRole: string;
  members: Member[];
  setCurrentUserRole: (roleId: string) => void;
  inviteMember: (email: string, roleId: string) => void;
  updateMemberRole: (memberId: string, roleId: string) => void;
  removeMember: (memberId: string) => void;
  hasPermission: (permission: Permission) => boolean;
}

function initialsFromEmail(email: string): string {
  const name = email.split('@')[0] ?? email;
  return name.slice(0, 2).toUpperCase();
}

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

const SEED_MEMBERS: Member[] = [
  {
    id: 'member-1',
    name: 'Priya Nair',
    email: 'priya@mosaicgui.dev',
    roleId: 'owner',
    avatarInitials: 'PN',
    joinedAt: daysAgo(210),
    status: 'active',
  },
  {
    id: 'member-2',
    name: 'Marcus Bell',
    email: 'marcus@mosaicgui.dev',
    roleId: 'admin',
    avatarInitials: 'MB',
    joinedAt: daysAgo(140),
    status: 'active',
  },
  {
    id: 'member-3',
    name: 'Elena Ruiz',
    email: 'elena@mosaicgui.dev',
    roleId: 'editor',
    avatarInitials: 'ER',
    joinedAt: daysAgo(64),
    status: 'active',
  },
  {
    id: 'member-4',
    name: 'Sam Kowalski',
    email: 'sam@mosaicgui.dev',
    roleId: 'viewer',
    avatarInitials: 'SK',
    joinedAt: daysAgo(3),
    status: 'invited',
  },
];

export const useRbacStore = create<RbacState>((set, get) => ({
  currentUserRole: 'owner',
  members: SEED_MEMBERS,

  setCurrentUserRole: (roleId) => set({ currentUserRole: roleId }),

  inviteMember: (email, roleId) =>
    set((state) => ({
      members: [
        ...state.members,
        {
          id: crypto.randomUUID(),
          name: email.split('@')[0] ?? email,
          email,
          roleId,
          avatarInitials: initialsFromEmail(email),
          joinedAt: new Date().toISOString(),
          status: 'invited',
        },
      ],
    })),

  updateMemberRole: (memberId, roleId) =>
    set((state) => ({
      members: state.members.map((member) => (member.id === memberId ? { ...member, roleId } : member)),
    })),

  removeMember: (memberId) =>
    set((state) => ({ members: state.members.filter((member) => member.id !== memberId) })),

  hasPermission: (permission) => {
    const role = BUILTIN_ROLES.find((r) => r.id === get().currentUserRole);
    return role ? role.permissions.includes(permission) : false;
  },
}));
