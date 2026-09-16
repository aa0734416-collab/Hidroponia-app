export type UserRole = 'owner' | 'operator' | 'technician' | 'viewer';

export interface User {
  id: string;
  name?: string;
  fullName?: string;
  username: string;
  email: string;
  avatar?: string;
  position?: string; // Cargo / Rol profesional (ej: Administrador General, Agrónomo, Operador Hidropónico)
  phone?: string;
  farmName?: string; // Nombre de la finca / empresa
  role?: UserRole;
  qrCode?: string; // Código QR generado para la credencial de acceso
  authProvider?: 'local' | 'google';
  googleId?: string;
  apiKey?: string;
  createdAt: string;
}

export type HydroSystemType = 'dwc' | 'vertical_tubes' | 'aeroponics' | 'nft' | 'other';
export type SystemStatus = 'active' | 'maintenance' | 'harvested' | 'inactive';

export interface HydroSystem {
  id: string;
  name: string;
  type: HydroSystemType;
  capacityLiters: number;
  plantsCapacity?: number;
  maxCapacity?: number;
  currentPlantsCount: number;
  location: string;
  installationDate: string;
  componentsList: string[];
  componentsDetail?: {
    dwc?: {
      hasAerator: boolean;
      aeratorModel?: string;
      hose: boolean;
      diffuserStone: boolean;
      containerType: string;
      cupsCount: number;
      foamType: string;
    };
    vertical?: {
      waterPump: boolean;
      waterPumpModel?: string;
      hoses: boolean;
      tubesCount: number;
      cupsCount: number;
      foamType: string;
      distributionSystem: string;
    };
    aeroponic?: {
      highPressurePump: boolean;
      nozzlesCount: number;
      sprayFrequencyMin: number;
      dropletCollector: boolean;
    };
  };
  photos: string[];
  notes: string;
  status: SystemStatus;
  currentWaterLevelLiters: number;
  minWaterLevelLiters: number;
}

export type PlantStatus = 'healthy' | 'needs_observation' | 'needs_attention' | 'harvested' | 'lost';

export interface GeminiAnalysisResult {
  analyzedAt: string;
  imageUrl?: string;
  healthStatus: 'Saludable' | 'Observación' | 'Atención Requerida';
  overallCondition: string;
  leafEvaluation: {
    coloration: string;
    yellowing: boolean;
    spots: boolean;
    wilting: boolean;
    details: string;
  };
  rootEvaluation?: string;
  possibleCauses: string[];
  generalRecommendations: string[];
  recommendedWaterChecks: string[];
  disclaimer: string;
}

export interface PlantGrowthRecord {
  id: string;
  date: string;
  dayNumber: number;
  heightCm: number;
  leavesCount: number;
  rootDevelopment: 'inicial' | 'moderado' | 'abundante' | 'vigoroso' | 'en_observacion';
  plantSizeNotes?: string;
  weightGrams?: number;
  status: PlantStatus;
  photo?: string;
  waterPh?: number;
  waterEc?: number;
  waterTemp?: number;
  waterMeasurements?: {
    ph?: number;
    ec?: number;
    tds?: number;
    waterTemp?: number;
  };
  notes?: string;
  aiAnalysis?: GeminiAnalysisResult;
}

export type PlantHistoryLog = PlantGrowthRecord;

export interface Plant {
  id: string;
  code: string;
  species: string;
  variety: string;
  systemId: string;
  position?: string;
  seedingDate?: string;
  sowingDate?: string;
  germinationDate: string;
  transplantDate: string;
  estimatedHarvestDate: string;
  actualHarvestDate?: string;
  harvestYieldGrams?: number;
  initialPhoto?: string;
  observations: string;
  status: PlantStatus;
  currentHeightCm: number;
  currentLeavesCount: number;
  rootDevelopment: 'inicial' | 'moderado' | 'abundante' | 'vigoroso' | 'en_observacion';
  historyLogs?: PlantHistoryLog[];
  growthHistory?: PlantGrowthRecord[];
  qrCodeDataUrl?: string;
  qrCodeValue?: string;
  geminiDiagnosis?: GeminiAnalysisResult;
}

export type SensorType = 
  | 'ph' 
  | 'water_temp' 
  | 'ec' 
  | 'tds' 
  | 'salinity' 
  | 'dissolved_oxygen' 
  | 'ambient_temp' 
  | 'ambient_humidity' 
  | 'water_level' 
  | 'other';

export interface SensorConfig {
  id: string;
  name: string;
  type: SensorType;
  variable?: string;
  variableMeasured?: string;
  unit: string;
  systemId: string;
  calibrationDate?: string;
  calibratedAt?: string;
  nextCalibrationDate?: string;
  status: 'active' | 'calibrating' | 'faulty' | 'inactive';
  minIdeal?: number;
  maxIdeal?: number;
  idealRangeMin?: number;
  idealRangeMax?: number;
  source: 'manual' | 'esp32_iot' | 'arduino';
}

export interface Measurement {
  id: string;
  timestamp: string;
  systemId: string;
  plantId?: string;
  sensorId?: string;
  sensorType: SensorType;
  value: number;
  unit: string;
  notes?: string;
  source: 'manual' | 'esp32' | 'arduino' | 'api';
}

export interface ForageGrowthLog {
  id?: string;
  day?: number;
  dayNumber?: number;
  date: string;
  heightCm: number;
  weightKg: number;
  notes: string;
  photo?: string;
  wateringsApplied?: number;
}

export interface ForageLot {
  id: string;
  code?: string;
  lotCode?: string;
  seedType: string;
  seedAmountKg?: number;
  initialSeedWeightKg?: number;
  initialWeightKg?: number;
  startDate: string;
  germinationDate: string;
  trayId?: string;
  trayIdentifier?: string;
  dailyWateringsCount?: number;
  ambientTemp?: number;
  temperatureAvg?: number;
  ambientHumidity?: number;
  humidityAvg?: number;
  waterPh?: number;
  phAvg?: number;
  waterEc?: number;
  ecAvg?: number;
  currentHeightCm: number;
  currentWeightKg: number;
  harvestDate?: string;
  finalWeightKg?: number;
  yieldMultiplier?: number;
  yieldRatio?: number;
  photos: string[];
  notes: string;
  status: 'active' | 'harvested' | 'discarded' | 'growing';
  qrCodeDataUrl?: string;
  qrCodeValue?: string;
  growthDays?: ForageGrowthLog[];
  growthLogs?: ForageGrowthLog[];
}

export interface WaterRefillRecord {
  id: string;
  date?: string;
  timestamp?: string;
  systemId: string;
  litersAdded: number;
  previousVolumeLiters?: number;
  newVolumeLiters?: number;
  waterSource?: string;
  notes: string;
}

export type WaterRefill = WaterRefillRecord;

export interface NutrientComponent {
  name: string;
  dosePerLiter: number;
  unit: string;
}

export interface NutrientProduct {
  id: string;
  name: string;
  brand: string;
  type: 'nutrient_a' | 'nutrient_b' | 'nutrient_c' | 'ph_up' | 'ph_down';
  composition: string;
  concentration: string;
  recommendedDosePerLiter: number;
  unit: 'ml' | 'g';
  instructions: string;
}

export interface NutrientApplicationRecord {
  id: string;
  date?: string;
  timestamp?: string;
  systemId: string;
  formulaName?: string;
  waterVolumeLiters?: number;
  components?: NutrientComponent[];
  solutionA_mlPerL?: number;
  solutionB_mlPerL?: number;
  micronutrients_mlPerL?: number;
  phRegulator?: string;
  phRegulator_mlPerL?: number;
  phBefore?: number;
  phAfter?: number;
  ecBefore?: number;
  ecAfter?: number;
  tdsBefore?: number;
  tdsAfter?: number;
  productId?: string;
  productName?: string;
  doseApplied?: number;
  doseMl?: number;
  unit?: 'ml' | 'g';
  notes?: string;
}

export type NutrientLog = NutrientApplicationRecord;

export interface EquipmentMaintenance {
  id: string;
  systemId: string;
  systemName?: string;
  equipmentItem: string;
  equipmentId?: string;
  date?: string;
  action?: string;
  actionType: 'limpieza' | 'revision_bomba' | 'cambio_agua' | 'limpieza_mangueras' | 'calibracion_sensores' | 'desinfeccion' | 'reemplazo';
  performedAt?: string;
  performedBy?: string;
  nextScheduledDate: string;
  technician: string;
  notes: string;
  status: 'completed' | 'scheduled' | 'overdue';
}

export type MaintenanceLog = EquipmentMaintenance;

export interface MaintenanceEquipment {
  id: string;
  name: string;
  type: string;
  systemId: string;
  status: 'good' | 'warning' | 'needs_service';
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  operatingHours?: number;
  notes?: string;
}

export interface ScheduledTask {
  id: string;
  title: string;
  description?: string;
  category?: string;
  date?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  repeat?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  isRecurring?: boolean;
  recurrencePeriod?: string;
  completed: boolean;
  systemId?: string;
  notes?: string;
}

export type AgriculturalCalendarTask = ScheduledTask;

export type AlertLevel = 'normal' | 'observation' | 'needs_attention';

export interface AlertItem {
  id: string;
  level?: AlertLevel;
  severity?: 'normal' | 'observation' | 'attention';
  title?: string;
  systemId?: string;
  systemName?: string;
  plantId?: string;
  parameter?: string;
  variable?: string;
  currentValue?: string | number;
  value?: string | number;
  idealRange: string;
  message: string;
  suggestedAction?: string;
  timestamp: string;
  acknowledged: boolean;
}

export type SystemAlert = AlertItem;

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed?: number;
  condition?: string;
  lastUpdated?: string;
}

export interface CultivationLocation {
  placeName: string;
  latitude: number;
  longitude: number;
  elevationMeters: number;
  notes: string;
  currentWeather?: {
    temperature: number;
    tempMin: number;
    tempMax: number;
    humidity: number;
    precipitationMm: number;
    windSpeedKmh: number;
    weatherCodeDescription: string;
    lastUpdated: string;
  };
  weatherHistory?: {
    date: string;
    tempExterior: number;
    tempMin: number;
    tempMax: number;
    humidity: number;
    rainMm: number;
  }[];
}

export interface PhotoRecord {
  id: string;
  url: string;
  timestamp?: string;
  capturedAt?: string;
  targetType?: 'plant' | 'system' | 'forage' | 'other';
  associatedEntityType?: string;
  associatedEntityId?: string;
  targetId?: string;
  targetCode?: string;
  targetName?: string;
  notes?: string;
  caption?: string;
  aiAnalysis?: GeminiAnalysisResult;
  geminiAnalysis?: GeminiAnalysisResult;
}

export interface AppData {
  user?: User | null;
  userIotApiKey?: string;
  locationName?: string;
  latitude: number;
  longitude: number;
  weather?: WeatherData;
  location?: CultivationLocation;

  systems: HydroSystem[];
  plants: Plant[];
  sensors: SensorConfig[];
  measurements: Measurement[];
  forageLots: ForageLot[];
  waterRefills: WaterRefillRecord[];
  nutrientProducts: NutrientProduct[];
  nutrientLogs: NutrientApplicationRecord[];
  nutrientRecords: NutrientApplicationRecord[];
  maintenanceLogs: EquipmentMaintenance[];
  equipments: MaintenanceEquipment[];
  calendarTasks: ScheduledTask[];
  tasks: ScheduledTask[];
  alerts: SystemAlert[];
  photos: PhotoRecord[];
}
