import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Sprout,
  Activity,
  LineChart,
  QrCode,
  Camera,
  Wheat,
  Droplets,
  FlaskConical,
  Wrench,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  X,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  alias?: string;
}

interface SidebarProps {
  currentView?: string;
  activeTab?: string;
  onNavigate?: (viewId: string) => void;
  onTabChange?: (tab: string) => void;
  isOpen?: boolean;
  isMobileOpen?: boolean;
  onClose?: () => void;
  onCloseMobile?: () => void;
  unreadAlertsCount?: number;
  pendingTasksCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  activeTab,
  onNavigate,
  onTabChange,
  isOpen,
  isMobileOpen,
  onClose,
  onCloseMobile,
  unreadAlertsCount = 0,
  pendingTasksCount = 0,
}) => {
  const effectiveView = activeTab || currentView || 'dashboard';
  const effectiveIsOpen = isMobileOpen !== undefined ? isMobileOpen : (isOpen ?? false);

  const handleClose = () => {
    if (onCloseMobile) onCloseMobile();
    if (onClose) onClose();
  };

  const handleSelect = (tabId: string) => {
    if (onTabChange) onTabChange(tabId);
    if (onNavigate) onNavigate(tabId);
    handleClose();
  };

  const navItems: NavItem[] = [
    { id: 'dashboard', alias: 'inicio', label: 'Inicio', icon: LayoutDashboard },
    { id: 'systems', alias: 'mis-sistemas', label: 'Mis sistemas', icon: Layers },
    { id: 'plants', alias: 'mis-plantas', label: 'Mis plantas', icon: Sprout },
    { id: 'sensors', alias: 'sensores', label: 'Sensores', icon: Activity },
    { id: 'measurements', alias: 'mediciones', label: 'Mediciones', icon: LineChart },
    { id: 'qr-scanner', alias: 'escanear-qr', label: 'Escanear QR', icon: QrCode },
    { id: 'photos-ai', alias: 'fotografias-ia', label: 'Fotografías e IA', icon: Camera },
    { id: 'forage', alias: 'forraje', label: 'Forraje (FVH)', icon: Wheat },
    { id: 'water', alias: 'agua', label: 'Agua y Riego', icon: Droplets },
    { id: 'nutrients', alias: 'nutrientes', label: 'Nutrientes', icon: FlaskConical },
    { id: 'maintenance', alias: 'mantenimiento', label: 'Mantenimiento', icon: Wrench },
    {
      id: 'calendar',
      alias: 'calendario',
      label: 'Calendario',
      icon: Calendar,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
      badgeColor: 'bg-sky-500 text-white',
    },
    {
      id: 'alerts',
      alias: 'alertas',
      label: 'Alertas',
      icon: AlertTriangle,
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
    },
    { id: 'reports', alias: 'informes', label: 'Informes', icon: FileSpreadsheet },
    { id: 'settings', alias: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {effectiveIsOpen && (
        <div
          id="sidebar-backdrop"
          onClick={handleClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          effectiveIsOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
          <span className="text-sm font-bold text-slate-200 tracking-wide">Menú de Navegación</span>
          <button
            id="btn-close-sidebar"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = effectiveView === item.id || effectiveView === item.alias;

            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition group text-left cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      item.badgeColor || 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom summary card */}
        <div className="p-3 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800">
            <div className="font-semibold text-slate-300 mb-0.5">La Bocana, El Oro</div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Cultivo en línea (v1.0)
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
