import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import SessionGuard from './components/SessionGuard';
import { Loader2 } from 'lucide-react';

// Lazy loading des pages pour un affichage < 2s (code splitting)
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AgentLoginPage = lazy(() => import('./pages/AgentLoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AgentDashboard = lazy(() => import('./pages/AgentDashboard'));
const VehiclesPage = lazy(() => import('./pages/VehiclesPage'));
const AgentVehiclesPage = lazy(() => import('./pages/AgentVehiclesPage'));
const InterventionsPage = lazy(() => import('./pages/InterventionsPage'));
const AgentInterventionsPage = lazy(() => import('./pages/AgentInterventionsPage'));
const StockPage = lazy(() => import('./pages/StockPage'));
const FinancePage = lazy(() => import('./pages/FinancePage'));
const CashPage = lazy(() => import('./pages/CashPage'));
const AgentsPage = lazy(() => import('./pages/AgentsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuthStore();
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuthStore();
  if (isAuthenticated && token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function DashboardRoute() {
  const { user } = useAuthStore();
  return user?.role === 'admin_garage' ? <Dashboard /> : <AgentDashboard />;
}

function VehiclesRoute() {
  const { user } = useAuthStore();
  return user?.role === 'admin_garage' ? <VehiclesPage /> : <AgentVehiclesPage />;
}

function InterventionsRoute() {
  const { user } = useAuthStore();
  return user?.role === 'admin_garage' ? <InterventionsPage /> : <AgentInterventionsPage />;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastContainer />
        <SessionGuard />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Routes publiques : redirige vers / si déjà connecté */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/agent/login" element={<PublicRoute><AgentLoginPage /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* Routes protégées : redirige vers /login si non connecté */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardRoute />} />
              <Route path="vehicles" element={<VehiclesRoute />} />
              <Route path="interventions" element={<InterventionsRoute />} />
              <Route path="stock" element={<StockPage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="cash" element={<CashPage />} />
              <Route path="agents" element={<AgentsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Toute URL inconnue redirige vers / */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
