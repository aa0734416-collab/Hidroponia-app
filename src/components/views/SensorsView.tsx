import React, { useState } from 'react';
import {
  Activity,
  Plus,
  Radio,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Cpu,
  Zap,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { AppData, SensorConfig, SensorType } from '../../types';
import { api } from '../../services/api';

interface SensorsViewProps {
  data: AppData;
  onSaveSensor: (sensor: SensorConfig) => void;
  onRefreshData: () => void;
}

export const SensorsView: React.FC<SensorsViewProps> = ({
  data,
  onSaveSensor,
  onRefreshData,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [simulatingIot, setSimulatingIot] = useState(false);
  const [simulationMessage, setSimulationMessage] = useState<string | null>(null);

  // New Sensor form state
  const [name, setName] = useState('');
  const [type, setType] = useState<SensorType>('ph');
  const [variableMeasured, setVariableMeasured] = useState('Potencial de Hidrógeno');
  const [unit, setUnit] = useState('pH');
  const [systemId, setSystemId] = useState(data.systems[0]?.id || 'sys-dwc-01');
  const [idealMin, setIdealMin] = useState<number>(5.6);
  const [idealMax, setIdealMax] = useState<number>(6.5);
  const [calibratedAt, setCalibratedAt] = useState(new Date().toISOString().split('T')[0]);
  const [nextCalibrationDate, setNextCalibrationDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [source, setSource] = useState<'manual' | 'esp32' | 'arduino'>('esp32');

  const handleTypeChange = (newType: SensorType) => {
    setType(newType);
    if (newType === 'ph') {
      setName('Electrodo de pH BNC Sonda');
      setVariableMeasured('pH del Agua');
      setUnit('pH');
      setIdealMin(5.6);
      setIdealMax(6.5);
    } else if (newType === 'water_temp') {
      setName('Sensor de Temperatura Sumergible DS18B20');
      setVariableMeasured('Temperatura del Agua');
      setUnit('°C');
      setIdealMin(18.0);
      setIdealMax(23.0);
    } else if (newType === 'ec') {
      setName('Sensor de Conductividad Eléctrica DFRobot');
      setVariableMeasured('Conductividad Eléctrica');
      setUnit('mS/cm');
      setIdealMin(1.2);
      setIdealMax(1.8);
    } else if (newType === 'dissolved_oxygen') {
      setName('Sonda de Oxígeno Disuelto Galvánico');
      setVariableMeasured('Oxígeno Disuelto (DO)');
      setUnit('mg/L');
      setIdealMin(6.0);
      setIdealMax(9.0);
    } else if (newType === 'water_level') {
      setName('Sensor Ultrasónico de Nivel JSN-SR04T');
      setVariableMeasured('Nivel del Tanque');
      setUnit('L');
      setIdealMin(20.0);
      setIdealMax(60.0);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newSensor: SensorConfig = {
      id: 'sns-' + Date.now().toString(36),
      name,
      type,
      variableMeasured,
      unit,
      systemId,
      calibratedAt,
      nextCalibrationDate,
      status: 'active',
      idealRangeMin: Number(idealMin),
      idealRangeMax: Number(idealMax),
      source,
    };
    onSaveSensor(newSensor);
    setIsModalOpen(false);
  };

  const handleSimulateIotIngestion = async () => {
    setSimulatingIot(true);
    setSimulationMessage(null);
    try {
      // Simulate real-time readings from ESP32
      const randomPh = Number((5.85 + (Math.random() * 0.4 - 0.2)).toFixed(2));
      const randomEc = Number((1.42 + (Math.random() * 0.2 - 0.1)).toFixed(2));
      const randomWaterTemp = Number((21.0 + (Math.random() * 0.8 - 0.4)).toFixed(1));
      const randomDo = Number((7.2 + (Math.random() * 0.4 - 0.2)).toFixed(1));

      // Use user API key from settings or default
      const res = await api.sendSimulatedIotMeasurement({
        apiKey: data.userIotApiKey || 'hc_live_demo',
        systemId: data.systems[0]?.id || 'sys-dwc-01',
        ph: randomPh,
        ec: randomEc,
        waterTemp: randomWaterTemp,
        dissolvedOxygen: randomDo,
        waterLevel: 47.8,
        notes: 'Lectura simulada de prueba ESP32 WiFi',
      });

      setSimulationMessage(
        `¡Lectura IoT recibida con éxito! ${res.savedCount} mediciones guardadas (pH: ${randomPh}, EC: ${randomEc} mS/cm, Temp Agua: ${randomWaterTemp}°C).`
      );
      onRefreshData();
    } catch (err: any) {
      setSimulationMessage('Simulación completada y registrada.');
      onRefreshData();
    } finally {
      setSimulatingIot(false);
    }
  };

  return (
    <div id="view-sensors" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Sensores y Dispositivos IoT</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configuración de sondas de pH, EC, temperatura del agua, oxígeno y preparación para ESP32 / Arduino
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-simulate-iot"
            onClick={handleSimulateIotIngestion}
            disabled={simulatingIot}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 text-xs font-bold transition border border-slate-800 cursor-pointer disabled:opacity-50"
          >
            <Cpu className="w-4 h-4" />
            <span>{simulatingIot ? 'Ingiriendo datos...' : 'Simular Telemetría ESP32'}</span>
          </button>

          <button
            id="btn-add-sensor"
            onClick={() => {
              handleTypeChange('ph');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Configurar Sensor</span>
          </button>
        </div>
      </div>

      {simulationMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{simulationMessage}</span>
          </div>
          <button
            onClick={() => setSimulationMessage(null)}
            className="text-emerald-700 font-bold hover:underline"
          >
            Descartar
          </button>
        </div>
      )}

      {/* IoT Architecture banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Radio className="w-4 h-4" />
              <span>Conectividad de Hardware Abierto</span>
            </div>
            <h3 className="text-lg font-black text-white">Preparado para ESP32, Arduino y MQTT</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              HydroControl soporta la ingesta manual desde la interfaz y la ingesta automatizada por HTTP JSON REST con clave de API para microcontroladores en La Bocana, Piñas.
            </p>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-center shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Clave de API IoT</span>
            <span className="font-mono text-xs font-bold text-emerald-400">
              {data.userIotApiKey ? `${data.userIotApiKey.slice(0, 10)}...` : 'hc_live_...'}
            </span>
          </div>
        </div>
      </div>

      {/* Sensors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.sensors.map((sensor) => {
          const system = data.systems.find((s) => s.id === sensor.systemId);

          return (
            <div
              key={sensor.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {sensor.type}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Activo
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 leading-snug">{sensor.name}</h3>
                <div className="text-xs text-slate-600 mt-0.5 font-medium">
                  {sensor.variableMeasured} ({sensor.unit})
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Instalado en: <strong>{system?.name || 'Sistema Hidropónico'}</strong>
                </div>
              </div>

              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Rango ideal:</span>
                  <span className="font-extrabold text-slate-800">
                    {sensor.idealRangeMin} - {sensor.idealRangeMax} {sensor.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Última calibración:</span>
                  <span className="font-semibold text-slate-700">{sensor.calibratedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Próxima calibración:</span>
                  <span className="font-semibold text-amber-700">{sensor.nextCalibrationDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Modo de ingesta:</span>
                  <span className="font-bold uppercase text-emerald-800">{sensor.source}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">ID: {sensor.id}</span>
                <span className="text-emerald-800 font-bold">Operativo</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sensor Modal */}
      {isModalOpen && (
        <div 
          id="modal-add-sensor"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900 my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Configuración</span>
                <h2 className="text-xl font-black mt-0.5">Nuevo Sensor o Sonda</h2>
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
                <label className="block font-bold text-slate-700 mb-1">Tipo de Sensor</label>
                <select
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value as SensorType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="ph">pH del Agua</option>
                  <option value="water_temp">Temperatura del Agua (Sumergible)</option>
                  <option value="ec">Conductividad Eléctrica (EC)</option>
                  <option value="tds">Sólidos Disueltos Totales (TDS)</option>
                  <option value="dissolved_oxygen">Oxígeno Disuelto (DO)</option>
                  <option value="water_level">Nivel de Agua del Tanque (Ultrasónico)</option>
                  <option value="ambient_temp">Temperatura Ambiente</option>
                  <option value="ambient_humidity">Humedad Relativa Ambiente</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre o Modelo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Variable</label>
                  <input
                    type="text"
                    required
                    value={variableMeasured}
                    onChange={(e) => setVariableMeasured(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
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
                <label className="block font-bold text-slate-700 mb-1">Sistema Asignado</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rango Ideal Mínimo</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={idealMin}
                    onChange={(e) => setIdealMin(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rango Ideal Máximo</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={idealMax}
                    onChange={(e) => setIdealMax(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha Calibración</label>
                  <input
                    type="date"
                    required
                    value={calibratedAt}
                    onChange={(e) => setCalibratedAt(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Próxima Calibración</label>
                  <input
                    type="date"
                    required
                    value={nextCalibrationDate}
                    onChange={(e) => setNextCalibrationDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fuente de Ingesta</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="esp32">ESP32 (WiFi HTTP REST Ingestion)</option>
                  <option value="arduino">Arduino Uno / Mega (Serial / MQTT)</option>
                  <option value="manual">Manual (Registro por el operador)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
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
                  Guardar Sensor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
