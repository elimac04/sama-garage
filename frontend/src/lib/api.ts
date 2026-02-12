import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_TIMEOUT_MS = 15_000; // 15s max par requête
const MAX_RETRIES = 1; // 1 retry auto pour les erreurs réseau

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag pour éviter les refresh en parallèle
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

// Intercepteur requête : ajouter le token + auto-refresh si expirant
api.interceptors.request.use(async (config) => {
  const store = useAuthStore.getState();
  const url = config.url || '';
  const isAuthRequest = url.startsWith('/auth/login') || url.startsWith('/auth/refresh');

  // Si le token expire bientôt et qu'on a un refresh token, le renouveler
  if (store.isAuthenticated && store.isTokenExpiringSoon() && !isAuthRequest && !isRefreshing) {
    isRefreshing = true;
    const success = await store.refreshAccessToken();
    isRefreshing = false;
    if (!success) {
      return Promise.reject(new Error('Session expirée'));
    }
  }

  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Mettre à jour l'activité
  if (store.isAuthenticated) {
    store.updateLastActivity();
  }

  return config;
});

// Intercepteur réponse : gérer 401 avec retry via refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';
    const isAuthRequest = url.startsWith('/auth/login') || url.startsWith('/auth/refresh') || url.startsWith('/auth/logout');

    // Si 401 sur une requête non-auth et pas encore retryée
    if (error.response?.status === 401 && !isAuthRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // Attendre que le refresh en cours se termine
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const store = useAuthStore.getState();
      const success = await store.refreshAccessToken();
      isRefreshing = false;

      if (success) {
        const newToken = useAuthStore.getState().token;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } else {
        processQueue(error, null);
        store.logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // Retry automatique pour les erreurs réseau/timeout (pas les erreurs métier)
    const retryCount = originalRequest._retryCount || 0;
    if (
      !error.response &&
      retryCount < MAX_RETRIES &&
      !isAuthRequest
    ) {
      originalRequest._retryCount = retryCount + 1;
      // Attente progressive avant retry
      await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default api;
