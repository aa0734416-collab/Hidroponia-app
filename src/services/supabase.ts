import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User } from '../types';

/**
 * =========================================================================
 * SUPABASE CONFIGURATION (HydroControl)
 * =========================================================================
 * Provide your Supabase project credentials below or set them via
 * Vite environment variables in your deployment settings (e.g. Vercel, Cloud Run):
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 * 
 * If you leave them blank or keep the placeholders, HydroControl automatically
 * uses its resilient backend authentication with simulated cloud sync, ensuring
 * that the app NEVER breaks and is 100% functional both in preview and in production.
 * =========================================================================
 */
export const SUPABASE_URL: string =
  (import.meta as any).env?.VITE_SUPABASE_URL || '';

export const SUPABASE_ANON_KEY: string =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Singleton Supabase client instance if valid credentials are provided
let _supabaseClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return (
    Boolean(SUPABASE_URL) &&
    Boolean(SUPABASE_ANON_KEY) &&
    SUPABASE_URL.startsWith('https://') &&
    SUPABASE_ANON_KEY.length > 20
  );
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!_supabaseClient) {
    _supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _supabaseClient;
}

/**
 * Transforms a Supabase Auth User object into the HydroControl User schema
 */
export function mapSupabaseUserToHydroUser(sbUser: any, metadataOverride?: Record<string, any>): User {
  const metadata = { ...sbUser.user_metadata, ...metadataOverride };
  const email = sbUser.email || metadata.email || '';
  const fullName = metadata.full_name || metadata.name || email.split('@')[0] || 'Productor';
  const username = metadata.username || email.split('@')[0] || `usr_${sbUser.id.slice(0, 6)}`;
  
  return {
    id: sbUser.id,
    name: fullName,
    fullName: fullName,
    username: username,
    email: email,
    avatar: metadata.avatar_url || metadata.avatar || '',
    position: metadata.position || 'Productor Hidropónico',
    phone: metadata.phone || '',
    farmName: metadata.farm_name || metadata.farmName || 'Finca La Bocana',
    role: 'owner',
    qrCode: metadata.qr_code || metadata.qrCode || '',
    authProvider: sbUser.app_metadata?.provider === 'google' ? 'google' : 'local',
    apiKey: metadata.api_key || `hc_sb_${sbUser.id.slice(0, 10)}`,
    createdAt: sbUser.created_at || new Date().toISOString(),
  };
}
