import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { AppData, MaintenanceEquipment, MaintenanceLog } from '../../types';

interface MaintenanceViewProps {
  data: AppData;
  onUpdateEquipment: (equipment: MaintenanceEquipment) => void;
  onSaveMaintenanceLog: (log: MaintenanceLog) => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  data,
  onUpdateEquipment,
  onSaveMaintenanceLog,
}) => {
  const [selectedEquipment, setSelectedEquipment] = useState<MaintenanceEquipment | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Form
  const [actionDone, setActionDone] = useState('');
  const [newStatus, setNewStatus] = useState<any>('operational');
  const [performedBy, setPerformedBy] = useState('Operador');
  const [notes, setNotes] = useState('');
  const [nextDate, setNextDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  const handleOpenLogModal = (eq: MaintenanceEquipment) => {
    setSelectedEquipment(eq);
    setActionDone(`Mantenimiento preventivo de ${eq.name}`);
    setNewStatus(eq.status);
    setIsLogModalOpen(true);
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipment) return;

    const today = new Date().toISOString().split('T')[0];
    const newLog: MaintenanceLog = {
      id: 'mlog-' + Date.now().toString(36),
      equipmentId: selectedEquipment.id,
      equipmentItem: selectedEquipment.name,
      systemId: selectedEquipment.systemId,
      date: today,
      performedAt: new Date().toISOString(),
      action: actionDone,
      actionType: 'limpieza',
      performedBy,
      technician: performedBy,
      nextScheduledDate: nextDate,
      status: 'completed',
      notes,
    };

    const updatedEq: MaintenanceEquipment = {
      ...selectedEquipment,
      status: newStatus,
      lastMaintenanceDate: today,
      nextMaintenanceDate: nextDate,
    };

    onSaveMaintenanceLog(newLog);
    onUpdateEquipment(updatedEq);
    setIsLogModalOpen(false);
  };

  return (
    <div id="view-maintenance" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Mantenimiento de Equipos e Instalaciones</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervisión periódica de bombas sumergibles, aireadores, piedras difusoras, mangueras y sondas
          </p>
        </div>
      </div>

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.equipments.map((eq) => {
          const sys = data.systems.find((s) => s.id === eq.systemId);
          const isNeedsCheck = eq.status === 'needs_review';
          const isNeedsReplace = eq.status === 'needs_replacement';

          return (
            <div
              key={eq.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {eq.type.replace('_', ' ')}
                  </span>

                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      eq.status === 'operational'
                        ? 'bg-emerald-100 text-emerald-800'
                        : eq.status === 'needs_review'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {eq.status === 'operational'
                      ? 'Funcionando'
                      : eq.status === 'needs_review'
                      ? 'Revisión'
                      : 'Reemplazo'}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900">{eq.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{sys?.name || 'Sistema Hidropónico'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Último servicio:</span>
                  <span className="font-semibold text-slate-800">{eq.lastMaintenanceDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Próximo servicio:</span>
                  <span className="font-bold text-emerald-700">{eq.nextMaintenanceDate}</span>
                </div>
                {eq.notes && (
                  <div className="pt-1 text-[11px] text-slate-600 italic border-t border-slate-200/60">
                    {eq.notes}
                  </div>
                )}
              </div>

              <button
                id={`btn-maint-log-${eq.id}`}
                onClick={() => handleOpenLogModal(eq)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Registrar Mantenimiento</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Maintenance Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Bitácora de Servicios Realizados</h3>
            <p className="text-xs text-slate-500">Historial completo de intervenciones a equipos</p>
          </div>
          <span className="text-xs font-bold text-slate-700">{data.maintenanceLogs.length} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-500">
              <tr>
                <th className="py-2.5 px-4">Fecha</th>
                <th className="py-2.5 px-4">Equipo</th>
                <th className="py-2.5 px-4">Acción Realizada</th>
                <th className="py-2.5 px-4">Responsable</th>
                <th className="py-2.5 px-4">Detalles / Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {data.maintenanceLogs.map((mlog) => {
                const eq = data.equipments.find((e) => e.id === mlog.equipmentId);

                return (
                  <tr key={mlog.id} className="hover:bg-slate-50">
                    <td className="py-2 px-4 whitespace-nowrap font-bold text-slate-900">{mlog.date}</td>
                    <td className="py-2 px-4 font-semibold text-slate-800">{eq?.name || mlog.equipmentId}</td>
                    <td className="py-2 px-4 text-emerald-800 font-bold">{mlog.action}</td>
                    <td className="py-2 px-4 text-slate-600">{mlog.performedBy}</td>
                    <td className="py-2 px-4 text-slate-500 italic max-w-xs truncate">{mlog.notes || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maintenance Log Modal */}
      {isLogModalOpen && selectedEquipment && (
        <div 
          id="modal-record-maintenance"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900 my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  {selectedEquipment.name}
                </span>
                <h2 className="text-xl font-black mt-0.5">Registrar Mantenimiento</h2>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Acción Realizada</label>
                <input
                  type="text"
                  required
                  value={actionDone}
                  onChange={(e) => setActionDone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nuevo Estado</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                  >
                    <option value="operational">Funcionando correctamente</option>
                    <option value="needs_review">Requiere revisión</option>
                    <option value="needs_replacement">Requiere cambio</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Próxima Fecha Recomendada</label>
                  <input
                    type="date"
                    required
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Responsable</label>
                <input
                  type="text"
                  required
                  value={performedBy}
                  onChange={(e) => setPerformedBy(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Se enjuagó la carcasa y se removieron incrustaciones minerales..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer"
                >
                  Guardar Mantenimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
