import React, { useState } from 'react';
import {
  MapPin,
  CloudSun,
  Cpu,
  Copy,
  Check,
  Save,
  Radio,
  ExternalLink,
  Thermometer,
  Droplets,
  Wind,
  Layers,
  Code2,
  Sparkles,
} from 'lucide-react';
import { AppData, WeatherData, User as UserType } from '../../types';
import { api } from '../../services/api';
import { KeyRound, ShieldAlert, ShieldCheck as ShieldCheckIcon } from 'lucide-react';

interface SettingsViewProps {
  data: AppData;
  user?: UserType | null;
  onUpdateLocation: (location: string, lat: number, lon: number) => void;
  onRefreshWeather: () => void;
  onOpenForgotPassword?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  data,
  user,
  onUpdateLocation,
  onRefreshWeather,
  onOpenForgotPassword,
}) => {
  const [locationName, setLocationName] = useState(
    data.locationName || 'La Bocana, Cantón Piñas, Provincia de El Oro, Ecuador'
  );
  const [latitude, setLatitude] = useState(data.latitude || -3.6825);
  const [longitude, setLongitude] = useState(data.longitude || -79.6811);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const apiKey = data.userIotApiKey || 'hc_live_bocana_77f4a9';

  const handleSaveCoordinates = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateLocation(locationName, Number(latitude), Number(longitude));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    onRefreshWeather();
  };

  const copyToClipboard = (text: string, setFn: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2500);
  };

  // Arduino / ESP32 code sample
  const esp32CodeSample = `// HydroControl ESP32 Firmware Sketch
// Diseñado para enviar telemetría a HydroControl
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid     = "MI_WIFI_RURAL";
const char* password = "PASSWORD_WIFI";

// Servidor y Credenciales de HydroControl
const char* serverUrl = "https://TU-DOMINIO.run.app/api/iot/measurements";
const char* apiKey    = "${apiKey}";
const char* systemId  = "sys-dwc-01"; // ID del sistema DWC

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nConectado a la red WiFi");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", apiKey);

    // Lectura de sensores físicos (ejemplo: Sonda pH y DS18B20)
    float ph = analogRead(34) * (14.0 / 4095.0); // Ajustar con calibración
    float waterTemp = 21.5;                      // Lectura OneWire DS18B20
    float ec = 1.45;                             // Sonda DFRobot EC

    // Crear JSON
    StaticJsonDocument<256> doc;
    doc["systemId"] = systemId;
    doc["ph"] = ph;
    doc["waterTemp"] = waterTemp;
    doc["ec"] = ec;
    doc["dissolvedOxygen"] = 7.2;

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);
    Serial.printf("Código respuesta HTTP: %d\\n", httpResponseCode);
    http.end();
  }
  // Enviar cada 10 minutos (600,000 ms)
  delay(600000);
}`;

  return (
    <div id="view-settings" className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Ubicación y Conectividad IoT</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configuración geográfica del cultivo en La Bocana, Piñas, El Oro y parámetros de comunicación para ESP32
        </p>
      </div>

      {/* Location & Interactive Map Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-black text-slate-900">Ubicación del Cultivo Hidropónico</h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            La Bocana • Piñas • El Oro
          </span>
        </div>

        <form onSubmit={handleSaveCoordinates} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nombre del Lugar / Finca</label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Latitud (Coordenadas Decimales)</label>
            <input
              type="number"
              step="0.000001"
              value={latitude}
              onChange={(e) => setLatitude(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Longitud (Coordenadas Decimales)</label>
            <input
              type="number"
              step="0.000001"
              value={longitude}
              onChange={(e) => setLongitude(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
            />
          </div>

          <div className="sm:col-span-3 flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Coordenadas actualizadas correctamente</span>
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                Coordenadas de referencia parroquial: -3.6825, -79.6811
              </span>
            )}

            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Coordenadas</span>
            </button>
          </div>
        </form>

        {/* Interactive OpenStreetMap Embed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Mapa Satelital y Terrestre de La Bocana</span>
            <a
              href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=14/${latitude}/${longitude}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Ver pantalla completa en OSM</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="w-full h-72 rounded-2xl overflow-hidden border border-slate-300 shadow-inner">
            <iframe
              title="Mapa de La Bocana, Piñas"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.04}%2C${latitude - 0.03}%2C${longitude + 0.04}%2C${latitude + 0.03}&layer=mapnik&marker=${latitude}%2C${longitude}`}
            ></iframe>
          </div>
        </div>

        {/* Live Weather Card from Open-Meteo */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-xs">
              <CloudSun className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                Clima en Tiempo Real (Open-Meteo)
              </span>
              <div className="text-base font-black text-slate-900">
                {data.weather?.condition || 'Templado Húmedo de Altura'}
              </div>
              <div className="text-xs text-slate-500">
                Parroquia La Bocana, Cantón Piñas
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs">
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-rose-500" />
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">Temperatura</span>
                <span className="font-extrabold text-slate-900">{data.weather?.temperature ?? 22.4} °C</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-cyan-500" />
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">Humedad</span>
                <span className="font-extrabold text-slate-900">{data.weather?.humidity ?? 78} %</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-slate-500" />
              <div>
                <span className="text-slate-400 block text-[10px] font-bold">Viento</span>
                <span className="font-extrabold text-slate-900">{data.weather?.windSpeed ?? 8.2} km/h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Security & Password Recovery Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-black text-slate-900">Seguridad y Recuperación de Contraseña</h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            Protección de Cultivo
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="space-y-1">
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
              <span>Restablecer o Cambiar Contraseña por Correo</span>
            </div>
            <p className="text-xs text-slate-500 max-w-xl">
              Si ha olvidado o desea renovar su clave, solicite un enlace y código de un solo uso que se enviará de inmediato a su dirección registrada ({user?.email || 'su correo'}).
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenForgotPassword}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/10 transition cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>Recuperar / Cambiar Clave</span>
          </button>
        </div>
      </div>

      {/* IoT Integration Guide for ESP32 & Arduino */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 text-white shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black text-white">Guía de Conexión para ESP32, Arduino y MQTT</h2>
          </div>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-800 text-emerald-400 border border-slate-700">
            API Ingestión Activa
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          HydroControl está diseñado con una arquitectura abierta para que microcontroladores (ESP32 con WiFi, Arduino con Ethernet/Serial o Raspberry Pi con broker MQTT) puedan enviar mediciones de sensores reales directamente al backend.
        </p>

        {/* Credentials Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              1. Clave de Autenticación IoT (Header <code className="text-emerald-400">x-api-key</code>)
            </span>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 font-mono text-emerald-400 font-bold">
              <span>{apiKey}</span>
              <button
                onClick={() => copyToClipboard(apiKey, setCopiedKey)}
                className="p-1 rounded text-slate-400 hover:text-white"
                title="Copiar Clave"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Incluya este token en el encabezado HTTP <code className="text-slate-300">x-api-key</code> de cada petición.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              2. Endpoint REST HTTP POST
            </span>
            <div className="p-2 rounded-xl bg-slate-950 font-mono text-cyan-300 text-[11px] font-bold truncate">
              POST /api/iot/measurements
            </div>
            <p className="text-[11px] text-slate-400">
              Soporta mediciones simultáneas de pH, EC, temperatura del agua, oxígeno disuelto y nivel en un solo payload.
            </p>
          </div>
        </div>

        {/* JSON Schema Format */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300">Formato de Carga Útil (JSON):</span>
          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto">
{`{
  "systemId": "sys-dwc-01",     // ID del sistema receptor
  "ph": 6.12,                   // Valor numérico de pH (0 - 14)
  "ec": 1.48,                   // Conductividad en mS/cm
  "waterTemp": 21.4,            // Temperatura del agua en °C
  "dissolvedOxygen": 7.2,       // Oxígeno disuelto en mg/L (opcional)
  "waterLevel": 48.0,           // Litros en tanque (opcional)
  "notes": "Lectura automática ESP32"
}`}
          </pre>
        </div>

        {/* Complete ESP32 Sketch sample */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>Código de Ejemplo para Arduino IDE (ESP32 C++):</span>
            </span>
            <button
              onClick={() => copyToClipboard(esp32CodeSample, setCopiedSnippet)}
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-bold"
            >
              {copiedSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSnippet ? '¡Copiado!' : 'Copiar Sketch C++'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-72 overflow-y-auto">
            {esp32CodeSample}
          </pre>
        </div>
      </div>
    </div>
  );
};
