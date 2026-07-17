import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface ScheduledSlotItem {
  _id: string;
  teamId: { _id: string; name: string; program?: string };
  reviewType: string;
  facultyIds: { _id: string; name: string; email?: string; designation?: string }[];
  startTime: string;
  endTime: string;
  periodLabel: string;
  notified: boolean;
}

export function useScheduledSlots(program?: string, reviewType?: string) {
  return useQuery({
    queryKey: ['scheduled-slots', program, reviewType],
    queryFn: async () => {
      const res = await api.get<{ slots: ScheduledSlotItem[] }>('/scheduling/slots', { params: { program, reviewType } });
      return res.data.slots ?? [];
    },
  });
}

export function useGenerateSchedules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { reviewType: string; periodLabel: string; durationMinutes?: number }) => {
      const res = await api.post('/scheduling/generate', data);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled-slots'] }),
  });
}

export function useGenerateSlotForTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      teamId: string;
      reviewType: string;
      startTime: string;
      endTime: string;
      facultyIds: string[];
      periodLabel: string;
    }) => {
      const res = await api.post('/scheduling/generate/team', data);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled-slots'] }),
  });
}

export function useClearSchedules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data?: { reviewType?: string; periodLabel?: string }) => {
      const res = await api.delete('/scheduling/slots', { data });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled-slots'] }),
  });
}

export function useDeleteScheduledSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/scheduling/slots/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduled-slots'] }),
  });
}
