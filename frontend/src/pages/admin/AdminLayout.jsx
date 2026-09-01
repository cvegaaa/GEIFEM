import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Mail, LogOut, Menu, X, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { adminAxios, adminLogout } from './adminApi';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    adminAxios.get('/admin/verify')
      .then(() => { setVerified(true); setChecking(false); })
      .catch(() => { navigate('/admin/login'); });
  }, [navigate]);

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, testid: 'nav-dashboard' },
    { path: '/admin/leads', label: 'Leads / Contactos', icon: Users, testid: 'nav-leads' },
    { path: '/admin/articles', label: 'Artículos', icon: FileText, testid: 'nav-articles' },
    { path: '/admin/newsletter', label: 'Newsletter', icon: Mail, testid: 'nav-newsletter' },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Verificando sesión...</p>
      </div>
    );
  }

  if (!verified) return null;

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-layout">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#003057] text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 flex flex-col`}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#CBA55A] rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-white" size={22} />
            </div>
            <div>
              <div className="font-bold text-lg">GEIFEM</div>
              <div className="text-xs text-white/60 uppercase tracking-wider">Admin</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                data-testid={item.testid}
                className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-[#CBA55A] text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Button
            variant="ghost"
            className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10"
            onClick={adminLogout}
            data-testid="admin-logout-btn"
          >
            <LogOut size={18} className="mr-3" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="lg:ml-64">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="flex items-center justify-between p-4">
            <button
              className="lg:hidden p-2 text-gray-700"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="admin-sidebar-toggle"
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div className="hidden lg:block text-sm text-gray-500">Panel administrativo · GEIFEM</div>
            <Link to="/" className="text-sm text-[#1E5A75] hover:text-[#003057]" data-testid="admin-view-site">
              Ver sitio →
            </Link>
          </div>
        </header>

        <main className="p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
