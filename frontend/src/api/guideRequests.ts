import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface GuideRequestItem {
  _id: string;
  teamId: { _id: string; name: string } | string;
  guideId: string;
  program: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export function useGuideRequests(status?: string) {
  return useQuery({
    queryKey: ['guide-requests', status],
    queryFn: async () => {
      const res = await api.get<{ requests: GuideRequestItem[] }>('/guide-requests', { params: status ? { status } : {} });
      return res.data.requests;
    },
  });
}

export function useGuideCapacity(guideId?: string) {
  return useQuery({
    queryKey: ['guide-limits', guideId],
    queryFn: async () => {
      const res = await api.get('/guide-requests/limits', { params: guideId ? { guideId } : {} });
      return res.data.capacity as {
        ug: { accepted: number; limit: number; remaining: number };
        pg: { accepted: number; limit: number; remaining: number };
      };
    },
  });
}

export function useCreateGuideRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { teamId: string; guideId: string }) => {
      const res = await api.post('/guide-requests', input);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });
}

export function useRespondToGuideRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      const res = await api.patch(`/guide-requests/${id}`, { accept });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['guide-limits'] });
      queryClient.invalidateQueries({ queryKey: ['guide-requests'] });
    },
  });
}
