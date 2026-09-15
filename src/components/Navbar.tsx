import React from 'react';
import { 
  Sprout, 
  CloudSun, 
  Bell, 
  CheckSquare, 
  LogOut, 
  Menu,
  Radio,
  LogIn,
  UserPlus
} from 'lucide-react';
import { User, CultivationLocation, SystemAlert, AgriculturalCalendarTask, WeatherData } from '../types';

export interface NavbarProps {
  user: User | null;
  location?: CultivationLocation;
  weather?: WeatherData;
  alerts?: SystemAlert[];
  tasks?: AgriculturalCalendarTask[];
  unreadAlertsCount?: number;
  onNavigate?: (viewId: string) => void;
  onLogout: () => void;
  onOpenMobileMenu?: () => void;
  onToggleMobileSidebar?: () => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
  onOpenAlerts?: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  location,
  weather,
  alerts = [],
  tasks = [],
  unreadAlertsCount,
  onNavigate,
  onLogout,
  onOpenMobileMenu,
  onToggleMobileSidebar,
  onOpenLogin,
  onOpenRegister,
  onOpenAlerts,
  onOpenSettings,
}) => {
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const unreadAlerts = safeAlerts.filter(a => !a.acknowledged);
  const pendingTasks = safeTasks.filter(t => !t.completed);
  const effectiveAlertCount = unreadAlertsCount !== undefined ? unreadAlertsCount : unreadAlerts.length;

  const handleMenuToggle = () => {
    if (onOpenMobileMenu) {
      onOpenMobileMenu();
    } else if (onToggleMobileSidebar) {
      onToggleMobileSidebar();
    }
  };

  const handleNav = (id: string) => {
    if (id === 'alertas' && onOpenAlerts) {
      onOpenAlerts();
      return;
    }
    if (id === 'configuracion' && onOpenSettings) {
      onOpenSettings();
      return;
    }
    if (onNavigate) {
      onNavigate(id);
    }
  };

  const currentTemp = location?.currentWeather?.temperature ?? weather?.temperature ?? 23.4;
  const currentHumidity = location?.currentWeather?.humidity ?? weather?.humidity ?? 78;

  return (
    <header 
      id="main-navbar"
      className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Mobile menu toggle + Brand */}
        <div className="flex items-center gap-3">
          <button
            id="btn-mobile-menu"
            onClick={handleMenuToggle}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition focus:outline-none cursor-pointer"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div 
            id="brand-logo"
            onClick={() => handleNav('inicio')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">HydroControl</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">IoT & IA</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Monitoreo Hidropónico Inteligente</p>
            </div>
          </div>
        </div>

        {/* Center: Location & Live Weather */}
        <div 
          id="location-weather-badge"
          onClick={() => handleNav('configuracion')}
          className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 cursor-pointer transition text-xs"
          title="Ubicación y Clima en tiempo real"
        >
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-200">La Bocana, Piñas</span>
          </div>
          <span className="text-slate-500">•</span>
          <div className="flex items-center gap-1.5 text-amber-300 font-medium">
            <CloudSun className="w-4 h-4 text-amber-400" />
            <span>{currentTemp}°C</span>
            <span className="text-slate-400 text-[11px] hidden lg:inline">
              ({currentHumidity}% HR)
            </span>
          </div>
        </div>

        {/* Right: Quick actions & User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Scanner Shortcut */}
          <button
            id="btn-quick-qr"
            onClick={() => handleNav('escanear-qr')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
            title="Escanear QR de planta o forraje"
          >
            <Radio className="w-4 h-4" />
            <span className="hidden sm:inline">Escanear QR</span>
          </button>

          {/* Pending Tasks */}
          <button
            id="btn-nav-tasks"
            onClick={() => handleNav('calendario')}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Tareas pendientes del calendario"
          >
            <CheckSquare className="w-5 h-5" />
            {pendingTasks.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-sky-500 text-white ring-2 ring-slate-900">
                {pendingTasks.length}
              </span>
            )}
          </button>

          {/* Alerts Bell */}
          <button
            id="btn-nav-alerts"
            onClick={() => handleNav('alertas')}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Alertas del cultivo"
          >
            <Bell className="w-5 h-5" />
            {effectiveAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white ring-2 ring-slate-900 animate-pulse">
                {effectiveAlertCount}
              </span>
            )}
          </button>

          {/* User Profile / Auth buttons */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-200 truncate max-w-[120px]">
                    {user.name || user.fullName || user.username}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono">
                    @{user.username}
                  </div>
                </div>

                <button
                  id="btn-logout"
                  onClick={onLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {onOpenLogin && (
                  <button
                    id="btn-nav-login"
                    onClick={onOpenLogin}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Ingresar</span>
                  </button>
                )}
                {onOpenRegister && (
                  <button
                    id="btn-nav-register"
                    onClick={onOpenRegister}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition shadow-xs cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Registro</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
