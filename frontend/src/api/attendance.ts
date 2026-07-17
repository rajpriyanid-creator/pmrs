import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { Attendance } from '@/types';

export function useTeamAttendance(teamId?: string, kind?: 'review' | 'semester') {
  return useQuery({
    queryKey: ['attendance', teamId, kind],
    queryFn: async () => {
      const res = await api.get<{ attendance: Attendance[] }>('/attendance', { params: { teamId, kind } });
      return res.data.attendance;
    },
    enabled: !!teamId,
  });
}

export function useProgramAttendance(program?: string, kind?: 'review' | 'semester') {
  return useQuery({
    queryKey: ['attendance', 'program', program, kind],
    queryFn: async () => {
      const res = await api.get<{ attendance: any[] }>('/attendance', { params: { program, kind } });
      return res.data.attendance;
    },
  });
}

export function useSubmitAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      teamId,
      ...body
    }: {
      teamId: string;
      reviewId: string | null;
      kind: 'review' | 'semester';
      perStudent: { studentId: string; present: boolean }[];
      reviewDate?: string;
      reviewTime?: string;
    }) => {
      const res = await api.post(`/attendance/${teamId}/submit`, body);
      return res.data.attendance as Attendance;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance'] }),
  });
}

export function downloadAttendance(params: { teamId?: string; program?: string }) {
  return api.get('/attendance/export', { params, responseType: 'blob' });
}
