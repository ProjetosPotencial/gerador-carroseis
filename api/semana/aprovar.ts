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

export const maxDuration = 30;

function json(d: any, s = 200): Response {
  return new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
}
export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
}

function csvCell(v: any): string {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function seg(v: any, fb: string): string {
  const s = String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\/\\]+/g, " ").replace(/[^A-Za-z0-9\s._-]+/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
  return s || fb;
}

// Seg=Peça1(post), Qua=Peça3(carrossel), Qui=Peça2(post), Sex=Peça4(carrossel)
const PECA_DO_DIA: Record<string, number> = { segunda: 1, quinta: 2, quarta: 3, sexta: 4 };

export async function POST(req: Request): Promise<Response> {
  const acesso = await verificarAcesso(req);
  if (!acesso.ok) return json({ error: acesso.erro || "Não autorizado." }, acesso.status || 401);
  const base0 = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_SLIDES_BUCKET || "slides-finais";
  if (!base0 || !key) return json({ configured: false });
  const base = base0.replace(/\/+$/, "");
  const H = { apikey: key, Authorization: "Bearer " + key };

  let body: any = {};
  try { body = await req.json(); } catch {}
  const mes = String(body.mes || "").trim();
  const semana = String(body.semana || "").trim();
  const hora = String(body.hora || process.env.AGENDA_HORA || "09:00").trim();
  if (!mes || !semana) return json({ error: "Informe Mês e Semana." }, 400);

  try {
    const rl = await fetch(base + `/rest/v1/legendas?select=dia,tipo,titulo,instagram,linkedin,data&order=data&mes=eq.${encodeURIComponent(mes)}&semana=eq.${encodeURIComponent(semana)}`, { headers: H });
    const legendas = (await rl.json()) as any[];
    if (!Array.isArray(legendas) || legendas.length === 0) {
      return json({ error: "Nenhuma legenda importada para esta semana. Importe o 02-Legendas antes de aprovar." }, 400);
    }
    const rs = await fetch(base + `/rest/v1/slides_exportados?select=peca,slide,url&mes=eq.${encodeURIComponent(mes)}&semana=eq.${encodeURIComponent(semana)}&order=peca,slide`, { headers: H });
    const slides = (await rs.json().catch(() => [])) as any[];
    const imagensDoPost = (dia: string, tipo: string): string => {
      const num = PECA_DO_DIA[dia];
      const match = (Array.isArray(slides) ? slides : []).filter((s) => {
        const pc = String(s.peca || "").toLowerCase();
        if (num && pc.includes(String(num))) return true;
        return tipo === "carrossel" ? pc.includes("carrossel") : pc.includes("feed") || pc.includes("stories") || pc.includes("post");
      });
      return match.map((s) => s.url).join(" | ");
    };

    // Horário de engajamento por (dia, rede); fallback pro hora padrão.
    const horarios: Record<string, string> = {};
    try {
      const rh = await fetch(base + "/rest/v1/horarios_engajamento?select=dia,rede,hora", { headers: H });
      const hr = await rh.json();
      if (Array.isArray(hr)) {
        for (const x of hr) horarios[`${String(x.dia).toLowerCase()}|${String(x.rede).toLowerCase()}`] = String(x.hora);
      }
    } catch {}
    const horaDe = (dia: string, rede: string): string =>
      horarios[`${dia.toLowerCase()}|${rede.toLowerCase()}`] || hora;

    const redes: [keyof any, string][] = [["instagram", "Instagram"], ["linkedin", "LinkedIn"]];
    const linhas: string[][] = [["data", "hora", "rede", "tipo", "titulo", "legenda", "imagens"]];
    for (const lg of legendas) {
      const imgs = imagensDoPost(lg.dia, lg.tipo);
      for (const [campo, label] of redes) {
        linhas.push([lg.data || "", horaDe(lg.dia, String(campo)), label, lg.tipo, lg.titulo, (lg as any)[campo] || "", imgs]);
      }
    }
    const csv = linhas.map((r) => r.map(csvCell).join(",")).join("\r\n");
    const bytes = Buffer.from("﻿" + csv, "utf8"); // BOM p/ acentos no Excel

    const path = `${seg(mes, "Mes")}/${seg(semana, "Semana")}/agendamento-${seg(semana, "semana")}.csv`;
    const up = await fetch(base + "/storage/v1/object/" + bucket + "/" + encodeURI(path), {
      method: "POST",
      headers: { ...H, "Content-Type": "text/csv; charset=utf-8", "x-upsert": "true" },
      body: bytes,
    });
    if (!up.ok) return json({ error: `Falha ao salvar CSV (${up.status}): ${(await up.text().catch(() => "")).slice(0, 200)}` }, 502);
    const csvUrl = base + "/storage/v1/object/public/" + bucket + "/" + encodeURI(path);

    await fetch(base + "/rest/v1/semanas_aprovadas", {
      method: "POST", headers: { ...H, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ mes, semana, csv_url: csvUrl }),
    }).catch(() => {});

    await enviarSlack(`✅ Parcele Aqui — Semana ${semana} (${mes}) aprovada. Pacote de agendamento pronto pra importar no Buffer/Metricool: ${csvUrl}`);

    return json({ ok: true, csvUrl, linhas: linhas.length - 1 });
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, 502);
  }
}
