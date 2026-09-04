/**
 * Parser do arquivo 02-Legendas.md (Parcele Aqui) → posts estruturados.
 * Formato: cabeçalho + 4 blocos "POST DE {DIA} — {formato} · "título"",
 * cada um com uma seção INSTAGRAM e uma LINKEDIN.
 */
export interface PostLegenda {
  dia: string; // segunda | quarta | quinta | sexta
  tipo: "post" | "carrossel";
  formato: string;
  titulo: string;
  instagram: string;
  linkedin: string;
}
export interface LegendasParse {
  dataInicio: string | null; // ISO yyyy-mm-dd (segunda da semana)
  posts: PostLegenda[];
}

function normalizarDia(d: string): string {
  const x = d.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (x.startsWith("seg")) return "segunda";
  if (x.startsWith("qua")) return "quarta";
  if (x.startsWith("qui")) return "quinta";
  if (x.startsWith("sex")) return "sexta";
  if (x.startsWith("ter")) return "terca";
  return x;
}

function extrairSecao(body: string, de: string, ate: string | null): string {
  const linhas = body.split("\n");
  let capturando = false;
  const buf: string[] = [];
  for (const l of linhas) {
    const u = l.trim().toUpperCase();
    if (!capturando) {
      if (u === de) capturando = true;
      continue;
    }
    if (u.startsWith("====") || (ate && u === ate)) break;
    buf.push(l);
  }
  return buf.join("\n").trim();
}

export function parsearLegendas(texto: string): LegendasParse {
  const t = (texto || "").replace(/\r\n/g, "\n");

  let dataInicio: string | null = null;
  const md = t.match(/\((\d{1,2})\s*a\s*\d{1,2}\/(\d{1,2})\/(\d{4})\)/);
  if (md) {
    dataInicio = `${md[3]}-${md[2].padStart(2, "0")}-${md[1].padStart(2, "0")}`;
  }

  const headerRe = /^POST DE\s+([A-Za-zÇÁ-Úá-ú]+)\s*[—–-]\s*([^\n·]+?)\s*·\s*"?([^"\n]+?)"?\s*$/gim;
  const ms: { dia: string; formato: string; titulo: string; i: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(t)) !== null) {
    ms.push({ dia: m[1], formato: m[2].trim(), titulo: m[3].trim(), i: m.index, end: headerRe.lastIndex });
  }

  const posts: PostLegenda[] = ms.map((c, idx) => {
    const bodyStart = c.end;
    const bodyEnd = idx + 1 < ms.length ? ms[idx + 1].i : t.length;
    const body = t.slice(bodyStart, bodyEnd);
    return {
      dia: normalizarDia(c.dia),
      tipo: /carrossel/i.test(c.formato) ? "carrossel" : "post",
      formato: c.formato,
      titulo: c.titulo,
      instagram: extrairSecao(body, "INSTAGRAM", "LINKEDIN"),
      linkedin: extrairSecao(body, "LINKEDIN", null),
    };
  });

  return { dataInicio, posts };
}

/** Data (ISO) de um dia da semana a partir da segunda. */
export function dataDoDia(dataInicio: string | null, dia: string): string | null {
  if (!dataInicio) return null;
  const base = new Date(dataInicio + "T00:00:00Z");
  if (isNaN(base.getTime())) return null;
  const off: Record<string, number> = {
    segunda: 0, terca: 1, quarta: 2, quinta: 3, sexta: 4, sabado: 5, domingo: 6,
  };
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + (off[dia] ?? 0));
  return d.toISOString().slice(0, 10);
}
