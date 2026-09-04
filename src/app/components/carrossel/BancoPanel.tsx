import { useState, useEffect, useCallback } from "react";
import {
  Library,
  X,
  RotateCcw,
  Database,
  Search,
  ImageDown,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { BancoConfigControls } from "./useImagens";
import { authHeaders } from "../../lib/supabaseClient";

interface BancoPanelProps {
  img: BancoConfigControls;
  onFechar: () => void;
  /** Aplica a URL da imagem escolhida no slide ativo (custo zero, sem Gemini). */
  onUsarNoSlide: (url: string) => void;
  /** Número (1-based) do slide ativo, para rotular o botão de reuso. */
  slideAtivoNum: number;
}

interface ImagemRow {
  id: string;
  url: string;
  prompt_cena?: string;
  vertical?: string;
  mes?: string;
  semana?: string;
  peca?: string;
  slide?: number;
  layout?: string;
  aspect_ratio?: string;
  tags?: string[];
  created_at?: string;
}

const VERTICAIS: { valor: string; rotulo: string }[] = [
  { valor: "", rotulo: "— Nenhuma —" },
  { valor: "contabilidades", rotulo: "Contabilidades" },
  { valor: "imobiliarias", rotulo: "Imobiliárias" },
  { valor: "educacao", rotulo: "Educação" },
  { valor: "b2b", rotulo: "B2B (mar aberto)" },
  { valor: "b2c", rotulo: "B2C final" },
  { valor: "varejo", rotulo: "Varejo" },
];

const LAYOUTS: string[] = [
  "",
  "foto_cheia",
  "foto_cheia_final",
  "split_horizontal",
  "split_invertido",
  "tipografia_pura",
];

const LIMIT = 60;

const labelCls = "block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1";
const inputCls =
  "w-full bg-[#0f0f0f] border border-gray-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFC528]";

/**
 * "Banco de imagens": metadados de arquivamento (topo) + galeria do repositório
 * Supabase com filtros e reuso no slide (embaixo).
 */
export default function BancoPanel({ img, onFechar, onUsarNoSlide, slideAtivoNum }: BancoPanelProps) {
  const b = img.banco;

  // ---- Galeria ----
  const [rows, setRows] = useState<ImagemRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [fVertical, setFVertical] = useState("");
  const [fMes, setFMes] = useState("");
  const [fLayout, setFLayout] = useState("");
  const [fQ, setFQ] = useState("");

  const buscar = useCallback(
    async (novoOffset: number, append: boolean) => {
      setLoading(true);
      setErro(null);
      try {
        const p = new URLSearchParams();
        if (fVertical) p.set("vertical", fVertical);
        if (fMes.trim()) p.set("mes", fMes.trim());
        if (fLayout) p.set("layout", fLayout);
        if (fQ.trim()) p.set("q", fQ.trim());
        p.set("limit", String(LIMIT));
        p.set("offset", String(novoOffset));
        const r = await fetch(`/api/imagens/list?${p.toString()}`, { headers: { ...(await authHeaders()) } });
        const data = await r.json();
        setConfigured(data.configured !== false);
        if (data.error) setErro(String(data.error));
        const novos: ImagemRow[] = Array.isArray(data.rows) ? data.rows : [];
        setRows((prev) => (append ? [...prev, ...novos] : novos));
        setOffset(novoOffset);
        setHasMore(novos.length === LIMIT);
      } catch (e: any) {
        setErro(e?.message || "Falha ao carregar o banco.");
      } finally {
        setLoading(false);
      }
    },
    [fVertical, fMes, fLayout, fQ]
  );

  useEffect(() => {
    buscar(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aplicarFiltros = () => buscar(0, false);

  return (
    <div className="bg-[#141414] border border-gray-800 rounded-xl p-5 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Library size={18} className="text-[#FFC528]" />
          <div>
            <h3 className="text-sm font-bold text-white">Banco de imagens</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Etiquete as artes geradas e reaproveite imagens do repositório sem gastar
              cota do Gemini.
            </p>
          </div>
        </div>
        <button
          onClick={onFechar}
          className="text-gray-500 hover:text-white transition-colors"
          title="Fechar"
        >
          <X size={18} />
        </button>
      </div>

      {/* ---- Metadados de arquivamento ---- */}
      <div className="space-y-3">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Etiquetas (aplicadas às novas imagens)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Vertical</label>
            <select
              value={b.vertical}
              onChange={(e) => img.setBancoCampo("vertical", e.target.value)}
              className={inputCls}
            >
              {VERTICAIS.map((v) => (
                <option key={v.valor} value={v.valor}>
                  {v.rotulo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Mês</label>
            <input
              type="text"
              value={b.mes}
              onChange={(e) => img.setBancoCampo("mes", e.target.value)}
              placeholder="Agosto"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Semana</label>
            <input
              type="text"
              value={b.semana}
              onChange={(e) => img.setBancoCampo("semana", e.target.value)}
              placeholder="Semana 01"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Peça / campanha</label>
            <input
              type="text"
              value={b.peca}
              onChange={(e) => img.setBancoCampo("peca", e.target.value)}
              placeholder="Carrossel Peça 3"
              className={inputCls}
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Tags (separadas por vírgula)</label>
            <input
              type="text"
              value={b.tags}
              onChange={(e) => img.setBancoCampo("tags", e.target.value)}
              placeholder="familia, mesa, escritorio"
              className={inputCls}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-[11px] text-gray-600">
            <Database size={12} />
            Precisa das variáveis SUPABASE_* na Vercel. Sem elas, a geração funciona
            (só não arquiva).
          </p>
          <button
            onClick={img.resetarBanco}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#1a1a1a] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-all shrink-0"
            title="Limpar os campos"
          >
            <RotateCcw size={13} />
            Limpar campos
          </button>
        </div>
      </div>

      {/* ---- Galeria / repositório ---- */}
      <div className="border-t border-gray-800 pt-5 space-y-3">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Repositório
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select
            value={fVertical}
            onChange={(e) => {
              setFVertical(e.target.value);
            }}
            className={inputCls}
          >
            {VERTICAIS.map((v) => (
              <option key={v.valor} value={v.valor}>
                {v.valor ? v.rotulo : "Todas as verticais"}
              </option>
            ))}
          </select>
          <select
            value={fLayout}
            onChange={(e) => setFLayout(e.target.value)}
            className={inputCls}
          >
            {LAYOUTS.map((l) => (
              <option key={l} value={l}>
                {l ? l : "Todos os layouts"}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={fMes}
            onChange={(e) => setFMes(e.target.value)}
            placeholder="Mês"
            className={inputCls}
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={fQ}
              onChange={(e) => setFQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") aplicarFiltros();
              }}
              placeholder="Buscar cena…"
              className={inputCls}
            />
            <button
              onClick={aplicarFiltros}
              disabled={loading}
              className="shrink-0 px-3 rounded-md bg-[#FFC528] text-black hover:bg-[#ffd55a] transition-all disabled:opacity-50"
              title="Aplicar filtros"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </div>
        </div>

        {/* Estados */}
        {!configured && (
          <p className="text-xs text-gray-500 bg-[#0f0f0f] border border-gray-800 rounded-lg px-4 py-3">
            Repositório não configurado. Defina as variáveis <span className="text-gray-300">SUPABASE_URL</span> e{" "}
            <span className="text-gray-300">SUPABASE_SERVICE_ROLE_KEY</span> na Vercel para ver as imagens.
          </p>
        )}
        {configured && erro && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
            {erro}
          </p>
        )}
        {configured && !erro && rows.length === 0 && !loading && (
          <p className="text-xs text-gray-500 italic px-1">
            Nenhuma imagem encontrada com esses filtros.
          </p>
        )}

        {/* Grade */}
        {rows.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {rows.map((r) => (
              <div
                key={r.id}
                className="group relative rounded-lg overflow-hidden border border-gray-800 bg-[#0f0f0f]"
              >
                <img
                  src={r.url}
                  alt={r.prompt_cena || "imagem"}
                  loading="lazy"
                  className="w-full aspect-[4/5] object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2 pt-6">
                  <p className="text-[10px] text-gray-300 truncate">
                    {[r.vertical, r.mes, r.layout].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <button
                    onClick={() => onUsarNoSlide(r.url)}
                    className="mt-1 w-full flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-[#FFC528] text-black hover:bg-[#ffd55a] transition-all"
                    title={`Aplicar no slide ${slideAtivoNum}`}
                  >
                    <ImageDown size={12} />
                    Usar no slide {slideAtivoNum}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Carregar mais */}
        {configured && hasMore && (
          <button
            onClick={() => buscar(offset + LIMIT, true)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-bold bg-[#1a1a1a] border border-gray-800 text-gray-300 hover:border-[#FFC528] hover:text-white transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Carregar mais
          </button>
        )}
      </div>
    </div>
  );
}
