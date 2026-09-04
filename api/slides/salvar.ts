/**
 * Vercel Function: POST /api/slides/salvar — v7.13
 *
 * Recebe o PNG de um slide final (dataURL) + metadados e sobe pro bucket
 * Supabase `slides-finais` no caminho ${mes}/${semana}/${peca}/slide-${n}.png,
 * gravando uma linha em public.slides_exportados. Usa a SERVICE_ROLE_KEY
 * server-side (nunca no cliente). Best-effort: se o Supabase faltar, avisa
 * (configured:false) sem quebrar.
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
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

/**
 * Sanitiza um segmento de caminho para chave do Supabase Storage.
 * O Storage rejeita caracteres nao-ASCII (ex.: "c-cedilha", "a-til") com InvalidKey,
 * entao normalizamos (NFD) e removemos diacriticos antes de filtrar.
 * Mantem legivel: espacos, maiusculas, ".", "_" e "-" sao preservados.
 */
function seg(v: any, fallback: string): string {
  const s = String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\/\\]+/g, " ")
    .replace(/[^A-Za-z0-9\s._-]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return s || fallback;
}

export async function POST(req: Request): Promise<Response> {
  const acesso = await verificarAcesso(req);
  if (!acesso.ok) return json({ error: acesso.erro || "Não autorizado." }, acesso.status || 401);
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_SLIDES_BUCKET || "slides-finais";
  if (!base || !key) return json({ configured: false });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido." }, 400);
  }

  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(String(body.png || ""));
  if (!m) return json({ error: "PNG ausente ou inválido." }, 400);
  const contentType = m[1];
  const bytes = Buffer.from(m[2], "base64");

  const n = Number(body.slide) || 1;
  const mes = seg(body.mes, "Geral");
  const semana = seg(body.semana, "Geral");
  const peca = seg(body.peca, "Carrossel");
  const caminho = `${mes}/${semana}/${peca}`;
  const path = `${caminho}/slide-${n}.png`;
  const raiz = base.replace(/\/+$/, "");

  try {
    const up = await fetch(raiz + "/storage/v1/object/" + bucket + "/" + encodeURI(path), {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key,
        apikey: key,
        "Content-Type": contentType,
        "x-upsert": "true",
        "cache-control": "3600",
      },
      body: bytes,
    });
    if (!up.ok) {
      const txt = (await up.text().catch(() => "")).slice(0, 200);
      return json({ error: `Upload falhou (${up.status}): ${txt}` }, 502);
    }
    const url = raiz + "/storage/v1/object/public/" + bucket + "/" + encodeURI(path);

    await fetch(raiz + "/rest/v1/slides_exportados", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key,
        apikey: key,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ mes, semana, peca, slide: n, url }),
    }).catch(() => {});

    return json({ configured: true, url, caminho });
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, 502);
  }
}
