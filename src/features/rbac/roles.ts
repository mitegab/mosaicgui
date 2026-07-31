export type Permission =
  | 'schema:view'
  | 'schema:edit'
  | 'query:view'
  | 'query:build'
  | 'query:execute'
  | 'query:delete'
  | 'ai:use'
  | 'settings:manage'
  | 'billing:view'
  | 'users:manage';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  color: string;
}

export const ALL_PERMISSIONS: Permission[] = [
  'schema:view',
  'schema:edit',
  'query:view',
  'query:build',
  'query:execute',
  'query:delete',
  'ai:use',
  'settings:manage',
  'billing:view',
  'users:manage',
];

export const BUILTIN_ROLES: Role[] = [
  {
    id: 'owner',
    name: 'Owner',
    description: 'Full access to everything',
    permissions: [...ALL_PERMISSIONS],
    color: '#ef4444',
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Manage users, queries, and schema',
    permissions: [
      'schema:view',
      'schema:edit',
      'query:view',
      'query:build',
      'query:execute',
      'query:delete',
      'ai:use',
      'settings:manage',
      'users:manage',
    ],
    color: '#f59e0b',
  },
  {
    id: 'editor',
    name: 'Editor',
    description: 'Build and run queries',
    permissions: ['schema:view', 'query:view', 'query:build', 'query:execute', 'ai:use'],
    color: '#8b5cf6',
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access',
    permissions: ['schema:view', 'query:view'],
    color: '#06b6d4',
  },
];

export function getRole(roleId: string): Role | undefined {
  return BUILTIN_ROLES.find((role) => role.id === roleId);
}
