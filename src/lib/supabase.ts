import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnvUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const getEnvKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function cleanSupabaseUrl(rawUrl: string): string {
  let url = (rawUrl || '').trim();
  url = url.replace(/\/rest\/v1\/?$/, '');
  url = url.replace(/\/+$/, '');
  return url;
}

export function getSupabaseCredentials(): { url: string; key: string } {
  let url = getEnvUrl();
  let key = getEnvKey();

  if (typeof window !== 'undefined') {
    // Some in-app/private browsers throw on localStorage access
    try {
      const storedUrl = localStorage.getItem('ud_supabase_url');
      const storedKey = localStorage.getItem('ud_supabase_anon_key');
      if (storedUrl) url = storedUrl;
      if (storedKey) key = storedKey;
    } catch {}
  }

  return { url: cleanSupabaseUrl(url), key: key.trim() };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(
    url &&
      key &&
      !url.includes('placeholder') &&
      !key.includes('placeholder') &&
      url.startsWith('https://')
  );
}

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();
  if (!isSupabaseConfigured()) {
    cachedClient = null;
    return null;
  }

  if (cachedClient && lastUrl === url && lastKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key);
    lastUrl = url;
    lastKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function setSupabaseCredentials(url: string, key: string): boolean {
  if (typeof window !== 'undefined') {
    const cleanUrl = cleanSupabaseUrl(url);
    const cleanKey = key.trim();
    localStorage.setItem('ud_supabase_url', cleanUrl);
    localStorage.setItem('ud_supabase_anon_key', cleanKey);
    try {
      cachedClient = createClient(cleanUrl, cleanKey);
      lastUrl = cleanUrl;
      lastKey = cleanKey;
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function clearSupabaseCredentials(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ud_supabase_url');
    localStorage.removeItem('ud_supabase_anon_key');
    cachedClient = null;
    lastUrl = '';
    lastKey = '';
  }
}
