import { create } from "zustand";

interface UiState {
  darkMode: boolean;
  toggleDarkMode: () => void;
  railCollapsed: boolean;
  toggleRail: () => void;
}

const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

export const useUiStore = create<UiState>((set) => ({
  darkMode: prefersDark,
  toggleDarkMode: () => set((s) => {
    const next = !s.darkMode;
    document.documentElement.classList.toggle("dark", next);
    return { darkMode: next };
  }),
  railCollapsed: false,
  toggleRail: () => set((s) => ({ railCollapsed: !s.railCollapsed })),
}));
