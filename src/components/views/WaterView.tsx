import React, { useState } from 'react';
import {
  Droplets,
  Plus,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Info,
  Layers,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { AppData, WaterRefillRecord, HydroSystem } from '../../types';

interface WaterViewProps {
  data: AppData;
  onSaveRefill: (refill: WaterRefillRecord) => void;
  onUpdateSystemWaterLevel: (systemId: string, newLevel: number) => void;
}

export const WaterView: React.FC<WaterViewProps> = ({
  data,
  onSaveRefill,
  onUpdateSystemWaterLevel,
}) => {
  const [selectedSystemId, setSelectedSystemId] = useState<string>(data.systems[0]?.id || 'sys-dwc-01');
  const [isRefillModalOpen, setIsRefillModalOpen] = useState(false);

  // Refill Form
  const [litersAdded, setLitersAdded] = useState<number>(15);
  const [refillNotes, setRefillNotes] = useState('Recarga con agua desclorada y ajuste de sales');

  // Adjustable estimation parameters
  const [customDailyConsumption, setCustomDailyConsumption] = useState<number>(3.2);

  const systems = Array.isArray(data.systems) ? data.systems : [];
  const plants = Array.isArray(data.plants) ? data.plants : [];
  const waterRefills = Array.isArray(data.waterRefills) ? data.waterRefills : [];

  const currentSystem = systems.find((s) => s.id === selectedSystemId) || systems[0];
  const plantsInSystem = plants.filter((p) => p.systemId === selectedSystemId);
  const systemCapacity = currentSystem?.capacityLiters || 60;
  const currentWaterLevel = currentSystem?.currentWaterLevelLiters || 48;
  const minRecommendedLevel = currentSystem?.minWaterLevelLiters || 20;

  // Calculations
  const waterPct = Math.round((currentWaterLevel / systemCapacity) * 100);
  const plantsCount = plantsInSystem.length || 1;
  const consumptionPerPlant = Number((customDailyConsumption / plantsCount).toFixed(3));
  const availableLitersAboveMin = Math.max(0, currentWaterLevel - minRecommendedLevel);
  const daysUntilMin = Number((availableLitersAboveMin / (customDailyConsumption || 1)).toFixed(1));

  const handleSaveRefill = (e: React.FormEvent) => {
    e.preventDefault();
    const newLevel = Math.min(systemCapacity, currentWaterLevel + Number(litersAdded));
    const newRefill: WaterRefillRecord = {
      id: 'wr-' + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      systemId: selectedSystemId,
      litersAdded: Number(litersAdded),
      previousVolumeLiters: currentWaterLevel,
      newVolumeLiters: newLevel,
      waterSource: 'Agua de vertiente desclorada',
      notes: refillNotes,
    };

    onSaveRefill(newRefill);
    onUpdateSystemWaterLevel(selectedSystemId, newLevel);
    setIsRefillModalOpen(false);
  };

  const refillsForSystem = waterRefills.filter((r) => r.systemId === selectedSystemId);

  return (
    <div id="view-water" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Control del Agua y Balance Hídrico</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoreo de tanques, estimación de evapotranspiración, consumo por planta y proyección de recargas
          </p>
        </div>

        <button
          id="btn-add-refill"
          onClick={() => setIsRefillModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-900/30 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Recarga de Agua</span>
        </button>
      </div>

      {/* System Selector Tab */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        {data.systems.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSystemId(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedSystemId === s.id
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Droplets className="w-4 h-4" />
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      {/* Main Water Tank Card */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 rounded-3xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left: Big Water Level Gauge */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-300">
                Nivel Actual en {currentSystem?.name}
              </span>
              <span className="text-xs font-bold text-slate-300">{waterPct}% capacidad</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black tracking-tight text-white">{currentWaterLevel}</span>
              <span className="text-xl font-bold text-cyan-200">/ {systemCapacity} Litros</span>
            </div>

            {/* Tank Progress Bar */}
            <div className="w-full bg-slate-800 rounded-2xl h-4 p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-xl transition-all duration-500 ${
                  currentWaterLevel <= minRecommendedLevel
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-cyan-500 to-teal-400'
                }`}
                style={{ width: `${Math.min(100, waterPct)}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Mínimo seguro: {minRecommendedLevel} L</span>
              <span>Capacidad total: {systemCapacity} L</span>
            </div>
          </div>

          {/* Right: Evapotranspiration & Days Forecast KPIs */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Consumo Diario</span>
              <span className="text-2xl font-black text-cyan-300 mt-1 block">~{customDailyConsumption} L</span>
              <span className="text-[11px] text-slate-400">por evapotranspiración</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Por Planta</span>
              <span className="text-2xl font-black text-cyan-300 mt-1 block">~{consumptionPerPlant} L</span>
              <span className="text-[11px] text-slate-400">para {plantsCount} plantas</span>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-950/90 border border-cyan-800/60">
              <span className="text-[10px] text-cyan-300 uppercase font-bold block">Días Restantes</span>
              <span className="text-2xl font-black text-amber-400 mt-1 block">~{daysUntilMin} días</span>
              <span className="text-[11px] text-slate-300">antes de llegar a {minRecommendedLevel} L</span>
            </div>
          </div>
        </div>

        {/* Explanatory estimation notice */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Cálculo estimativo agronómico basado en transpiración vegetal y evaporación en clima de La Bocana.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-slate-400">Ajustar consumo L/día:</span>
            <input
              type="number"
              step="0.1"
              value={customDailyConsumption}
              onChange={(e) => setCustomDailyConsumption(Number(e.target.value))}
              className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-white font-bold"
            />
          </div>
        </div>
      </div>

      {/* Refills Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Historial de Recargas de Agua</h3>
            <p className="text-xs text-slate-500">Registro de litros agregados y preparación del agua</p>
          </div>
          <span className="text-xs font-bold text-cyan-700">{refillsForSystem.length} recargas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-500">
              <tr>
                <th className="py-2.5 px-4">Fecha y Hora</th>
                <th className="py-2.5 px-4">Cantidad Agregada</th>
                <th className="py-2.5 px-4">Volumen Anterior</th>
                <th className="py-2.5 px-4">Nuevo Volumen</th>
                <th className="py-2.5 px-4">Origen del Agua</th>
                <th className="py-2.5 px-4">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {refillsForSystem.map((refill) => (
                <tr key={refill.id} className="hover:bg-slate-50">
                  <td className="py-2 px-4 whitespace-nowrap text-slate-900 font-semibold">
                    {new Date(refill.timestamp).toLocaleString('es-EC')}
                  </td>
                  <td className="py-2 px-4 font-black text-cyan-700">+{refill.litersAdded} Litros</td>
                  <td className="py-2 px-4 text-slate-600">{refill.previousVolumeLiters} L</td>
                  <td className="py-2 px-4 font-bold text-slate-900">{refill.newVolumeLiters} L</td>
                  <td className="py-2 px-4 text-slate-700">{refill.waterSource}</td>
                  <td className="py-2 px-4 text-slate-500 italic max-w-xs truncate">{refill.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Refill Modal */}
      {isRefillModalOpen && (
        <div 
          id="modal-water-refill"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900 my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-400">Balance Hídrico</span>
                <h2 className="text-xl font-black mt-0.5">Registrar Recarga de Agua</h2>
              </div>
              <button
                onClick={() => setIsRefillModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRefill} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sistema Hidropónico</label>
                <select
                  value={selectedSystemId}
                  onChange={(e) => setSelectedSystemId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-900"
                >
                  {data.systems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Actual: {s.currentWaterLevelLiters || 48} L / {s.capacityLiters} L)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Litros Agregados</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  value={litersAdded}
                  onChange={(e) => setLitersAdded(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-base text-cyan-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={refillNotes}
                  onChange={(e) => setRefillNotes(e.target.value)}
                  placeholder="Agua reposada 24h para evaporar cloro residual..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRefillModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition cursor-pointer"
                >
                  Confirmar Recarga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
