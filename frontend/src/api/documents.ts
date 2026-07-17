import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface LetterTemplate {
  id: string;
  label: string;
}

export interface SignatureItem {
  _id: string;
  label: string;
  imageBase64: string;
  createdAt: string;
}

export function useLetterTemplates() {
  return useQuery({
    queryKey: ['documents', 'templates'],
    queryFn: async () => {
      const res = await api.get<{ templates: LetterTemplate[] }>('/documents/templates');
      return res.data.templates;
    },
  });
}

export function usePreviewLetter(type: string, teamId: string, reviewDate?: string) {
  return useQuery({
    queryKey: ['documents', 'preview', type, teamId, reviewDate],
    queryFn: async () => {
      const params = new URLSearchParams({ teamId });
      if (reviewDate) params.append('reviewDate', reviewDate);
      const res = await api.get<{ preview: string; data: any; templateName: string }>(`/documents/preview/${type}?${params.toString()}`);
      return res.data;
    },
    enabled: !!type && !!teamId,
  });
}

export function useSignatures() {
  return useQuery({
    queryKey: ['signatures'],
    queryFn: async () => {
      const res = await api.get<{ signatures: SignatureItem[] }>('/signatures');
      return res.data.signatures ?? [];
    },
  });
}

export function useCreateSignature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { label: string; imageBase64: string }) => {
      const res = await api.post<{ signature: SignatureItem }>('/signatures', data);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['signatures'] }),
  });
}

export function useDeleteSignature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete<{ ok: boolean }>(`/signatures/${id}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['signatures'] }),
  });
}
