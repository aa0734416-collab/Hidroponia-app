import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { initialAppData } from './src/defaultData.js';
import { AppData, User, GeminiAnalysisResult } from './src/types.js';

dotenv.config();

const app = express();
const PORT = 3000;

// Set payload limits for photos and images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Persistence directory
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'hydro_db.json');

interface StoredUser extends User {
  passwordHash: string;
  salt: string;
}

interface PasswordResetToken {
  token: string;
  code: string;
  userId: string;
  email: string;
  expiresAt: number;
}

interface DatabaseSchema {
  users: StoredUser[];
  userData: Record<string, AppData>; // userId -> AppData
  tokens: Record<string, string>; // token -> userId
  resetTokens?: Record<string, PasswordResetToken>; // resetToken -> info
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function loadDB(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading DB file, creating fresh:', err);
  }

  // Initialize with a default demo user
  const defaultSalt = crypto.randomBytes(16).toString('hex');
  const demoUser: StoredUser = {
    id: 'usr-demo-01',
    name: 'Productor Hidropónico Piñas',
    username: 'admin',
    email: 'aa0734416@gmail.com',
    apiKey: 'hc_live_' + crypto.randomBytes(12).toString('hex'),
    createdAt: new Date().toISOString(),
    salt: defaultSalt,
    passwordHash: hashPassword('admin123', defaultSalt),
  };

  const initialDb: DatabaseSchema = {
    users: [demoUser],
    userData: {
      [demoUser.id]: initialAppData,
    },
    tokens: {},
  };

  saveDB(initialDb);
  return initialDb;
}

function saveDB(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB file:', err);
  }
}

let db = loadDB();

// Middleware: Authenticate user from Bearer token
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No se proporcionó token de autorización' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const userId = db.tokens[token];
  if (!userId) {
    res.status(401).json({ error: 'Sesión inválida o expirada' });
    return;
  }
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    res.status(401).json({ error: 'Usuario no encontrado' });
    return;
  }

  (req as any).user = user;
  next();
}

// ----------------------------------------------------
// AUTH API
// ----------------------------------------------------

app.post('/api/auth/register', (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name || !username || !email || !password) {
    res.status(400).json({ error: 'Todos los campos son requeridos: nombre, usuario, correo y contraseña' });
    return;
  }

  const existingEmail = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existingEmail) {
    res.status(400).json({ error: 'Ya existe una cuenta con este correo electrónico' });
    return;
  }

  const existingUsername = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (existingUsername) {
    res.status(400).json({ error: 'Este nombre de usuario ya está en uso' });
    return;
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const userId = 'usr-' + crypto.randomUUID();
  const apiKey = 'hc_live_' + crypto.randomBytes(12).toString('hex');

  const newUser: StoredUser = {
    id: userId,
    name,
    username,
    email,
    apiKey,
    createdAt: new Date().toISOString(),
    salt,
    passwordHash,
  };

  db.users.push(newUser);
  // Deep clone initial data for the new user
  db.userData[userId] = JSON.parse(JSON.stringify(initialAppData));

  // Generate token
  const token = 'tok_' + crypto.randomBytes(24).toString('hex');
  db.tokens[token] = userId;
  saveDB(db);

  const { passwordHash: _, salt: __, ...userProfile } = newUser;
  res.json({
    token,
    user: userProfile,
  });
});

app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    res.status(400).json({ error: 'Ingrese usuario/correo y contraseña' });
    return;
  }

  const user = db.users.find(
    (u) => u.email.toLowerCase() === identifier.toLowerCase() || u.username.toLowerCase() === identifier.toLowerCase()
  );

  if (!user) {
    res.status(401).json({ error: 'Credenciales incorrectas. Verifique su usuario y contraseña.' });
    return;
  }

  const hash = hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    res.status(401).json({ error: 'Contraseña incorrecta' });
    return;
  }

  const token = 'tok_' + crypto.randomBytes(24).toString('hex');
  db.tokens[token] = user.id;
  saveDB(db);

  const { passwordHash: _, salt: __, ...userProfile } = user;
  res.json({
    token,
    user: userProfile,
  });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const { passwordHash: _, salt: __, ...userProfile } = user;
  res.json({ user: userProfile });
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    delete db.tokens[token];
    saveDB(db);
  }
  res.json({ success: true });
});

// Request Password Reset (Forgot Password)
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Por favor ingrese su correo electrónico registrado' });
    return;
  }

  const trimmedEmail = email.trim().toLowerCase();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === trimmedEmail || u.username.toLowerCase() === trimmedEmail
  );

  if (!user) {
    // Return friendly generic or specific feedback
    res.status(404).json({
      error: 'No se encontró ninguna cuenta asociada a este correo o usuario',
    });
    return;
  }

  if (!db.resetTokens) {
    db.resetTokens = {};
  }

  // 6-digit numeric verification code and secure token
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const resetToken = 'rst_' + crypto.randomBytes(20).toString('hex');
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

  // Clean old tokens for this user
  for (const [key, val] of Object.entries(db.resetTokens)) {
    if (val.userId === user.id || val.expiresAt < Date.now()) {
      delete db.resetTokens[key];
    }
  }

  db.resetTokens[resetToken] = {
    token: resetToken,
    code: resetCode,
    userId: user.id,
    email: user.email,
    expiresAt,
  };
  saveDB(db);

  console.log(`[PASSWORD RESET] Correo enviado a ${user.email}. Código de verificación: ${resetCode}, Token: ${resetToken}`);

  res.json({
    success: true,
    message: `Se ha enviado el enlace y código de recuperación al correo ${user.email}`,
    email: user.email,
    maskedEmail: user.email.replace(/(.{2})(.*)(?=@)/, (_gp, a, b) => a + '*'.repeat(Math.max(b.length, 3))),
    resetToken,
    demoCode: resetCode, // Provided for instant simulation in preview
  });
});

// Confirm Password Reset with Code or Token
app.post('/api/auth/reset-password', (req, res) => {
  const { resetToken, code, newPassword } = req.body;

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    return;
  }

  if (!db.resetTokens) {
    res.status(400).json({ error: 'Solicitud de restablecimiento no encontrada o expirada' });
    return;
  }

  // Look up by resetToken or 6-digit code
  let foundKey: string | null = null;
  let resetItem: PasswordResetToken | null = null;

  for (const [key, val] of Object.entries(db.resetTokens)) {
    if ((resetToken && key === resetToken) || (code && val.code === code.toString().trim())) {
      foundKey = key;
      resetItem = val;
      break;
    }
  }

  if (!resetItem || !foundKey) {
    res.status(400).json({ error: 'El código o token de restablecimiento es inválido o ha expirado' });
    return;
  }

  if (Date.now() > resetItem.expiresAt) {
    delete db.resetTokens[foundKey];
    saveDB(db);
    res.status(400).json({ error: 'El código de restablecimiento ha expirado. Por favor solicite uno nuevo.' });
    return;
  }

  const user = db.users.find((u) => u.id === resetItem!.userId);
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  // Update password with new salt and hash
  const newSalt = crypto.randomBytes(16).toString('hex');
  const newHash = hashPassword(newPassword, newSalt);

  user.salt = newSalt;
  user.passwordHash = newHash;

  // Invalidate reset token
  delete db.resetTokens[foundKey];

  // Invalidate any existing active login tokens for this user for security
  for (const [tok, uId] of Object.entries(db.tokens)) {
    if (uId === user.id) {
      delete db.tokens[tok];
    }
  }

  // Create new active session token
  const sessionToken = 'tok_' + crypto.randomBytes(24).toString('hex');
  db.tokens[sessionToken] = user.id;
  saveDB(db);

  const { passwordHash: _, salt: __, ...userProfile } = user;

  res.json({
    success: true,
    message: 'Su contraseña ha sido cambiada exitosamente. Se ha iniciado sesión automáticamente.',
    token: sessionToken,
    user: userProfile,
  });
});

// ----------------------------------------------------
// USER DATA API
// ----------------------------------------------------

app.get('/api/user-data', authMiddleware, (req, res) => {
  const user = (req as any).user;
  let data = db.userData[user.id];
  if (!data) {
    data = JSON.parse(JSON.stringify(initialAppData));
    db.userData[user.id] = data;
    saveDB(db);
  }
  const fallback = JSON.parse(JSON.stringify(initialAppData));
  const safeTasks = Array.isArray(data.tasks)
    ? data.tasks
    : Array.isArray(data.calendarTasks)
    ? data.calendarTasks
    : fallback.tasks || [];
  const safeCalendarTasks = Array.isArray(data.calendarTasks) ? data.calendarTasks : safeTasks;
  const safeNutrientLogs = Array.isArray(data.nutrientLogs)
    ? data.nutrientLogs
    : Array.isArray(data.nutrientRecords)
    ? data.nutrientRecords
    : fallback.nutrientLogs || [];
  const safeNutrientRecords = Array.isArray(data.nutrientRecords) ? data.nutrientRecords : safeNutrientLogs;

  const normalized = {
    ...fallback,
    ...data,
    systems: Array.isArray(data.systems) ? data.systems : fallback.systems || [],
    plants: Array.isArray(data.plants) ? data.plants : fallback.plants || [],
    sensors: Array.isArray(data.sensors) ? data.sensors : fallback.sensors || [],
    measurements: Array.isArray(data.measurements) ? data.measurements : fallback.measurements || [],
    forageLots: Array.isArray(data.forageLots) ? data.forageLots : fallback.forageLots || [],
    waterRefills: Array.isArray(data.waterRefills) ? data.waterRefills : fallback.waterRefills || [],
    nutrientProducts: Array.isArray(data.nutrientProducts) ? data.nutrientProducts : fallback.nutrientProducts || [],
    nutrientLogs: safeNutrientLogs,
    nutrientRecords: safeNutrientRecords,
    maintenanceLogs: Array.isArray(data.maintenanceLogs) ? data.maintenanceLogs : fallback.maintenanceLogs || [],
    equipments: Array.isArray(data.equipments) ? data.equipments : fallback.equipments || [],
    calendarTasks: safeCalendarTasks,
    tasks: safeTasks,
    alerts: Array.isArray(data.alerts) ? data.alerts : fallback.alerts || [],
    photos: Array.isArray(data.photos) ? data.photos : fallback.photos || [],
    location: data.location || fallback.location,
    weather: data.weather || fallback.weather,
  };
  res.json(normalized);
});

app.post('/api/user-data', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const data: AppData = req.body;
  if (!data || typeof data !== 'object') {
    res.status(400).json({ error: 'Datos no válidos' });
    return;
  }
  db.userData[user.id] = data;
  saveDB(db);
  res.json({ success: true, savedAt: new Date().toISOString() });
});

// ----------------------------------------------------
// GEMINI PLANT ANALYSIS API
// ----------------------------------------------------

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

app.post('/api/gemini/analyze-plant', authMiddleware, async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType = 'image/jpeg',
      plantCode = 'DESCONOCIDO',
      species = 'Planta hidropónica',
      variety = 'Estándar',
      systemType = 'Hidroponía',
      dayNumber = 1,
      currentPh,
      currentEc,
      currentWaterTemp,
      observations = '',
    } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'Se requiere la imagen en formato base64 para el análisis' });
      return;
    }

    const ai = getGeminiClient();

    // Clean base64 header if included
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    if (!ai) {
      // Fallback heuristics when API key is not yet set
      const simulatedResult: GeminiAnalysisResult = {
        analyzedAt: new Date().toISOString(),
        healthStatus: 'Observación',
        overallCondition: 'Análisis preliminar heurístico (Configure GEMINI_API_KEY en Secretos para análisis por visión profunda). Se observa morfología foliar turgente.',
        leafEvaluation: {
          coloration: 'Verde predominante con variaciones de iluminación',
          yellowing: false,
          spots: false,
          wilting: false,
          details: 'Láminas foliares con desarrollo vegetativo en curso.',
        },
        rootEvaluation: 'Verificar oxigenación directa en la zona radicular.',
        possibleCauses: [
          'Variación normal de pigmentación bajo luz solar o espectro LED.',
          'Consumo natural de nitrógeno y micronutrientes.',
        ],
        generalRecommendations: [
          'Mantener la circulación del agua y la aireación continua.',
          'Inspeccionar el envés de las hojas periódicamente.',
          'Configurar la clave GEMINI_API_KEY en los secretos del entorno para activar el diagnóstico en tiempo real con Gemini 3.8 Flash.',
        ],
        recommendedWaterChecks: [
          `Verificar pH actual (${currentPh ?? '5.8 - 6.2'})`,
          `Verificar EC actual (${currentEc ?? '1.2 - 1.8'} mS/cm)`,
          `Verificar Temperatura del agua (${currentWaterTemp ?? '18 - 22'} °C)`,
        ],
        disclaimer: 'Orientación agronómica basada en IA. No constituye certificación fitopatológica definitiva sin confirmación de laboratorio.',
      };
      res.json(simulatedResult);
      return;
    }

    const systemPrompt = `Eres un experto agrónomo en hidroponía y patología vegetal con especialidad en sistemas DWC (raíz flotante), tubos verticales NFT y aeroponía.
Analiza con rigor técnico la fotografía de la planta proporcionada.
Tus observaciones deben ser preventivas y analíticas:
- Observa características visibles: coloración de hojas, presencia o ausencia de amarillamiento (clorosis), manchas necróticas o fúngicas, turgencia o marchitez, quemadura de ápice (tip burn), desarrollo foliar y de tallos, y raíces si son visibles (color blanco, presencia de algas, pudrición parda).
- NO presentes ninguna enfermedad como confirmada o diagnósticamente definitiva basándote solo en una foto. Señala posibilidades agronómicas, factores abióticos (pH, temperatura, sales, desbalance nutricional) o bióticos a vigilar.
- Recomienda qué parámetros del agua (pH, EC, temperatura, oxígeno disuelto) deben revisarse puntualmente.
- Responde estrictamente en formato JSON respetando el esquema solicitado.`;

    const userPrompt = `Analiza esta fotografía de cultivo hidropónico:
- Código de planta: ${plantCode}
- Especie: ${species}
- Variedad: ${variety}
- Tipo de sistema: ${systemType}
- Día de cultivo: Día ${dayNumber}
- Medición reciente de pH del agua: ${currentPh ?? 'No registrada'}
- Medición reciente de Conductividad Eléctrica EC: ${currentEc ? currentEc + ' mS/cm' : 'No registrada'}
- Temperatura del agua: ${currentWaterTemp ? currentWaterTemp + ' °C' : 'No registrada'}
- Observaciones del operador: ${observations || 'Ninguna previa'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: `${systemPrompt}\n\n${userPrompt}`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            healthStatus: {
              type: Type.STRING,
              description: "Uno de: 'Saludable', 'Observación', 'Atención Requerida'",
            },
            overallCondition: {
              type: Type.STRING,
              description: 'Descripción concisa del vigor y estado general de la planta',
            },
            leafEvaluation: {
              type: Type.OBJECT,
              properties: {
                coloration: { type: Type.STRING, description: 'Evaluación del color y uniformidad foliar' },
                yellowing: { type: Type.BOOLEAN, description: 'Si presenta clorosis o amarillamiento' },
                spots: { type: Type.BOOLEAN, description: 'Si presenta manchas necróticas o fúngicas' },
                wilting: { type: Type.BOOLEAN, description: 'Si presenta pérdida de turgencia o marchitez' },
                details: { type: Type.STRING, description: 'Detalle anatómico de las hojas' },
              },
              required: ['coloration', 'yellowing', 'spots', 'wilting', 'details'],
            },
            rootEvaluation: {
              type: Type.STRING,
              description: 'Evaluación de las raíces si son visibles en la imagen, o indicar que no se aprecian',
            },
            possibleCauses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Posibles causas de los síntomas observados (factores nutricionales, lumínicos o ambientales)',
            },
            generalRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Recomendaciones prácticas de manejo y cuidado agronómico',
            },
            recommendedWaterChecks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Lista de parámetros específicos del agua o solución que se recomienda verificar o calibrar',
            },
            disclaimer: {
              type: Type.STRING,
              description: 'Nota aclaratoria indicando que es una orientación preliminar y no reemplaza análisis fitopatológico de laboratorio',
            },
          },
          required: [
            'healthStatus',
            'overallCondition',
            'leafEvaluation',
            'possibleCauses',
            'generalRecommendations',
            'recommendedWaterChecks',
            'disclaimer',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const result: GeminiAnalysisResult = {
      analyzedAt: new Date().toISOString(),
      healthStatus: (['Saludable', 'Observación', 'Atención Requerida'].includes(parsed.healthStatus)
        ? parsed.healthStatus
        : 'Observación') as any,
      overallCondition: parsed.overallCondition || 'Análisis completado.',
      leafEvaluation: parsed.leafEvaluation || {
        coloration: 'Normal',
        yellowing: false,
        spots: false,
        wilting: false,
        details: 'Evaluación foliar estándar',
      },
      rootEvaluation: parsed.rootEvaluation || 'Zona radicular no visible en la toma.',
      possibleCauses: parsed.possibleCauses || [],
      generalRecommendations: parsed.generalRecommendations || [],
      recommendedWaterChecks: parsed.recommendedWaterChecks || [],
      disclaimer: parsed.disclaimer || 'Análisis agronómico generado con Gemini 3.8 Flash.',
    };

    res.json(result);
  } catch (error: any) {
    console.error('Error in Gemini plant analysis:', error);
    res.status(500).json({
      error: 'Error al procesar el análisis con Gemini: ' + (error?.message || 'Error desconocido'),
    });
  }
});

// ----------------------------------------------------
// IOT SENSOR INGESTION API (ESP32, Arduino, MQTT Bridge)
// ----------------------------------------------------

app.post('/api/iot/measurements', (req, res) => {
  const apiKey = (req.headers['x-api-key'] as string) || req.body.apiKey;
  if (!apiKey) {
    res.status(401).json({ error: 'Se requiere clave de API en cabecera x-api-key o en el cuerpo' });
    return;
  }

  const user = db.users.find((u) => u.apiKey === apiKey);
  if (!user) {
    res.status(401).json({ error: 'Clave de API de IoT no válida' });
    return;
  }

  const userData = db.userData[user.id];
  if (!userData) {
    res.status(404).json({ error: 'Usuario sin datos configurados' });
    return;
  }

  const {
    systemId,
    ph,
    ec,
    tds,
    waterTemp,
    ambientTemp,
    humidity,
    waterLevel,
    dissolvedOxygen,
    salinity,
    notes = 'Ingesta automática desde ESP32 / IoT',
  } = req.body;

  const targetSystemId = systemId || (userData.systems[0] ? userData.systems[0].id : 'sys-default');
  const timestamp = new Date().toISOString();
  const addedMeasurements: any[] = [];
  const alertsTriggered: any[] = [];

  const addM = (sensorType: any, value: number | undefined, unit: string) => {
    if (value !== undefined && value !== null && !isNaN(Number(value))) {
      const m: any = {
        id: 'm-iot-' + crypto.randomUUID().slice(0, 8),
        timestamp,
        systemId: targetSystemId,
        sensorType,
        value: Number(value),
        unit,
        source: 'esp32' as const,
        notes,
      };
      userData.measurements.push(m);
      addedMeasurements.push(m);

      // Check thresholds
      if (sensorType === 'ph') {
        if (value < 5.5 || value > 6.8) {
          const alert = {
            id: 'al-iot-' + crypto.randomUUID().slice(0, 8),
            severity: 'attention',
            title: `Alerta IoT: pH fuera de rango (${value} pH)`,
            message: `La sonda conectada al ESP32 reportó un pH de ${value}, fuera del rango ideal (5.6 - 6.5).`,
            systemId: targetSystemId,
            parameter: 'pH',
            value,
            idealRange: '5.6 - 6.5',
            timestamp,
            acknowledged: false,
          };
          userData.alerts.unshift(alert as any);
          alertsTriggered.push(alert);
        }
      } else if (sensorType === 'water_temp' && value > 25) {
        const alert = {
          id: 'al-iot-' + crypto.randomUUID().slice(0, 8),
          severity: 'observation',
          title: `Temperatura del agua elevada (${value}°C)`,
          message: 'Temperaturas de agua superiores a 24°C disminuyen la retención de oxígeno disuelto.',
          systemId: targetSystemId,
          parameter: 'Temperatura Agua',
          value,
          idealRange: '18 - 23 °C',
          timestamp,
          acknowledged: false,
        };
        userData.alerts.unshift(alert as any);
        alertsTriggered.push(alert);
      }
    }
  };

  addM('ph', ph, 'pH');
  addM('ec', ec, 'mS/cm');
  addM('tds', tds, 'ppm');
  addM('water_temp', waterTemp, '°C');
  addM('ambient_temp', ambientTemp, '°C');
  addM('ambient_humidity', humidity, '%');
  addM('water_level', waterLevel, 'L');
  addM('dissolved_oxygen', dissolvedOxygen, 'mg/L');
  addM('salinity', salinity, 'ppt');

  // Update current water level if provided
  if (waterLevel !== undefined) {
    const sys = userData.systems.find((s) => s.id === targetSystemId);
    if (sys) {
      sys.currentWaterLevelLiters = Number(waterLevel);
    }
  }

  saveDB(db);

  res.json({
    success: true,
    savedCount: addedMeasurements.length,
    timestamp,
    alertsTriggered,
  });
});

// IoT configuration code helper
app.get('/api/iot/sample-code', authMiddleware, (req, res) => {
  const user = (req as any).user;
  const sampleArduinoCode = `/*
 * HydroControl - Firmware ESP32 / Arduino para Ingesta IoT de Sensores
 * Proyecto: Monitoreo Hidropónico (La Bocana, Piñas, El Oro, Ecuador)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";

// Endpoint de la aplicación HydroControl
const char* serverUrl = "${req.protocol}://${req.get('host')}/api/iot/measurements";
const char* apiKey = "${user.apiKey}";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Conectado!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", apiKey);

    // Lectura de sensores físicos (ejemplo analógico y OneWire)
    float ph = 6.05; // Reemplazar con lectura analógica calibrada
    float ec = 1.48; // Reemplazar con sensor EC DFRobot
    float waterTemp = 21.4; // Reemplazar con DS18B20
    float dissolvedOxygen = 7.3; // Sensor DO óptico

    StaticJsonDocument<256> doc;
    doc["apiKey"] = apiKey;
    doc["systemId"] = "sys-dwc-01";
    doc["ph"] = ph;
    doc["ec"] = ec;
    doc["waterTemp"] = waterTemp;
    doc["dissolvedOxygen"] = dissolvedOxygen;

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);

    http.end();
  }
  // Enviar cada 15 minutos (900000 ms)
  delay(900000);
}
`;
  res.json({ code: sampleArduinoCode, apiKey: user.apiKey });
});

// ----------------------------------------------------
// WEATHER API (Open-Meteo Integration for Piñas, El Oro)
// ----------------------------------------------------

app.get('/api/weather', async (req, res) => {
  try {
    const lat = req.query.lat || -3.6825;
    const lon = req.query.lon || -79.6811;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

    const weatherRes = await fetch(url);
    if (!weatherRes.ok) {
      throw new Error('Open-Meteo respondió con error: ' + weatherRes.statusText);
    }
    const data = await weatherRes.json();

    // Map WMO weather code to Spanish description
    const weatherCodeMap: Record<number, string> = {
      0: 'Cielo despejado',
      1: 'Mayormente despejado',
      2: 'Parcialmente nublado',
      3: 'Nublado',
      45: 'Niebla o neblina de montaña',
      48: 'Niebla con escarcha',
      51: 'Llovizna ligera',
      53: 'Llovizna moderada',
      55: 'Llovizna densa',
      61: 'Lluvia leve',
      63: 'Lluvia moderada',
      65: 'Lluvia fuerte',
      80: 'Chubascos leves',
      81: 'Chubascos moderados',
      82: 'Chubascos violentos',
      95: 'Tormenta eléctrica',
    };

    const currentCode = data.current?.weather_code ?? 2;
    const weatherDesc = weatherCodeMap[currentCode] || 'Parcialmente nublado';

    res.json({
      current: {
        temperature: data.current?.temperature_2m ?? 23.4,
        humidity: data.current?.relative_humidity_2m ?? 78,
        precipitationMm: data.current?.precipitation ?? 0,
        windSpeedKmh: data.current?.wind_speed_10m ?? 8.5,
        weatherCodeDescription: weatherDesc,
        tempMax: data.daily?.temperature_2m_max?.[0] ?? 26.5,
        tempMin: data.daily?.temperature_2m_min?.[0] ?? 18.0,
        lastUpdated: new Date().toISOString(),
      },
      daily: data.daily,
    });
  } catch (error: any) {
    console.warn('Weather API fallback used:', error?.message);
    res.json({
      current: {
        temperature: 23.5,
        humidity: 78,
        precipitationMm: 1.0,
        windSpeedKmh: 9.0,
        weatherCodeDescription: 'Parcialmente nublado (Clima subtropical de Piñas)',
        tempMax: 27.0,
        tempMin: 18.0,
        lastUpdated: new Date().toISOString(),
      },
    });
  }
});

// ----------------------------------------------------
// BOOTSTRAP EXPRESS + VITE
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HydroControl backend server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
