import { enviarSlack } from "./slack";

/**
 * Controle de crédito mensal do Gerador (freio de custo da Gemini API).
 * Conta as imagens do mês na tabela public.imagens e estima o custo em BRL.
 * Bloqueia a geração ao atingir o teto e alerta no Slack aos AVISO_PERCENT e 100%.
 * Tudo env-gated: sem SUPABASE_URL/KEY, não bloqueia.
 */
export interface CreditoInfo {
  configurado: boolean;
  bloqueado: boolean;
  count: number;
  custoBRL: number;
  tetoBRL: number;
  pct: number;
  dataReset: string;
  mensagem?: string;
}

function envNum(name: string, def: number): number {
  const v = parseFloat(process.env[name] || "");
  return isNaN(v) ? def : v;
}
function fmtBRL(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", timeZone: "UTC" });
}

async function somaRecargas(base: string, key: string, startISO: string): Promise<number> {
  try {
    const r = await fetch(
      base + `/rest/v1/credito_recargas?select=valor_brl&created_at=gte.${encodeURIComponent(startISO)}`,
      { headers: { apikey: key, Authorization: "Bearer " + key } }
    );
    if (!r.ok) return 0;
    const rows = await r.json();
    if (!Array.isArray(rows)) return 0;
    return rows.reduce((a: number, x: any) => a + (Number(x.valor_brl) || 0), 0);
  } catch {
    return 0;
  }
}

/** Marca o alerta do nível no mês; retorna true se JÁ havia sido enviado. */
async function jaAvisou(base: string, key: string, mes: string, nivel: number): Promise<boolean> {
  try {
    const r = await fetch(base + "/rest/v1/credito_alertas", {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ mes, nivel }),
    });
    if (r.status === 201 || r.ok) return false; // inseriu agora → ainda não avisou
    if (r.status === 409) return true; // unique (mes,nivel) → já avisou
    return true; // erro desconhecido → não arrisca spam
  } catch {
    return true;
  }
}

export async function verificarCredito(opts?: { alertar?: boolean }): Promise<CreditoInfo> {
  const alertar = opts?.alertar !== false;
  const base0 = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const teto0 = envNum("ORCAMENTO_MES_BRL", 60);
  const cambio = envNum("CAMBIO_USD_BRL", 6);
  const custoImg = envNum("CUSTO_IMAGEM_USD", 0.039);
  const aviso = envNum("AVISO_PERCENT", 80);

  const now = new Date();
  const y = now.getUTCFullYear();
  const mo = now.getUTCMonth();
  const startISO = new Date(Date.UTC(y, mo, 1)).toISOString();
  const resetISO = new Date(Date.UTC(y, mo + 1, 1)).toISOString();
  const mesKey = `${y}-${String(mo + 1).padStart(2, "0")}`;

  if (!base0 || !key) {
    return { configurado: false, bloqueado: false, count: 0, custoBRL: 0, tetoBRL: teto0, pct: 0, dataReset: resetISO };
  }
  const base = base0.replace(/\/+$/, "");

  let count = 0;
  try {
    const r = await fetch(
      base + `/rest/v1/imagens?select=id&created_at=gte.${encodeURIComponent(startISO)}&limit=1`,
      { headers: { apikey: key, Authorization: "Bearer " + key, Prefer: "count=exact" } }
    );
    const cr = r.headers.get("content-range") || "";
    const tot = cr.split("/")[1];
    count = tot ? parseInt(tot, 10) : 0;
    if (isNaN(count)) count = 0;
  } catch {
    count = 0;
  }

  const recargas = await somaRecargas(base, key, startISO);
  const teto = teto0 + recargas;
  const custoAtual = count * custoImg * cambio;
  const custoProj = (count + 1) * custoImg * cambio;
  const pct = teto > 0 ? custoAtual / teto : 0;
  const bloqueado = custoAtual >= teto;
  const dataResetFmt = fmtData(resetISO);

  if (alertar) {
    try {
      if (bloqueado || custoProj >= teto) {
        if (!(await jaAvisou(base, key, mesKey, 100))) {
          await enviarSlack(
            `🚨 Parcele Aqui — Gerador de imagens: o teto mensal de R$ ${fmtBRL(teto)} foi atingido (${count} imagens). ` +
              `A geração de imagens no app está PAUSADA e os agendamentos foram suspensos. ` +
              `Reset automático em ${dataResetFmt}. Para voltar a gerar antes disso, é preciso providenciar a recarga/aumento do teto do billing da Gemini API (projeto ADMSOCIAL).`
          );
        }
      } else if (custoProj >= teto * (aviso / 100)) {
        if (!(await jaAvisou(base, key, mesKey, 80))) {
          const pctProj = Math.round((custoProj / teto) * 100);
          await enviarSlack(
            `⚠️ Parcele Aqui — Gerador de imagens: já usamos ~R$ ${fmtBRL(custoProj)} de R$ ${fmtBRL(teto)} do mês (${pctProj}%). Perto do teto mensal.`
          );
        }
      }
    } catch (e: any) {
      console.error("[credito] alerta falhou", e?.message || e);
    }
  }

  const mensagem = bloqueado
    ? `Teto mensal de imagens atingido (R$ ${fmtBRL(custoAtual)} de R$ ${fmtBRL(teto)}). Geração pausada até a recarga ou a virada do mês em ${dataResetFmt}.`
    : undefined;

  return { configurado: true, bloqueado, count, custoBRL: custoAtual, tetoBRL: teto, pct, dataReset: resetISO, mensagem };
}
