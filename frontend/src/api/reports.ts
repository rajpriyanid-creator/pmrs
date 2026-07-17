import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface RejectionItem {
  filePath: string;
  filename: string;
  remarks: string;
  rejectedAt: string;
}

export interface ReportItem {
  _id: string;
  teamId: { _id: string; name: string };
  uploadedBy: { _id: string; name: string; rollNo?: string };
  filename: string;
  mimeType: string;
  status: 'uploaded' | 'approved' | 'rejected';
  remarks?: string;
  rejections?: RejectionItem[];
  approvedBy?: { _id: string; name: string };
  approvedAt?: string;
  createdAt: string;
}

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await api.get<{ reports: ReportItem[] }>('/reports');
      return res.data.reports;
    },
  });
}

export function useUploadReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('report', file);
      const res = await api.post('/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useApproveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch<{ report: ReportItem }>(`/reports/${id}/approve`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useRejectReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, remarks }: { id: string; remarks: string }) => {
      const res = await api.patch<{ report: ReportItem }>(`/reports/${id}/reject`, { remarks });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });
}
