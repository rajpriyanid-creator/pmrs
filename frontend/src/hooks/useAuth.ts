import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const { accessToken, role, program, programName, mustChangePassword, clear } = useAuthStore();
  return {
    isAuthenticated: Boolean(accessToken),
    role, program, programName, mustChangePassword,
    logout: clear,
  };
}
