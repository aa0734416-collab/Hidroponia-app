import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { DashboardView } from './components/views/DashboardView';
import { SystemsView } from './components/views/SystemsView';
import { PlantsView } from './components/views/PlantsView';
import { PlantDetailModal } from './components/views/PlantDetailModal';
import { QrScannerView } from './components/views/QrScannerView';
import { SensorsView } from './components/views/SensorsView';
import { MeasurementsView } from './components/views/MeasurementsView';
import { PhotosAiView } from './components/views/PhotosAiView';
import { ForageView } from './components/views/ForageView';
import { WaterView } from './components/views/WaterView';
import { NutrientsView } from './components/views/NutrientsView';
import { MaintenanceView } from './components/views/MaintenanceView';
import { CalendarView } from './components/views/CalendarView';
import { AlertsView } from './components/views/AlertsView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';

import { api } from './services/api';
import { initialData } from './defaultData';
import {
  AppData,
  User,
  Plant,
  HydroSystem,
  Measurement,
  ForageLot,
  PhotoRecord,
  WaterRefillRecord,
  NutrientApplicationRecord,
  MaintenanceEquipment,
  MaintenanceLog,
  ScheduledTask,
  SensorConfig,
  GeminiAnalysisResult,
} from './types';

export function normalizeAppData(raw: any): AppData {
  const base = initialData;
  if (!raw || typeof raw !== 'object') {
    return JSON.parse(JSON.stringify(base));
  }

  const tasksList = Array.isArray(raw.tasks)
    ? raw.tasks
    : Array.isArray(raw.calendarTasks)
    ? raw.calendarTasks
    : base.tasks || [];

  const calendarTasksList = Array.isArray(raw.calendarTasks)
    ? raw.calendarTasks
    : tasksList;

  const nutrientLogsList = Array.isArray(raw.nutrientLogs)
    ? raw.nutrientLogs
    : Array.isArray(raw.nutrientRecords)
    ? raw.nutrientRecords
    : base.nutrientLogs || [];

  const nutrientRecordsList = Array.isArray(raw.nutrientRecords)
    ? raw.nutrientRecords
    : nutrientLogsList;

  return {
    ...base,
    ...raw,
    systems: Array.isArray(raw.systems) ? raw.systems : base.systems || [],
    plants: Array.isArray(raw.plants) ? raw.plants : base.plants || [],
    sensors: Array.isArray(raw.sensors) ? raw.sensors : base.sensors || [],
    measurements: Array.isArray(raw.measurements) ? raw.measurements : base.measurements || [],
    forageLots: Array.isArray(raw.forageLots) ? raw.forageLots : base.forageLots || [],
    waterRefills: Array.isArray(raw.waterRefills) ? raw.waterRefills : base.waterRefills || [],
    nutrientProducts: Array.isArray(raw.nutrientProducts) ? raw.nutrientProducts : base.nutrientProducts || [],
    nutrientLogs: nutrientLogsList,
    nutrientRecords: nutrientRecordsList,
    maintenanceLogs: Array.isArray(raw.maintenanceLogs) ? raw.maintenanceLogs : base.maintenanceLogs || [],
    equipments: Array.isArray(raw.equipments) ? raw.equipments : base.equipments || [],
    tasks: tasksList,
    calendarTasks: calendarTasksList,
    alerts: Array.isArray(raw.alerts) ? raw.alerts : base.alerts || [],
    photos: Array.isArray(raw.photos) ? raw.photos : base.photos || [],
    location: raw.location || base.location,
    weather: raw.weather || base.weather,
  };
}

export const normalizeTab = (tab: string): string => {
  const map: Record<string, string> = {
    'inicio': 'dashboard',
    'dashboard': 'dashboard',
    'mis-sistemas': 'systems',
    'systems': 'systems',
    'mis-plantas': 'plants',
    'plants': 'plants',
    'sensores': 'sensors',
    'sensors': 'sensors',
    'mediciones': 'measurements',
    'measurements': 'measurements',
    'escanear-qr': 'qr-scanner',
    'qr-scanner': 'qr-scanner',
    'fotografias-ia': 'photos-ai',
    'photos-ai': 'photos-ai',
    'forraje': 'forage',
    'forage': 'forage',
    'agua': 'water',
    'water': 'water',
    'nutrientes': 'nutrients',
    'nutrients': 'nutrients',
    'mantenimiento': 'maintenance',
    'maintenance': 'maintenance',
    'calendario': 'calendar',
    'calendar': 'calendar',
    'alertas': 'alerts',
    'alerts': 'alerts',
    'informes': 'reports',
    'reportes': 'reports',
    'reports': 'reports',
    'configuracion': 'settings',
    'settings': 'settings',
  };
  return map[tab] || tab;
};

export default function App() {
  const [data, setData] = useState<AppData>(() => normalizeAppData(initialData));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleNavigate = (tab: string) => {
    setActiveTab(normalizeTab(tab));
    setIsMobileSidebarOpen(false);
  };

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [selectedPlantForModal, setSelectedPlantForModal] = useState<Plant | null>(null);
  const [preselectedSystemIdForPlants, setPreselectedSystemIdForPlants] = useState<string | null>(null);
  const [selectedForageLotForDetail, setSelectedForageLotForDetail] = useState<ForageLot | null>(null);
  const [openNewMeasurementModalDirectly, setOpenNewMeasurementModalDirectly] = useState(false);

  // Initialize and check user session
  useEffect(() => {
    const initApp = async () => {
      try {
        const currentUser = await api.getMe();
        if (currentUser) {
          setUser(currentUser);
          const userData = await api.getUserData();
          setData(normalizeAppData(userData));
        } else {
          // Check weather for initial default location
          try {
            const weather = await api.getWeather(initialData.latitude, initialData.longitude);
            setData((prev) => normalizeAppData({ ...prev, weather }));
          } catch (e) {
            console.warn('Weather fetch error:', e);
          }
        }
      } catch (err) {
        console.warn('Init error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  // Save changes to backend if logged in
  const persistData = async (updatedData: AppData) => {
    const normalized = normalizeAppData(updatedData);
    setData(normalized);
    if (user) {
      try {
        await api.saveUserData(normalized);
      } catch (err) {
        console.warn('Auto-save error:', err);
      }
    }
  };

  // Auth handlers
  const handleAuthSuccess = async (loggedUser: User) => {
    setUser(loggedUser);
    setIsAuthModalOpen(false);
    try {
      const userData = await api.getUserData();
      setData(normalizeAppData(userData));
    } catch (e) {
      console.warn('Error loading user data:', e);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setData(normalizeAppData(initialData));
  };

  // Weather refresher
  const handleRefreshWeather = async () => {
    try {
      const weather = await api.getWeather(data.latitude, data.longitude);
      setData((prev) => ({ ...prev, weather }));
    } catch (e) {
      console.warn('Weather refresh failed:', e);
    }
  };

  // State update actions
  const handleSavePlant = (newPlant: Plant) => {
    const exists = data.plants.some((p) => p.id === newPlant.id);
    const updatedPlants = exists
      ? data.plants.map((p) => (p.id === newPlant.id ? newPlant : p))
      : [newPlant, ...data.plants];

    const updated = { ...data, plants: updatedPlants };
    persistData(updated);
    setSelectedPlantForModal(newPlant);
  };

  const handleUpdatePlantDiagnosis = (plantId: string, diagnosis: GeminiAnalysisResult) => {
    const updatedPlants = data.plants.map((p) => {
      if (p.id === plantId) {
        return {
          ...p,
          geminiDiagnosis: diagnosis,
          status:
            diagnosis.healthStatus === 'Saludable'
              ? ('healthy' as const)
              : diagnosis.healthStatus === 'Observación'
              ? ('needs_observation' as const)
              : ('needs_attention' as const),
        };
      }
      return p;
    });

    const updated = { ...data, plants: updatedPlants };
    persistData(updated);

    if (selectedPlantForModal?.id === plantId) {
      const found = updatedPlants.find((p) => p.id === plantId);
      if (found) setSelectedPlantForModal(found);
    }
  };

  const handleSaveSystem = (newSystem: HydroSystem) => {
    const exists = data.systems.some((s) => s.id === newSystem.id);
    const updatedSystems = exists
      ? data.systems.map((s) => (s.id === newSystem.id ? newSystem : s))
      : [...data.systems, newSystem];

    const updated = { ...data, systems: updatedSystems };
    persistData(updated);
  };

  const handleSaveMeasurement = (measurement: Measurement) => {
    const updatedMeasurements = [...data.measurements, measurement];

    // Check if measurement generates an alert
    const newAlerts = [...data.alerts];
    if (measurement.sensorType === 'ph') {
      if (measurement.value < 5.4 || measurement.value > 6.8) {
        newAlerts.unshift({
          id: 'alt-' + Date.now().toString(36),
          level: 'needs_attention',
          systemId: measurement.systemId,
          variable: 'pH del Agua',
          currentValue: `${measurement.value} pH`,
          idealRange: '5.6 - 6.5 pH',
          message: `pH crítico en ${measurement.systemId} (${measurement.value})`,
          suggestedAction:
            measurement.value > 6.8
              ? 'Aplicar solución pH Down (ácido fosfórico) para retornar al rango ideal.'
              : 'Aplicar solución pH Up o reponer agua desclorada.',
          timestamp: new Date().toISOString(),
          acknowledged: false,
        });
      } else if (measurement.value < 5.6 || measurement.value > 6.5) {
        newAlerts.unshift({
          id: 'alt-' + Date.now().toString(36),
          level: 'observation',
          systemId: measurement.systemId,
          variable: 'pH del Agua',
          currentValue: `${measurement.value} pH`,
          idealRange: '5.6 - 6.5 pH',
          message: `pH fuera de rango óptimo (${measurement.value})`,
          suggestedAction: 'Vigilar próxima lectura en 12 horas antes de dosificar ácido.',
          timestamp: new Date().toISOString(),
          acknowledged: false,
        });
      }
    }

    const updated = {
      ...data,
      measurements: updatedMeasurements,
      alerts: newAlerts,
    };
    persistData(updated);
  };

  const handleSaveSensor = (sensor: SensorConfig) => {
    const exists = data.sensors.some((s) => s.id === sensor.id);
    const updatedSensors = exists
      ? data.sensors.map((s) => (s.id === sensor.id ? sensor : s))
      : [...data.sensors, sensor];

    const updated = { ...data, sensors: updatedSensors };
    persistData(updated);
  };

  const handleSavePhoto = (photo: PhotoRecord) => {
    const exists = data.photos.some((p) => p.id === photo.id);
    const updatedPhotos = exists
      ? data.photos.map((p) => (p.id === photo.id ? photo : p))
      : [photo, ...data.photos];

    const updated = { ...data, photos: updatedPhotos };
    persistData(updated);
  };

  const handleSaveForageLot = (lot: ForageLot) => {
    const exists = data.forageLots.some((l) => l.id === lot.id);
    const updatedLots = exists
      ? data.forageLots.map((l) => (l.id === lot.id ? lot : l))
      : [...data.forageLots, lot];

    const updated = { ...data, forageLots: updatedLots };
    persistData(updated);
    setSelectedForageLotForDetail(lot);
  };

  const handleSaveRefill = (refill: WaterRefillRecord) => {
    const updatedRefills = [refill, ...data.waterRefills];
    const updated = { ...data, waterRefills: updatedRefills };
    persistData(updated);
  };

  const handleUpdateSystemWaterLevel = (systemId: string, newLevel: number) => {
    const updatedSystems = data.systems.map((s) =>
      s.id === systemId ? { ...s, currentWaterLevelLiters: newLevel } : s
    );
    const updated = { ...data, systems: updatedSystems };
    persistData(updated);
  };

  const handleSaveNutrientRecord = (record: NutrientApplicationRecord) => {
    const updatedRecords = [record, ...data.nutrientRecords];
    const updated = { ...data, nutrientRecords: updatedRecords };
    persistData(updated);
  };

  const handleUpdateEquipment = (eq: MaintenanceEquipment) => {
    const updatedEquipments = data.equipments.map((e) => (e.id === eq.id ? eq : e));
    const updated = { ...data, equipments: updatedEquipments };
    persistData(updated);
  };

  const handleSaveMaintenanceLog = (log: MaintenanceLog) => {
    const updatedLogs = [log, ...data.maintenanceLogs];
    const updated = { ...data, maintenanceLogs: updatedLogs };
    persistData(updated);
  };

  const handleSaveTask = (task: ScheduledTask) => {
    const exists = data.tasks.some((t) => t.id === task.id);
    const updatedTasks = exists
      ? data.tasks.map((t) => (t.id === task.id ? task : t))
      : [task, ...data.tasks];

    const updated = { ...data, tasks: updatedTasks };
    persistData(updated);
  };

  const handleToggleTaskComplete = (taskId: string) => {
    const updatedTasks = data.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    const updated = { ...data, tasks: updatedTasks };
    persistData(updated);
  };

  const handlePostponeTask = (taskId: string, days: number) => {
    const updatedTasks = data.tasks.map((t) => {
      if (t.id === taskId) {
        const d = new Date(t.dueDate);
        d.setDate(d.getDate() + days);
        return { ...t, dueDate: d.toISOString().split('T')[0] };
      }
      return t;
    });
    const updated = { ...data, tasks: updatedTasks };
    persistData(updated);
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    const updatedAlerts = data.alerts.map((a) =>
      a.id === alertId ? { ...a, acknowledged: true } : a
    );
    const updated = { ...data, alerts: updatedAlerts };
    persistData(updated);
  };

  const handleUpdateLocation = (locationName: string, lat: number, lon: number) => {
    const updated = {
      ...data,
      locationName,
      latitude: lat,
      longitude: lon,
    };
    persistData(updated);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-white font-black text-lg">HydroControl</div>
          <div className="text-xs text-slate-400">Cargando sistema de hidroponía en La Bocana...</div>
        </div>
      </div>
    );
  }

  const unreadAlertsCount = (data.alerts || []).filter((a) => !a.acknowledged).length;
  const pendingTasksCount = (data.tasks || data.calendarTasks || []).filter((t) => !t.completed).length;

  return (
    <div id="hydrocontrol-app" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        user={user}
        location={data.location}
        weather={data.weather}
        alerts={data.alerts || []}
        tasks={data.tasks || data.calendarTasks || []}
        unreadAlertsCount={unreadAlertsCount}
        onNavigate={handleNavigate}
        onOpenLogin={() => {
          setAuthMode('login');
          setIsAuthModalOpen(true);
        }}
        onOpenRegister={() => {
          setAuthMode('register');
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenAlerts={() => handleNavigate('alerts')}
        onOpenSettings={() => handleNavigate('settings')}
        onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          currentView={activeTab}
          onTabChange={handleNavigate}
          onNavigate={handleNavigate}
          unreadAlertsCount={unreadAlertsCount}
          pendingTasksCount={pendingTasksCount}
          isMobileOpen={isMobileSidebarOpen}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Content View Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardView
              data={data}
              onNavigate={handleNavigate}
              onSelectPlant={(plant) => setSelectedPlantForModal(plant)}
              onOpenPlantDetail={(plant) => setSelectedPlantForModal(plant)}
              onQuickNewMeasurement={() => {
                handleNavigate('measurements');
                setOpenNewMeasurementModalDirectly(true);
              }}
              onOpenNewMeasurement={() => {
                handleNavigate('measurements');
                setOpenNewMeasurementModalDirectly(true);
              }}
              onOpenNewPlant={() => handleNavigate('plants')}
              onQuickScanQr={() => handleNavigate('qr-scanner')}
              onAcknowledgeAlert={handleAcknowledgeAlert}
            />
          )}

          {activeTab === 'systems' && (
            <SystemsView
              data={data}
              onSaveSystem={handleSaveSystem}
              onViewSystemPlants={(sysId) => {
                setPreselectedSystemIdForPlants(sysId);
                setActiveTab('plants');
              }}
            />
          )}

          {activeTab === 'plants' && (
            <PlantsView
              data={data}
              onSelectPlant={(plant) => setSelectedPlantForModal(plant)}
              onSavePlant={handleSavePlant}
              preselectedSystemId={preselectedSystemIdForPlants}
            />
          )}

          {activeTab === 'qr-scanner' && (
            <QrScannerView
              data={data}
              onOpenPlantDetail={(plant) => {
                setSelectedPlantForModal(plant);
              }}
              onOpenForageLot={(lot) => {
                setSelectedForageLotForDetail(lot);
                setActiveTab('forage');
              }}
            />
          )}

          {activeTab === 'sensors' && (
            <SensorsView
              data={data}
              onSaveSensor={handleSaveSensor}
              onRefreshData={() => {
                // If user simulated IoT data, fetch fresh user data
                api.getUserData().then(setData).catch(console.warn);
              }}
            />
          )}

          {activeTab === 'measurements' && (
            <MeasurementsView
              data={data}
              onSaveMeasurement={handleSaveMeasurement}
              isOpenNewModalOnInit={openNewMeasurementModalDirectly}
              onCloseInitModal={() => setOpenNewMeasurementModalDirectly(false)}
            />
          )}

          {activeTab === 'photos-ai' && (
            <PhotosAiView
              data={data}
              onSavePhoto={handleSavePhoto}
              onUpdatePlantDiagnosis={handleUpdatePlantDiagnosis}
            />
          )}

          {activeTab === 'forage' && (
            <ForageView
              data={data}
              onSaveLot={handleSaveForageLot}
              selectedLotOnInit={selectedForageLotForDetail}
              onClearSelectedLotOnInit={() => setSelectedForageLotForDetail(null)}
            />
          )}

          {activeTab === 'water' && (
            <WaterView
              data={data}
              onSaveRefill={handleSaveRefill}
              onUpdateSystemWaterLevel={handleUpdateSystemWaterLevel}
            />
          )}

          {activeTab === 'nutrients' && (
            <NutrientsView
              data={data}
              onSaveNutrientRecord={handleSaveNutrientRecord}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenanceView
              data={data}
              onUpdateEquipment={handleUpdateEquipment}
              onSaveMaintenanceLog={handleSaveMaintenanceLog}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              data={data}
              onSaveTask={handleSaveTask}
              onToggleTaskComplete={handleToggleTaskComplete}
              onPostponeTask={handlePostponeTask}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsView
              data={data}
              onAcknowledgeAlert={handleAcknowledgeAlert}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView data={data} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              data={data}
              user={user}
              onUpdateLocation={handleUpdateLocation}
              onRefreshWeather={handleRefreshWeather}
              onOpenForgotPassword={() => {
                setAuthMode('forgot');
                setIsAuthModalOpen(true);
              }}
            />
          )}
        </main>
      </div>

      {/* Plant Detail & Diagnosis Modal */}
      {selectedPlantForModal && (
        <PlantDetailModal
          plant={selectedPlantForModal}
          data={data}
          onClose={() => setSelectedPlantForModal(null)}
          onSavePlant={handleSavePlant}
          onDiagnoseWithAi={async (plant, base64) => {
            const system = data.systems.find((s) => s.id === plant.systemId);
            const diag = await api.analyzePlantWithGemini({
              imageBase64: base64,
              plantCode: plant.code,
              species: plant.species,
              variety: plant.variety,
              systemType: system?.name || 'Hidroponía',
              observations: plant.observations,
            });
            handleUpdatePlantDiagnosis(plant.id, diag);
          }}
        />
      )}

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
