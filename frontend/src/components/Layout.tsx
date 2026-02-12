import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  Wrench, 
  Package, 
  Receipt, 
  DollarSign,
  Users,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import logo from '@/assets/logo.png';

const Layout = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navigation selon le rôle
  const getNavigationByRole = (role: string) => {
    switch (role) {
      case 'mechanic':
        return [
          { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
          { name: 'Véhicules', href: '/vehicles', icon: Car },
          { name: 'Interventions', href: '/interventions', icon: Wrench },
          { name: 'Stock', href: '/stock', icon: Package },
        ];
      case 'cashier':
        return [
          { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
          { name: 'Véhicules', href: '/vehicles', icon: Car },
          { name: 'Interventions', href: '/interventions', icon: Wrench },
          { name: 'Finance', href: '/finance', icon: Receipt },
          { name: 'Caisse', href: '/cash', icon: DollarSign },
        ];
      case 'admin_garage':
      default:
        return [
          { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
          { name: 'Véhicules', href: '/vehicles', icon: Car },
          { name: 'Interventions', href: '/interventions', icon: Wrench },
          { name: 'Stock', href: '/stock', icon: Package },
          { name: 'Finance', href: '/finance', icon: Receipt },
          { name: 'Caisse', href: '/cash', icon: DollarSign },
          { name: 'Agents', href: '/agents', icon: Users },
          { name: 'Paramètres', href: '/settings', icon: Settings },
        ];
    }
  };

  const navigation = user ? getNavigationByRole(user.role) : [];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white">
            <div className="flex h-full flex-col">
              <div className="flex h-24 items-center justify-between px-6 border-b">
                <img src={logo} alt="SAMA GARAGE" className="h-20 w-auto" />
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.href)
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t p-4">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Déconnexion"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 border-r bg-white">
          <div className="flex h-24 items-center justify-center px-6 border-b">
            <img src={logo} alt="SAMA GARAGE" className="h-20 w-auto" />
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t p-4">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Déconnexion"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar mobile */}
        <div className="sticky top-0 z-40 flex h-24 items-center gap-x-4 border-b bg-white px-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <img src={logo} alt="SAMA GARAGE" className="h-16 w-auto" />
        </div>

        {/* Page content */}
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
