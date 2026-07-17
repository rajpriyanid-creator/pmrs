import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface DesignationLimitItem {
  _id: string;
  designation: string;
  ugLimit: number;
  pgLimit: number;
}

export function useDesignationLimits() {
  return useQuery({
    queryKey: ['designation-limits'],
    queryFn: async () => {
      const res = await api.get('/designation-limits');
      return res.data as { success: boolean; items: DesignationLimitItem[] };
    },
  });
}

export function useCreateDesignationLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { designation: string; ugLimit: number; pgLimit: number }) => {
      const res = await api.post('/designation-limits', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designation-limits'] });
    },
  });
}

export function useSaveBatchDesignationLimits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (limits: { designation: string; ugLimit: number; pgLimit: number }[]) => {
      const res = await api.post('/designation-limits/batch', { limits });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designation-limits'] });
    },
  });
}

export function useDeleteDesignationLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/designation-limits/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designation-limits'] });
    },
  });
}

export function useDeleteAllDesignationLimits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.delete('/designation-limits');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designation-limits'] });
    },
  });
}

export function useImportDesignationLimits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/designation-limits/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designation-limits'] });
    },
  });
}

export async function downloadDesignationLimitsTemplate() {
  return api.get('/designation-limits/template', { responseType: 'blob' });
}
