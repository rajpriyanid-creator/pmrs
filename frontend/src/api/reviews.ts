import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { Review, ReviewType } from '@/types';

export function useTeamReviews(teamId?: string) {
  return useQuery({
    queryKey: ['reviews', teamId],
    queryFn: async () => {
      const res = await api.get<{ reviews: Review[] }>('/reviews', { params: { teamId } });
      return res.data.reviews;
    },
    enabled: !!teamId,
  });
}

export function useCreateOrUpdateReview() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (input: { teamId: string; type: ReviewType; scheduledDate?: string; scheduledTime?: string; durationMinutes?: number }) => {
      const res = await api.post('/reviews', input);
      return res.data.review as Review;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews'] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: { id: string; scheduledDate?: string; scheduledTime?: string; durationMinutes?: number; closed?: boolean }) => {
      const res = await api.patch(`/reviews/${id}`, input);
      return res.data.review as Review;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews'] }),
  });

  return { create, update };
}
