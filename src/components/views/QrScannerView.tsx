import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  QrCode,
  Upload,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sprout,
  Wheat,
  Sparkles,
} from 'lucide-react';
import jsQR from 'jsqr';
import { AppData, Plant, ForageLot } from '../../types';

interface QrScannerViewProps {
  data: AppData;
  onOpenPlantDetail: (plant: Plant) => void;
  onOpenForageLot: (lot: ForageLot) => void;
}

export const QrScannerView: React.FC<QrScannerViewProps> = ({
  data,
  onOpenPlantDetail,
  onOpenForageLot,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    setScanResult(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La cámara no está disponible o no está soportada en este navegador.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        scanFrame();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        'No se pudo acceder a la cámara. Puede deberse a permisos del navegador o falta de dispositivo. Puede utilizar la carga de imágenes o seleccionar un código abajo.'
      );
      setCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleResolveCode = (code: string) => {
    setScanResult(code);
    stopCamera();

    // Check if it's a plant
    const plant = data.plants.find(
      (p) => p.code.toLowerCase() === code.trim().toLowerCase() || p.qrCodeValue?.toLowerCase() === code.trim().toLowerCase()
    );
    if (plant) {
      onOpenPlantDetail(plant);
      return;
    }

    // Check if it's a forage lot
    const lot = data.forageLots.find(
      (l) => l.lotCode.toLowerCase() === code.trim().toLowerCase() || l.qrCodeValue?.toLowerCase() === code.trim().toLowerCase()
    );
    if (lot) {
      onOpenForageLot(lot);
      return;
    }
  };

  const scanFrame = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (qrCode && qrCode.data) {
            handleResolveCode(qrCode.data);
            return;
          }
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(scanFrame);
  };

  // Scan uploaded image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const qr = jsQR(imageData.data, imageData.width, imageData.height);
          if (qr && qr.data) {
            handleResolveCode(qr.data);
          } else {
            setCameraError('No se detectó ningún código QR legible en la imagen seleccionada.');
          }
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div id="view-qr-scanner" className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 mb-2">
          <QrCode className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Escáner de Códigos QR</h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Apunte la cámara a la etiqueta física de la planta o charola de forraje para abrir inmediatamente su ficha técnica y registrar mediciones.
        </p>
      </div>

      {/* Main Scanner Box */}
      <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <canvas ref={canvasRef} className="hidden" />

        {/* Video stream or Inactive State */}
        <div className="relative aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center border-2 border-slate-800">
          {cameraActive ? (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              {/* Overlay target frame */}
              <div className="absolute inset-0 border-4 border-emerald-500/60 rounded-2xl m-8 pointer-events-none animate-pulse flex items-center justify-center">
                <div className="w-full h-0.5 bg-emerald-400/80 shadow-lg shadow-emerald-400"></div>
              </div>
            </>
          ) : (
            <div className="p-6 text-center space-y-3">
              <Camera className="w-12 h-12 text-slate-600 mx-auto" />
              <div className="text-xs text-slate-400">
                La cámara está detenida. Presione el botón para iniciar el escáner en tiempo real.
              </div>
              <button
                id="btn-start-camera"
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/40 transition cursor-pointer"
              >
                Activar Cámara
              </button>
            </div>
          )}
        </div>

        {/* Camera controls */}
        {cameraActive && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={stopCamera}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              Detener Cámara
            </button>
          </div>
        )}

        {/* Error notification */}
        {cameraError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Option 2: Upload Photo */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-center">
          <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 cursor-pointer transition">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Escanear desde una fotografía guardada</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Manual Search or Quick Selection */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Ingreso Directo o Pruebas Rápidas</h3>
        <p className="text-xs text-slate-500">
          Si está probando desde una computadora o no tiene la etiqueta física a mano, ingrese o seleccione un código para simular la lectura:
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ej. LEC-001 o FOR-001"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={() => handleResolveCode(manualCode)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
          >
            Abrir
          </button>
        </div>

        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Códigos QR Disponibles en el Cultivo
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {data.plants.map((p) => (
              <button
                key={p.id}
                onClick={() => handleResolveCode(p.code)}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition flex items-center gap-2 group cursor-pointer"
              >
                <Sprout className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
                <div>
                  <div className="font-mono font-bold text-xs text-slate-900">{p.code}</div>
                  <div className="text-[10px] text-slate-500 truncate">{p.species}</div>
                </div>
              </button>
            ))}

            {data.forageLots.map((l) => (
              <button
                key={l.id}
                onClick={() => handleResolveCode(l.lotCode)}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition flex items-center gap-2 group cursor-pointer"
              >
                <Wheat className="w-4 h-4 text-amber-600 group-hover:scale-110 transition" />
                <div>
                  <div className="font-mono font-bold text-xs text-slate-900">{l.lotCode}</div>
                  <div className="text-[10px] text-slate-500 truncate">Forraje FVH</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
