import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api/auth.api';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  tenant_id?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  lastActivity: number;
  login: (user: User, token: string) => void;
  loginWithApi: (email: string, password: string) => Promise<void>;
  logout: () => void;
  logoutWithApi: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  updateLastActivity: () => void;
  isTokenExpiringSoon: () => boolean;
  clearError: () => void;
}

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      tokenExpiresAt: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      lastActivity: Date.now(),

      login: (user, token) => {
        set({ user, token, isAuthenticated: true, error: null, lastActivity: Date.now() });
      },

      loginWithApi: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const response = await authApi.login({ email, password });
          const expiresAt = Date.now() + (response.expires_in || 900) * 1000;
          set({
            user: response.user,
            token: response.access_token,
            refreshToken: response.refresh_token || null,
            tokenExpiresAt: expiresAt,
            isAuthenticated: true,
            loading: false,
            error: null,
            lastActivity: Date.now(),
          });
        } catch (error: any) {
          const message =
            error.response?.data?.message || 'Email ou mot de passe incorrect';
          set({ loading: false, error: message });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          tokenExpiresAt: null,
          isAuthenticated: false,
          error: null,
        });
      },

      logoutWithApi: async () => {
        try {
          await authApi.logout();
        } catch {
          // Ignorer les erreurs - on déconnecte quand même côté frontend
        }
        get().logout();
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          const response = await authApi.refresh(refreshToken);
          const expiresAt = Date.now() + (response.expires_in || 900) * 1000;
          set({
            token: response.access_token,
            tokenExpiresAt: expiresAt,
          });
          return true;
        } catch {
          // Refresh token invalide → déconnexion
          get().logout();
          return false;
        }
      },

      updateLastActivity: () => {
        set({ lastActivity: Date.now() });
      },

      isTokenExpiringSoon: () => {
        const { tokenExpiresAt } = get();
        if (!tokenExpiresAt) return true;
        // Renouveler 2 minutes avant l'expiration
        return Date.now() > tokenExpiresAt - 2 * 60 * 1000;
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user ? { id: state.user.id, email: state.user.email, full_name: state.user.full_name, role: state.user.role } : null,
        token: state.token,
        refreshToken: state.refreshToken,
        tokenExpiresAt: state.tokenExpiresAt,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity,
      }),
      onRehydrateStorage: () => (state) => {
        // Vérifier l'expiration au rechargement de la page
        if (state && state.isAuthenticated) {
          const now = Date.now();
          // Si le token est expiré et pas de refresh token, déconnecter
          if (state.tokenExpiresAt && now > state.tokenExpiresAt && !state.refreshToken) {
            state.logout();
          }
          // Si inactif trop longtemps, déconnecter
          if (state.lastActivity && (now - state.lastActivity) > INACTIVITY_TIMEOUT_MS) {
            state.logout();
          }
        }
      },
    }
  )
);

export { INACTIVITY_TIMEOUT_MS };
