import React from 'react';
import {
  Layers,
  Sprout,
  HeartPulse,
  AlertTriangle,
  LineChart,
  Calendar,
  CloudSun,
  Droplets,
  ArrowRight,
  TrendingUp,
  Activity,
  Plus,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { AppData, Plant, Measurement } from '../../types';

export interface DashboardViewProps {
  data: AppData;
  onNavigate: (viewId: string) => void;
  onOpenPlantDetail?: (plant: Plant) => void;
  onSelectPlant?: (plant: Plant) => void;
  onOpenNewMeasurement?: () => void;
  onQuickNewMeasurement?: () => void;
  onOpenNewPlant?: () => void;
  onQuickScanQr?: () => void;
  onAcknowledgeAlert?: (alertId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  onNavigate,
  onOpenPlantDetail,
  onSelectPlant,
  onOpenNewMeasurement,
  onQuickNewMeasurement,
  onOpenNewPlant,
  onQuickScanQr,
  onAcknowledgeAlert,
}) => {
  const handlePlantClick = onOpenPlantDetail || onSelectPlant || (() => {});
  const handleNewMeasurementClick = onOpenNewMeasurement || onQuickNewMeasurement || (() => onNavigate('measurements'));

  const systems = data.systems || [];
  const plants = data.plants || [];
  const measurements = data.measurements || [];
  const alerts = data.alerts || [];
  const tasks = data.calendarTasks || data.tasks || [];

  const totalSystems = systems.length;
  const totalPlants = plants.length;
  const healthyPlants = plants.filter((p) => p.status === 'healthy').length;
  const observationPlants = plants.filter((p) => p.status === 'needs_observation').length;
  const attentionPlants = plants.filter((p) => p.status === 'needs_attention').length;

  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const pendingTasks = tasks.filter((t) => !t.completed);

  // Latest measurements
  const latestMeasurements = [...measurements]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  // Latest pH and EC from systems
  const latestPh = measurements.filter((m) => m.sensorType === 'ph').slice(-1)[0]?.value ?? 6.0;
  const latestEc = measurements.filter((m) => m.sensorType === 'ec').slice(-1)[0]?.value ?? 1.45;
  const latestWaterTemp = measurements.filter((m) => m.sensorType === 'water_temp').slice(-1)[0]?.value ?? 21.2;
  const latestDo = measurements.filter((m) => m.sensorType === 'dissolved_oxygen').slice(-1)[0]?.value ?? 7.4;

  const currentWeather = data.location?.currentWeather || {
    temperature: data.weather?.temperature ?? 23.4,
    humidity: data.weather?.humidity ?? 78,
    tempMin: 18.5,
    tempMax: 26.2,
    weatherCodeDescription: 'Parcialmente soleado, idóneo para fotosíntesis',
    windSpeedKmh: 11,
    precipitationMm: 0,
    lastUpdated: new Date().toISOString(),
  };

  return (
    <div id="view-dashboard" className="space-y-6">
      {/* Welcome & Context Banner */}
      <div 
        id="dashboard-header-card"
        className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-2xl border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
      >
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Monitoreo en Tiempo Real • La Bocana, Piñas, El Oro
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Panel Principal HydroControl</h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Resumen integral de sistemas DWC, torres verticales, fisiología vegetal, sensores IoT y balance hídrico.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-dash-scan-qr"
            onClick={onQuickScanQr ? onQuickScanQr : () => onNavigate('escanear-qr')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-md shadow-emerald-900/40 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Escanear QR</span>
          </button>

          <button
            id="btn-dash-new-meas"
            onClick={handleNewMeasurementClick}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Medición</span>
          </button>
        </div>
      </div>

      {/* Top 4 Essential KPIs */}
      <div id="dashboard-kpis-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Systems KPI */}
        <div
          id="kpi-systems"
          onClick={() => onNavigate('mis-sistemas')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-500/50 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Sistemas Hidropónicos</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalSystems}</span>
            <span className="text-xs text-slate-600 font-medium">instalados</span>
          </div>
          <div className="mt-2 text-xs text-slate-700 flex items-center gap-1">
            <span className="font-semibold text-emerald-800">DWC, Vertical & Aero</span>
          </div>
        </div>

        {/* Plants KPI */}
        <div
          id="kpi-plants"
          onClick={() => onNavigate('mis-plantas')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-500/50 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Total de Plantas</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sprout className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalPlants}</span>
            <span className="text-xs text-slate-600 font-medium">con ficha individual</span>
          </div>
          <div className="mt-2 text-xs flex items-center gap-2">
            <span className="text-emerald-800 font-bold">{healthyPlants} sanas</span>
            <span className="text-slate-500">•</span>
            <span className="text-amber-700 font-bold">{observationPlants} obs.</span>
          </div>
        </div>

        {/* Attention needed KPI */}
        <div
          id="kpi-attention"
          onClick={() => onNavigate(attentionPlants > 0 ? 'mis-plantas' : 'alertas')}
          className={`p-5 rounded-2xl border transition cursor-pointer group shadow-xs ${
            attentionPlants > 0
              ? 'bg-rose-50/70 border-rose-200 hover:border-rose-400'
              : 'bg-white border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Requieren Atención</span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                attentionPlants > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <HeartPulse className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold ${
                attentionPlants > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {attentionPlants}
            </span>
            <span className="text-xs text-slate-600 font-medium">plantas</span>
          </div>
          <div className="mt-2 text-xs font-medium text-slate-700">
            {attentionPlants > 0 ? 'Revisar clorosis o agua' : 'Sin alertas críticas en plantas'}
          </div>
        </div>

        {/* Ambient Temperature & Weather KPI */}
        <div
          id="kpi-weather"
          onClick={() => onNavigate('configuracion')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-400/50 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Clima Cultivo (La Bocana)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CloudSun className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {currentWeather?.temperature ?? 23.4}°C
            </span>
            <span className="text-xs text-slate-600 font-medium">exterior</span>
          </div>
          <div className="mt-2 text-xs text-slate-700 flex items-center justify-between">
            <span>HR: {currentWeather?.humidity ?? 78}%</span>
            <span className="text-emerald-800 font-bold">Agua: {latestWaterTemp}°C</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Left (Water Parameters & Alerts) | Right (Pending Tasks & Plants Status) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hydro Solution Vital Parameters Card */}
          <div 
            id="dashboard-vital-params-card"
            className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Parámetros Clave de la Solución Nutritiva</h2>
                <p className="text-xs text-slate-600">Última lectura tomada en Sistema DWC Tanque A</p>
              </div>
              <button
                onClick={() => onNavigate('mediciones')}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition"
              >
                <span>Ver gráficos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* pH */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-bold text-slate-600 uppercase">pH Agua</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{latestPh}</div>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Rango ideal:</span>
                  <span className="font-bold text-emerald-800">5.6 - 6.5</span>
                </div>
              </div>

              {/* EC */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-bold text-slate-600 uppercase">Conductividad EC</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{latestEc} <span className="text-xs font-normal text-slate-600">mS/cm</span></div>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Rango ideal:</span>
                  <span className="font-bold text-emerald-800">1.2 - 1.8</span>
                </div>
              </div>

              {/* Temp Agua */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-bold text-slate-600 uppercase">Temp. Agua</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{latestWaterTemp} <span className="text-xs font-normal text-slate-600">°C</span></div>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Rango ideal:</span>
                  <span className="font-bold text-emerald-800">18 - 23 °C</span>
                </div>
              </div>

              {/* Oxígeno Disuelto */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-bold text-slate-600 uppercase">Oxígeno (DO)</span>
                <div className="text-2xl font-black text-emerald-800 mt-1">{latestDo} <span className="text-xs font-normal text-slate-600">mg/L</span></div>
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Rango ideal:</span>
                  <span className="font-bold text-emerald-800">&gt; 6.0</span>
                </div>
              </div>
            </div>

            {/* Note on sensor vs weather temp differentiation */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-sky-500" />
                Diferenciación activa: Temperatura del agua ({latestWaterTemp}°C) vs Clima exterior La Bocana ({currentWeather?.temperature ?? 23.4}°C)
              </span>
              <span className="text-emerald-800 font-semibold">Delta térmico: {(Math.abs((currentWeather?.temperature ?? 23.4) - latestWaterTemp)).toFixed(1)}°C</span>
            </div>
          </div>

          {/* Active Alerts List */}
          <div 
            id="dashboard-alerts-card"
            className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900">Alertas del Sistema</h2>
                {activeAlerts.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    {activeAlerts.length} activas
                  </span>
                )}
              </div>
              <button
                onClick={() => onNavigate('alertas')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeAlerts.length === 0 ? (
              <div className="text-center py-6 text-slate-600 text-sm">
                No hay alertas activas. Todos los parámetros se encuentran en estado normal.
              </div>
            ) : (
              <div className="space-y-3">
                {activeAlerts.slice(0, 3).map((alert) => {
                  const isAttention = alert.severity === 'attention';
                  const isObservation = alert.severity === 'observation';

                  return (
                    <div
                      key={alert.id}
                      className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                        isAttention
                          ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                          : isObservation
                          ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                          : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm mb-0.5">{alert.title}</div>
                        <p className="text-slate-700">{alert.message}</p>
                        <div className="mt-2 text-[11px] text-slate-600 font-medium">
                          Parámetro: {alert.parameter} • Rango: {alert.idealRange}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                          isAttention
                            ? 'bg-rose-200 text-rose-900'
                            : isObservation
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-emerald-200 text-emerald-900'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Latest Registered Plants Spotlight */}
          <div 
            id="dashboard-plants-spotlight-card"
            className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Plantas Monitoreadas</h2>
                <p className="text-xs text-slate-600">Fichas individuales con QR e historial</p>
              </div>
              <button
                onClick={() => onNavigate('mis-plantas')}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition"
              >
                <span>Ver todas ({data.plants.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(data.plants || []).slice(0, 4).map((plant) => (
                <div
                  key={plant.id}
                  onClick={() => handlePlantClick(plant)}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-sm bg-slate-50/50 cursor-pointer transition flex items-center gap-3 group"
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                    {plant.initialPhoto ? (
                      <img
                        src={plant.initialPhoto}
                        alt={plant.code}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Sprout className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900">{plant.code}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          plant.status === 'healthy'
                            ? 'bg-emerald-100 text-emerald-900'
                            : plant.status === 'needs_observation'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {plant.status === 'healthy'
                          ? 'Sana'
                          : plant.status === 'needs_observation'
                          ? 'Observación'
                          : 'Atención'}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-700 truncate">{plant.species} • {plant.variety}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">
                      Alt: {plant.currentHeightCm} cm • {plant.currentLeavesCount} hojas
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Pending Calendar Tasks, Water Level Forecast & Forage */}
        <div className="space-y-6">
          {/* Pending Tasks */}
          <div 
            id="dashboard-tasks-card"
            className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-600" />
                <h2 className="text-base font-bold text-slate-900">Tareas Pendientes</h2>
              </div>
              <button
                onClick={() => onNavigate('calendario')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition"
              >
                <span>Calendario</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingTasks.length === 0 ? (
              <p className="text-xs text-slate-600 py-4 text-center">¡Todas las tareas al día!</p>
            ) : (
              <div className="space-y-2.5">
                {pendingTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs"
                  >
                    <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 shrink-0"></div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900">{task.title}</div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Fecha: {task.date} {task.isRecurring && '• Tarea periódica'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Water Consumption & Days Remaining Widget */}
          <div 
            id="dashboard-water-widget"
            className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-cyan-950 via-slate-900 to-slate-950 text-white border border-cyan-900/50 shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">Control del Agua</span>
              </div>
              <button
                onClick={() => onNavigate('agua')}
                className="text-[11px] text-cyan-300 hover:text-white underline"
              >
                Detalle
              </button>
            </div>

            <div className="text-2xl font-black text-white">48.0 Litros</div>
            <div className="text-xs text-cyan-200/70 mt-0.5">Nivel actual en Tanque DWC (Capacidad: 60L)</div>

            <div className="my-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full rounded-full" style={{ width: '80%' }}></div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Consumo diario estimado:</span>
                <span className="font-bold text-white">~3.2 L/día</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Consumo por planta:</span>
                <span className="font-bold text-white">~0.15 L/planta/día</span>
              </div>
              <div className="flex justify-between text-amber-300 font-bold">
                <span>Días hasta nivel mínimo (20L):</span>
                <span>~8.7 días</span>
              </div>
            </div>
          </div>

          {/* Quick Forage Spotlight */}
          <div 
            id="dashboard-forage-widget"
            onClick={() => onNavigate('forraje')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500/50 shadow-xs cursor-pointer transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase">Forraje Verde (FVH)</span>
              <span className="text-xs font-bold text-emerald-800">Lote FOR-001</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">Día 7</span>
              <span className="text-xs text-slate-600 font-medium">14.5 cm de altura</span>
            </div>
            <div className="mt-2 text-xs text-slate-700 flex justify-between">
              <span>Semilla: 1.2 kg maíz</span>
              <span className="font-bold text-emerald-800">Rendimiento: 5.66x</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
