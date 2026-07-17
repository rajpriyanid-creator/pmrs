import { api } from './client';
import { RoleOption, ScopedRole } from '@/types';

export async function loginRequest(username: string, password: string) {
  const res = await api.post('/auth/login', { username, password });
  return res.data as
    | { needsRoleSelection: true; identityToken: string; name: string; mustChangePassword?: boolean }
    | {
        needsRoleSelection: false;
        accessToken: string;
        profile: { userId: string; name: string; role: ScopedRole; programId: string | null };
        mustChangePassword?: boolean;
      };
}

export async function getRolesRequest(identityToken: string) {
  const res = await api.get('/auth/roles', { headers: { Authorization: `Bearer ${identityToken}` } });
  return res.data as { name: string; options: RoleOption[] };
}

export async function selectRoleRequest(identityToken: string, role: ScopedRole, programId: string | null) {
  const res = await api.post(
    '/auth/select-role',
    { role, programId },
    { headers: { Authorization: `Bearer ${identityToken}` } }
  );
  return res.data as {
    accessToken: string;
    profile: { userId: string; name: string; role: ScopedRole; programId: string | null };
  };
}

export async function logoutRequest() {
  await api.post('/auth/logout');
}
