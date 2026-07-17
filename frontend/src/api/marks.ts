import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { MarksEntry, MarksSummary } from '@/types';

export function useMarksForReview(teamId?: string, reviewId?: string) {
  return useQuery({
    queryKey: ['marks', teamId, reviewId],
    queryFn: async () => {
      const res = await api.get<{ entries: MarksEntry[] }>('/marks', { params: { teamId, reviewId } });
      return res.data.entries;
    },
    enabled: !!teamId && !!reviewId,
  });
}

export function useMarksSummary(teamId?: string) {
  return useQuery({
    queryKey: ['marks-summary', teamId],
    queryFn: async () => {
      const res = await api.get<{ summaries: MarksSummary[]; overall: number }>(`/marks/summary/${teamId}`);
      return res.data;
    },
    enabled: !!teamId,
  });
}

export function useSubmitMarks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { teamId: string; reviewId: string; score: number; confirm: boolean }) => {
      const res = await api.post('/marks', input);
      return res.data.entry as MarksEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
      queryClient.invalidateQueries({ queryKey: ['marks-summary'] });
    },
  });
}

export function downloadMarks(params: { teamId?: string }) {
  return api.get('/marks/export', { params, responseType: 'blob' });
}
