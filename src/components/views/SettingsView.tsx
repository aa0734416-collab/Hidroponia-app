import React, { useState, useEffect, useRef } from 'react';
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
  User as UserIcon,
  Briefcase,
  Camera,
  QrCode,
  Phone,
  Building2,
  Mail,
  Download,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  ShieldAlert,
  ShieldCheck as ShieldCheckIcon,
} from 'lucide-react';
import QRCode from 'qrcode';
import { AppData, WeatherData, User as UserType } from '../../types';
import { api } from '../../services/api';

interface SettingsViewProps {
  data: AppData;
  user?: UserType | null;
  onUpdateLocation: (location: string, lat: number, lon: number) => void;
  onRefreshWeather: () => void;
  onOpenForgotPassword?: () => void;
  onUpdateUser?: (updatedUser: UserType) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  data,
  user,
  onUpdateLocation,
  onRefreshWeather,
  onOpenForgotPassword,
  onUpdateUser,
}) => {
  const [locationName, setLocationName] = useState(
    data.locationName || 'La Bocana, Cantón Piñas, Provincia de El Oro, Ecuador'
  );
  const [latitude, setLatitude] = useState(data.latitude || -3.6825);
  const [longitude, setLongitude] = useState(data.longitude || -79.6811);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // User Profile Form State
  const [profileName, setProfileName] = useState(user?.name || user?.fullName || '');
  const [profilePosition, setProfilePosition] = useState(user?.position || 'Productor Hidropónico');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileFarmName, setProfileFarmName] = useState(user?.farmName || 'Finca La Bocana');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '');
  const [profileQrCode, setProfileQrCode] = useState(user?.qrCode || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when user prop changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || user.fullName || '');
      setProfilePosition(user.position || 'Productor Hidropónico');
      setProfilePhone(user.phone || '');
      setProfileFarmName(user.farmName || 'Finca La Bocana');
      setProfileAvatar(user.avatar || '');
      if (user.qrCode) {
        setProfileQrCode(user.qrCode);
      }
    }
  }, [user]);

  // Generate QR Code on change or if not present
  useEffect(() => {
    if (user) {
      const qrData = JSON.stringify({
        type: 'user_credential',
        app: 'HydroControl',
        id: user.id,
        user: user.username,
        name: profileName || user.name || user.username,
        position: profilePosition || 'Productor',
        email: user.email,
        farm: profileFarmName || 'Finca La Bocana',
        phone: profilePhone || '',
        updatedAt: new Date().toISOString(),
      });

      QRCode.toDataURL(qrData, {
        width: 320,
        margin: 2,
        color: {
          dark: '#064e3b',
          light: '#ffffff',
        },
      })
        .then((url) => {
          setProfileQrCode(url);
        })
        .catch((err) => console.warn('QR gen error:', err));
    }
  }, [user, profileName, profilePosition, profileFarmName, profilePhone]);

  // Handle Photo selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Por favor seleccione un archivo de imagen válido (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError('La foto no debe superar los 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setProfileAvatar(result);
    };
    reader.readAsDataURL(file);
  };

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileMessage(null);

    try {
      const res = await api.updateProfile({
        name: profileName.trim(),
        fullName: profileName.trim(),
        position: profilePosition.trim(),
        phone: profilePhone.trim(),
        farmName: profileFarmName.trim(),
        avatar: profileAvatar,
        qrCode: profileQrCode,
      });

      if (res.user && onUpdateUser) {
        onUpdateUser(res.user);
      }
      setProfileMessage('¡Datos de usuario, foto y código QR actualizados con éxito!');
      setTimeout(() => setProfileMessage(null), 4000);
    } catch (err: any) {
      setProfileError(err.message || 'No se pudo guardar los cambios del perfil');
    } finally {
      setProfileSaving(false);
    }
  };

  // Download QR Credential as image
  const handleDownloadQr = () => {
    if (!profileQrCode) return;
    const a = document.createElement('a');
    a.href = profileQrCode;
    a.download = `credencial_qr_${user?.username || 'usuario'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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
        <h1 className="text-2xl font-extrabold text-slate-900">Configuración, Perfil y Conectividad</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Gestione los datos del usuario, foto, cargo, credencial QR única, ubicación geográfica y parámetros IoT
        </p>
      </div>

      {/* User Profile & Generated QR Credential Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-black text-slate-900">Perfil de Usuario y Credencial de Acceso QR</h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {user?.authProvider === 'google' ? 'Acceso con Google' : 'Acceso con Usuario y Clave'}
          </span>
        </div>

        {profileMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{profileMessage}</span>
          </div>
        )}

        {profileError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left: Interactive Credential Preview Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white shadow-lg space-y-4 border border-slate-700/80">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                  Credencial Oficial HydroControl
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  ACTIVO
                </span>
              </div>

              {/* Photo & Identity */}
              <div className="flex items-center gap-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-emerald-500/70 overflow-hidden shrink-0 cursor-pointer relative group flex items-center justify-center shadow-md transition hover:scale-105"
                  title="Haga clic para cambiar o subir su foto"
                >
                  {profileAvatar ? (
                    <img
                      src={profileAvatar}
                      alt="Foto de perfil"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-emerald-300">
                      <Camera className="w-5 h-5" />
                      <span className="text-[9px] mt-0.5 font-medium">Subir</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black text-white truncate">
                    {profileName || user?.name || user?.username || 'Usuario'}
                  </h3>
                  <div className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 truncate">
                    {profilePosition || 'Operador'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono truncate">
                    @{user?.username || 'usuario'}
                  </div>
                </div>
              </div>

              {/* Generated QR Code for User Identity */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-700/60 flex items-center gap-3">
                {profileQrCode ? (
                  <img
                    src={profileQrCode}
                    alt="Código QR de Usuario"
                    className="w-20 h-20 bg-white rounded-lg p-1 shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                    <QrCode className="w-8 h-8 text-slate-600 animate-pulse" />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="text-[11px] font-bold text-white flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Código QR Personal</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Escaneable en el módulo de control para verificación de operador y registro de bitácora.
                  </p>
                  {profileQrCode && (
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-300 hover:text-emerald-200 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Descargar imagen QR</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Farm metadata */}
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                <span>Instalación:</span>
                <span className="text-slate-200 font-semibold">{profileFarmName}</span>
              </div>
            </div>

            {/* Right: Form inputs to edit user data */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Completo</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Juan Pérez"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre de Usuario (Identificador)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">@</span>
                    <input
                      type="text"
                      disabled
                      value={user?.username || ''}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-500 font-mono font-bold cursor-not-allowed"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">El usuario es único para el acceso.</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cargo / Posición en el Cultivo</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Agrónomo, Operador Hidropónico, Gerente"
                      value={profilePosition}
                      onChange={(e) => setProfilePosition(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Finca / Instalación</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ej. Finca La Bocana"
                      value={profileFarmName}
                      onChange={(e) => setProfileFarmName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-500 font-medium cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono de Contacto</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+57 300 123 4567"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Photo file selection */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200"
                >
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>{profileAvatar ? 'Cambiar Foto de Perfil' : 'Subir Foto de Perfil'}</span>
                </button>

                {profileAvatar && (
                  <button
                    type="button"
                    onClick={() => setProfileAvatar('')}
                    className="text-xs text-rose-500 hover:text-rose-600 font-medium"
                  >
                    Quitar foto
                  </button>
                )}

                <span className="text-[11px] text-slate-400">
                  Formato PNG, JPG o WebP. El código QR se regenera automáticamente con su cargo y datos.
                </span>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  id="btn-save-profile"
                  type="submit"
                  disabled={profileSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition cursor-pointer disabled:opacity-50"
                >
                  {profileSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar Datos de Perfil y QR</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
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
