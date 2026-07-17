import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import { Program } from '@/types';

export function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const res = await api.get<{ programs: Program[] }>('/programs');
      return res.data.programs;
    },
    staleTime: 5 * 60_000,
  });
}
