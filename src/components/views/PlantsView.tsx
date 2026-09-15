import React, { useState } from 'react';
import {
  Sprout,
  Plus,
  Search,
  Filter,
  QrCode,
  Layers,
  HeartPulse,
  Sparkles,
  Calendar,
  ArrowUpDown,
} from 'lucide-react';
import { AppData, Plant, PlantStatus } from '../../types';

interface PlantsViewProps {
  data: AppData;
  onSelectPlant: (plant: Plant) => void;
  onSavePlant: (newPlant: Plant) => void;
  preselectedSystemId?: string | null;
}

export const PlantsView: React.FC<PlantsViewProps> = ({
  data,
  onSelectPlant,
  onSavePlant,
  preselectedSystemId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [systemFilter, setSystemFilter] = useState<string>(preselectedSystemId || 'all');
  const [isNewPlantModalOpen, setIsNewPlantModalOpen] = useState(false);

  // New plant form state
  const [code, setCode] = useState(`LEC-00${data.plants.length + 1}`);
  const [species, setSpecies] = useState('Lechuga');
  const [variety, setVariety] = useState('Crespa Verde');
  const [systemId, setSystemId] = useState(data.systems[0]?.id || 'sys-dwc-01');
  const [sowingDate, setSowingDate] = useState(new Date().toISOString().split('T')[0]);
  const [germinationDate, setGerminationDate] = useState(new Date().toISOString().split('T')[0]);
  const [transplantDate, setTransplantDate] = useState(new Date().toISOString().split('T')[0]);
  const [estimatedHarvestDate, setEstimatedHarvestDate] = useState(
    new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0]
  );
  const [initialHeightCm, setInitialHeightCm] = useState(4.5);
  const [initialLeavesCount, setInitialLeavesCount] = useState(3);
  const [rootDevelopment, setRootDevelopment] = useState<any>('moderado');
  const [observations, setObservations] = useState('');

  const plantsList = Array.isArray(data.plants) ? data.plants : [];

  const filteredPlants = plantsList.filter((p) => {
    const matchesSearch =
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.variety.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSystem = systemFilter === 'all' || p.systemId === systemFilter;

    return matchesSearch && matchesStatus && matchesSystem;
  });

  const handleCreatePlant = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlant: Plant = {
      id: 'plt-' + Date.now().toString(36),
      code,
      species,
      variety,
      systemId,
      sowingDate,
      germinationDate,
      transplantDate,
      estimatedHarvestDate,
      currentHeightCm: Number(initialHeightCm),
      currentLeavesCount: Number(initialLeavesCount),
      rootDevelopment,
      status: 'healthy',
      qrCodeValue: code,
      observations,
      growthHistory: [
        {
          id: 'pgr-init',
          date: transplantDate,
          dayNumber: 1,
          heightCm: Number(initialHeightCm),
          leavesCount: Number(initialLeavesCount),
          rootDevelopment,
          status: 'healthy',
          waterPh: 6.0,
          waterEc: 1.45,
          waterTemp: 21.2,
          notes: 'Trasplante al sistema hidropónico con excelente vigor.',
        },
      ],
      initialPhoto: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=400&q=80',
    };

    onSavePlant(newPlant);
    setIsNewPlantModalOpen(false);
  };

  return (
    <div id="view-plants" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Mis Plantas</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoreo individual con código QR, historial por días y diagnóstico agronómico
          </p>
        </div>

        <button
          id="btn-add-plant"
          onClick={() => {
            setCode(`LEC-00${data.plants.length + 1}`);
            setIsNewPlantModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nueva Planta</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="input-search-plants"
            type="text"
            placeholder="Buscar por código (LEC-001), especie o variedad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            id="select-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todos los estados</option>
            <option value="healthy">Saludables</option>
            <option value="needs_observation">En Observación</option>
            <option value="needs_attention">Requieren Atención</option>
            <option value="harvested">Cosechadas</option>
          </select>

          <select
            id="select-system-filter"
            value={systemFilter}
            onChange={(e) => setSystemFilter(e.target.value)}
            className="w-full md:w-auto bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todos los sistemas</option>
            {data.systems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Plants Grid */}
      {filteredPlants.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
          <Sprout className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No se encontraron plantas</h3>
          <p className="text-xs text-slate-400 mt-1">Pruebe ajustando los filtros o registre una nueva planta.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlants.map((plant) => {
            const system = data.systems.find((s) => s.id === plant.systemId);

            return (
              <div
                key={plant.id}
                id={`plant-card-${plant.code}`}
                onClick={() => onSelectPlant(plant)}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-500/50 transition cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Photo & Header */}
                  <div className="h-40 bg-slate-100 relative overflow-hidden">
                    {plant.initialPhoto ? (
                      <img
                        src={plant.initialPhoto}
                        alt={plant.code}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Sprout className="w-10 h-10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent"></div>

                    {/* QR icon pill */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-slate-900 font-mono text-xs font-black flex items-center gap-1.5 shadow-sm">
                      <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{plant.code}</span>
                    </div>

                    {/* Status Pill */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg backdrop-blur-md uppercase tracking-wider ${
                          plant.status === 'healthy'
                            ? 'bg-emerald-500/90 text-white'
                            : plant.status === 'needs_observation'
                            ? 'bg-amber-500/90 text-white'
                            : plant.status === 'needs_attention'
                            ? 'bg-rose-500/90 text-white'
                            : 'bg-slate-700/90 text-slate-100'
                        }`}
                      >
                        {plant.status === 'healthy'
                          ? 'Sana'
                          : plant.status === 'needs_observation'
                          ? 'Observación'
                          : plant.status === 'needs_attention'
                          ? 'Atención'
                          : 'Cosechada'}
                      </span>
                    </div>

                    {/* Name & Variety */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="text-base font-black leading-tight drop-shadow-sm">
                        {plant.species} • {plant.variety}
                      </h3>
                      <div className="text-[11px] text-slate-300 mt-0.5 truncate">
                        {system?.name || 'Sistema Hidropónico'}
                      </div>
                    </div>
                  </div>

                  {/* Body Specs */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Altura</span>
                        <span className="font-extrabold text-slate-900">{plant.currentHeightCm} cm</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Hojas</span>
                        <span className="font-extrabold text-slate-900">{plant.currentLeavesCount} hojas</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Raíz:</span>
                      <span className="font-bold text-emerald-700 uppercase text-[11px]">
                        {plant.rootDevelopment}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Historial:</span>
                      <span className="font-semibold text-slate-800">
                        {plant.growthHistory?.length || 1} registros tomados
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card footer CTA */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-bold group-hover:text-emerald-800">
                  <span>Abrir ficha completa</span>
                  <span className="text-base leading-none">→</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Plant Modal */}
      {isNewPlantModalOpen && (
        <div 
          id="modal-new-plant"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900 my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Nueva Planta</span>
                <h2 className="text-xl font-black mt-0.5">Ficha de Cultivo Individual</h2>
              </div>
              <button
                onClick={() => setIsNewPlantModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlant} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código Único (QR)</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Especie</label>
                  <input
                    type="text"
                    required
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Variedad</label>
                  <input
                    type="text"
                    required
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sistema Hidropónico</label>
                  <select
                    value={systemId}
                    onChange={(e) => setSystemId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  >
                    {data.systems.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Siembra</label>
                  <input
                    type="date"
                    required
                    value={sowingDate}
                    onChange={(e) => setSowingDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Trasplante</label>
                  <input
                    type="date"
                    required
                    value={transplantDate}
                    onChange={(e) => setTransplantDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Altura Inicial (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={initialHeightCm}
                    onChange={(e) => setInitialHeightCm(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hojas Iniciales</label>
                  <input
                    type="number"
                    required
                    value={initialLeavesCount}
                    onChange={(e) => setInitialLeavesCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Desarrollo Radicular Inicial</label>
                <select
                  value={rootDevelopment}
                  onChange={(e) => setRootDevelopment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="moderado">Moderado</option>
                  <option value="inicial">Inicial</option>
                  <option value="vigoroso">Vigoroso</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Plántula seleccionada por buen vigor de cotiledones..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPlantModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer"
                >
                  Guardar y Generar QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
