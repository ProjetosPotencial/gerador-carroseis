/**
 * Vercel Function: /api/imagem — v7.9
 *
 * Provedor de imagem CONFIGURÁVEL por variável de ambiente (server-side).
 *   IMAGE_PROVIDER: "gemini" | "openrouter" | "openai"  (default "gemini")
 *   IMAGE_MODEL: sobrescreve o modelo padrão do provedor (opcional)
 *   IMAGE_PROVIDER_FALLBACK: provedor reserva se o principal falhar (opcional)
 *   GEMINI_API_KEY / OPENROUTER_API_KEY / OPENAI_API_KEY: chaves de cada provedor
 *
 * O front envia: cena, estiloVisual, negative, aspectRatio, imageSize, apiKey?
 * (apiKey = chave do usuário p/ Gemini, "bring-your-own"; nunca vaza pro cliente
 * porque a chamada ao provedor é feita aqui no servidor).
 *
 * Endpoints (confirmados em 07/2026):
 *  - gemini: generateContent, responseModalities:["IMAGE"] + imageConfig.aspectRatio
 *  - openrouter: chat/completions, modalities:["image","text"] (OpenAI-compatible)
 *  - openai: /v1/images/generations, gpt-image-1, size fixo
 */

// Node.js serverless (NÃO edge) para respeitar maxDuration.
// gpt-image-1 leva ~28s; edge morre em ~25s (FUNCTION_INVOCATION_TIMEOUT).
export const maxDuration = 60;

type Provider = "gemini" | "openrouter" | "openai";

const ENV_KEY: Record<Provider, string> = {
  gemini: "GEMINI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  openai: "OPENAI_API_KEY",
};

const ASPECTOS_VALIDOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];

// OpenAI só aceita tamanhos fixos.
const OPENAI_SIZE: Record<string, string> = {
  "4:5": "1024x1536",
  "9:16": "1024x1536",
  "16:9": "1536x1024",
  "1:1": "1024x1024",
};

class ErroProvedor extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// fetch com timeout próprio (AbortController). Assim, se o provedor travar,
// a rota responde com mensagem clara em vez de pendurar até o maxDuration de 60s.
async function fetchTimeout(
  url: string,
  opts: RequestInit,
  ms: number,
  provedor: string
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new ErroProvedor(
        `${provedor} demorou demais (timeout de ${Math.round(ms / 1000)}s). Tente de novo ou reduza a qualidade.`,
        504
      );
    }
    throw new ErroProvedor(`Erro de rede ao chamar o ${provedor}: ${e?.message || String(e)}`, 502);
  } finally {
    clearTimeout(t);
  }
}

// ============================================================
// HELPERS INLINE (auth + crédito + slack) — self-contained.
// Antes eram imports de arquivos separados; inline garante que a função
// SEMPRE carrega, sem risco de falha de resolução de módulo no build.
// Tudo best-effort e env-gated: nunca derruba a geração.
// ============================================================

async function verificarAcessoLocal(
  req: Request
): Promise<{ ok: boolean; erro?: string; status?: number }> {
  const allow = (process.env.EMAILS_AUTORIZADOS || "").trim();
  if (!allow) return { ok: true };
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return { ok: true };
  const auth = req.headers.get("authorization") || "";
  const token = /^bearer\s+/i.test(auth) ? auth.replace(/^bearer\s+/i, "").trim() : "";
  // v7.20.6: automação (produzir-semana / render headless) autentica com CRON_SECRET
  const cron = (process.env.CHAVE_ACESSO || process.env.CRON_SECRET || "").trim();
  if (cron && token === cron) return { ok: true };
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

async function enviarSlackLocal(texto: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  const mencoes = (process.env.SLACK_MENCOES || "").trim();
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: mencoes ? `${texto} ${mencoes}` : texto }),
    });
  } catch (e: any) {
    console.error("[slack] erro webhook", e?.message || e);
  }
}

function envNumLocal(name: string, def: number): number {
  const v = parseFloat(process.env[name] || "");
  return isNaN(v) ? def : v;
}

async function verificarCreditoLocal(opts?: {
  alertar?: boolean;
}): Promise<{ bloqueado: boolean; mensagem?: string; count?: number; custoBRL?: number; tetoBRL?: number }> {
  const alertar = opts?.alertar !== false;
  const base0 = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const teto0 = envNumLocal("ORCAMENTO_MES_BRL", 60);
  const cambio = envNumLocal("CAMBIO_USD_BRL", 6);
  const custoImg = envNumLocal("CUSTO_IMAGEM_USD", 0.039);
  const aviso = envNumLocal("AVISO_PERCENT", 80);
  if (!base0 || !key) return { bloqueado: false };
  const base = base0.replace(/\/+$/, "");
  const H = { apikey: key, Authorization: "Bearer " + key };
  const now = new Date();
  const y = now.getUTCFullYear();
  const mo = now.getUTCMonth();
  const startISO = new Date(Date.UTC(y, mo, 1)).toISOString();
  const resetISO = new Date(Date.UTC(y, mo + 1, 1)).toISOString();
  const mesKey = `${y}-${String(mo + 1).padStart(2, "0")}`;

  let count = 0;
  try {
    const r = await fetch(
      base + `/rest/v1/imagens?select=id&created_at=gte.${encodeURIComponent(startISO)}&limit=1`,
      { headers: { ...H, Prefer: "count=exact" } }
    );
    const cr = r.headers.get("content-range") || "";
    const tot = cr.split("/")[1];
    count = tot ? parseInt(tot, 10) : 0;
    if (isNaN(count)) count = 0;
  } catch {
    return { bloqueado: false }; // erro ao contar → não bloqueia (best-effort)
  }

  let recargas = 0;
  try {
    const rr = await fetch(
      base + `/rest/v1/credito_recargas?select=valor_brl&created_at=gte.${encodeURIComponent(startISO)}`,
      { headers: H }
    );
    if (rr.ok) {
      const rows = await rr.json();
      if (Array.isArray(rows)) recargas = rows.reduce((a: number, x: any) => a + (Number(x.valor_brl) || 0), 0);
    }
  } catch {}

  const teto = teto0 + recargas;
  const custoAtual = count * custoImg * cambio;
  const custoProj = (count + 1) * custoImg * cambio;
  const bloqueado = custoAtual >= teto;
  const fmt = (n: number) => n.toFixed(2);
  const dataReset = new Date(resetISO).toISOString().slice(0, 10);

  if (alertar) {
    const jaAvisou = async (nivel: number): Promise<boolean> => {
      try {
        const r = await fetch(base + "/rest/v1/credito_alertas", {
          method: "POST",
          headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ mes: mesKey, nivel }),
        });
        if (r.status === 201 || r.ok) return false;
        return true;
      } catch {
        return true;
      }
    };
    try {
      if (bloqueado || custoProj >= teto) {
        if (!(await jaAvisou(100)))
          await enviarSlackLocal(
            `🚨 Parcele Aqui — Gerador de imagens: o teto mensal de R$ ${fmt(teto)} foi atingido (${count} imagens). Geração PAUSADA. Reset automático em ${dataReset}. Providenciar recarga do billing da Gemini (projeto ADMSOCIAL).`
          );
      } else if (custoProj >= teto * (aviso / 100)) {
        if (!(await jaAvisou(80)))
          await enviarSlackLocal(
            `⚠️ Parcele Aqui — Gerador de imagens: já usamos ~R$ ${fmt(custoProj)} de R$ ${fmt(teto)} do mês (${Math.round((custoProj / teto) * 100)}%). Perto do teto.`
          );
      }
    } catch (e: any) {
      console.error("[credito] alerta falhou", e?.message || e);
    }
  }

  const mensagem = bloqueado
    ? `Teto mensal de imagens atingido (R$ ${fmt(custoAtual)} de R$ ${fmt(teto)}). Geração pausada até a recarga ou a virada do mês em ${dataReset}.`
    : undefined;
  return { bloqueado, mensagem, count, custoBRL: custoAtual, tetoBRL: teto };
}

// Vercel runtime Node: usar exports nomeados por método (Web handlers).
// O `export default (req: Request)` só é reconhecido no runtime edge; no Node
// ele não é invocado e a função responde vazio. GET/POST/OPTIONS resolvem isso.

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// Debug: GET /api/imagem?debug=1 -> qual provider/modelo está ativo (sem chamar a API)
export async function GET(req: Request): Promise<Response> {
  const qs = (req.url || "").split("?")[1] || "";
  if (new URLSearchParams(qs).get("debug") === "1") {
    const prov = (process.env.IMAGE_PROVIDER || "gemini").toLowerCase();
    const defaults: Record<string, string> = {
      gemini: "gemini-2.5-flash-image",
      openrouter: "google/gemini-2.5-flash-image",
      openai: "gpt-image-1",
    };
    const model = process.env.IMAGE_MODEL || defaults[prov] || "";
    const envKey = (ENV_KEY as Record<string, string>)[prov];
    const hasKey = Boolean(envKey && process.env[envKey]);
    return json({ provider: prov, model, hasKey });
  }
  return json({ error: "Use POST (debug: GET /api/imagem?debug=1)" }, 405);
}

export async function POST(req: Request): Promise<Response> {
  // Auth e crédito são best-effort: nunca podem derrubar a geração de imagem.
  let acesso: { ok: boolean; erro?: string; status?: number } = { ok: true };
  try {
    acesso = await verificarAcessoLocal(req);
  } catch (e) {
    console.error("[auth] erro (liberando):", e);
  }
  if (!acesso.ok) return json({ error: acesso.erro || "Não autorizado." }, acesso.status || 401);

  let credito: any = { bloqueado: false };
  try {
    credito = await verificarCreditoLocal({ alertar: true });
  } catch (e) {
    console.error("[credito] erro (seguindo geração):", e);
  }
  if (credito.bloqueado) {
    return json({ error: credito.mensagem || "Teto mensal de imagens atingido.", credito }, 402);
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido no corpo da requisição." }, 400);
  }

  // ---- Modo HOSPEDAR (automação de publicação): sobe um PNG final pro
  // Supabase público e devolve a URL. Evita criar uma função serverless nova
  // (limite de 12 no plano Hobby). Auth já validada acima (CRON_SECRET).
  if (body && body.acao === "hospedar") {
    const hpath = String(body.path || "").replace(/^\/+/, "");
    const hdata = String(body.dataUrl || "");
    if (!hpath || !hdata) return json({ error: "path e dataUrl obrigatorios" }, 400);
    const sbBase = process.env.SUPABASE_URL;
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const sbBucket = process.env.SUPABASE_BUCKET || "imagens-parcele";
    if (!sbBase || !sbKey) return json({ error: "Supabase nao configurado" }, 500);
    const mm = /^data:([-\w.+\/]+);base64,(.+)$/.exec(hdata); // aceita imagem e PDF
    if (!mm) return json({ error: "dataUrl invalida" }, 400);
    const raiz = sbBase.replace(/\/+$/, "");
    const up = await fetch(raiz + "/storage/v1/object/" + sbBucket + "/" + encodeURI(hpath), {
      method: "POST",
      headers: { Authorization: "Bearer " + sbKey, apikey: sbKey, "Content-Type": mm[1], "x-upsert": "true", "cache-control": "3600" },
      body: Buffer.from(mm[2], "base64"),
    });
    if (!up.ok) return json({ error: "upload falhou " + up.status }, 502);
    return json({ ok: true, url: raiz + "/storage/v1/object/public/" + sbBucket + "/" + hpath });
  }

  // ---- Composição do prompt final (server-side) ----
  const cena = String(body.cena ?? "").trim();
  const estiloVisual = String(body.estiloVisual ?? "").trim();
  const negative = String(body.negative ?? body.negativePrompt ?? "").trim();

  let basePrompt: string;
  if (cena) {
    basePrompt = [cena, estiloVisual].filter(Boolean).join(", ");
  } else {
    // compat: front antigo mandava o prompt já montado
    basePrompt = String(body.prompt ?? "").trim();
  }
  if (!basePrompt) {
    return json({ error: "Campo 'cena' (ou 'prompt') é obrigatório." }, 400);
  }
  // Regra de marca (v7.20): nunca usar fachada de banco / colunas / prédios antigos
  // para transmitir solidez, experiência ou tempo de mercado. Sempre anexada.
  const REGRA_MARCA =
    "Regra de marca obrigatoria: NAO usar fachada de banco, colunas de marmore, " +
    "predios antigos nem arquitetura institucional para transmitir solidez, experiencia " +
    "ou tempo de mercado. Se a cena acima pedir isso, IGNORE e no lugar mostre uma pessoa " +
    "brasileira real usando o Parcele Aqui no notebook, computador ou celular, pagando uma " +
    "conta com tranquilidade e olhando para a camera com alivio, em ambiente cotidiano " +
    "(casa ou escritorio), luz natural, realista. " +
    "Enquadramento: deixe amplo espaco livre onde o texto entra (parte inferior e " +
    "esquerda em fotos de fundo inteiro); as pessoas/sujeito devem ficar nos tercos " +
    "superiores OU no lado oposto ao texto, NUNCA cobertas pelo texto nem na area " +
    "escurecida pelo gradiente. O modelo/pessoa deve aparecer EM DESTAQUE e bem " +
    "enquadrado (mostrar mais da pessoa, sem cortar cabeca ou corpo); objetos-chave " +
    "como o celular ficam VISIVEIS acima ou ao lado do texto, nunca atras dele. Em " +
    "feed/stories, o sujeito fica proeminente e mais ao centro-superior da peca, cabendo INTEIRA no enquadramento, sem cortar a pessoa nas bordas, SEMPRE com respiro/margem nas laterais (o modelo nunca encosta nem sai pela borda). PROIBIDO renderizar qualquer texto, letras, palavras, numeros, logotipos, marcas ou marca d agua dentro da imagem — isso INCLUI telas de celular e computador (que devem aparecer limpas, sem texto legivel), cartazes, placas, quadros, etiquetas e estampas em roupas. A imagem e apenas a foto realista; todos os textos e o logo sao adicionados depois pelo layout. A imagem deve ser UMA unica cena coesa preenchendo TODO o quadro, sem duplicar nem espelhar o cenario, sem molduras, faixas ou margens vazias.";
  // Nenhum desses provedores tem parâmetro de negative dedicado hoje: anexamos.
  const promptFinal = [
    basePrompt,
    negative ? `Evitar: ${negative}.` : "",
    REGRA_MARCA,
  ]
    .filter(Boolean)
    .join("\n\n");

  const aspectRatio = ASPECTOS_VALIDOS.includes(String(body.aspectRatio || ""))
    ? String(body.aspectRatio)
    : "4:5";
  const imageSize = ["1K", "2K", "4K"].includes(String(body.imageSize || ""))
    ? String(body.imageSize)
    : "1K";

  const provider = ((process.env.IMAGE_PROVIDER || "gemini").toLowerCase() as Provider);
  const fallback = (process.env.IMAGE_PROVIDER_FALLBACK || "").toLowerCase() as Provider | "";
  const imageModelEnv = process.env.IMAGE_MODEL || "";

  const keys: Record<Provider, string | undefined> = {
    gemini: (String(body.apiKey || "").trim() || process.env.GEMINI_API_KEY) as string | undefined,
    openrouter: process.env.OPENROUTER_API_KEY,
    openai: process.env.OPENAI_API_KEY,
  };

  const args = { promptFinal, aspectRatio, imageSize };

  async function comRetry(prov: Provider): Promise<{ dataUrl: string; modelo: string }> {
    // modelo: IMAGE_MODEL (env) > body.model (só p/ gemini, é ID gemini) > default do provedor
    const modelo =
      imageModelEnv || (prov === "gemini" ? String(body.model || "") : "") || undefined;
    // OpenAI: "low" (~12s) — confiável dentro do maxDuration; "medium" às vezes passa de 60s.
    const qualidades = prov === "openai" ? ["low", "low", "low"] : [undefined, undefined, undefined];
    let ultimoErro: ErroProvedor | null = null;
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      try {
        return await chamarProvedor(prov, args, keys[prov], modelo, qualidades[tentativa]);
      } catch (e: any) {
        ultimoErro = e instanceof ErroProvedor ? e : new ErroProvedor(String(e?.message || e));
        const st = ultimoErro.status;
        const retriavel = st === 429 || st === 408 || st === 500 || st === 502 || st === 503 || st === 504;
        if (retriavel && tentativa < 2) {
          await sleep(1500);
          continue;
        }
        throw ultimoErro;
      }
    }
    throw ultimoErro || new ErroProvedor("Falha desconhecida");
  }

  const banco = metaBanco(body, { cena, estiloVisual, aspectRatio });
  try {
    const r = await comRetry(provider);
    const bancoUrl = await persistirNoBanco(r.dataUrl, banco);
    return json({ imagem: r.dataUrl, modelo: r.modelo, provider, bancoUrl });
  } catch (e: any) {
    const err: ErroProvedor = e instanceof ErroProvedor ? e : new ErroProvedor(String(e?.message || e));
    // fallback (uma vez) se configurado e diferente do principal
    if (fallback && fallback !== provider && (["gemini", "openrouter", "openai"] as string[]).includes(fallback)) {
      try {
        const r = await comRetry(fallback as Provider);
        const bancoUrl = await persistirNoBanco(r.dataUrl, banco);
        return json({ imagem: r.dataUrl, modelo: r.modelo, provider: fallback, fallback: true, bancoUrl });
      } catch {
        // ignora — reporta o erro do provedor principal
      }
    }
    return json({ error: err.message }, err.status === 401 ? 401 : err.status || 502);
  }
}

// ============================================================
// DISPATCH
// ============================================================
async function chamarProvedor(
  prov: Provider,
  args: { promptFinal: string; aspectRatio: string; imageSize: string },
  key: string | undefined,
  modelo: string | undefined,
  quality?: string
): Promise<{ dataUrl: string; modelo: string }> {
  if (!key) {
    throw new ErroProvedor(
      `Chave do provedor "${prov}" não configurada. Defina ${ENV_KEY[prov]} nas variáveis de ambiente da Vercel (ou, no Gemini, cole sua chave no painel "Estilo visual").`,
      500
    );
  }
  if (prov === "gemini") return gerarGemini(args, key, modelo);
  if (prov === "openrouter") return gerarOpenRouter(args, key, modelo);
  if (prov === "openai") return gerarOpenAI(args, key, modelo, quality);
  throw new ErroProvedor(`IMAGE_PROVIDER inválido: "${prov}" (use gemini, openrouter ou openai).`, 400);
}

// ============================================================
// GEMINI
// ============================================================
async function gerarGemini(
  { promptFinal, aspectRatio, imageSize }: { promptFinal: string; aspectRatio: string; imageSize: string },
  key: string,
  modelo?: string
): Promise<{ dataUrl: string; modelo: string }> {
  const model = modelo || "gemini-2.5-flash-image";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const resp = await fetchTimeout(endpoint, {
    method: "POST",
    headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptFinal }] }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio, imageSize },
      },
    }),
  }, 45000, "Gemini");
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new ErroProvedor(traduzir("Gemini", resp.status, t), resp.status);
  }
  const data = await resp.json();
  const partes: any[] = data?.candidates?.[0]?.content?.parts || [];
  const inline = partes.find((p) => p?.inlineData?.data || p?.inline_data?.data);
  const dados = inline?.inlineData || inline?.inline_data;
  if (!dados?.data) {
    const motivo = data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason || "";
    throw new ErroProvedor(
      motivo
        ? `Gemini não retornou imagem (motivo: ${motivo}). Ajuste o prompt da cena.`
        : "Gemini não retornou nenhuma imagem. Tente novamente."
    );
  }
  const mime = dados.mimeType || dados.mime_type || "image/png";
  return { dataUrl: `data:${mime};base64,${dados.data}`, modelo: model };
}

// ============================================================
// OPENROUTER (chat/completions, modalities image)
// ============================================================
async function gerarOpenRouter(
  { promptFinal, aspectRatio }: { promptFinal: string; aspectRatio: string; imageSize: string },
  key: string,
  modelo?: string
): Promise<{ dataUrl: string; modelo: string }> {
  const model = modelo || "google/gemini-2.5-flash-image";
  const resp = await fetchTimeout("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://gerador-carroseis-v6.vercel.app",
      "X-Title": "Gerador Potencial",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: promptFinal }],
      modalities: ["image", "text"],
      image_config: { aspect_ratio: aspectRatio },
    }),
  }, 45000, "OpenRouter");
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new ErroProvedor(traduzir("OpenRouter", resp.status, t), resp.status);
  }
  const data = await resp.json();
  const msg = data?.choices?.[0]?.message;
  // OpenRouter devolve imagens em message.images[].image_url.url (data URL)
  const url =
    msg?.images?.[0]?.image_url?.url ||
    msg?.images?.[0]?.url ||
    (typeof msg?.content === "string" && msg.content.startsWith("data:") ? msg.content : "");
  if (!url) {
    throw new ErroProvedor("OpenRouter não retornou imagem. Verifique se o modelo gera imagem.");
  }
  return { dataUrl: url, modelo: model };
}

// ============================================================
// OPENAI (/v1/images/generations)
// ============================================================
async function gerarOpenAI(
  { promptFinal, aspectRatio }: { promptFinal: string; aspectRatio: string; imageSize: string },
  key: string,
  modelo?: string,
  quality?: string
): Promise<{ dataUrl: string; modelo: string }> {
  const model = modelo || "gpt-image-1";
  const size = OPENAI_SIZE[aspectRatio] || "1024x1024";
  const resp = await fetchTimeout("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt: promptFinal, size, n: 1, quality: quality || "low" }),
  }, 45000, "OpenAI");
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new ErroProvedor(traduzir("OpenAI", resp.status, t), resp.status);
  }
  const data = await resp.json();
  const item = data?.data?.[0];
  const b64 = item?.b64_json;
  if (b64) return { dataUrl: `data:image/png;base64,${b64}`, modelo: model };
  if (item?.url) return { dataUrl: item.url, modelo: model };
  throw new ErroProvedor("OpenAI não retornou imagem.");
}

// ============================================================
// HELPERS
// ============================================================
function traduzir(provedor: string, status: number, texto: string): string {
  const t = (texto || "").toLowerCase();
  if (status === 400 && t.includes("api key"))
    return `Chave do ${provedor} inválida ou mal formatada.`;
  if (status === 401 || status === 403)
    return `Chave do ${provedor} inválida, revogada ou sem permissão para gerar imagens.`;
  if (status === 429)
    return `Cota do ${provedor} estourada (rate limit). Aguarde um minuto e tente de novo, ou use outra chave.`;
  if (status >= 500) return `${provedor} com erro temporário. Tente novamente em alguns segundos.`;
  if (t.includes("safety") || t.includes("blocked"))
    return `Prompt bloqueado por política de segurança do ${provedor}. Ajuste a descrição da cena.`;
  return `Erro HTTP ${status} do ${provedor}: ${(texto || "").slice(0, 200)}`;
}

// ============================================================
// BANCO DE IMAGENS (Supabase) — best-effort, nunca quebra a geração
// ============================================================

/** Monta a linha de metadados a partir do body.banco + campos do core. */
function metaBanco(
  body: any,
  core: { cena: string; estiloVisual: string; aspectRatio: string }
): Record<string, any> {
  const b = (body && typeof body.banco === "object" && body.banco) || {};
  const str = (v: any) => {
    const t = String(v ?? "").trim();
    return t ? t : null;
  };
  const tags = Array.isArray(b.tags)
    ? b.tags.map((t: any) => String(t).trim()).filter(Boolean)
    : null;
  return {
    prompt_cena: str(core.cena),
    estilo_visual: str(core.estiloVisual),
    aspect_ratio: str(core.aspectRatio),
    vertical: str(b.vertical),
    mes: str(b.mes),
    semana: str(b.semana),
    peca: str(b.peca),
    slide: b.slide != null && !isNaN(Number(b.slide)) ? Number(b.slide) : null,
    layout: str(b.layout),
    tags: tags && tags.length ? tags : null,
  };
}

function slugBanco(v: any): string {
  return String(v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/**
 * Sobe o PNG pro Supabase Storage e insere a linha de metadados.
 * Só roda se SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY estiverem setados.
 * Nunca lança: se falhar, loga e devolve null (a geração não depende disto).
 */
async function persistirNoBanco(
  dataUrl: string,
  meta: Record<string, any>
): Promise<string | null> {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_BUCKET || "imagens-parcele";
  if (!base || !key) return null; // banco não configurado — segue sem persistir
  try {
    const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
    if (!m) return null;
    const contentType = m[1];
    const ext = (contentType.split("/")[1] || "png").replace(/[^a-z0-9]/gi, "") || "png";
    const bytes = Buffer.from(m[2], "base64");

    const vertical = slugBanco(meta.vertical) || "geral";
    const nome =
      [
        slugBanco(meta.mes),
        slugBanco(meta.semana),
        slugBanco(meta.peca) || "peca",
        meta.slide != null ? "slide" + meta.slide : "",
        String(Date.now()),
      ]
        .filter(Boolean)
        .join("-") + "." + ext;
    const path = vertical + "/" + nome;
    const raiz = base.replace(/\/+$/, "");

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
      console.error("[banco] upload falhou", up.status, (await up.text().catch(() => "")).slice(0, 200));
      return null;
    }
    const publicUrl = raiz + "/storage/v1/object/public/" + bucket + "/" + path;

    const ins = await fetch(raiz + "/rest/v1/imagens", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key,
        apikey: key,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ url: publicUrl, ...meta }),
    });
    if (!ins.ok) {
      console.error("[banco] insert falhou", ins.status, (await ins.text().catch(() => "")).slice(0, 200));
    }
    return publicUrl;
  } catch (e: any) {
    console.error("[banco] erro:", e?.message || e);
    return null;
  }
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
