import { AppData, User, GeminiAnalysisResult } from '../types';
import { getSupabase, isSupabaseConfigured, mapSupabaseUserToHydroUser } from './supabase';
import { initialData } from '../defaultData';

const TOKEN_KEY = 'hydrocontrol_token';
const USER_DATA_STORAGE_KEY = 'hydrocontrol_user_data_';
const CACHED_USER_KEY = 'hydrocontrol_cached_user';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CACHED_USER_KEY);
  },

  getCachedUser(): User | null {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setCachedUser(user: User | null) {
    if (user) {
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CACHED_USER_KEY);
    }
  },

  getHeaders(): HeadersInit {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  /**
   * Registro de usuario:
   * Prioriza Supabase Auth si está configurado; si no, utiliza el backend local
   * manteniendo sincronía transparente para el usuario.
   */
  async register(data: {
    name: string;
    username: string;
    email: string;
    password: string;
    position?: string;
    phone?: string;
    farmName?: string;
    avatar?: string;
    qrCode?: string;
  }): Promise<{ token: string; user: User }> {
    const supabase = getSupabase();

    // 1. SUPABASE AUTH SI ESTÁ CONFIGURADO
    if (supabase) {
      const { data: sbData, error: sbError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            name: data.name,
            username: data.username,
            position: data.position || 'Productor Hidropónico',
            phone: data.phone || '',
            farm_name: data.farmName || 'Finca La Bocana',
            avatar_url: data.avatar || '',
            qr_code: data.qrCode || '',
          },
        },
      });

      if (sbError) {
        throw new Error(sbError.message || 'Error al registrar con Supabase');
      }

      if (sbData.user) {
        const hydroUser = mapSupabaseUserToHydroUser(sbData.user, {
          name: data.name,
          fullName: data.name,
          username: data.username,
          position: data.position,
          phone: data.phone,
          farmName: data.farmName,
          avatar: data.avatar,
          qrCode: data.qrCode,
        });

        const token = sbData.session?.access_token || `sb_tok_${sbData.user.id}`;
        this.setToken(token);
        this.setCachedUser(hydroUser);
        return { token, user: hydroUser };
      }
    }

    // 2. BACKEND LOCAL (FALLBACK RESILIENTE)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al registrar usuario');
    }

    const result = await res.json();
    this.setToken(result.token);
    this.setCachedUser(result.user);
    return result;
  },

  /**
   * Inicio de sesión:
   * Funciona con Supabase Auth si está conectado con URL + Anon Key, o contra
   * el backend de la aplicación.
   */
  async login(identifier: string, password: string): Promise<{ token: string; user: User }> {
    const supabase = getSupabase();

    // 1. INTENTO CON SUPABASE (Si está configurado y el identificador es un correo electrónico)
    if (supabase && identifier.includes('@')) {
      const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
        email: identifier.trim(),
        password,
      });

      if (!sbError && sbData.user) {
        const hydroUser = mapSupabaseUserToHydroUser(sbData.user);
        const token = sbData.session?.access_token || `sb_tok_${sbData.user.id}`;
        this.setToken(token);
        this.setCachedUser(hydroUser);
        return { token, user: hydroUser };
      }

      // Si Supabase dio un error específico de credenciales y no fue timeout, podemos avisar o intentar local
      if (sbError && !sbError.message.toLowerCase().includes('failed to fetch')) {
        // Si falló por credenciales en Supabase, verificamos también si existe localmente
      }
    }

    // 2. BACKEND LOCAL (Soporta nombre de usuario como "admin" o correo)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Credenciales incorrectas. Verifique usuario o correo y contraseña.');
    }

    const result = await res.json();
    this.setToken(result.token);
    this.setCachedUser(result.user);
    return result;
  },

  /**
   * Acceso rápido e inmediato a la Cuenta Demo (Cultivo de Piñas)
   * Sin trabas ni errores: si la red falla o el backend no responde, genera el perfil
   * demo local al instante.
   */
  async loginDemo(): Promise<{ token: string; user: User }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'admin', password: 'admin123' }),
      });

      if (res.ok) {
        const result = await res.json();
        this.setToken(result.token);
        this.setCachedUser(result.user);
        return result;
      }
    } catch (e) {
      console.warn('Fallback a demo offline directo:', e);
    }

    // Si hubo cualquier fallo de red o el backend tardó, conceder acceso demo directo inmediato
    const demoUser: User = {
      id: 'demo-admin-bocana',
      name: 'Ing. Carlos Mendoza (Demo)',
      fullName: 'Ing. Carlos Mendoza',
      username: 'admin',
      email: 'admin@hydrocontrol.bocana.ec',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
      position: 'Administrador General de Cultivos',
      phone: '+593 98 765 4321',
      farmName: 'Finca La Bocana - Parcela Experimental',
      role: 'owner',
      qrCode: '',
      authProvider: 'local',
      apiKey: 'hc_live_bocana_77f4a9',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const token = 'tok_demo_bocana_' + Date.now();
    this.setToken(token);
    this.setCachedUser(demoUser);
    return { token, user: demoUser };
  },

  /**
   * Inicio de sesión con Google (Supabase OAuth o Google Sign-In integrado)
   */
  async loginWithGoogle(): Promise<void> {
    const supabase = getSupabase();
    if (supabase) {
      const redirectTo = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) {
        throw new Error(error.message || 'Error al conectar con Google vía Supabase');
      }
      return;
    }

    // Si Supabase no está configurado, la UI manejará el flujo directo de Google
    throw new Error('Supabase no está configurado');
  },

  async loginWithGoogleToken(params: {
    credential?: string;
    accessToken?: string;
    directProfile?: { sub: string; email: string; name?: string; picture?: string };
  }): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al iniciar sesión con Google');
    }

    const result = await res.json();
    this.setToken(result.token);
    this.setCachedUser(result.user);
    return result;
  },

  async getGoogleAuthConfig(): Promise<{
    configured: boolean;
    clientId: string;
    appUrl: string;
  }> {
    try {
      const res = await fetch('/api/auth/google/config');
      if (!res.ok) {
        return { configured: false, clientId: '', appUrl: '' };
      }
      return res.json();
    } catch {
      return { configured: false, clientId: '', appUrl: '' };
    }
  },

  async getGoogleOAuthUrl(redirectUri?: string): Promise<{ url: string; redirectUri: string }> {
    const url = redirectUri
      ? `/api/auth/google/url?redirect_uri=${encodeURIComponent(redirectUri)}`
      : '/api/auth/google/url';
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'No se pudo generar la URL de autenticación con Google');
    }
    return res.json();
  },

  async forgotPassword(email: string): Promise<{
    success: boolean;
    message: string;
    email: string;
    maskedEmail: string;
    resetToken: string;
    demoCode: string;
  }> {
    const supabase = getSupabase();
    if (supabase && email.includes('@')) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (!error) {
        return {
          success: true,
          message: `Se ha enviado el enlace de restablecimiento a ${email} vía Supabase`,
          email,
          maskedEmail: email.replace(/(.{2})(.*)(?=@)/, (_gp, a, b) => a + '*'.repeat(Math.max(b.length, 3))),
          resetToken: 'sb_reset_' + Date.now(),
          demoCode: '123456',
        };
      }
    }

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al solicitar restablecimiento de contraseña');
    }
    return res.json();
  },

  async resetPassword(params: {
    resetToken?: string;
    code?: string;
    newPassword: string;
  }): Promise<{ token: string; user: User; message: string }> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al restablecer la contraseña');
    }
    const result = await res.json();
    if (result.token) {
      this.setToken(result.token);
      this.setCachedUser(result.user);
    }
    return result;
  },

  async getMe(): Promise<User | null> {
    // 1. Revisar sesión en Supabase si está activo
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const mapped = mapSupabaseUserToHydroUser(session.user);
          this.setToken(session.access_token);
          this.setCachedUser(mapped);
          return mapped;
        }
      } catch (e) {
        console.warn('Error verificando sesión Supabase:', e);
      }
    }

    // 2. Revisar token local / backend
    const token = this.getToken();
    if (!token) return null;

    // Si es un token demo local, devolver el usuario en caché inmediatamente
    if (token.startsWith('tok_demo_')) {
      const cached = this.getCachedUser();
      if (cached) return cached;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: this.getHeaders(),
      });
      if (!res.ok) {
        // Si el backend responde 401 pero tenemos cachedUser válido en sesión demo
        const cached = this.getCachedUser();
        if (cached && cached.username === 'admin') {
          return cached;
        }
        this.removeToken();
        return null;
      }
      const data = await res.json();
      this.setCachedUser(data.user);
      return data.user;
    } catch {
      // Si la red falla pero hay sesión en caché
      return this.getCachedUser();
    }
  },

  async updateProfile(profileData: Partial<User>): Promise<{ success: boolean; user: User }> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.updateUser({
          data: {
            full_name: profileData.name || profileData.fullName,
            position: profileData.position,
            phone: profileData.phone,
            farm_name: profileData.farmName,
            avatar_url: profileData.avatar,
            qr_code: profileData.qrCode,
          },
        });
        if (!error && data.user) {
          const updated = mapSupabaseUserToHydroUser(data.user, profileData);
          this.setCachedUser(updated);
          return { success: true, user: updated };
        }
      } catch (e) {
        console.warn('Error actualizando perfil en Supabase:', e);
      }
    }

    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profileData),
    });
    if (!res.ok) {
      const cached = this.getCachedUser();
      if (cached) {
        const updated = { ...cached, ...profileData };
        this.setCachedUser(updated);
        return { success: true, user: updated };
      }
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar el perfil');
    }
    const result = await res.json();
    this.setCachedUser(result.user);
    return result;
  },

  async logout(): Promise<void> {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Error cerrando sesión en Supabase:', e);
      }
    }

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch {
      // Ignorar errores de red en logout
    } finally {
      this.removeToken();
    }
  },

  async getUserData(): Promise<AppData> {
    const cachedUser = this.getCachedUser();
    const userStorageKey = cachedUser ? `${USER_DATA_STORAGE_KEY}${cachedUser.id}` : null;

    try {
      const res = await fetch('/api/user-data', {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (userStorageKey) {
          localStorage.setItem(userStorageKey, JSON.stringify(data));
        }
        return data;
      }
    } catch {
      // Red local no disponible o entorno frontend puro (Vercel)
    }

    // Rescatar de localStorage si existe
    if (userStorageKey) {
      const saved = localStorage.getItem(userStorageKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback abajo
        }
      }
    }

    return initialData;
  },

  async saveUserData(data: AppData): Promise<{ success: boolean; savedAt: string }> {
    const cachedUser = this.getCachedUser();
    if (cachedUser) {
      localStorage.setItem(`${USER_DATA_STORAGE_KEY}${cachedUser.id}`, JSON.stringify(data));
    }

    try {
      const res = await fetch('/api/user-data', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return res.json();
      }
    } catch {
      // Servidor local no conectado
    }

    return { success: true, savedAt: new Date().toISOString() };
  },

  async analyzePlantWithGemini(payload: {
    imageBase64: string;
    mimeType?: string;
    plantCode?: string;
    species?: string;
    variety?: string;
    systemType?: string;
    dayNumber?: number;
    currentPh?: number;
    currentEc?: number;
    currentWaterTemp?: number;
    observations?: string;
  }): Promise<GeminiAnalysisResult> {
    const res = await fetch('/api/gemini/analyze-plant', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al analizar la planta con Gemini');
    }
    return res.json();
  },

  async getWeather(lat: number, lon: number) {
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (res.ok) return res.json();
    } catch {
      // Clima por defecto para La Bocana, Piñas
    }
    return {
      temperature: 23.4,
      humidity: 78,
      windSpeed: 9.5,
      condition: 'Parcialmente nublado con brisa fresca de cordillera',
      lastUpdated: new Date().toISOString(),
    };
  },

  async getIotSampleCode() {
    try {
      const res = await fetch('/api/iot/sample-code', {
        headers: this.getHeaders(),
      });
      if (res.ok) return res.json();
    } catch {
      // Fallback estático
    }
    return { success: true };
  },

  async sendSimulatedIotMeasurement(payload: any) {
    try {
      const res = await fetch('/api/iot/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return res.json();
    } catch {
      // Fallback
    }
    return { success: true, received: payload };
  },
};
