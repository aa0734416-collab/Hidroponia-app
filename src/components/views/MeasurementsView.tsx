import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Plus,
  Filter,
  Droplets,
  Thermometer,
  Zap,
  Activity,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { AppData, Measurement, SensorType } from '../../types';

interface MeasurementsViewProps {
  data: AppData;
  onSaveMeasurement: (measurement: Measurement) => void;
  isOpenNewModalOnInit?: boolean;
  onCloseInitModal?: () => void;
}

export const MeasurementsView: React.FC<MeasurementsViewProps> = ({
  data,
  onSaveMeasurement,
  isOpenNewModalOnInit = false,
  onCloseInitModal,
}) => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [systemFilter, setSystemFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(isOpenNewModalOnInit);

  // New Measurement form state
  const [selectedSystemId, setSelectedSystemId] = useState(data.systems[0]?.id || 'sys-dwc-01');
  const [selectedSensorType, setSelectedSensorType] = useState<SensorType>('ph');
  const [numericValue, setNumericValue] = useState<number>(6.05);
  const [unit, setUnit] = useState('pH');
  const [notes, setNotes] = useState('');

  const handleSensorTypeChange = (st: SensorType) => {
    setSelectedSensorType(st);
    if (st === 'ph') {
      setNumericValue(6.05);
      setUnit('pH');
    } else if (st === 'ec') {
      setNumericValue(1.48);
      setUnit('mS/cm');
    } else if (st === 'tds') {
      setNumericValue(740);
      setUnit('ppm');
    } else if (st === 'water_temp') {
      setNumericValue(21.4);
      setUnit('°C');
    } else if (st === 'dissolved_oxygen') {
      setNumericValue(7.2);
      setUnit('mg/L');
    } else if (st === 'water_level') {
      setNumericValue(48);
      setUnit('L');
    }
  };

  // Filter measurements based on time and system
  const filteredMeasurements = useMemo(() => {
    const now = new Date().getTime();
    return (data.measurements || []).filter((m) => {
      const mTime = new Date(m.timestamp).getTime();
      const diffHours = (now - mTime) / (1000 * 60 * 60);

      if (timeRange === '24h' && diffHours > 24) return false;
      if (timeRange === '7d' && diffHours > 24 * 7) return false;
      if (timeRange === '30d' && diffHours > 24 * 30) return false;

      if (systemFilter !== 'all' && m.systemId !== systemFilter) return false;
      return true;
    });
  }, [data.measurements, timeRange, systemFilter]);

  // Group measurements by sensor type and sort chronologically
  const sortedMeasurements = useMemo(() => {
    return [...filteredMeasurements].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [filteredMeasurements]);

  const phData = sortedMeasurements.filter((m) => m.sensorType === 'ph');
  const ecData = sortedMeasurements.filter((m) => m.sensorType === 'ec');
  const waterTempData = sortedMeasurements.filter((m) => m.sensorType === 'water_temp');
  const ambientTempData = sortedMeasurements.filter((m) => m.sensorType === 'ambient_temp');
  const doData = sortedMeasurements.filter((m) => m.sensorType === 'dissolved_oxygen');
  const waterLevelData = sortedMeasurements.filter((m) => m.sensorType === 'water_level');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newM: Measurement = {
      id: 'm-' + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      systemId: selectedSystemId,
      sensorType: selectedSensorType,
      value: Number(numericValue),
      unit,
      source: 'manual',
      notes,
    };
    onSaveMeasurement(newM);
    setIsModalOpen(false);
    if (onCloseInitModal) onCloseInitModal();
    setNotes('');
  };

  // SVG Chart Helper
  const renderChart = (
    title: string,
    dataset: Measurement[],
    unitLabel: string,
    idealMin: number,
    idealMax: number,
    secondaryDataset?: Measurement[],
    secondaryLabel?: string
  ) => {
    if (dataset.length === 0) {
      return (
        <div className="h-44 flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          No hay lecturas registradas en este período.
        </div>
      );
    }

    const allValues = [
      ...dataset.map((d) => d.value),
      ...(secondaryDataset ? secondaryDataset.map((d) => d.value) : []),
      idealMin,
      idealMax,
    ];
    const minVal = Math.floor(Math.min(...allValues) * 0.95);
    const maxVal = Math.ceil(Math.max(...allValues) * 1.05);
    const range = maxVal - minVal || 1;

    const width = 500;
    const height = 140;
    const padding = 25;

    const getX = (idx: number, total: number) => {
      if (total <= 1) return width / 2;
      return padding + (idx / (total - 1)) * (width - 2 * padding);
    };

    const getY = (val: number) => {
      return height - padding - ((val - minVal) / range) * (height - 2 * padding);
    };

    const pointsPrimary = dataset
      .map((d, i) => `${getX(i, dataset.length)},${getY(d.value)}`)
      .join(' ');

    const pointsSecondary = secondaryDataset
      ? secondaryDataset
          .map((d, i) => `${getX(i, secondaryDataset.length)},${getY(d.value)}`)
          .join(' ')
      : null;

    const idealTop = getY(idealMax);
    const idealBottom = getY(idealMin);
    const idealHeight = Math.max(2, Math.abs(idealBottom - idealTop));

    const latestValue = dataset[dataset.length - 1]?.value;
    const isWithinRange = latestValue >= idealMin && latestValue <= idealMax;

    return (
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">{title}</h3>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span>
                Rango recomendado: <strong>{idealMin} - {idealMax} {unitLabel}</strong>
              </span>
              <span>•</span>
              <span>Último: <strong className={isWithinRange ? 'text-emerald-700' : 'text-rose-600'}>{latestValue} {unitLabel}</strong></span>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
              isWithinRange ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {isWithinRange ? 'En Rango' : 'Fuera de Límite'}
          </span>
        </div>

        {/* Legend */}
        {secondaryDataset && (
          <div className="flex items-center gap-4 text-[11px] text-slate-600 pt-1">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-emerald-600 inline-block"></span>
              {title}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-amber-500 inline-block"></span>
              {secondaryLabel}
            </span>
          </div>
        )}

        {/* SVG Curve */}
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36">
            {/* Ideal Band Highlight */}
            <rect
              x={padding}
              y={idealTop}
              width={width - 2 * padding}
              height={idealHeight}
              fill="rgba(16, 185, 129, 0.12)"
              rx="4"
            />
            {/* Horizontal ideal lines */}
            <line
              x1={padding}
              y1={idealTop}
              x2={width - padding}
              y2={idealTop}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            <line
              x1={padding}
              y1={idealBottom}
              x2={width - padding}
              y2={idealBottom}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeWidth="1"
            />

            {/* Secondary line if applicable (e.g. ambient temp) */}
            {pointsSecondary && (
              <>
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  points={pointsSecondary}
                />
                {secondaryDataset?.map((d, i) => (
                  <circle
                    key={`sec-${i}`}
                    cx={getX(i, secondaryDataset.length)}
                    cy={getY(d.value)}
                    r="3"
                    fill="#f59e0b"
                  />
                ))}
              </>
            )}

            {/* Primary line */}
            <polyline
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsPrimary}
            />

            {/* Primary dots */}
            {dataset.map((d, i) => {
              const cx = getX(i, dataset.length);
              const cy = getY(d.value);
              const inRange = d.value >= idealMin && d.value <= idealMax;
              return (
                <g key={`pri-${i}`} className="group">
                  <circle
                    cx={cx}
                    cy={cy}
                    r={i === dataset.length - 1 ? 5 : 3.5}
                    fill={inRange ? '#059669' : '#e11d48'}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text
                    x={cx}
                    y={cy - 8}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#334155"
                  >
                    {d.value}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div id="view-measurements" className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Mediciones y Gráficos del Cultivo</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoreo continuo de pH, EC, TDS, oxigenación y contraste térmico (agua vs exterior)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time range switcher */}
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-xs text-xs font-bold text-slate-600">
            <button
              onClick={() => setTimeRange('24h')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeRange === '24h' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              24 Horas
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeRange === '7d' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              7 Días
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeRange === '30d' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              30 Días
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeRange === 'all' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Todo
            </button>
          </div>

          <button
            id="btn-open-add-measurement"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Medición</span>
          </button>
        </div>
      </div>

      {/* System Filter Select */}
      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 text-xs">
        <span className="font-bold text-slate-700">Filtrar por Sistema:</span>
        <select
          value={systemFilter}
          onChange={(e) => setSystemFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">Todos los sistemas hidropónicos</option>
          {data.systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.type})
            </option>
          ))}
        </select>
        <span className="text-slate-400 ml-auto">
          Mostrando {filteredMeasurements.length} mediciones
        </span>
      </div>

      {/* Grid of Interactive Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. pH Evolution Chart */}
        {renderChart('Evolución del pH del Agua', phData, 'pH', 5.6, 6.5)}

        {/* 2. EC Evolution Chart */}
        {renderChart('Evolución de Conductividad Eléctrica (EC)', ecData, 'mS/cm', 1.2, 1.8)}

        {/* 3. Water Temp vs Ambient Temp Chart */}
        {renderChart(
          'Temperatura del Agua vs Ambiente Cultivo',
          waterTempData,
          '°C',
          18.0,
          23.0,
          ambientTempData,
          'Clima Exterior (La Bocana)'
        )}

        {/* 4. Dissolved Oxygen Chart */}
        {renderChart('Nivel de Oxígeno Disuelto (DO)', doData, 'mg/L', 6.0, 9.0)}

        {/* 5. Tank Water Level */}
        {renderChart('Nivel de Agua en el Tanque', waterLevelData, 'L', 20.0, 60.0)}
      </div>

      {/* Detailed Measurements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Registro Cronológico de Mediciones</h3>
            <p className="text-xs text-slate-500">Últimas lecturas manuales y automáticas (ESP32/IoT)</p>
          </div>
          <span className="text-xs font-bold text-emerald-700">
            {filteredMeasurements.length} registros
          </span>
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] font-bold sticky top-0">
              <tr>
                <th className="py-2.5 px-4">Fecha y Hora</th>
                <th className="py-2.5 px-4">Sistema</th>
                <th className="py-2.5 px-4">Sensor / Variable</th>
                <th className="py-2.5 px-4">Valor</th>
                <th className="py-2.5 px-4">Fuente</th>
                <th className="py-2.5 px-4">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {[...filteredMeasurements]
                .reverse()
                .slice(0, 20)
                .map((m) => {
                  const sys = data.systems.find((s) => s.id === m.systemId);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-4 whitespace-nowrap text-slate-900 font-semibold">
                        {new Date(m.timestamp).toLocaleString('es-EC')}
                      </td>
                      <td className="py-2 px-4 text-slate-800">{sys?.name || m.systemId}</td>
                      <td className="py-2 px-4 font-bold uppercase text-[11px] text-slate-700">
                        {m.sensorType}
                      </td>
                      <td className="py-2 px-4">
                        <span className="font-black text-slate-900">{m.value}</span>{' '}
                        <span className="text-slate-500">{m.unit}</span>
                      </td>
                      <td className="py-2 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            m.source === 'esp32'
                              ? 'bg-blue-100 text-blue-800'
                              : m.source === 'arduino'
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {m.source}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-slate-500 italic max-w-xs truncate">
                        {m.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Measurement Modal */}
      {isModalOpen && (
        <div 
          id="modal-new-measurement"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900 my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Toma de Datos</span>
                <h2 className="text-xl font-black mt-0.5">Registrar Nueva Medición</h2>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  if (onCloseInitModal) onCloseInitModal();
                }}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sistema Hidropónico</label>
                <select
                  value={selectedSystemId}
                  onChange={(e) => setSelectedSystemId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {data.systems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Variable o Sensor</label>
                <select
                  value={selectedSensorType}
                  onChange={(e) => handleSensorTypeChange(e.target.value as SensorType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="ph">pH de la solución</option>
                  <option value="ec">Conductividad Eléctrica (EC)</option>
                  <option value="tds">Sólidos Disueltos (TDS)</option>
                  <option value="water_temp">Temperatura del Agua (Sumergible)</option>
                  <option value="dissolved_oxygen">Oxígeno Disuelto (DO)</option>
                  <option value="water_level">Nivel del Tanque (Litros)</option>
                  <option value="ambient_temp">Temperatura Ambiente</option>
                  <option value="ambient_humidity">Humedad Ambiente</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor Medido</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={numericValue}
                    onChange={(e) => setNumericValue(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unidad</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Medición tomada con peachímetro digital calibrado..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    if (onCloseInitModal) onCloseInitModal();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer"
                >
                  Guardar Medición
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
