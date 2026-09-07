import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BarChart3,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Compass,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function DashboardLayout() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState({
    overdue: 0,
    today: 0,
    newLeads: 0,
  });

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setNotificationCounts({
          overdue: res.data.stats.overdueFollowups || 0,
          today: res.data.stats.todaysFollowups || 0,
          newLeads: res.data.stats.newLeads || 0,
        });
      }
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Leads', path: '/leads', icon: Users },
    { name: 'Follow-ups', path: '/followups', icon: CalendarCheck, badge: notificationCounts.overdue + notificationCounts.today },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    ...(isAdmin ? [{ name: 'Team', path: '/team', icon: UserCheck }] : []),
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans selection:bg-blue-600 selection:text-white">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 text-slate-700 min-h-screen sticky top-0 shadow-xs">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base leading-tight tracking-tight">MyTripWala CRM</h1>
              <p className="text-[11px] text-blue-600 font-semibold uppercase tracking-wider">Indian Travel Pipeline</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 font-medium">{user?.role === 'admin' ? '⚡ Main Admin' : '👤 Team Member'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Quick Status Notifications Pills */}
            <div className="hidden sm:flex items-center gap-2">
              {notificationCounts.overdue > 0 && (
                <Link
                  to="/followups?filter=overdue"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition"
                >
                  <AlertCircle className="w-3.5 h-3.5 animate-bounce" />
                  <span>{notificationCounts.overdue} Overdue</span>
                </Link>
              )}
              {notificationCounts.today > 0 && (
                <Link
                  to="/followups?filter=today"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{notificationCounts.today} Today</span>
                </Link>
              )}
              {notificationCounts.newLeads > 0 && (
                <Link
                  to="/leads?status=New"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>{notificationCounts.newLeads} New Leads</span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/leads?action=create"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-600/20 transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add New Lead</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-white/95 backdrop-blur pt-20 px-6 pb-6 space-y-3 flex flex-col border-b border-slate-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl font-medium text-slate-800 bg-slate-50 border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-blue-600" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-700">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="pt-6 border-t border-slate-200 mt-auto">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold"
              >
                <LogOut className="w-5 h-5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
