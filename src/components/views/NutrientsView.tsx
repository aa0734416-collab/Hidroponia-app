import React, { useState } from 'react';
import {
  FlaskConical,
  Calculator,
  Plus,
  ArrowRight,
  Droplet,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AppData, NutrientApplicationRecord } from '../../types';

interface NutrientsViewProps {
  data: AppData;
  onSaveNutrientRecord: (record: NutrientApplicationRecord) => void;
}

export const NutrientsView: React.FC<NutrientsViewProps> = ({
  data,
  onSaveNutrientRecord,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculator State
  const [calcTankVolume, setCalcTankVolume] = useState<number>(50);
  const [calcDoseA, setCalcDoseA] = useState<number>(5.0); // ml/L
  const [calcDoseB, setCalcDoseB] = useState<number>(5.0); // ml/L
  const [calcDoseMicro, setCalcDoseMicro] = useState<number>(2.0); // ml/L
  const [calcPhDown, setCalcPhDown] = useState<number>(0.5); // ml/L

  // Total calculated ml
  const totalA = (calcTankVolume * calcDoseA).toFixed(1);
  const totalB = (calcTankVolume * calcDoseB).toFixed(1);
  const totalMicro = (calcTankVolume * calcDoseMicro).toFixed(1);
  const totalPhDown = (calcTankVolume * calcPhDown).toFixed(1);

  // New Record Form
  const [systemId, setSystemId] = useState(data.systems[0]?.id || 'sys-dwc-01');
  const [formulaName, setFormulaName] = useState('Solución Estándar Hoja Verde (A + B + Micros)');
  const [solutionA_mlPerL, setSolutionA] = useState<number>(5.0);
  const [solutionB_mlPerL, setSolutionB] = useState<number>(5.0);
  const [micronutrients_mlPerL, setMicronutrients] = useState<number>(2.0);
  const [phRegulator, setPhRegulator] = useState('pH Down (Ácido fosfórico)');
  const [phRegulator_mlPerL, setPhRegulatorDose] = useState<number>(0.5);
  const [phBefore, setPhBefore] = useState<number>(7.2);
  const [phAfter, setPhAfter] = useState<number>(6.05);
  const [ecBefore, setEcBefore] = useState<number>(0.3);
  const [ecAfter, setEcAfter] = useState<number>(1.45);
  const [notes, setNotes] = useState('Renovación completa de nutrientes tras 14 días de cultivo');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: NutrientApplicationRecord = {
      id: 'nt-' + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      systemId,
      formulaName,
      components: [
        { name: 'Solución Concentrada A (Macronutrientes N-P-K-Ca)', dosePerLiter: Number(solutionA_mlPerL), unit: 'ml/L' },
        { name: 'Solución Concentrada B (Sulfatos y Magnesio)', dosePerLiter: Number(solutionB_mlPerL), unit: 'ml/L' },
        { name: 'Solución C (Quelato de Hierro y Micronutrientes)', dosePerLiter: Number(micronutrients_mlPerL), unit: 'ml/L' },
      ],
      solutionA_mlPerL: Number(solutionA_mlPerL),
      solutionB_mlPerL: Number(solutionB_mlPerL),
      micronutrients_mlPerL: Number(micronutrients_mlPerL),
      phRegulator,
      phRegulator_mlPerL: Number(phRegulator_mlPerL),
      phBefore: Number(phBefore),
      phAfter: Number(phAfter),
      ecBefore: Number(ecBefore),
      ecAfter: Number(ecAfter),
      notes,
    };

    onSaveNutrientRecord(newRecord);
    setIsModalOpen(false);
  };

  return (
    <div id="view-nutrients" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Nutrientes y Soluciones Nutritivas</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Calculadora de dosificación por volumen de tanque, control de Solución A, B, C y trazabilidad antes/después
          </p>
        </div>

        <button
          id="btn-add-nutrient-record"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Mezcla Nutritiva</span>
        </button>
      </div>

      {/* Interactive Dosing Calculator Card */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-black">Calculadora Rápida de Dosis por Tanque</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Fórmula Dinámica en Mililitros</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          {/* Tank volume input */}
          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
            <label className="block text-slate-400 font-bold mb-1">Volumen Tanque (L)</label>
            <input
              type="number"
              value={calcTankVolume}
              onChange={(e) => setCalcTankVolume(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-base focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Dose A */}
          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
            <label className="block text-slate-400 font-bold mb-1">Solución A (ml/L)</label>
            <input
              type="number"
              step="0.1"
              value={calcDoseA}
              onChange={(e) => setCalcDoseA(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-base focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Dose B */}
          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
            <label className="block text-slate-400 font-bold mb-1">Solución B (ml/L)</label>
            <input
              type="number"
              step="0.1"
              value={calcDoseB}
              onChange={(e) => setCalcDoseB(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-base focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Dose C / Micro */}
          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
            <label className="block text-slate-400 font-bold mb-1">Micronutrientes (ml/L)</label>
            <input
              type="number"
              step="0.1"
              value={calcDoseMicro}
              onChange={(e) => setCalcDoseMicro(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-base focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* pH Down */}
          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
            <label className="block text-slate-400 font-bold mb-1">pH Down / Regulador</label>
            <input
              type="number"
              step="0.1"
              value={calcPhDown}
              onChange={(e) => setCalcPhDown(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-base focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Calculated Total Box */}
        <div className="p-4 bg-emerald-950/60 rounded-2xl border border-emerald-900/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase block">Total Solución A</span>
            <span className="text-2xl font-black text-white mt-1 block">{totalA} ml</span>
            <span className="text-[10px] text-slate-400">({(Number(totalA) / 1000).toFixed(2)} L)</span>
          </div>

          <div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase block">Total Solución B</span>
            <span className="text-2xl font-black text-white mt-1 block">{totalB} ml</span>
            <span className="text-[10px] text-slate-400">({(Number(totalB) / 1000).toFixed(2)} L)</span>
          </div>

          <div>
            <span className="text-[10px] text-emerald-400 font-bold uppercase block">Total Micros</span>
            <span className="text-2xl font-black text-white mt-1 block">{totalMicro} ml</span>
            <span className="text-[10px] text-slate-400">Hierro quelatado</span>
          </div>

          <div>
            <span className="text-[10px] text-amber-400 font-bold uppercase block">Total pH Down</span>
            <span className="text-2xl font-black text-amber-300 mt-1 block">{totalPhDown} ml</span>
            <span className="text-[10px] text-slate-400">Ajuste gradual</span>
          </div>
        </div>
      </div>

      {/* Applications Log */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm text-slate-900">Historial de Preparación y Ajuste de Nutrientes</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.nutrientRecords.map((record) => {
            const system = data.systems.find((s) => s.id === record.systemId);

            return (
              <div
                key={record.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-slate-500">
                      {new Date(record.timestamp).toLocaleString('es-EC')}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                      {system?.name || 'Sistema Hidropónico'}
                    </span>
                  </div>

                  <h4 className="font-black text-slate-900 text-base">{record.formulaName}</h4>
                  <p className="text-xs text-slate-600 mt-1">{record.notes}</p>
                </div>

                {/* Doses breakdown */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Solución A</span>
                    <span className="font-extrabold text-slate-900">{record.solutionA_mlPerL} ml/L</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Solución B</span>
                    <span className="font-extrabold text-slate-900">{record.solutionB_mlPerL} ml/L</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Micros</span>
                    <span className="font-extrabold text-slate-900">{record.micronutrients_mlPerL} ml/L</span>
                  </div>
                </div>

                {/* Before vs After Impact Box */}
                <div className="p-3 bg-slate-900 rounded-xl text-white text-xs space-y-2">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                    Impacto en el Agua (Antes → Después)
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 block text-[11px]">pH:</span>
                      <div className="flex items-center gap-1.5 font-black text-sm">
                        <span className="text-rose-400">{record.phBefore}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-emerald-400">{record.phAfter}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">EC:</span>
                      <div className="flex items-center gap-1.5 font-black text-sm">
                        <span className="text-slate-300">{record.ecBefore}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-emerald-400">{record.ecAfter} mS/cm</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Nutrient Application Modal */}
      {isModalOpen && (
        <div 
          id="modal-new-nutrient-mix"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900 my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Nutrición</span>
                <h2 className="text-xl font-black mt-0.5">Registrar Mezcla o Ajuste</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sistema Hidropónico</label>
                <select
                  value={systemId}
                  onChange={(e) => setSystemId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                >
                  {data.systems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre de la Fórmula</label>
                <input
                  type="text"
                  required
                  value={formulaName}
                  onChange={(e) => setFormulaName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Solución A (ml/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={solutionA_mlPerL}
                    onChange={(e) => setSolutionA(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Solución B (ml/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={solutionB_mlPerL}
                    onChange={(e) => setSolutionB(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Micros (ml/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={micronutrients_mlPerL}
                    onChange={(e) => setMicronutrients(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Regulador pH</label>
                  <input
                    type="text"
                    value={phRegulator}
                    onChange={(e) => setPhRegulator(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dosis pH (ml/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={phRegulator_mlPerL}
                    onChange={(e) => setPhRegulatorDose(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block text-[11px] uppercase">
                  Valores de Comprobación
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">pH Inicial → Final</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.01"
                        value={phBefore}
                        onChange={(e) => setPhBefore(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1 text-center font-bold"
                      />
                      <span>→</span>
                      <input
                        type="number"
                        step="0.01"
                        value={phAfter}
                        onChange={(e) => setPhAfter(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1 text-center font-bold text-emerald-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">EC Inicial → Final (mS/cm)</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step="0.01"
                        value={ecBefore}
                        onChange={(e) => setEcBefore(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1 text-center font-bold"
                      />
                      <span>→</span>
                      <input
                        type="number"
                        step="0.01"
                        value={ecAfter}
                        onChange={(e) => setEcAfter(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1 text-center font-bold text-emerald-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer"
                >
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
