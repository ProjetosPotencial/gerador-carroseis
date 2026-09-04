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

export const maxDuration = 15;

function json(d: any, s = 200): Response {
  return new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
}
export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
}
export async function POST(req: Request): Promise<Response> {
  const acesso = await verificarAcesso(req);
  if (!acesso.ok) return json({ error: acesso.erro || "Não autorizado." }, acesso.status || 401);
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return json({ configured: false });

  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: "JSON inválido." }, 400); }
  const mes = String(body.mes || "").trim();
  const semana = String(body.semana || "").trim();
  const posts = Array.isArray(body.posts) ? body.posts : [];
  if (!mes || !semana) return json({ error: "Informe Mês e Semana (painel Banco de imagens)." }, 400);
  if (posts.length === 0) return json({ error: "Nenhum post reconhecido no texto colado." }, 400);

  const raiz = base.replace(/\/+$/, "");
  const H = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
  try {
    // limpa a semana antes de reinserir
    await fetch(raiz + `/rest/v1/legendas?mes=eq.${encodeURIComponent(mes)}&semana=eq.${encodeURIComponent(semana)}`, {
      method: "DELETE", headers: { ...H, Prefer: "return=minimal" },
    });
    const rows = posts.map((p: any) => ({
      mes, semana,
      dia: String(p.dia || "").trim(),
      tipo: String(p.tipo || "").trim(),
      titulo: String(p.titulo || "").trim(),
      instagram: String(p.instagram || ""),
      linkedin: String(p.linkedin || ""),
      data: p.data || null,
    }));
    const r = await fetch(raiz + "/rest/v1/legendas", { method: "POST", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(rows) });
    if (!r.ok) return json({ error: `Falha ao gravar (${r.status}): ${(await r.text().catch(() => "")).slice(0, 200)}` }, 502);
    return json({ ok: true, importados: rows.length });
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, 502);
  }
}
