import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface AllocationRow {
  teamId: string;
  teamName: string;
  guide: { _id: string; name: string } | null;
  panel: { _id: string; coordinatorId: { _id: string; name: string }; memberIds: { _id: string; name: string }[] } | null;
}

export function useAllocationTable(program?: string) {
  return useQuery({
    queryKey: ['allocations', program],
    queryFn: async () => {
      const res = await api.get<{ rows: AllocationRow[] }>('/assignments', { params: { program } });
      return res.data.rows;
    },
    enabled: !!program,
  });
}

interface BatchUpdate {
  teamId: string;
  guideId?: string | null;
  coordinatorId?: string | null;
  panelMemberIds?: string[];
}

export function useBatchUpdateAssignments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ program, updates }: { program: string; updates: BatchUpdate[] }) => {
      const res = await api.patch('/assignments/batch', { program, updates });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allocations'] }),
  });
}

export function useAutoAssign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (program: string) => {
      const res = await api.post('/assignments/auto-assign', { program });
      return res.data as { assignedCount: number; unassignedRemaining: number };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allocations'] }),
  });
}

export function useAutoAssignPanels() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (program: string) => {
      const res = await api.post('/assignments/auto-assign-panels', { program });
      return res.data as { assignedCount: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['panels'] });
    },
  });
}
