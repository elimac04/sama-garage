import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, INACTIVITY_TIMEOUT_MS } from '@/stores/authStore';

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
const CHECK_INTERVAL_MS = 60 * 1000; // Vérifier toutes les minutes

const SessionGuard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logoutWithApi, updateLastActivity } = useAuthStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleInactivityLogout = useCallback(async () => {
    await logoutWithApi();
    navigate('/login', { replace: true });
  }, [logoutWithApi, navigate]);

  const handleActivity = useCallback(() => {
    if (isAuthenticated) {
      updateLastActivity();
    }
  }, [isAuthenticated, updateLastActivity]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Écouter les événements d'activité utilisateur
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Vérifier périodiquement l'inactivité
    timerRef.current = setInterval(() => {
      const store = useAuthStore.getState();
      if (!store.isAuthenticated) return;

      const elapsed = Date.now() - store.lastActivity;
      if (elapsed > INACTIVITY_TIMEOUT_MS) {
        handleInactivityLogout();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isAuthenticated, handleActivity, handleInactivityLogout]);

  return null;
};

export default SessionGuard;
