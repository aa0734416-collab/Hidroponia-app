import React, { useState } from 'react';
import {
  Camera,
  Sparkles,
  Upload,
  Sprout,
  Layers,
  Wheat,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Info,
  Clock,
} from 'lucide-react';
import { AppData, PhotoRecord, Plant, GeminiAnalysisResult } from '../../types';
import { api } from '../../services/api';

interface PhotosAiViewProps {
  data: AppData;
  onSavePhoto: (photo: PhotoRecord) => void;
  onUpdatePlantDiagnosis: (plantId: string, diagnosis: GeminiAnalysisResult) => void;
}

export const PhotosAiView: React.FC<PhotosAiViewProps> = ({
  data,
  onSavePhoto,
  onUpdatePlantDiagnosis,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoRecord | null>(data.photos[0] || null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Upload Form state
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string>('');
  const [entityType, setEntityType] = useState<'plant' | 'system' | 'forage'>('plant');
  const [selectedEntityId, setSelectedEntityId] = useState<string>(data.plants[0]?.id || '');
  const [caption, setCaption] = useState('');
  const [requestAiImmediate, setRequestAiImmediate] = useState(true);

  // Analysis running state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedImageBase64) {
      setAnalysisError('Debe seleccionar o tomar una fotografía.');
      return;
    }

    setAnalysisError(null);
    setAnalyzing(true);

    const timestamp = new Date().toISOString();
    const photoId = 'ph-' + Date.now().toString(36);

    let geminiResult: GeminiAnalysisResult | undefined = undefined;

    if (requestAiImmediate) {
      try {
        const plant = entityType === 'plant' ? data.plants.find((p) => p.id === selectedEntityId) : null;
        const system = data.systems.find((s) => s.id === (plant?.systemId || selectedEntityId));

        geminiResult = await api.analyzePlantWithGemini({
          imageBase64: uploadedImageBase64,
          plantCode: plant?.code || 'SISTEMA-HIDRO',
          species: plant?.species || 'Cultivo hidropónico',
          variety: plant?.variety || 'Estándar',
          systemType: system?.name || 'Hidroponía',
          observations: caption,
        });

        if (plant) {
          onUpdatePlantDiagnosis(plant.id, geminiResult);
        }
      } catch (err: any) {
        console.warn('Gemini analysis failed or fell back:', err);
      }
    }

    const newPhotoRecord: PhotoRecord = {
      id: photoId,
      url: uploadedImageBase64,
      capturedAt: timestamp,
      associatedEntityType: entityType,
      associatedEntityId: selectedEntityId,
      caption: caption || 'Registro fotográfico de inspección',
      geminiAnalysis: geminiResult,
    };

    onSavePhoto(newPhotoRecord);
    setSelectedPhoto(newPhotoRecord);
    setIsUploadModalOpen(false);
    setAnalyzing(false);
    setUploadedImageBase64('');
    setCaption('');
  };

  const handleRunAnalysisForSelected = async () => {
    if (!selectedPhoto) return;
    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const plant =
        selectedPhoto.associatedEntityType === 'plant'
          ? data.plants.find((p) => p.id === selectedPhoto.associatedEntityId)
          : null;
      const system = data.systems.find((s) => s.id === (plant?.systemId || selectedPhoto.associatedEntityId));

      const result = await api.analyzePlantWithGemini({
        imageBase64: selectedPhoto.url,
        plantCode: plant?.code || 'CULTIVO-PIÑAS',
        species: plant?.species || 'Especie hidropónica',
        variety: plant?.variety || 'Comercial',
        systemType: system?.name || 'Hidroponía',
        observations: selectedPhoto.caption,
      });

      const updatedPhoto: PhotoRecord = {
        ...selectedPhoto,
        geminiAnalysis: result,
      };

      onSavePhoto(updatedPhoto);
      setSelectedPhoto(updatedPhoto);

      if (plant) {
        onUpdatePlantDiagnosis(plant.id, result);
      }
    } catch (err: any) {
      setAnalysisError(err.message || 'Error al ejecutar el análisis con Gemini');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div id="view-photos-ai" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Fisiología Vegetal Asistida por Inteligencia Artificial</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Fotografías y Diagnóstico Gemini</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspección foliar y radicular con Gemini 3.8 Flash, recomendaciones preventivas y registro cronológico
          </p>
        </div>

        <button
          id="btn-upload-photo"
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition cursor-pointer self-start sm:self-auto"
        >
          <Camera className="w-4 h-4" />
          <span>Subir o Tomar Fotografía</span>
        </button>
      </div>

      {/* Selected Photo & Gemini Analysis Viewer */}
      {selectedPhoto && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Big photo display */}
          <div className="lg:col-span-5 bg-slate-950 p-4 sm:p-6 flex flex-col justify-between relative min-h-[340px]">
            <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 h-full flex items-center justify-center">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption}
                className="w-full h-full object-contain max-h-[420px]"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="mt-3 text-white text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold truncate text-slate-200">{selectedPhoto.caption}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(selectedPhoto.capturedAt).toLocaleDateString('es-EC')}
                </span>
              </div>
              <div className="text-[11px] text-emerald-400">
                Asociado a: <strong className="text-white">{selectedPhoto.associatedEntityType.toUpperCase()}</strong> ({selectedPhoto.associatedEntityId})
              </div>
            </div>
          </div>

          {/* Right: Detailed Gemini Agronomic Diagnosis */}
          <div className="lg:col-span-7 p-6 flex flex-col justify-between space-y-5 bg-slate-50/50">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Diagnóstico Agronómico Gemini
                  </h3>
                </div>

                {selectedPhoto.geminiAnalysis ? (
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${
                      selectedPhoto.geminiAnalysis.healthStatus === 'Saludable'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedPhoto.geminiAnalysis.healthStatus === 'Observación'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedPhoto.geminiAnalysis.healthStatus}
                  </span>
                ) : (
                  <button
                    onClick={handleRunAnalysisForSelected}
                    disabled={analyzing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{analyzing ? 'Analizando...' : 'Analizar esta foto'}</span>
                  </button>
                )}
              </div>

              {analysisError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{analysisError}</span>
                </div>
              )}

              {selectedPhoto.geminiAnalysis ? (
                <div className="space-y-4 text-xs">
                  {/* Overall condition */}
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <span className="font-bold text-slate-900 block mb-1">Estado y Vigor General:</span>
                    <p className="text-slate-700 leading-relaxed">
                      {selectedPhoto.geminiAnalysis.overallCondition}
                    </p>
                  </div>

                  {/* Leaf & Root Evaluation Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                      <span className="font-bold text-slate-900 block text-[11px] uppercase mb-1.5">
                        Morfología Foliar
                      </span>
                      <ul className="space-y-1 text-slate-600">
                        <li>• Coloración: {selectedPhoto.geminiAnalysis.leafEvaluation.coloration}</li>
                        <li>
                          • Clorosis / Amarillamiento:{' '}
                          <strong
                            className={
                              selectedPhoto.geminiAnalysis.leafEvaluation.yellowing
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }
                          >
                            {selectedPhoto.geminiAnalysis.leafEvaluation.yellowing
                              ? 'Presente'
                              : 'No observado'}
                          </strong>
                        </li>
                        <li>
                          • Manchas:{' '}
                          {selectedPhoto.geminiAnalysis.leafEvaluation.spots
                            ? 'Puntos visibles'
                            : 'Ausentes'}
                        </li>
                        <li>
                          • Turgencia:{' '}
                          {selectedPhoto.geminiAnalysis.leafEvaluation.wilting
                            ? 'Signo de marchitez'
                            : 'Turgente'}
                        </li>
                      </ul>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                      <span className="font-bold text-slate-900 block text-[11px] uppercase mb-1.5">
                        Morfología Radicular
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        {selectedPhoto.geminiAnalysis.rootEvaluation}
                      </p>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <span className="font-bold text-slate-900 block mb-1.5">
                      Recomendaciones Prácticas de Cuidado y Manejo:
                    </span>
                    <ul className="space-y-1">
                      {selectedPhoto.geminiAnalysis.generalRecommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Water parameters checklist */}
                  <div className="p-3 bg-cyan-50/80 rounded-xl border border-cyan-200">
                    <span className="font-bold text-cyan-950 block text-[11px] uppercase mb-1">
                      Parámetros del Agua a Verificar:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPhoto.geminiAnalysis.recommendedWaterChecks.map((chk, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-cyan-100 text-cyan-900 font-semibold rounded text-[11px]"
                        >
                          {chk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
                  <Sparkles className="w-8 h-8 text-amber-500/50 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Esta fotografía aún no ha sido analizada</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Haga clic en "Analizar esta foto" para que Gemini identifique coloración foliar y balance nutricional.
                  </p>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="pt-3 border-t border-slate-200 flex items-center gap-2 text-[10px] text-slate-500">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                Orientación visual preliminar generada por IA. No constituye certificación fitopatológica de laboratorio.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Gallery of all photos */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Galería de Registros Fotográficos ({data.photos.length})</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {data.photos.map((ph) => {
            const isSelected = selectedPhoto?.id === ph.id;

            return (
              <div
                key={ph.id}
                onClick={() => setSelectedPhoto(ph)}
                className={`relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition group shadow-xs ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <img
                  src={ph.url}
                  alt={ph.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>

                <div className="absolute bottom-1.5 left-1.5 right-1.5 text-white">
                  <div className="text-[10px] font-bold truncate">{ph.caption}</div>
                  <div className="text-[9px] text-slate-300">
                    {new Date(ph.capturedAt).toLocaleDateString('es-EC')}
                  </div>
                </div>

                {ph.geminiAnalysis && (
                  <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 shadow-sm"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload / Capture Modal */}
      {isUploadModalOpen && (
        <div 
          id="modal-upload-photo"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900 my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Inspección Visual</span>
                <h2 className="text-xl font-black mt-0.5">Capturar o Subir Fotografía</h2>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-4 text-xs">
              {/* Image selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">Fotografía del Cultivo</label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:bg-slate-50 transition cursor-pointer relative">
                  {uploadedImageBase64 ? (
                    <div className="relative aspect-video max-h-48 mx-auto rounded-xl overflow-hidden">
                      <img
                        src={uploadedImageBase64}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="py-6 space-y-2">
                      <Camera className="w-10 h-10 text-slate-400 mx-auto" />
                      <div className="font-bold text-slate-700">Haga clic para tomar foto o seleccionar archivo</div>
                      <div className="text-[11px] text-slate-400">JPG, PNG o WebP</div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Entity Association */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Asociar A</label>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  >
                    <option value="plant">Planta Específica</option>
                    <option value="system">Sistema Hidropónico</option>
                    <option value="forage">Lote de Forraje (FVH)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Seleccionar Elemento</label>
                  <select
                    value={selectedEntityId}
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  >
                    {entityType === 'plant' &&
                      data.plants.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.species}
                        </option>
                      ))}
                    {entityType === 'system' &&
                      data.systems.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    {entityType === 'forage' &&
                      data.forageLots.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.lotCode} - {l.seedType}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción u Observación</label>
                <input
                  type="text"
                  placeholder="Ej. Revisión de ápices foliares en día 14..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900">
                  <input
                    type="checkbox"
                    checked={requestAiImmediate}
                    onChange={(e) => setRequestAiImmediate(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Solicitar análisis automático con Gemini al guardar</span>
                </label>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={analyzing}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {analyzing ? 'Guardando y Analizando...' : 'Guardar Fotografía'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
