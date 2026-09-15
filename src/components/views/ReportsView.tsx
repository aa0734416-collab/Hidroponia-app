import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Layers,
  Sprout,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { AppData } from '../../types';

interface ReportsViewProps {
  data: AppData;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ data }) => {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('weekly');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Handle Preset ranges
  const handleSelectPreset = (type: 'daily' | 'weekly' | 'monthly') => {
    setReportType(type);
    const end = new Date().toISOString().split('T')[0];
    setEndDate(end);

    if (type === 'daily') {
      setStartDate(end);
    } else if (type === 'weekly') {
      setStartDate(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
    } else if (type === 'monthly') {
      setStartDate(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
    }
  };

  // Filtered dataset
  const filteredMeasurements = useMemo(() => {
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime() + 86400000;
    return (data.measurements || []).filter((m) => {
      const t = new Date(m.timestamp).getTime();
      return t >= s && t <= e;
    });
  }, [data.measurements, startDate, endDate]);

  const filteredRefills = useMemo(() => {
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime() + 86400000;
    return (data.waterRefills || []).filter((r) => {
      const t = new Date(r.timestamp).getTime();
      return t >= s && t <= e;
    });
  }, [data.waterRefills, startDate, endDate]);

  const filteredAlerts = useMemo(() => {
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime() + 86400000;
    return (data.alerts || []).filter((a) => {
      const t = new Date(a.timestamp).getTime();
      return t >= s && t <= e;
    });
  }, [data.alerts, startDate, endDate]);

  // Statistical calculations
  const phVals = filteredMeasurements.filter((m) => m.sensorType === 'ph').map((m) => m.value);
  const ecVals = filteredMeasurements.filter((m) => m.sensorType === 'ec').map((m) => m.value);
  const tempVals = filteredMeasurements.filter((m) => m.sensorType === 'water_temp').map((m) => m.value);

  const avgPh = phVals.length ? (phVals.reduce((a, b) => a + b, 0) / phVals.length).toFixed(2) : '—';
  const avgEc = ecVals.length ? (ecVals.reduce((a, b) => a + b, 0) / ecVals.length).toFixed(2) : '—';
  const avgTemp = tempVals.length ? (tempVals.reduce((a, b) => a + b, 0) / tempVals.length).toFixed(1) : '—';
  const totalWaterAdded = filteredRefills.reduce((acc, r) => acc + r.litersAdded, 0);

  // CSV Export
  const handleExportCsv = () => {
    const headers = ['Fecha_Hora', 'Sistema', 'Variable', 'Valor', 'Unidad', 'Fuente', 'Observaciones'];
    const rows = filteredMeasurements.map((m) => [
      new Date(m.timestamp).toLocaleString('es-EC'),
      m.systemId,
      m.sensorType,
      m.value,
      m.unit,
      m.source,
      `"${m.notes || ''}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HydroControl_Reporte_${startDate}_a_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Print / PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="view-reports" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Informes y Exportación de Datos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generación de reportes agronómicos para auditoría, trazabilidad y descarga en Excel/CSV o PDF
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-csv"
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Descargar Excel / CSV</span>
          </button>

          <button
            id="btn-print-pdf"
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-900/30 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Guardar PDF</span>
          </button>
        </div>
      </div>

      {/* Preset & Date Controls */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-1.5 text-xs font-bold w-full md:w-auto">
          <button
            onClick={() => handleSelectPreset('daily')}
            className={`px-3 py-1.5 rounded-xl transition ${
              reportType === 'daily' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Diario (Hoy)
          </button>
          <button
            onClick={() => handleSelectPreset('weekly')}
            className={`px-3 py-1.5 rounded-xl transition ${
              reportType === 'weekly' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semanal (7d)
          </button>
          <button
            onClick={() => handleSelectPreset('monthly')}
            className={`px-3 py-1.5 rounded-xl transition ${
              reportType === 'monthly' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Mensual (30d)
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs w-full md:w-auto">
          <span className="text-slate-500 font-semibold">Desde:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setReportType('custom');
            }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 font-medium"
          />
          <span className="text-slate-500 font-semibold">Hasta:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setReportType('custom');
            }}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 font-medium"
          />
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div id="printable-report-card" className="bg-white rounded-3xl border border-slate-200 p-8 shadow-md space-y-6">
        {/* Document Letterhead */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-900 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900">HydroControl</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                Informe Agronómico Oficial
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ubicación: <strong>La Bocana, Cantón Piñas, Provincia de El Oro, Ecuador</strong>
            </p>
          </div>

          <div className="text-right text-xs text-slate-500">
            <div>Período: <strong className="text-slate-900">{startDate} al {endDate}</strong></div>
            <div>Fecha de emisión: {new Date().toLocaleDateString('es-EC')}</div>
            <div>Usuario: <strong className="text-slate-900">{data.user?.fullName || 'Operador Responsable'}</strong></div>
          </div>
        </div>

        {/* Executive Metrics KPI Summary */}
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-3">
            1. Resumen Ejecutivo del Cultivo
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Plantas Activas</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {data.plants.filter((p) => p.status !== 'harvested').length}
              </span>
              <span className="text-[11px] text-emerald-600 font-bold">
                {data.plants.filter((p) => p.status === 'healthy').length} en estado óptimo
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">pH Promedio</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">{avgPh}</span>
              <span className="text-[11px] text-slate-400">Rango ideal: 5.6 - 6.5</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">EC Promedio</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">{avgEc} mS/cm</span>
              <span className="text-[11px] text-slate-400">Rango ideal: 1.2 - 1.8</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Agua Recargada</span>
              <span className="text-2xl font-black text-cyan-700 mt-1 block">{totalWaterAdded} L</span>
              <span className="text-[11px] text-slate-400">{filteredRefills.length} recargas</span>
            </div>
          </div>
        </div>

        {/* Systems Status in the report */}
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-3">
            2. Estado de Sistemas Hidropónicos
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 uppercase text-[10px] font-bold text-slate-600">
                <tr>
                  <th className="py-2.5 px-4">Sistema</th>
                  <th className="py-2.5 px-4">Tipo</th>
                  <th className="py-2.5 px-4">Capacidad</th>
                  <th className="py-2.5 px-4">Nivel Actual</th>
                  <th className="py-2.5 px-4">Plantas</th>
                  <th className="py-2.5 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {data.systems.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5 px-4 font-black text-slate-900">{s.name}</td>
                    <td className="py-2.5 px-4 uppercase text-[11px]">{s.type}</td>
                    <td className="py-2.5 px-4">{s.capacityLiters} L</td>
                    <td className="py-2.5 px-4 font-bold text-cyan-700">{s.currentWaterLevelLiters || 48} L</td>
                    <td className="py-2.5 px-4">{s.currentPlantsCount} / {s.maxCapacity}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {s.status === 'active' ? 'Operativo' : s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alert Log Summary */}
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 mb-3">
            3. Registro de Incidencias y Alertas ({filteredAlerts.length})
          </h3>

          {filteredAlerts.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No se registraron alertas críticas durante este período.</p>
          ) : (
            <div className="space-y-2">
              {filteredAlerts.map((a) => (
                <div
                  key={a.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900">{a.message}</span>
                    <div className="text-slate-500 text-[11px]">
                      Acción tomada: {a.suggestedAction}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0">
                    {a.acknowledged ? 'Atendida' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Signatures for physical/pdf print */}
        <div className="pt-10 grid grid-cols-2 gap-12 text-center text-xs text-slate-600 border-t border-slate-200 mt-8">
          <div>
            <div className="w-48 mx-auto border-b border-slate-400 mb-1"></div>
            <span className="font-bold text-slate-800 block">Firma del Operador</span>
            <span className="text-[11px] text-slate-400">{data.user?.fullName || 'Responsable de Cultivo'}</span>
          </div>
          <div>
            <div className="w-48 mx-auto border-b border-slate-400 mb-1"></div>
            <span className="font-bold text-slate-800 block">Certificación de Parámetros</span>
            <span className="text-[11px] text-slate-400">Sistema HydroControl Automatizado</span>
          </div>
        </div>
      </div>
    </div>
  );
};
