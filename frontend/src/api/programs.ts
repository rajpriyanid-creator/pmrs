import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; code: string; type: 'UG' | 'PG'; maxTeamSize?: number }) => {
      const res = await api.post('/programs', data);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] }),
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; code?: string; type?: 'UG' | 'PG'; maxTeamSize?: number } }) => {
      const res = await api.patch(`/programs/${id}`, data);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] }),
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/programs/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] }),
  });
}

export function useImportPrograms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/programs/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data as { success: boolean; createdCount: number };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['programs'] }),
  });
}

export function downloadProgramTemplate() {
  return api.get('/programs/template', { responseType: 'blob' });
}
