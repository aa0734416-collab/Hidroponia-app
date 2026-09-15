import React, { useState } from 'react';
import {
  Sprout,
  Lock,
  Mail,
  User,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  X,
  Info,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';

export interface AuthModalProps {
  initialMode?: 'login' | 'register' | 'forgot';
  onSuccess: (user: UserType) => void;
  onClose?: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'reset-code';

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'login',
  onSuccess,
  onClose,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode === 'forgot' ? 'forgot' : initialMode);
  
  // Registration fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  
  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Recovery & Reset fields
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [demoCodeNotice, setDemoCodeNotice] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetFormState = () => {
    setError(null);
    setSuccessMessage(null);
    setDemoCodeNotice(null);
  };

  // Submit Login or Register
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim() || !username.trim() || !email.trim() || !password) {
          throw new Error('Todos los campos son obligatorios');
        }
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        const res = await api.register({
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
          password,
        });
        onSuccess(res.user);
      } else if (mode === 'login') {
        if (!email.trim() || !password) {
          throw new Error('Ingrese su correo o usuario y contraseña');
        }
        const res = await api.login(email.trim(), password);
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  // Submit Request Password Recovery Email
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!recoveryEmail.trim()) {
      setError('Por favor ingrese su correo electrónico o usuario');
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotPassword(recoveryEmail.trim());
      setSuccessMessage(res.message);
      setMaskedEmail(res.maskedEmail || res.email);
      setResetToken(res.resetToken);
      if (res.demoCode) {
        setDemoCodeNotice(res.demoCode);
      }
      setMode('reset-code');
    } catch (err: any) {
      setError(err.message || 'No se pudo enviar el correo de recuperación');
    } finally {
      setLoading(false);
    }
  };

  // Submit Confirm Reset Password
  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!resetCode.trim()) {
      setError('Ingrese el código de 6 dígitos que enviamos a su correo');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('La nueva contraseña debe contener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifique.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword({
        resetToken,
        code: resetCode.trim(),
        newPassword,
      });
      setSuccessMessage('¡Contraseña actualizada exitosamente! Iniciando sesión...');
      setTimeout(() => {
        onSuccess(res.user);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    resetFormState();
    setLoading(true);
    try {
      const res = await api.login('admin', 'admin123');
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'No se pudo iniciar con la cuenta demo');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setResetCode(code);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div
      id="auth-container"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
    >
      <div
        id="auth-card"
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative"
      >
        {/* Close button if provided */}
        {onClose && (
          <button
            id="btn-close-auth-modal"
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header with HydroControl Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-xl shadow-emerald-500/20 mb-3">
            <Sprout className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">HydroControl</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Sistema seguro de monitoreo hidropónico • La Bocana, Piñas, Ecuador
          </p>
        </div>

        {/* Tab switch for Login / Register */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex bg-slate-800/80 p-1 rounded-xl mb-6 border border-slate-700/50">
            <button
              id="tab-login"
              type="button"
              onClick={() => {
                setMode('login');
                resetFormState();
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                mode === 'login' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              id="tab-register"
              type="button"
              onClick={() => {
                setMode('register');
                resetFormState();
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                mode === 'register' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Crear Cuenta
            </button>
          </div>
        )}

        {/* Error message banner */}
        {error && (
          <div
            id="auth-error"
            className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Success message banner */}
        {successMessage && (
          <div
            id="auth-success"
            className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ----------------- MODE 1 & 2: LOGIN / REGISTER ----------------- */}
        {(mode === 'login' || mode === 'register') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      id="input-name"
                      type="text"
                      required
                      placeholder="Ej. Juan Pérez"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre de Usuario</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 text-sm font-bold">@</span>
                    <input
                      id="input-username"
                      type="text"
                      required
                      placeholder="juanp"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {mode === 'register' ? 'Correo Electrónico' : 'Correo o Usuario'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  id="input-email"
                  type={mode === 'register' ? 'email' : 'text'}
                  required
                  placeholder={mode === 'register' ? 'cultivo@ejemplo.com' : 'admin o correo@ejemplo.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Contraseña</label>
                {mode === 'login' && (
                  <button
                    id="btn-forgot-password-link"
                    type="button"
                    onClick={() => {
                      resetFormState();
                      setRecoveryEmail(email || '');
                      setMode('forgot');
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline transition cursor-pointer font-medium"
                  >
                    ¿Olvidó su contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {mode === 'register'
                  ? 'Mínimo 6 caracteres. Encriptado seguro con PBKDF2.'
                  : 'Acceso privado exclusivo a sus cultivos.'}
              </p>
            </div>

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-emerald-900/30 transition mt-2 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>{mode === 'register' ? 'Registrar y Comenzar' : 'Acceder al Panel'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ----------------- MODE 3: FORGOT PASSWORD REQUEST ----------------- */}
        {mode === 'forgot' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 text-emerald-400">
              <KeyRound className="w-5 h-5" />
              <h2 className="text-sm font-bold text-white">Recuperar Contraseña</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ingrese el correo electrónico o nombre de usuario registrado. Le enviaremos un enlace y código de verificación seguro para restablecer su contraseña.
            </p>

            <form onSubmit={handleRequestPasswordReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Correo Electrónico o Usuario
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    id="input-recovery-email"
                    type="text"
                    required
                    placeholder="ej. aa0734416@gmail.com o admin"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>
                  Por seguridad, el código generado caducará en 15 minutos y protegerá su cultivo contra accesos no autorizados.
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    resetFormState();
                    setMode('login');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al inicio</span>
                </button>
                <button
                  id="btn-send-recovery-email"
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-emerald-900/30 cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" />
                      <span>Enviar Código</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ----------------- MODE 4: RESET CODE & NEW PASSWORD ----------------- */}
        {mode === 'reset-code' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <h2 className="text-sm font-bold text-white">Restablecer Contraseña</h2>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                Paso 2 de 2
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Hemos emitido el código para <strong className="text-slate-200">{maskedEmail || recoveryEmail}</strong>. Ingréselo abajo junto con su nueva clave.
            </p>

            {/* Simulated Email Delivery Preview Banner for instantaneous development & preview */}
            {demoCodeNotice && (
              <div className="p-3 rounded-xl bg-slate-800/90 border border-emerald-500/40 text-xs text-slate-200 shadow-inner">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Buzón de correo seguro (Código emitido):</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(demoCodeNotice)}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/50 transition"
                  >
                    {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? '¡Copiado!' : 'Copiar código'}</span>
                  </button>
                </div>
                <div className="font-mono text-xl tracking-widest text-center text-emerald-400 font-bold bg-slate-950/60 py-2 rounded-lg border border-slate-700">
                  {demoCodeNotice}
                </div>
              </div>
            )}

            <form onSubmit={handleConfirmPasswordReset} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Código de Verificación (6 dígitos)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    id="input-reset-code"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-base font-mono tracking-wider text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    id="input-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    id="input-confirm-password"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Repita su nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetFormState();
                    setMode('forgot');
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver</span>
                </button>
                <button
                  id="btn-confirm-password-reset"
                  type="submit"
                  disabled={loading}
                  className="flex-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-emerald-900/30 cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Guardar e Iniciar Sesión</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Demo button (Only on login or register) */}
        {(mode === 'login' || mode === 'register') && (
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400 mb-2.5">¿Desea explorar el proyecto inmediatamente?</p>
            <button
              id="btn-demo-login"
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ingresar con Cuenta Demo (Cultivo de Piñas)</span>
            </button>
          </div>
        )}

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Contraseñas seguras y datos aislados por usuario</span>
        </div>
      </div>
    </div>
  );
};
