import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AppRouter } from '@/routes/AppRouter';
import { ToastViewport } from '@/components/ui/Toast';
import { useSessionBootstrap } from '@/hooks/useSessionBootstrap';

function AppShellGate() {
  const ready = useSessionBootstrap();
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-paper)]">
        <div className="h-8 w-8 rounded-full border-2 border-[var(--color-ink)]/15 border-t-[var(--color-seal)] animate-spin" />
      </div>
    );
  }
  return <AppRouter />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShellGate />
        <ToastViewport />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
