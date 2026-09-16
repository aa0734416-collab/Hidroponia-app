import { AppData, User, GeminiAnalysisResult } from '../types';

const TOKEN_KEY = 'hydrocontrol_token';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
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
    return result;
  },

  async login(identifier: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al iniciar sesión');
    }
    const result = await res.json();
    this.setToken(result.token);
    return result;
  },

  async forgotPassword(email: string): Promise<{
    success: boolean;
    message: string;
    email: string;
    maskedEmail: string;
    resetToken: string;
    demoCode: string;
  }> {
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
    }
    return result;
  },

  async getGoogleAuthConfig(): Promise<{
    configured: boolean;
    clientId: string;
    appUrl: string;
  }> {
    const res = await fetch('/api/auth/google/config');
    if (!res.ok) {
      return { configured: false, clientId: '', appUrl: '' };
    }
    return res.json();
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
    return result;
  },

  async getMe(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: this.getHeaders(),
      });
      if (!res.ok) {
        this.removeToken();
        return null;
      }
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  },

  async updateProfile(profileData: Partial<User>): Promise<{ success: boolean; user: User }> {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profileData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar el perfil');
    }
    return res.json();
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } finally {
      this.removeToken();
    }
  },

  async getUserData(): Promise<AppData> {
    const res = await fetch('/api/user-data', {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('No se pudo cargar la información del usuario');
    }
    return res.json();
  },

  async saveUserData(data: AppData): Promise<{ success: boolean; savedAt: string }> {
    const res = await fetch('/api/user-data', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error('Error al guardar datos');
    }
    return res.json();
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
    const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error('Error al consultar el clima');
    return res.json();
  },

  async getIotSampleCode() {
    const res = await fetch('/api/iot/sample-code', {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Error al obtener código IoT');
    return res.json();
  },

  async sendSimulatedIotMeasurement(payload: any) {
    const res = await fetch('/api/iot/measurements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Error en ingesta IoT');
    return res.json();
  },
};
