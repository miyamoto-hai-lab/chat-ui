import { useAuthContext } from '@/components/providers/AuthProvider';

export function usePasswordAuth() {
  return useAuthContext();
}
