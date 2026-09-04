import { useState, useEffect, useCallback } from "react";
import {
  CalendarCheck, X, Loader2, ClipboardList, CheckCircle2, ExternalLink, AlertTriangle,
} from "lucide-react";
import { parsearLegendas, dataDoDia } from "../../lib/parsearLegendas";
import { authHeaders } from "../../lib/supabaseClient";

interface AgendaPanelProps {
  mes: string;
  semana: string;
  onFechar: () => void;
}

const inputCls =
  "w-full bg-[#0f0f0f] border border-gray-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFC528]";

export default function AgendaPanel({ mes, semana, onFechar }: AgendaPanelProps) {
  const temSemana = Boolean(mes.trim() && semana.trim());

  const [texto, setTexto] = useState("");
  const [importando, setImportando] = useState(false);
  const [aprovando, setAprovando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [csvUrl, setCsvUrl] = useState<string | null>(null);
  const [jaImportadas, setJaImportadas] = useState<number | null>(null);

  const carregarStatus = useCallback(async () => {
    if (!temSemana) return;
    try {
      const p = new URLSearchParams({ mes, semana });
      const r = await fetch(`/api/legendas/list?${p.toString()}`, { headers: { ...(await authHeaders()) } });
      const d = await r.json();
      setJaImportadas(Array.isArray(d.rows) ? d.rows.length : 0);
    } catch {
      setJaImportadas(null);
    }
  }, [mes, semana, temSemana]);

  useEffect(() => {
    carregarStatus();
  }, [carregarStatus]);

  const importar = async () => {
    setErro(null);
    setOkMsg(null);
    const parsed = parsearLegendas(texto);
    if (parsed.posts.length === 0) {
      setErro("Não reconheci nenhum post no texto. Cole o conteúdo do 02-Legendas.md da semana.");
      return;
    }
    const posts = parsed.posts.map((p) => ({
      dia: p.dia,
      tipo: p.tipo,
      titulo: p.titulo,
      instagram: p.instagram,
      linkedin: p.linkedin,
      data: dataDoDia(parsed.dataInicio, p.dia),
    }));
    setImportando(true);
    try {
      const r = await fetch("/api/legendas/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ mes, semana, posts }),
      });
      const d = await r.json().catch(() => ({}));
      if (d.configured === false) {
        setErro("Repositório não configurado (defina SUPABASE_* na Vercel).");
      } else if (!r.ok || d.error) {
        setErro(d.error || `Erro HTTP ${r.status}`);
      } else {
        setOkMsg(`${d.importados} legendas importadas para ${semana} (${mes}).`);
        setJaImportadas(d.importados);
      }
    } catch (e: any) {
      setErro(e?.message || "Falha ao importar.");
    } finally {
      setImportando(false);
    }
  };

  const aprovar = async () => {
    setErro(null);
    setOkMsg(null);
    setCsvUrl(null);
    setAprovando(true);
    try {
      const r = await fetch("/api/semana/aprovar", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ mes, semana }),
      });
      const d = await r.json().catch(() => ({}));
      if (d.configured === false) {
        setErro("Repositório não configurado (defina SUPABASE_* na Vercel).");
      } else if (!r.ok || d.error) {
        setErro(d.error || `Erro HTTP ${r.status}`);
      } else {
        setCsvUrl(d.csvUrl);
        setOkMsg(`Semana aprovada! CSV com ${d.linhas} linhas gerado e avisado no Slack.`);
      }
    } catch (e: any) {
      setErro(e?.message || "Falha ao aprovar.");
    } finally {
      setAprovando(false);
    }
  };

  return (
    <div className="bg-[#141414] border border-gray-800 rounded-xl p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarCheck size={18} className="text-[#FFC528]" />
          <div>
            <h3 className="text-sm font-bold text-white">Agendamento da semana</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Importe as legendas da semana e gere o CSV de agendamento (Buffer/Metricool).
            </p>
          </div>
        </div>
        <button onClick={onFechar} className="text-gray-500 hover:text-white transition-colors" title="Fechar">
          <X size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-[12px] text-gray-400 bg-[#0f0f0f] border border-gray-800 rounded-md px-3 py-2">
        <span className="text-gray-500">Semana ativa:</span>
        <span className="font-bold text-white">{mes || "—"}</span>
        <span className="text-gray-600">·</span>
        <span className="font-bold text-white">{semana || "—"}</span>
        {jaImportadas != null && jaImportadas > 0 && (
          <span className="ml-auto text-emerald-400">{jaImportadas} legendas importadas</span>
        )}
      </div>

      {!temSemana && (
        <p className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
          <AlertTriangle size={14} />
          Preencha <b>Mês</b> e <b>Semana</b> no painel "Banco de imagens" para usar o agendamento.
        </p>
      )}

      {/* Importar legendas */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          <ClipboardList size={12} /> 1 · Importar legendas (colar o 02-Legendas.md)
        </div>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Cole aqui o conteúdo do arquivo 02-Legendas da semana…"
          rows={6}
          className={inputCls + " font-mono text-[12px] leading-relaxed resize-y"}
          disabled={!temSemana}
        />
        <button
          onClick={importar}
          disabled={!temSemana || importando || !texto.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold bg-[#1a1a1a] border border-[#FFC528]/40 text-[#FFC528] hover:bg-[#FFC528]/10 transition-all disabled:opacity-40"
        >
          {importando ? <Loader2 size={15} className="animate-spin" /> : <ClipboardList size={15} />}
          {importando ? "Importando…" : "Importar legendas"}
        </button>
      </div>

      {/* Aprovar semana */}
      <div className="space-y-2 border-t border-gray-800 pt-4">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          <CheckCircle2 size={12} /> 2 · Aprovar semana e gerar CSV
        </div>
        <p className="text-[11px] text-gray-600">
          Junta as legendas + as imagens salvas da semana (Seg=Peça 1, Qua=Peça 3, Qui=Peça 2, Sex=Peça 4),
          gera o CSV no bucket slides-finais e avisa no Slack.
        </p>
        <button
          onClick={aprovar}
          disabled={!temSemana || aprovando}
          className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-bold bg-[#FFC528] text-black hover:bg-[#ffd55a] transition-all disabled:opacity-40 shadow-md"
        >
          {aprovando ? <Loader2 size={16} className="animate-spin" /> : <CalendarCheck size={16} />}
          {aprovando ? "Gerando CSV…" : "Aprovar semana"}
        </button>
      </div>

      {erro && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">{erro}</p>
      )}
      {okMsg && (
        <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 space-y-2">
          <div className="flex items-center gap-1.5"><CheckCircle2 size={14} /> {okMsg}</div>
          {csvUrl && (
            <a href={csvUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[#FFC528] hover:underline">
              <ExternalLink size={13} /> Abrir/baixar o CSV de agendamento
            </a>
          )}
        </div>
      )}
    </div>
  );
}
