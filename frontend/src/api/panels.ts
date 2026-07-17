import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export function useVivaPanel() {
  return useQuery({
    queryKey: ['viva-panel'],
    queryFn: async () => {
      const res = await api.get('/panels/viva');
      return res.data.vivaPanel as {
        _id: string;
        internalMembers: { _id: string; name: string }[];
        externalMembers: { name: string; affiliation: string; email: string }[];
        teamIds: string[];
      };
    },
  });
}

export function useUpdateVivaPanel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      externalMembers,
    }: {
      id: string;
      externalMembers: { name: string; affiliation: string; email: string }[];
    }) => {
      const res = await api.patch(`/panels/viva/${id}`, { externalMembers });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['viva-panel'] }),
  });
}

export function useReviewPanels(program?: string) {
  return useQuery({
    queryKey: ['review-panels', program],
    queryFn: async () => {
      const res = await api.get('/panels/review', { params: { program } });
      return res.data.panels as {
        _id: string;
        coordinatorId: { _id: string; name: string };
        memberIds: { _id: string; name: string }[];
        teamIds: string[];
      }[];
    },
    enabled: !!program,
  });
}
