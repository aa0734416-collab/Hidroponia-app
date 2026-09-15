import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Wind,
  Droplets,
  Zap,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Sprout,
  X,
  Camera,
} from 'lucide-react';
import { AppData, HydroSystem, HydroSystemType, SystemStatus } from '../../types';

interface SystemsViewProps {
  data: AppData;
  onSaveSystem: (system: HydroSystem) => void;
  onNavigateToPlantsForSystem: (systemId: string) => void;
}

export const SystemsView: React.FC<SystemsViewProps> = ({
  data,
  onSaveSystem,
  onNavigateToPlantsForSystem,
}) => {
  const [selectedSystem, setSelectedSystem] = useState<HydroSystem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<HydroSystemType>('dwc');
  const [capacityLiters, setCapacityLiters] = useState<number>(60);
  const [plantsCapacity, setPlantsCapacity] = useState<number>(24);
  const [location, setLocation] = useState('Invernadero La Bocana, Piñas');
  const [installationDate, setInstallationDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<SystemStatus>('active');

  // Component options for DWC
  const [dwcHasAerator, setDwcHasAerator] = useState(true);
  const [dwcHose, setDwcHose] = useState(true);
  const [dwcDiffuserStone, setDwcDiffuserStone] = useState(true);
  const [dwcContainerType, setDwcContainerType] = useState('Hielera isotérmica plástica con aislamiento');
  const [dwcFoam, setDwcFoam] = useState('Cubos de espuma fenólica / poliuretano');

  // Component options for Vertical
  const [vertPump, setVertPump] = useState(true);
  const [vertHoses, setVertHoses] = useState(true);
  const [vertFoam, setVertFoam] = useState('Espuma hidropónica cilíndrica');
  const [vertTubesCount, setVertTubesCount] = useState(3);

  // Component options for Aeroponics
  const [aeroHighPressure, setAeroHighPressure] = useState(true);
  const [aeroNozzlesCount, setAeroNozzlesCount] = useState(6);

  const resetForm = () => {
    setName('');
    setType('dwc');
    setCapacityLiters(60);
    setPlantsCapacity(24);
    setLocation('Invernadero La Bocana, Piñas');
    setInstallationDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setStatus('active');
  };

  const handleOpenNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const componentsList: string[] = [];
    if (type === 'dwc') {
      if (dwcHasAerator) componentsList.push('Bomba de aire / Aireador');
      if (dwcHose) componentsList.push('Manguera de silicona');
      if (dwcDiffuserStone) componentsList.push('Piedra difusora microburbuja');
      componentsList.push(dwcContainerType);
      componentsList.push(dwcFoam);
      componentsList.push('Vasos de canastilla hidropónica');
    } else if (type === 'vertical_tubes') {
      if (vertPump) componentsList.push('Pequeña bomba sumergible de agua');
      if (vertHoses) componentsList.push('Mangueras y derivaciones');
      componentsList.push(`Tubos verticales PVC (${vertTubesCount} columnas)`);
      componentsList.push(vertFoam);
      componentsList.push('Vasos y copas hidropónicas');
    } else if (type === 'aeroponics') {
      if (aeroHighPressure) componentsList.push('Bomba de alta presión para pulverización');
      componentsList.push(`Nebulizadores / Aspersores de raíz (${aeroNozzlesCount} boquillas)`);
      componentsList.push('Cámara oscura de raíces suspendidas');
      componentsList.push('Temporizador cíclico');
    }

    const newSys: HydroSystem = {
      id: 'sys-' + Date.now().toString(36),
      name,
      type,
      capacityLiters: Number(capacityLiters),
      plantsCapacity: Number(plantsCapacity),
      currentPlantsCount: 0,
      location,
      installationDate,
      componentsList,
      componentsDetail: {
        dwc: type === 'dwc' ? {
          hasAerator: dwcHasAerator,
          hose: dwcHose,
          diffuserStone: dwcDiffuserStone,
          containerType: dwcContainerType,
          cupsCount: Number(plantsCapacity),
          foamType: dwcFoam,
        } : undefined,
        vertical: type === 'vertical_tubes' ? {
          waterPump: vertPump,
          hoses: vertHoses,
          tubesCount: vertTubesCount,
          cupsCount: Number(plantsCapacity),
          foamType: vertFoam,
          distributionSystem: 'Riego superior por gravedad recirculante',
        } : undefined,
        aeroponic: type === 'aeroponics' ? {
          highPressurePump: aeroHighPressure,
          nozzlesCount: aeroNozzlesCount,
          sprayFrequencyMin: 3,
          dropletCollector: true,
        } : undefined,
      },
      photos: [
        type === 'dwc'
          ? 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=800&q=80'
          : type === 'vertical_tubes'
          ? 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=800&q=80'
          : 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
      ],
      notes,
      status,
      currentWaterLevelLiters: Number(capacityLiters) * 0.8,
      minWaterLevelLiters: Number(capacityLiters) * 0.35,
    };

    onSaveSystem(newSys);
    setIsModalOpen(false);
  };

  return (
    <div id="view-systems" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Mis Sistemas Hidropónicos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de sistemas de raíz flotante (DWC), tubos verticales y aeroponía
          </p>
        </div>

        <button
          id="btn-add-system"
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nuevo Sistema</span>
        </button>
      </div>

      {/* Systems Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(data.systems || []).map((sys) => {
          const plantsInSys = (data.plants || []).filter((p) => p.systemId === sys.id);

          return (
            <div
              key={sys.id}
              id={`system-card-${sys.id}`}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
            >
              {/* Image banner */}
              <div className="h-44 bg-slate-800 relative overflow-hidden">
                {sys.photos?.[0] ? (
                  <img
                    src={sys.photos[0]}
                    alt={sys.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <Layers className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>

                <div className="absolute top-3 left-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider backdrop-blur-md ${
                      sys.type === 'dwc'
                        ? 'bg-blue-600/90 text-white'
                        : sys.type === 'vertical_tubes'
                        ? 'bg-emerald-600/90 text-white'
                        : 'bg-purple-600/90 text-white'
                    }`}
                  >
                    {sys.type === 'dwc'
                      ? 'Raíz Flotante (DWC)'
                      : sys.type === 'vertical_tubes'
                      ? 'Tubos Verticales'
                      : 'Aeroponía'}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="text-lg font-black leading-tight drop-shadow-sm">{sys.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{sys.location}</span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Tanque</span>
                    <span className="font-extrabold text-slate-900 text-sm">{sys.capacityLiters} L</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Capacidad</span>
                    <span className="font-extrabold text-slate-900 text-sm">{sys.plantsCapacity} pl.</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Ocupadas</span>
                    <span className="font-extrabold text-emerald-600 text-sm">{plantsInSys.length} pl.</span>
                  </div>
                </div>

                {/* Components Checklist */}
                <div>
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    <span>Componentes Utilizados</span>
                  </div>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {sys.componentsList.slice(0, 4).map((comp, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{comp}</span>
                      </li>
                    ))}
                    {sys.componentsList.length > 4 && (
                      <li className="text-[11px] text-slate-400 italic pl-5">
                        +{sys.componentsList.length - 4} componentes adicionales
                      </li>
                    )}
                  </ul>
                </div>

                {/* Notes */}
                {sys.notes && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    "{sys.notes}"
                  </p>
                )}

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => onNavigateToPlantsForSystem(sys.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition cursor-pointer"
                  >
                    <Sprout className="w-3.5 h-3.5" />
                    <span>Ver Plantas ({plantsInSys.length})</span>
                  </button>

                  <button
                    onClick={() => setSelectedSystem(sys)}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Ficha Completa
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedSystem && (
        <div 
          id="modal-system-detail"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900 my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Ficha Técnica de Sistema</span>
                <h2 className="text-xl font-black mt-0.5">{selectedSystem.name}</h2>
              </div>
              <button
                onClick={() => setSelectedSystem(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-bold">Tipo de Sistema</span>
                  <span className="font-extrabold text-slate-800 uppercase">{selectedSystem.type}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-bold">Capacidad Tanque</span>
                  <span className="font-extrabold text-slate-800">{selectedSystem.capacityLiters} L</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-bold">Capacidad Plantas</span>
                  <span className="font-extrabold text-slate-800">{selectedSystem.plantsCapacity} puestos</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-bold">Fecha Instalación</span>
                  <span className="font-extrabold text-slate-800">{selectedSystem.installationDate}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-2">Ubicación física</h4>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{selectedSystem.location}</span>
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900 mb-2">Lista Detallada de Componentes</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedSystem.componentsList.map((comp, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium text-slate-800">{comp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSystem.notes && (
                <div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1">Observaciones Técnicas</h4>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedSystem.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedSystem(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New System Modal */}
      {isModalOpen && (
        <div 
          id="modal-new-system"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900 my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Nuevo Sistema</span>
                <h2 className="text-xl font-black mt-0.5">Registrar Sistema Hidropónico</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del Sistema</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sistema DWC Raíz Flotante 2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setType('dwc')}
                  className={`p-3 rounded-xl border text-left transition ${
                    type === 'dwc'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <Wind className="w-5 h-5 text-emerald-600 mb-1" />
                  <div className="font-bold">Raíz Flotante (DWC)</div>
                  <div className="text-[10px] text-slate-500 font-normal">Hielera, aireador y difusor</div>
                </button>

                <button
                  type="button"
                  onClick={() => setType('vertical_tubes')}
                  className={`p-3 rounded-xl border text-left transition ${
                    type === 'vertical_tubes'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <Layers className="w-5 h-5 text-emerald-600 mb-1" />
                  <div className="font-bold">Tubos Verticales</div>
                  <div className="text-[10px] text-slate-500 font-normal">Bomba agua, vasos y espuma</div>
                </button>

                <button
                  type="button"
                  onClick={() => setType('aeroponics')}
                  className={`p-3 rounded-xl border text-left transition ${
                    type === 'aeroponics'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  <Zap className="w-5 h-5 text-emerald-600 mb-1" />
                  <div className="font-bold">Aeroponía</div>
                  <div className="text-[10px] text-slate-500 font-normal">Pulverización alta presión</div>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Capacidad del Tanque (Litros)</label>
                  <input
                    type="number"
                    min={5}
                    required
                    value={capacityLiters}
                    onChange={(e) => setCapacityLiters(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Puestos de Plantas</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={plantsCapacity}
                    onChange={(e) => setPlantsCapacity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ubicación</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Instalación</label>
                  <input
                    type="date"
                    required
                    value={installationDate}
                    onChange={(e) => setInstallationDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Specific components based on type */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <span className="font-bold text-slate-800 block uppercase tracking-wide text-[10px]">
                  Componentes del Sistema ({type.toUpperCase()})
                </span>

                {type === 'dwc' && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={dwcHasAerator}
                        onChange={(e) => setDwcHasAerator(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Bomba de aire / Aireador continuo</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={dwcHose}
                        onChange={(e) => setDwcHose(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Manguera de aireación</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={dwcDiffuserStone}
                        onChange={(e) => setDwcDiffuserStone(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Piedra difusora microperforada</span>
                    </label>

                    <div>
                      <span className="block font-semibold text-slate-600 mb-1">Tipo de contenedor:</span>
                      <input
                        type="text"
                        value={dwcContainerType}
                        onChange={(e) => setDwcContainerType(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                )}

                {type === 'vertical_tubes' && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={vertPump}
                        onChange={(e) => setVertPump(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Bomba pequeña sumergible de recirculación</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={vertHoses}
                        onChange={(e) => setVertHoses(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Mangueras y distribución</span>
                    </label>

                    <div>
                      <span className="block font-semibold text-slate-600 mb-1">Espuma hidropónica:</span>
                      <input
                        type="text"
                        value={vertFoam}
                        onChange={(e) => setVertFoam(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                )}

                {type === 'aeroponics' && (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={aeroHighPressure}
                        onChange={(e) => setAeroHighPressure(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Bomba impulsora de alta presión</span>
                    </label>
                    <div>
                      <span className="block font-semibold text-slate-600 mb-1">Cantidad de boquillas nebulizadoras:</span>
                      <input
                        type="number"
                        min={1}
                        value={aeroNozzlesCount}
                        onChange={(e) => setAeroNozzlesCount(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre oxigenación, ubicación respecto al sol..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
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
                  Guardar Sistema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
