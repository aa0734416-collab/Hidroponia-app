import React, { useState } from 'react';
import {
  Wheat,
  Plus,
  QrCode,
  Calendar,
  TrendingUp,
  Droplets,
  Scale,
  CheckCircle2,
  Printer,
  X,
  LineChart,
} from 'lucide-react';
import { AppData, ForageLot, ForageGrowthLog } from '../../types';
import { generateQrDataUrl, printQrElement } from '../../utils/qr';

interface ForageViewProps {
  data: AppData;
  onSaveLot: (lot: ForageLot) => void;
  selectedLotOnInit?: ForageLot | null;
  onClearSelectedLotOnInit?: () => void;
}

export const ForageView: React.FC<ForageViewProps> = ({
  data,
  onSaveLot,
  selectedLotOnInit,
  onClearSelectedLotOnInit,
}) => {
  const [selectedLot, setSelectedLot] = useState<ForageLot | null>(selectedLotOnInit || data.forageLots[0] || null);
  const [isNewLotModalOpen, setIsNewLotModalOpen] = useState(false);
  const [isDailyLogModalOpen, setIsDailyLogModalOpen] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);

  // New Lot form
  const [lotCode, setLotCode] = useState(`FOR-00${data.forageLots.length + 1}`);
  const [seedType, setSeedType] = useState('Maíz Criollo Amarillo');
  const [initialSeedWeightKg, setInitialSeedWeightKg] = useState<number>(1.2);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [germinationDate, setGerminationDate] = useState(new Date().toISOString().split('T')[0]);
  const [trayIdentifier, setTrayIdentifier] = useState('Charola Forrajera Plástica 01');
  const [notes, setNotes] = useState('');

  // Daily log form
  const [logHeight, setLogHeight] = useState<number>(14);
  const [logWeight, setLogWeight] = useState<number>(5.5);
  const [logWaterings, setLogWaterings] = useState<number>(4);
  const [logNotes, setLogNotes] = useState('');

  const calculateDays = (start: string) => {
    const s = new Date(start);
    const now = new Date();
    return Math.max(1, Math.floor((now.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const handleOpenQr = async (lot: ForageLot) => {
    const url = await generateQrDataUrl(lot.qrCodeValue || lot.lotCode);
    setQrPreviewUrl(url);
  };

  const handlePrintQr = (lot: ForageLot) => {
    if (qrPreviewUrl) {
      printQrElement(lot.lotCode, `Forraje Verde - ${lot.seedType}`, qrPreviewUrl);
    }
  };

  const handleCreateLot = (e: React.FormEvent) => {
    e.preventDefault();
    const newLot: ForageLot = {
      id: 'for-' + Date.now().toString(36),
      lotCode,
      seedType,
      initialSeedWeightKg: Number(initialSeedWeightKg),
      startDate,
      germinationDate,
      trayIdentifier,
      dailyWateringsCount: 4,
      ambientTemp: 23.5,
      ambientHumidity: 80,
      waterPh: 6.1,
      waterEc: 1.1,
      currentHeightCm: 1.5,
      currentWeightKg: Number(initialSeedWeightKg) * 1.3,
      yieldMultiplier: 1.3,
      status: 'growing',
      qrCodeValue: lotCode,
      photos: ['https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?auto=format&fit=crop&w=600&q=80'],
      notes,
      growthLogs: [
        {
          id: 'fgl-1',
          dayNumber: 1,
          date: startDate,
          heightCm: 0,
          weightKg: Number(initialSeedWeightKg),
          wateringsApplied: 4,
          notes: 'Inicio de siembra e hidratación de semillas.',
        },
      ],
    };

    onSaveLot(newLot);
    setSelectedLot(newLot);
    setIsNewLotModalOpen(false);
  };

  const handleSaveDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot) return;

    const currentDay = calculateDays(selectedLot.startDate);
    const newLog: ForageGrowthLog = {
      id: 'fgl-' + Date.now().toString(36),
      dayNumber: currentDay,
      date: new Date().toISOString().split('T')[0],
      heightCm: Number(logHeight),
      weightKg: Number(logWeight),
      wateringsApplied: Number(logWaterings),
      notes: logNotes,
    };

    const yieldRatio = Number((Number(logWeight) / selectedLot.initialSeedWeightKg).toFixed(2));

    const updatedLot: ForageLot = {
      ...selectedLot,
      currentHeightCm: Number(logHeight),
      currentWeightKg: Number(logWeight),
      yieldMultiplier: yieldRatio,
      dailyWateringsCount: Number(logWaterings),
      growthLogs: [...(selectedLot.growthLogs || []), newLog],
    };

    onSaveLot(updatedLot);
    setSelectedLot(updatedLot);
    setIsDailyLogModalOpen(false);
    setLogNotes('');
  };

  return (
    <div id="view-forage" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Forraje Verde Hidropónico (FVH)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Seguimiento de charolas, contador día a día, control de riegos y cálculo del factor de rendimiento
          </p>
        </div>

        <button
          id="btn-add-forage-lot"
          onClick={() => {
            setLotCode(`FOR-00${data.forageLots.length + 1}`);
            setIsNewLotModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Iniciar Nuevo Lote FVH</span>
        </button>
      </div>

      {/* Forage Lots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.forageLots.map((lot) => {
          const dayNumber = calculateDays(lot.startDate);
          const isSelected = selectedLot?.id === lot.id;

          return (
            <div
              key={lot.id}
              onClick={() => setSelectedLot(lot)}
              className={`bg-white rounded-2xl border transition p-5 shadow-xs cursor-pointer flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-slate-900">{lot.lotCode}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenQr(lot);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                      title="Ver código QR de la charola"
                    >
                      <QrCode className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-emerald-100 text-emerald-800">
                    Día {dayNumber}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900">{lot.seedType}</h3>
                <div className="text-xs text-slate-500 mt-0.5">{lot.trayIdentifier}</div>
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Semilla</span>
                  <span className="font-black text-slate-800">{lot.initialSeedWeightKg} kg</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Peso Actual</span>
                  <span className="font-black text-slate-800">
                    {lot.currentWeightKg || (lot.initialSeedWeightKg * (lot.yieldMultiplier || 1)).toFixed(1)} kg
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Rendimiento</span>
                  <span className="font-black text-emerald-600">{lot.yieldMultiplier}x</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Altura de biomasa:</span>
                  <span className="font-bold text-slate-900">{lot.currentHeightCm} cm</span>
                </div>
                <div className="flex justify-between">
                  <span>Riegos diarios:</span>
                  <span className="font-bold text-slate-900">{lot.dailyWateringsCount} nebulizaciones</span>
                </div>
                <div className="flex justify-between">
                  <span>Fecha de inicio:</span>
                  <span className="font-semibold text-slate-700">{lot.startDate}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                <span>Ver registro diario ({lot.growthLogs?.length || 1} días)</span>
                <span>→</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Lot Full Detail & Timeline */}
      {selectedLot && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-lg text-slate-900">{selectedLot.lotCode}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-emerald-600 text-white">
                  Día {calculateDays(selectedLot.startDate)} de cultivo
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">{selectedLot.seedType}</h2>
              <p className="text-xs text-slate-500">{selectedLot.trayIdentifier} • Inicio: {selectedLot.startDate}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenQr(selectedLot)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>QR de Charola</span>
              </button>

              <button
                id="btn-add-daily-log"
                onClick={() => setIsDailyLogModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Día Actual</span>
              </button>
            </div>
          </div>

          {/* Yield Formula Highlight Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 to-slate-900 text-white border border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block">
                Fórmula de Rendimiento Automática
              </span>
              <div className="text-lg font-black mt-0.5">
                Factor de Conversión: <span className="text-emerald-400">{selectedLot.yieldMultiplier}x</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Rendimiento = {selectedLot.currentWeightKg || (selectedLot.initialSeedWeightKg * (selectedLot.yieldMultiplier || 1)).toFixed(1)} kg biomasa / {selectedLot.initialSeedWeightKg} kg semilla
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs text-slate-400 block">Biomasa cosechable</span>
              <span className="text-2xl font-black text-white">
                {(Number(selectedLot.initialSeedWeightKg) * (selectedLot.yieldMultiplier || 1)).toFixed(2)} kg
              </span>
            </div>
          </div>

          {/* Chronological Table of Days */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <LineChart className="w-4 h-4 text-emerald-600" />
              <span>Evolución Día por Día del Forraje</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500">
                  <tr>
                    <th className="py-2.5 px-4">Día</th>
                    <th className="py-2.5 px-4">Fecha</th>
                    <th className="py-2.5 px-4">Altura (cm)</th>
                    <th className="py-2.5 px-4">Peso Estimado</th>
                    <th className="py-2.5 px-4">Riegos Aplicados</th>
                    <th className="py-2.5 px-4">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {selectedLot.growthLogs?.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2 px-4 font-black text-slate-900">Día {log.dayNumber}</td>
                      <td className="py-2 px-4 text-slate-600">{log.date}</td>
                      <td className="py-2 px-4 font-bold text-emerald-700">{log.heightCm} cm</td>
                      <td className="py-2 px-4 font-bold text-slate-800">{log.weightKg} kg</td>
                      <td className="py-2 px-4 text-slate-600">{log.wateringsApplied} veces/día</td>
                      <td className="py-2 px-4 text-slate-500 italic">{log.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal for Forage */}
      {qrPreviewUrl && selectedLot && (
        <div 
          id="modal-forage-qr"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 text-center text-slate-900 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setQrPreviewUrl(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="font-mono text-xs uppercase font-extrabold text-emerald-600 tracking-wider mb-1">
              Etiqueta de Charola FVH
            </div>
            <h3 className="text-2xl font-black">{selectedLot.lotCode}</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedLot.seedType}</p>

            <div className="p-3 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 inline-block mb-4">
              <img src={qrPreviewUrl} alt={selectedLot.lotCode} className="w-48 h-48 mx-auto" />
            </div>

            <button
              onClick={() => handlePrintQr(selectedLot)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Etiqueta para Charola</span>
            </button>
          </div>
        </div>
      )}

      {/* New Lot Modal */}
      {isNewLotModalOpen && (
        <div 
          id="modal-new-forage-lot"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900 my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Nuevo Lote</span>
                <h2 className="text-xl font-black mt-0.5">Iniciar Lote de Forraje (FVH)</h2>
              </div>
              <button
                onClick={() => setIsNewLotModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLot} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código del Lote</label>
                  <input
                    type="text"
                    required
                    value={lotCode}
                    onChange={(e) => setLotCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semilla Utilizada</label>
                  <input
                    type="text"
                    required
                    value={seedType}
                    onChange={(e) => setSeedType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peso Semilla Inicial (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={initialSeedWeightKg}
                    onChange={(e) => setInitialSeedWeightKg(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Charola / Nivel</label>
                  <input
                    type="text"
                    required
                    value={trayIdentifier}
                    onChange={(e) => setTrayIdentifier(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha Germinación</label>
                  <input
                    type="date"
                    required
                    value={germinationDate}
                    onChange={(e) => setGerminationDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Semilla desinfectada previamente en solución de cal/cloro..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewLotModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer"
                >
                  Iniciar Lote y Generar QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Daily Log Modal */}
      {isDailyLogModalOpen && selectedLot && (
        <div 
          id="modal-daily-forage-log"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900 my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  Registro Diario ({selectedLot.lotCode})
                </span>
                <h2 className="text-xl font-black mt-0.5">Día {calculateDays(selectedLot.startDate)}</h2>
              </div>
              <button
                onClick={() => setIsDailyLogModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDailyLog} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Altura de Biomasa (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={logHeight}
                    onChange={(e) => setLogHeight(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Peso Actual Charola (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={logWeight}
                    onChange={(e) => setLogWeight(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Riegos / Nebulizaciones Hoy</label>
                <input
                  type="number"
                  required
                  value={logWaterings}
                  onChange={(e) => setLogWaterings(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="Buen colchón radicular blanco sin presencia de moho..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDailyLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer"
                >
                  Guardar Día
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
