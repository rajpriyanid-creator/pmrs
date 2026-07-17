import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { Faculty, Paginated } from '@/types';

export function useFacultyList(search = '') {
  return useQuery({
    queryKey: ['faculty', search],
    queryFn: async () => {
      const res = await api.get<Paginated<Faculty>>('/faculty', { params: { search, limit: 50 } });
      return res.data;
    },
  });
}

export interface CreateFacultyInput {
  name: string;
  username: string;
  email: string;
  designation: string;
  seniority: number;
  guideLimits: { ug: number; pg: number };
  isAdmin?: boolean;
  isAssistant?: boolean;
}

export function useCreateFaculty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateFacultyInput) => {
      const res = await api.post('/faculty', input);
      return res.data as { faculty: Faculty; tempPassword: string };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['faculty'] }),
  });
}

export function useImportFaculty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/faculty/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data as { createdCount: number; errors: { row: number; message: string }[] };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['faculty'] }),
  });
}

export function useDeleteFaculty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/faculty/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['faculty'] }),
  });
}

export function useDeleteAllFaculty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.delete('/faculty');
      return res.data as { success: boolean; deletedCount: number };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['faculty'] }),
  });
}

export function downloadFacultyTemplate() {
  return api.get('/faculty/export/template', { responseType: 'blob' });
}

export function downloadFacultyList() {
  return api.get('/faculty/export', { responseType: 'blob' });
}
