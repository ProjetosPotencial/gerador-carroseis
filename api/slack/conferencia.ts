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
// [inline auto-gerado — helpers self-contained; a lib/ não empacota no Vercel]
/**
 * Slack via Incoming Webhook — posta num canal e menciona quem estiver em
 * SLACK_MENCOES. Env server-side: SLACK_WEBHOOK_URL (URL do webhook),
 * SLACK_MENCOES (ex.: "<@U0DANIEL> <@U0VICTOR>"). Best-effort: nunca lança.
 */
async function enviarSlack(texto: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return; // não configurado → silencioso
  const mencoes = (process.env.SLACK_MENCOES || "").trim();
  const text = mencoes ? `${texto} ${mencoes}` : texto;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) {
      console.error("[slack] webhook falhou", r.status, (await r.text().catch(() => "")).slice(0, 200));
    }
  } catch (e: any) {
    console.error("[slack] erro webhook", e?.message || e);
  }
}

export const maxDuration = 15;

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
export async function POST(req: Request): Promise<Response> {
  const acesso = await verificarAcesso(req);
  if (!acesso.ok) return json({ error: acesso.erro || "Não autorizado." }, acesso.status || 401);

  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  const peca = String(body.peca || "").trim() || "as artes";
  const semana = String(body.semana || "").trim();
  const n = Number(body.n) || 0;
  const appUrl = String(body.appUrl || "").trim() || process.env.APP_URL || "";

  const ondeSemana = semana ? ` da ${semana}` : "";
  const link = appUrl ? ` Confere e aprova aqui: ${appUrl}.` : "";
  const texto =
    `✅ Parcele Aqui — artes prontas: ${peca}${ondeSemana} ` +
    `(${n} ${n === 1 ? "imagem" : "imagens"}) ${n === 1 ? "foi gerada" : "foram geradas"}.${link}`;

  await enviarSlack(texto);
  return json({ ok: true, enviado: Boolean(process.env.SLACK_WEBHOOK_URL) });
}
