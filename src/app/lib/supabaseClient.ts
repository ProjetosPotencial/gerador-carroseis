import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para o navegador (auth). Usa a ANON key (pública, segura no
 * cliente) e a URL do projeto, via envs de build do Vite. Se as variáveis não
 * existirem, `authConfigurado` = false e o app roda sem login (fallback de dev).
 */
const env: any = (import.meta as any).env || {};
const url: string | undefined = env.VITE_SUPABASE_URL;
const anon: string | undefined = env.VITE_SUPABASE_ANON_KEY;

export const authConfigurado = Boolean(url && anon);

export const supabase: SupabaseClient | null = authConfigurado
  ? createClient(url as string, anon as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

/** Cabeçalho Authorization pras chamadas /api/* (vazio se não houver sessão). */
export async function authHeaders(): Promise<Record<string, string>> {
  const t = await getAccessToken();
  return t ? { Authorization: "Bearer " + t } : {};
}
