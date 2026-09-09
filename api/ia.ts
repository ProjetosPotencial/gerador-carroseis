/**
 * Vercel Function: /api/ia
 *
 * Proxy para OpenRouter — mantém a OPENROUTER_API_KEY segura no servidor.
 * Configure a chave em: Vercel Dashboard → Project → Settings → Environment Variables
 *   Nome: OPENROUTER_API_KEY
 *   Valor: sk-or-v1-...
 *
 * O frontend chama POST /api/ia com { prompt, model? } e recebe { texto } ou { error }.
 *
 * v6.1 — adiciona retry automático com modelos backup quando o principal está lotado.
 */

export const config = {
  runtime: "edge",
};

// Modelos válidos no OpenRouter (atualizados em 07/2026).
const MODELOS_PERMITIDOS = [
  // Premium (pagos)
  "anthropic/claude-sonnet-4.5",
  "anthropic/claude-haiku-4.5",
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "google/gemini-2.5-flash",
  "deepseek/deepseek-chat",
  // Grátis
  "deepseek/deepseek-r1:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen-2.5-72b-instruct:free",
];

// Cadeia de fallback: se o modelo escolhido falhar com 429/500, tenta esses (em ordem).
const FALLBACKS_GRATIS = [
  "deepseek/deepseek-r1:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen-2.5-72b-instruct:free",
];

const FALLBACKS_PAGOS = [
  "anthropic/claude-haiku-4.5",
  "openai/gpt-4o-mini",
  "google/gemini-2.5-flash",
];

const MODELO_DEFAULT = "anthropic/claude-sonnet-4.5";

// Status que justificam tentar outro modelo (sem dar erro pro usuário).
const STATUS_RETRY = [408, 429, 500, 502, 503, 504];


/**
 * v7.29 — controle de acesso da rota que gasta crédito de modelo.
 * Até aqui /api/ia era a única rota sem verificação nenhuma: qualquer pessoa
 * com a URL podia queimar a OPENROUTER_API_KEY. Agora aceita a chave de acesso
 * compartilhada (app sem tela de login e automações) ou uma sessão do Supabase
 * cujo e-mail esteja na allowlist. Sem EMAILS_AUTORIZADOS nem CHAVE_ACESSO
 * configurados, o comportamento continua liberado, como nas outras rotas.
 */
async function verificarAcessoIA(
  req: Request
): Promise<{ ok: boolean; erro?: string; status?: number }> {
  const allow = (process.env.EMAILS_AUTORIZADOS || "").trim();
  const chaveAcesso = (process.env.CHAVE_ACESSO || process.env.CRON_SECRET || "").trim();
  if (!allow && !chaveAcesso) return { ok: true };

  const auth = req.headers.get("authorization") || "";
  const token = /^bearer\s+/i.test(auth) ? auth.replace(/^bearer\s+/i, "").trim() : "";
  if (chaveAcesso && token === chaveAcesso) return { ok: true };
  if (!allow) return { ok: false, status: 401, erro: "Não autenticado." };

  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return { ok: true };
  if (!token) return { ok: false, status: 401, erro: "Não autenticado." };

  try {
    const r = await fetch(base.replace(/\/+$/, "") + "/auth/v1/user", {
      headers: { Authorization: "Bearer " + token, apikey: key },
    });
    if (!r.ok) return { ok: false, status: 401, erro: "Sessão inválida ou expirada." };
    const u = await r.json();
    const email = String(u?.email || "").toLowerCase();
    const lista = allow.toLowerCase().split(/[\s,;]+/).filter(Boolean);
    if (email && lista.includes(email)) return { ok: true };
    return { ok: false, status: 403, erro: "E-mail não autorizado." };
  } catch {
    return { ok: false, status: 401, erro: "Falha ao validar a sessão." };
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Use POST" }, 405);
  }

  const acesso = await verificarAcessoIA(req);
  if (!acesso.ok) {
    return json({ error: acesso.erro || "Sem acesso." }, acesso.status || 401);
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return json(
      {
        error:
          "OPENROUTER_API_KEY não configurada. Adicione em: Vercel Dashboard → Project → Settings → Environment Variables.",
      },
      500
    );
  }

  let body: { prompt?: string; model?: string; system?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido no corpo da requisição." }, 400);
  }

  const prompt = (body.prompt || "").trim();
  if (!prompt) {
    return json({ error: "Campo 'prompt' é obrigatório." }, 400);
  }

  const modelSolicitado = body.model || MODELO_DEFAULT;
  const systemPrompt =
    body.system ||
    "Você é um assistente que responde estritamente no formato solicitado pelo usuário. Se for pedido JSON, responda APENAS com o JSON puro, sem markdown, sem texto antes ou depois.";

  // Monta a cadeia de tentativas: modelo escolhido + fallbacks da mesma categoria
  const ehGratis = modelSolicitado.includes(":free");
  const cadeiaModelos = [
    modelSolicitado,
    ...(ehGratis ? FALLBACKS_GRATIS : FALLBACKS_PAGOS).filter(
      (m) => m !== modelSolicitado
    ),
  ];

  // Tenta cada modelo da cadeia até um funcionar
  let ultimoErro = "";
  let ultimoStatus = 502;
  const tentativasFalhas: string[] = [];

  for (const modelAtual of cadeiaModelos) {
    try {
      const resp = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://gerador-potencial.vercel.app",
            "X-Title": "Gerador Potencial",
          },
          body: JSON.stringify({
            model: modelAtual,
            max_tokens: 4000,
            temperature: 0.7,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
          }),
        }
      );

      if (resp.ok) {
        const data = await resp.json();
        const texto = data?.choices?.[0]?.message?.content;
        if (!texto || typeof texto !== "string") {
          ultimoErro = "Resposta vazia ou malformada";
          tentativasFalhas.push(`${modelAtual}: resposta vazia`);
          continue;
        }
        return json({
          texto,
          modelo: modelAtual,
          modeloSolicitado: modelSolicitado,
          tentativasFalhas: tentativasFalhas.length > 0 ? tentativasFalhas : undefined,
        });
      }

      // Não OK — captura o erro
      const textoErro = await resp.text().catch(() => "");
      ultimoStatus = resp.status;
      ultimoErro = traduzirErro(resp.status, textoErro);
      tentativasFalhas.push(`${modelAtual}: ${ultimoErro}`);

      // Se NÃO é erro de retry (ex: 401 unauthorized, 400 bad request), para imediatamente
      if (!STATUS_RETRY.includes(resp.status)) {
        break;
      }
    } catch (err: any) {
      ultimoErro = `Erro de rede: ${err?.message || String(err)}`;
      tentativasFalhas.push(`${modelAtual}: ${ultimoErro}`);
    }
  }

  // Todos os modelos da cadeia falharam
  return json(
    {
      error: montarMensagemFinal(ultimoErro, tentativasFalhas, ehGratis),
      tentativasFalhas,
    },
    ultimoStatus === 401 ? 401 : 502
  );
}

// ============================================================
// HELPERS
// ============================================================

function traduzirErro(status: number, textoErro: string): string {
  const erro = textoErro.toLowerCase();

  if (status === 401) {
    return "Chave de API inválida ou revogada (verifique em openrouter.ai/keys)";
  }
  if (status === 402 || erro.includes("insufficient")) {
    return "Sem créditos suficientes na conta do OpenRouter";
  }
  if (status === 404) {
    return "Modelo não existe ou foi descontinuado";
  }
  if (status === 429) {
    return "Modelo sobrecarregado (rate-limited) — tentando outro modelo";
  }
  if (status === 408 || status === 504) {
    return "Timeout — modelo demorou demais pra responder";
  }
  if (status >= 500) {
    return "OpenRouter ou provedor com erro temporário";
  }
  return `HTTP ${status}: ${textoErro.slice(0, 200)}`;
}

function montarMensagemFinal(
  ultimoErro: string,
  tentativas: string[],
  ehGratis: boolean
): string {
  if (tentativas.length === 1) {
    return `Falha: ${ultimoErro}`;
  }

  const modelosTentados = tentativas.length;
  const sugestao = ehGratis
    ? "Os modelos grátis estão muito demandados agora. Tente daqui a alguns minutos, ou use um modelo pago (Claude Haiku é o mais barato)."
    : "Verifique sua chave e créditos no OpenRouter.";

  return `Tentei ${modelosTentados} modelos sem sucesso. Último erro: ${ultimoErro}. ${sugestao}`;
}

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
