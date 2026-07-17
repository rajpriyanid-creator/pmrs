import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { NotificationItem, Paginated } from '@/types';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get<Paginated<NotificationItem>>('/notifications', { params: { limit: 20 } });
      return res.data;
    },
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
