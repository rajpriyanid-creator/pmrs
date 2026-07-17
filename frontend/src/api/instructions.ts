import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface InstructionItem {
  _id: string;
  program: string;
  title: string;
  instructions: string;
  filePath?: string;
  fileName?: string;
  uploadedBy?: { name: string; email: string };
  createdAt: string;
}

export function useInstructions(program?: string) {
  return useQuery({
    queryKey: ['instructions', program],
    queryFn: async () => {
      const q = program ? `?program=${encodeURIComponent(program)}` : '';
      const res = await api.get<{ instructions: InstructionItem[] }>(`/instructions${q}`);
      return res.data.instructions;
    },
  });
}

export function useCreateInstruction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/instructions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instructions'] }),
  });
}

export function useDeleteInstruction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete<{ ok: boolean }>(`/instructions/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instructions'] }),
  });
}
