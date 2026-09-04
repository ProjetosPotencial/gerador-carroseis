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
  const r = await verificarAcesso(req);
  return json({ authorized: r.ok, email: r.email || null, erro: r.erro || null });
}
