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

export const maxDuration = 15;

function json(d: any, s = 200): Response {
  return new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" } });
}
export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
}
export async function GET(req: Request): Promise<Response> {
  const acesso = await verificarAcesso(req);
  if (!acesso.ok) return json({ error: acesso.erro || "Não autorizado." }, acesso.status || 401);
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return json({ configured: false, rows: [] });
  const qs = new URLSearchParams((req.url || "").split("?")[1] || "");
  const mes = (qs.get("mes") || "").trim();
  const semana = (qs.get("semana") || "").trim();
  let url = base.replace(/\/+$/, "") + "/rest/v1/legendas?select=dia,tipo,titulo,data&order=data";
  if (mes) url += `&mes=eq.${encodeURIComponent(mes)}`;
  if (semana) url += `&semana=eq.${encodeURIComponent(semana)}`;
  try {
    const r = await fetch(url, { headers: { apikey: key, Authorization: "Bearer " + key } });
    const rows = await r.json();
    return json({ configured: true, rows: Array.isArray(rows) ? rows : [] });
  } catch {
    return json({ configured: false, rows: [] });
  }
}
