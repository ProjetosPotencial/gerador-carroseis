/**
 * Vercel Function: GET /api/imagens/list — v7.12
 *
 * Lista o banco de imagens (tabela public.imagens no Supabase) usando a
 * SUPABASE_SERVICE_ROLE_KEY (server-side; a chave NUNCA vai pro cliente).
 * Filtros por query string: vertical, mes, semana, layout, q (busca em
 * prompt_cena e peca), tag (tag exata), limit (default 60), offset.
 * Retorna { configured, rows } ordenado por created_at desc.
 */

// [inline auto-gerado — helpers self-contained; a lib/ não empacota no Vercel]
/**
 * Verificação de acesso das rotas /api/* — v7.15.
 * Só bloqueia quando EMAILS_AUTORIZADOS está setado (senão libera, compat).
 * Valida o token do usuário chamando /auth/v1/user do Supabase e confere o
 * e-mail contra a allowlist. Chaves só no servidor.
 */
async function verificarAcesso(
  req: Request
): Promise<{ ok: boolean; email?: string; erro?: string; status?: number }> {
  const allow = (process.env.EMAILS_AUTORIZADOS || "").trim();
  if (!allow) return { ok: true }; // auth não configurada → não bloqueia
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return { ok: true }; // sem supabase não dá pra validar

  const auth = req.headers.get("authorization") || "";
  const token = /^bearer\s+/i.test(auth) ? auth.replace(/^bearer\s+/i, "").trim() : "";
  // v7.29: chave de acesso compartilhada. Com o app sem tela de login, é ela
  // que autoriza as chamadas do navegador e das automações. Definida em
  // CHAVE_ACESSO (ou CRON_SECRET, mantido por compatibilidade).
  const chaveAcesso = (process.env.CHAVE_ACESSO || process.env.CRON_SECRET || "").trim();
  if (chaveAcesso && token === chaveAcesso) return { ok: true };
  if (!token) return { ok: false, status: 401, erro: "Não autenticado." };

  try {
    const r = await fetch(base.replace(/\/+$/, "") + "/auth/v1/user", {
      headers: { Authorization: "Bearer " + token, apikey: key },
    });
    if (!r.ok) return { ok: false, status: 401, erro: "Sessão inválida ou expirada." };
    const u = await r.json();
    const email = String(u?.email || "").toLowerCase();
    const lista = allow
      .toLowerCase()
      .split(/[\s,;]+/)
      .filter(Boolean);
    if (email && lista.includes(email)) return { ok: true, email };
    return { ok: false, status: 403, erro: "E-mail não autorizado." };
  } catch {
    return { ok: false, status: 401, erro: "Falha ao validar a sessão." };
  }
}

export const maxDuration = 30;

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET(req: Request): Promise<Response> {
  const acesso = await verificarAcesso(req);
  if (!acesso.ok) return json({ error: acesso.erro || "Não autorizado." }, acesso.status || 401);
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return json({ configured: false, rows: [] });

  const qs = new URLSearchParams((req.url || "").split("?")[1] || "");
  const eq = (campo: string, valor: string | null) =>
    valor && valor.trim() ? `&${campo}=eq.${encodeURIComponent(valor.trim())}` : "";

  const limitRaw = parseInt(qs.get("limit") || "60", 10);
  const limit = isNaN(limitRaw) ? 60 : Math.min(Math.max(limitRaw, 1), 120);
  const offsetRaw = parseInt(qs.get("offset") || "0", 10);
  const offset = isNaN(offsetRaw) ? 0 : Math.max(offsetRaw, 0);

  const cols =
    "id,url,prompt_cena,estilo_visual,vertical,mes,semana,peca,slide,layout,aspect_ratio,tags,created_at";
  let url =
    `${base.replace(/\/+$/, "")}/rest/v1/imagens` +
    `?select=${cols}&order=created_at.desc&limit=${limit}&offset=${offset}`;

  url += eq("vertical", qs.get("vertical"));
  url += eq("mes", qs.get("mes"));
  url += eq("semana", qs.get("semana"));
  url += eq("layout", qs.get("layout"));

  const q = (qs.get("q") || "").trim();
  if (q) {
    const t = encodeURIComponent(`*${q}*`);
    url += `&or=(prompt_cena.ilike.${t},peca.ilike.${t},estilo_visual.ilike.${t})`;
  }
  const tag = (qs.get("tag") || "").trim();
  if (tag) {
    url += `&tags=cs.${encodeURIComponent(`{"${tag}"}`)}`;
  }

  try {
    const resp = await fetch(url, {
      headers: { apikey: key, Authorization: "Bearer " + key, Accept: "application/json" },
    });
    if (!resp.ok) {
      return json({ configured: false, rows: [] });
    }
    const rows = await resp.json();
    return json({ configured: true, rows: Array.isArray(rows) ? rows : [] });
  } catch {
    return json({ configured: false, rows: [] });
  }
}
