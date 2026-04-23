import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'ACCOUNTANT';
  tenantId: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isHydrated: false,
      setAuth: (user, token) => {
        set({ user, token });
        localStorage.setItem('token', token);
      },
      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('token');
      },
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
