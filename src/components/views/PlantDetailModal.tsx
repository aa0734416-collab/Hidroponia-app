import React, { useState, useEffect } from 'react';
import {
  Sprout,
  X,
  QrCode,
  Camera,
  LineChart,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Printer,
  Download,
  Calendar,
  Layers,
  Plus,
  ArrowRight,
  Droplets,
  Activity,
  Upload,
} from 'lucide-react';
import { Plant, HydroSystem, PlantGrowthRecord, GeminiAnalysisResult } from '../../types';
import { generateQrDataUrl, printQrElement } from '../../utils/qr';
import { api } from '../../services/api';

interface PlantDetailModalProps {
  plant: Plant;
  systems: HydroSystem[];
  onClose: () => void;
  onUpdatePlant: (updated: Plant) => void;
  onAddMeasurementToPlant: (measurementData: {
    heightCm?: number;
    leavesCount?: number;
    rootDevelopment?: string;
    ph?: number;
    ec?: number;
    waterTemp?: number;
    notes?: string;
  }) => void;
}

export const PlantDetailModal: React.FC<PlantDetailModalProps> = ({
  plant,
  systems,
  onClose,
  onUpdatePlant,
  onAddMeasurementToPlant,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'new-record' | 'ai-analysis' | 'harvest'>('history');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // New growth record state
  const [newHeight, setNewHeight] = useState<number>(plant.currentHeightCm || 10);
  const [newLeaves, setNewLeaves] = useState<number>(plant.currentLeavesCount || 6);
  const [newRootDev, setNewRootDev] = useState<any>('vigoroso');
  const [newNotes, setNewNotes] = useState('');
  const [recordPh, setRecordPh] = useState<number>(6.0);
  const [recordEc, setRecordEc] = useState<number>(1.45);
  const [recordWaterTemp, setRecordWaterTemp] = useState<number>(21.2);

  // Gemini state
  const [analyzingWithGemini, setAnalyzingWithGemini] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [uploadedPhotoBase64, setUploadedPhotoBase64] = useState<string | null>(plant.initialPhoto || null);

  // Harvest state
  const [harvestWeightGrams, setHarvestWeightGrams] = useState<number>(180);
  const [harvestNotes, setHarvestNotes] = useState('Cosecha limpia con excelente turgencia radicular');

  const system = systems.find((s) => s.id === plant.systemId);

  // Calculate day number since transplant or sowing
  const startDate = new Date(plant.transplantDate || plant.sowingDate);
  const today = new Date();
  const diffDays = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  useEffect(() => {
    generateQrDataUrl(plant.qrCodeValue || plant.code).then((url) => {
      setQrDataUrl(url);
    });
  }, [plant.code, plant.qrCodeValue]);

  const handlePrintQr = () => {
    if (qrDataUrl) {
      printQrElement(plant.code, `${plant.species} - ${plant.variety}`, qrDataUrl);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${plant.code}.png`;
    a.click();
  };

  const handleSaveGrowthRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = new Date().toISOString();
    const newRecord: PlantGrowthRecord = {
      id: 'pgr-' + Date.now().toString(36),
      date: timestamp.split('T')[0],
      dayNumber: diffDays,
      heightCm: Number(newHeight),
      leavesCount: Number(newLeaves),
      rootDevelopment: newRootDev,
      status: plant.status,
      waterPh: Number(recordPh),
      waterEc: Number(recordEc),
      waterTemp: Number(recordWaterTemp),
      notes: newNotes,
    };

    const updatedHistory = [...(plant.growthHistory || []), newRecord];
    const updatedPlant: Plant = {
      ...plant,
      currentHeightCm: Number(newHeight),
      currentLeavesCount: Number(newLeaves),
      rootDevelopment: newRootDev,
      growthHistory: updatedHistory,
    };

    onUpdatePlant(updatedPlant);
    onAddMeasurementToPlant({
      heightCm: Number(newHeight),
      leavesCount: Number(newLeaves),
      rootDevelopment: newRootDev,
      ph: Number(recordPh),
      ec: Number(recordEc),
      waterTemp: Number(recordWaterTemp),
      notes: newNotes,
    });

    setNewNotes('');
    setActiveTab('history');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUploadedPhotoBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeWithGemini = async () => {
    const photoToAnalyze = uploadedPhotoBase64 || plant.initialPhoto;
    if (!photoToAnalyze) {
      setGeminiError('Por favor seleccione o tome una fotografía de la planta para analizar.');
      return;
    }

    setGeminiError(null);
    setAnalyzingWithGemini(true);

    try {
      const result = await api.analyzePlantWithGemini({
        imageBase64: photoToAnalyze,
        plantCode: plant.code,
        species: plant.species,
        variety: plant.variety,
        systemType: system?.name || 'Hidroponía',
        dayNumber: diffDays,
        currentPh: recordPh,
        currentEc: recordEc,
        currentWaterTemp: recordWaterTemp,
        observations: plant.observations,
      });

      // Update plant with new analysis
      const updatedPlant: Plant = {
        ...plant,
        geminiDiagnosisHistory: [result, ...(plant.geminiDiagnosisHistory || [])],
        status:
          result.healthStatus === 'Saludable'
            ? 'healthy'
            : result.healthStatus === 'Observación'
            ? 'needs_observation'
            : 'needs_attention',
      };

      onUpdatePlant(updatedPlant);
    } catch (err: any) {
      setGeminiError(err.message || 'Error al conectar con el servicio de análisis Gemini');
    } finally {
      setAnalyzingWithGemini(false);
    }
  };

  const handleRegisterHarvest = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Plant = {
      ...plant,
      actualHarvestDate: new Date().toISOString().split('T')[0],
      weightGrams: Number(harvestWeightGrams),
      status: 'harvested',
      observations: (plant.observations ? plant.observations + ' | ' : '') + `Cosechada con ${harvestWeightGrams}g. ${harvestNotes}`,
    };
    onUpdatePlant(updated);
    setActiveTab('history');
  };

  return (
    <div 
      id={`plant-modal-${plant.code}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900 my-4 sm:my-8">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-900/40">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">{plant.code}</h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    plant.status === 'healthy'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : plant.status === 'needs_observation'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : plant.status === 'needs_attention'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {plant.status === 'healthy'
                    ? 'Saludable'
                    : plant.status === 'needs_observation'
                    ? 'Requiere Observación'
                    : plant.status === 'needs_attention'
                    ? 'Requiere Atención'
                    : 'Cosechada'}
                </span>
                <span className="text-xs text-slate-400 font-mono">Día {diffDays}</span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {plant.species} • {plant.variety} ({system?.name || 'Sistema Hidropónico'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              id="btn-open-qr"
              onClick={() => setIsQrModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition"
              title="Ver y descargar código QR físico"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Ver QR</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 overflow-x-auto text-xs font-bold text-slate-600 gap-2 sm:gap-4">
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Historial de Crecimiento ({plant.growthHistory?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('new-record')}
            className={`py-3 px-2 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'new-record'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Medición</span>
          </button>
          <button
            onClick={() => setActiveTab('ai-analysis')}
            className={`py-3 px-2 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ai-analysis'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Diagnóstico IA (Gemini)</span>
          </button>
          <button
            onClick={() => setActiveTab('harvest')}
            className={`py-3 px-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'harvest'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            {plant.status === 'harvested' ? 'Datos de Cosecha' : 'Registrar Cosecha'}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 max-h-[65vh] overflow-y-auto text-xs text-slate-700">
          {/* TAB 1: HISTORY & EVOLUTION */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Plant Meta Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Siembra / Trasplante</span>
                  <span className="font-extrabold text-slate-800">{plant.sowingDate}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cosecha Estimada</span>
                  <span className="font-extrabold text-slate-800">{plant.estimatedHarvestDate || 'En ~25 días'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Altura Actual</span>
                  <span className="font-extrabold text-slate-800 text-sm">{plant.currentHeightCm} cm</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Desarrollo Radicular</span>
                  <span className="font-extrabold text-emerald-600 uppercase">{plant.rootDevelopment}</span>
                </div>
              </div>

              {/* Timeline of Days (Day 1, 7, 14, 21...) */}
              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-emerald-600" />
                  <span>Evolución Temporal del Cultivo</span>
                </h4>

                <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 ml-2">
                  {plant.growthHistory && plant.growthHistory.length > 0 ? (
                    plant.growthHistory.map((rec, idx) => (
                      <div key={rec.id || idx} className="relative">
                        {/* Dot */}
                        <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100"></div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <span className="font-extrabold text-sm text-slate-900">
                              Día {rec.dayNumber} ({rec.date})
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              Raíz: {rec.rootDevelopment}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] py-2 border-y border-slate-200/60 my-2">
                            <div>
                              <span className="text-slate-400 block">Altura</span>
                              <span className="font-bold text-slate-800">{rec.heightCm} cm</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Hojas</span>
                              <span className="font-bold text-slate-800">{rec.leavesCount} unidades</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">pH Agua</span>
                              <span className="font-bold text-slate-800">{rec.waterPh ?? 6.0}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">EC Agua</span>
                              <span className="font-bold text-slate-800">{rec.waterEc ? `${rec.waterEc} mS/cm` : '1.4 mS/cm'}</span>
                            </div>
                          </div>

                          {rec.notes && (
                            <p className="text-xs text-slate-600 italic">"{rec.notes}"</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 py-3">No hay registros cronológicos previos.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NEW MEASUREMENT RECORD */}
          {activeTab === 'new-record' && (
            <form onSubmit={handleSaveGrowthRecord} className="space-y-4 max-w-lg mx-auto py-2">
              <h4 className="font-bold text-sm text-slate-900 mb-1">Registrar Medición y Evolución</h4>
              <p className="text-xs text-slate-500 mb-4">
                Registre la altura actual, número de hojas y parámetros de la solución para esta planta.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Altura de la planta (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={newHeight}
                    onChange={(e) => setNewHeight(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cantidad de hojas</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newLeaves}
                    onChange={(e) => setNewLeaves(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Desarrollo de las Raíces</label>
                <select
                  value={newRootDev}
                  onChange={(e) => setNewRootDev(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="vigoroso">Vigoroso (Blancas, abundantes y densas)</option>
                  <option value="abundante">Abundante (Buen entramado radicular)</option>
                  <option value="moderado">Moderado (Desarrollo normal)</option>
                  <option value="inicial">Inicial (Primeras raicillas)</option>
                  <option value="en_observacion">En Observación (Manchas pardas o poco vigor)</option>
                </select>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700 block mb-2">Parámetros del Agua en el Tanque</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">pH</label>
                    <input
                      type="number"
                      step="0.01"
                      value={recordPh}
                      onChange={(e) => setRecordPh(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">EC (mS/cm)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={recordEc}
                      onChange={(e) => setRecordEc(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Temp. Agua (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={recordWaterTemp}
                      onChange={(e) => setRecordWaterTemp(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Excelente turgencia foliar, sin signos de plagas..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition cursor-pointer"
                >
                  Guardar Medición
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: GEMINI AI PLANT ANALYSIS */}
          {activeTab === 'ai-analysis' && (
            <div className="space-y-6">
              {/* Photo & Trigger Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700 shadow-md">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-28 h-28 rounded-xl bg-slate-800 border-2 border-emerald-500/50 overflow-hidden shrink-0 relative group">
                    {uploadedPhotoBase64 ? (
                      <img
                        src={uploadedPhotoBase64}
                        alt="Planta a analizar"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center text-[10px]">
                        <Camera className="w-6 h-6 mb-1 text-slate-500" />
                        <span>Sin foto</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span>Diagnóstico Fisiológico por Visión IA</span>
                    </div>
                    <h3 className="text-base font-extrabold text-white">
                      Análisis con Gemini 3.8 Flash
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-lg">
                      La IA observa minuciosamente coloración foliar, clorosis, manchas necróticas, turgencia y raíces, entregando recomendaciones agronómicas sin asegurar enfermedades confirmadas solo por foto.
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir otra foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>

                      <button
                        onClick={handleAnalyzeWithGemini}
                        disabled={analyzingWithGemini}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-extrabold shadow-lg shadow-emerald-900/30 transition disabled:opacity-50 cursor-pointer"
                      >
                        {analyzingWithGemini ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Analizando hojas y raíces...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Analizar con Gemini</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {geminiError && (
                  <div className="mt-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{geminiError}</span>
                  </div>
                )}
              </div>

              {/* Diagnosis History Display */}
              {plant.geminiDiagnosisHistory && plant.geminiDiagnosisHistory.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-900">
                    Historial de Diagnósticos ({plant.geminiDiagnosisHistory.length})
                  </h4>

                  {plant.geminiDiagnosisHistory.map((diag, index) => (
                    <div
                      key={index}
                      className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-mono">
                            {new Date(diag.analyzedAt).toLocaleString('es-EC')}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              diag.healthStatus === 'Saludable'
                                ? 'bg-emerald-100 text-emerald-800'
                                : diag.healthStatus === 'Observación'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {diag.healthStatus}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">Gemini 3.8 Flash</span>
                      </div>

                      <div>
                        <span className="font-bold text-slate-900 block text-xs">Condición General:</span>
                        <p className="text-xs text-slate-700 mt-0.5">{diag.overallCondition}</p>
                      </div>

                      {/* Leaf details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <span className="font-bold text-slate-800 block text-[11px] uppercase mb-1">
                            Evaluación Foliar
                          </span>
                          <ul className="space-y-0.5 text-xs text-slate-600">
                            <li>• Coloración: {diag.leafEvaluation.coloration}</li>
                            <li>
                              • Amarillamiento (Clorosis):{' '}
                              <strong className={diag.leafEvaluation.yellowing ? 'text-amber-600' : 'text-emerald-600'}>
                                {diag.leafEvaluation.yellowing ? 'Detectado' : 'No observado'}
                              </strong>
                            </li>
                            <li>
                              • Manchas: {diag.leafEvaluation.spots ? 'Visibles' : 'Ausentes'}
                            </li>
                            <li>
                              • Turgencia: {diag.leafEvaluation.wilting ? 'Marchitez incipiente' : 'Firme y turgente'}
                            </li>
                          </ul>
                        </div>

                        <div>
                          <span className="font-bold text-slate-800 block text-[11px] uppercase mb-1">
                            Evaluación Radicular
                          </span>
                          <p className="text-xs text-slate-600">{diag.rootEvaluation}</p>
                        </div>
                      </div>

                      {/* Recommendations */}
                      {diag.generalRecommendations && diag.generalRecommendations.length > 0 && (
                        <div>
                          <span className="font-bold text-slate-900 block text-xs mb-1">
                            Recomendaciones de Manejo Agronómico:
                          </span>
                          <ul className="space-y-1">
                            {diag.generalRecommendations.map((rec, rIdx) => (
                              <li key={rIdx} className="flex items-start gap-1.5 text-xs text-slate-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Water parameters to check */}
                      {diag.recommendedWaterChecks && diag.recommendedWaterChecks.length > 0 && (
                        <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-100">
                          <span className="font-bold text-cyan-900 block text-[11px] uppercase mb-1">
                            Parámetros del Agua a Calibrar:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {diag.recommendedWaterChecks.map((chk, cIdx) => (
                              <span
                                key={cIdx}
                                className="px-2.5 py-1 rounded-lg bg-cyan-100 text-cyan-900 font-semibold text-xs"
                              >
                                {chk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
                        * {diag.disclaimer}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 border border-dashed border-slate-200 rounded-2xl">
                  Aún no se han ejecutado diagnósticos de visión artificial para esta planta.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HARVEST */}
          {activeTab === 'harvest' && (
            <div className="max-w-lg mx-auto py-3 space-y-4">
              {plant.status === 'harvested' ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                  <div className="flex items-center gap-2 font-black text-base text-emerald-900 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Planta Cosechada Exitosamente</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <strong>Fecha de Cosecha:</strong> {plant.actualHarvestDate}
                    </div>
                    <div>
                      <strong>Peso final cosechado:</strong> {plant.weightGrams} gramos
                    </div>
                    {plant.observations && (
                      <div className="mt-2 text-slate-600 italic">"{plant.observations}"</div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegisterHarvest} className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 mb-1">Registrar Cosecha de la Planta</h4>
                  <p className="text-xs text-slate-500">
                    Al registrar la cosecha se completará el ciclo de vida de {plant.code} y se archivará con sus métricas finales.
                  </p>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Peso Cosechado (Gramos)</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      required
                      value={harvestWeightGrams}
                      onChange={(e) => setHarvestWeightGrams(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Notas y Calidad Final</label>
                    <textarea
                      rows={2}
                      value={harvestNotes}
                      onChange={(e) => setHarvestNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition cursor-pointer"
                    >
                      Confirmar Cosecha
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-400">
            Código QR asignado: <span className="font-mono font-bold text-slate-700">{plant.code}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>

      {/* QR MODAL PREVIEW & PRINT */}
      {isQrModalOpen && (
        <div 
          id="modal-qr-preview"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 text-center text-slate-900 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="font-mono text-xs uppercase font-extrabold text-emerald-600 tracking-wider mb-1">
              Etiqueta de Cultivo
            </div>
            <h3 className="text-2xl font-black">{plant.code}</h3>
            <p className="text-xs text-slate-500 mb-4">{plant.species} • {plant.variety}</p>

            <div className="p-3 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 inline-block mb-4">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt={plant.code} className="w-48 h-48 mx-auto" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400">Generando QR...</div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handlePrintQr}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>

              <button
                onClick={handleDownloadQr}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>Descargar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
