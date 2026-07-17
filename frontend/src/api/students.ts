import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { Paginated, Student } from '@/types';

export function useStudentList(program?: string) {
  return useQuery({
    queryKey: ['students', program],
    queryFn: async () => {
      const res = await api.get<Paginated<Student>>('/students', { params: { program, limit: 100 } });
      return res.data;
    },
    enabled: !!program,
  });
}

export interface CreateStudentInput {
  name: string;
  rollNo: string;
  program: string;
  email: string;
  username: string;
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateStudentInput) => {
      const res = await api.post('/students', input);
      return res.data as { student: Student; tempPassword: string };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/students/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });
}

export function useDeleteAllStudents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (program?: string) => {
      const res = await api.delete('/students', { params: { program } });
      return res.data as { success: boolean; deletedCount: number };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });
}

export function useImportStudents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, program }: { file: File; program: string }) => {
      const form = new FormData();
      form.append('file', file);
      form.append('program', program);
      const res = await api.post('/students/import', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      return res.data as { createdCount: number; errors: { row: number; message: string }[] };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });
}

export function downloadStudentTemplate() {
  return api.get('/students/template', { responseType: 'blob' });
}

export interface GuideAvailability {
  guideId: string;
  name: string;
  designation: string;
  remaining: number;
  limit: number;
}

export function useGuideAvailability() {
  return useQuery({
    queryKey: ['guide-availability'],
    queryFn: async () => {
      const res = await api.get<{ maxTeamSize: number; guides: GuideAvailability[] }>('/students/guides');
      return res.data;
    },
  });
}
