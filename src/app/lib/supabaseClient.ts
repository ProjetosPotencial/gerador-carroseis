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
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // v7.28: chave fixa de storage. Sem isso a chave deriva da URL do
        // projeto e qualquer troca de ambiente derruba a sessão salva.
        storageKey: "gp-gerador-auth",
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
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

/**
 * v7.29 — chave de acesso compartilhada.
 * Com o app sem tela de login, é ela que autoriza as chamadas /api/*.
 * Defina VITE_CHAVE_ACESSO no build e CHAVE_ACESSO no servidor, com o mesmo
 * valor. Se não definir nenhuma das duas, as rotas seguem o comportamento
 * antigo (liberadas quando EMAILS_AUTORIZADOS está vazio).
 */
export const chaveAcesso: string = String(env.VITE_CHAVE_ACESSO || "").trim();

/**
 * Cabeçalho Authorization pras chamadas /api/*.
 * Prioridade: sessão do Supabase (quando existir) > chave compartilhada.
 * Vazio quando não há nem uma nem outra.
 */
export async function authHeaders(): Promise<Record<string, string>> {
  const t = await getAccessToken();
  if (t) return { Authorization: "Bearer " + t };
  if (chaveAcesso) return { Authorization: "Bearer " + chaveAcesso };
  return {};
}
