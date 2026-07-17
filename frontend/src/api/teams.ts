import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { Paginated, Team } from '@/types';

export interface MyInvite {
  _id: string;
  teamId: { _id: string; name: string };
  fromStudent: { _id: string; name: string; rollNo: string };
  status: string;
}

export function useMyInvites() {
  return useQuery({
    queryKey: ['my-invites'],
    queryFn: async () => {
      const res = await api.get<{ invites: MyInvite[] }>('/teams/invites/mine');
      return res.data.invites;
    },
  });
}

export function useTeamList(params: { program?: string; status?: string } = {}) {
  return useQuery({
    queryKey: ['teams', params],
    queryFn: async () => {
      const res = await api.get<Paginated<Team>>('/teams', { params: { ...params, limit: 100 } });
      return res.data;
    },
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; program: string; studentIds: string[] }) => {
      const res = await api.post('/teams', input);
      return res.data.team as Team;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
}

export function useInviteToTeam() {
  return useMutation({
    mutationFn: async ({ teamId, toStudentId }: { teamId: string; toStudentId: string }) => {
      const res = await api.post(`/teams/${teamId}/invite`, { toStudentId });
      return res.data;
    },
  });
}

export function useRespondToInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ inviteId, accept }: { inviteId: string; accept: boolean }) => {
      const res = await api.patch(`/teams/invites/${inviteId}`, { accept });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['my-invites'] });
    },
  });
}

export function useLockTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (teamId: string) => {
      const res = await api.post(`/teams/${teamId}/lock`);
      return res.data.team as Team;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
}
