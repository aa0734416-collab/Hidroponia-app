import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Check,
  Filter,
  Sparkles,
  Info,
} from 'lucide-react';
import { AppData, AlertItem, AlertLevel } from '../../types';

interface AlertsViewProps {
  data: AppData;
  onAcknowledgeAlert: (alertId: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  data,
  onAcknowledgeAlert,
}) => {
  const [levelFilter, setLevelFilter] = useState<'all' | 'needs_attention' | 'observation' | 'acknowledged'>('all');

  const alerts = Array.isArray(data.alerts) ? data.alerts : [];

  const filteredAlerts = alerts.filter((a) => {
    if (levelFilter === 'acknowledged') return a.acknowledged;
    if (a.acknowledged && levelFilter !== 'all') return false;
    if (levelFilter === 'needs_attention') return a.level === 'needs_attention' && !a.acknowledged;
    if (levelFilter === 'observation') return a.level === 'observation' && !a.acknowledged;
    return true;
  });

  const activeAttention = alerts.filter((a) => a.level === 'needs_attention' && !a.acknowledged).length;
  const activeObservation = alerts.filter((a) => a.level === 'observation' && !a.acknowledged).length;

  return (
    <div id="view-alerts" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Centro de Alertas y Diagnóstico Activo</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Clasificación tripartita (Normal, Observación, Atención) con acciones correctivas recomendadas
          </p>
        </div>

        {/* Global summary badge */}
        <div className="flex items-center gap-2">
          {activeAttention > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
              <span>{activeAttention} atención urgente</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Sistemas en estado óptimo</span>
            </div>
          )}
        </div>
      </div>

      {/* 3 Level Hierarchy Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">Nivel 1</span>
            <div className="font-extrabold text-sm text-slate-900">Normal</div>
            <div className="text-[11px] text-slate-500">Parámetros dentro del rango ideal</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block">Nivel 2</span>
            <div className="font-extrabold text-sm text-slate-900">En Observación ({activeObservation})</div>
            <div className="text-[11px] text-slate-500">Cercanos al límite de tolerancia</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 block">Nivel 3</span>
            <div className="font-extrabold text-sm text-slate-900">Requiere Atención ({activeAttention})</div>
            <div className="text-[11px] text-slate-500">Fuera de rango con riesgo vegetal</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded-2xl border border-slate-200 text-xs font-bold shadow-xs">
        <button
          onClick={() => setLevelFilter('all')}
          className={`px-3 py-1.5 rounded-xl transition ${
            levelFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Todas las Alertas ({alerts.length})
        </button>
        <button
          onClick={() => setLevelFilter('needs_attention')}
          className={`px-3 py-1.5 rounded-xl transition ${
            levelFilter === 'needs_attention' ? 'bg-rose-600 text-white' : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          Requiere Atención ({activeAttention})
        </button>
        <button
          onClick={() => setLevelFilter('observation')}
          className={`px-3 py-1.5 rounded-xl transition ${
            levelFilter === 'observation' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-50'
          }`}
        >
          En Observación ({activeObservation})
        </button>
        <button
          onClick={() => setLevelFilter('acknowledged')}
          className={`px-3 py-1.5 rounded-xl transition ${
            levelFilter === 'acknowledged' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          Atendidas / Resueltas ({data.alerts.filter((a) => a.acknowledged).length})
        </button>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">Sin alertas pendientes en esta categoría</h3>
            <p className="text-xs text-slate-400 mt-1">Todos los sistemas hidropónicos operan correctamente.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isAttention = alert.level === 'needs_attention';
            const isObs = alert.level === 'observation';
            const sys = data.systems.find((s) => s.id === alert.systemId);

            return (
              <div
                key={alert.id}
                id={`alert-card-${alert.id}`}
                className={`p-5 rounded-2xl border transition shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                  alert.acknowledged
                    ? 'bg-slate-50/70 border-slate-200 opacity-60'
                    : isAttention
                    ? 'bg-white border-rose-300 shadow-rose-500/5'
                    : 'bg-white border-amber-300 shadow-amber-500/5'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        alert.acknowledged
                          ? 'bg-slate-200 text-slate-700'
                          : isAttention
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {alert.acknowledged
                        ? 'Atendida'
                        : isAttention
                        ? 'Requiere Atención'
                        : 'En Observación'}
                    </span>

                    <span className="font-bold text-xs text-slate-500">
                      {sys?.name || 'Sistema Hidropónico'}
                    </span>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(alert.timestamp).toLocaleString('es-EC')}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900">{alert.message}</h3>

                  {/* Value vs Ideal Range chips */}
                  <div className="flex items-center gap-3 text-xs flex-wrap">
                    <span className="p-1.5 rounded-lg bg-slate-100 font-medium text-slate-700">
                      Variable: <strong className="uppercase">{alert.variable}</strong>
                    </span>
                    <span className="p-1.5 rounded-lg bg-rose-50 text-rose-800 font-semibold border border-rose-200">
                      Valor Actual: <strong>{alert.currentValue}</strong>
                    </span>
                    <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                      Rango Recomendado: <strong>{alert.idealRange}</strong>
                    </span>
                  </div>

                  {/* Suggested Action */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900">Acción Correctiva Sugerida: </span>
                      <span className="text-slate-700">{alert.suggestedAction}</span>
                    </div>
                  </div>
                </div>

                {/* Acknowledge Button */}
                <div className="shrink-0 self-end md:self-center">
                  {alert.acknowledged ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <Check className="w-4 h-4" />
                      <span>Resuelta</span>
                    </span>
                  ) : (
                    <button
                      id={`btn-ack-${alert.id}`}
                      onClick={() => onAcknowledgeAlert(alert.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Marcar como Atendida</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
