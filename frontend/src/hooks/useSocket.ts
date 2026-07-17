import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/Toast';

export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;
    const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
    const socket = io(url, { auth: { token: accessToken }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('notification:new', (payload: { message: string }) => {
      toast.info(payload.message);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    socket.on('marks:published', () => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, queryClient]);

  return socketRef;
}
