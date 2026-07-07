import { useState, useEffect } from "react";
import {
  Palette,
  Layout,
  Type,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Eye,
  ArrowRight,
  Wand2,
  ImagePlus,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Check,
  Layers,
  List,
} from "lucide-react";
import UnsplashSearch from "../UnsplashSearch";
import { TEMAS_DISPONIVEIS, obterTema } from "../temas";
import {
  FONTE_LABELS,
  FONTE_FAMILIAS,
  PESO_LABELS,
  CAPS_LABELS,
  type SlideData,
  type TemaId,
  type FonteId,
  type PesoFonte,
  type ModoCaps,
  type TipografiaOverride,
  type ElementoTipo,
} from "../temas/tipos";

interface EditPanelProps {
  slide: SlideData;
  onChange: (patch: Partial<SlideData>) => void;
  temaId: TemaId;
  onTrocarTema: (id: TemaId) => void;
  temaAtivo: ReturnType<typeof obterTema>;
  /** v7.8: gera/regenera a imagem por IA deste slide. forcar=true pula confirmação. */
  onGerarImagem?: (forcar?: boolean) => void;
}

type Aba = "conteudo" | "imagem" | "design" | "elementos";
type Modo = "tudo" | "abas";

const MODO_KEY = "parceleaqui:editpanel:modo:v1";

const ABAS: { id: Aba; label: string; icone: React.ReactNode }[] = [
  { id: "conteudo", label: "Conteúdo", icone: <Type size={14} /> },
  { id: "imagem", label: "Imagem", icone: <ImageIcon size={14} /> },
  { id: "design", label: "Design", icone: <Palette size={14} /> },
  { id: "elementos", label: "Elementos", icone: <Layers size={14} /> },
];

/**
 * Painel direito de edição do slide ativo.
 * v7.8: dois modos alternáveis —
 *   "tudo" (rolagem única, ordem original — padrão, nada escondido)
 *   "abas" (Conteúdo · Imagem · Design · Elementos)
 * A geração de imagem por IA entra na seção de foto em ambos os modos.
 */
export default function EditPanel({
  slide,
  onChange,
  temaId,
  onTrocarTema,
  temaAtivo,
  onGerarImagem,
}: EditPanelProps) {
  const [modo, setModo] = useState<Modo>(() => {
    try {
      return (localStorage.getItem(MODO_KEY) as Modo) || "tudo";
    } catch {
      return "tudo";
    }
  });
  const [aba, setAba] = useState<Aba>("conteudo");

  useEffect(() => {
    try {
      localStorage.setItem(MODO_KEY, modo);
    } catch {}
  }, [modo]);

  const layoutAtual =
    temaAtivo.layouts.find((l) => l.id === slide.layout) || temaAtivo.layouts[0];
  const usaFoto = layoutAtual.usaFoto;
  const usaDuasFotos = Boolean(layoutAtual.usaDuasFotos);
  const coresFundoPermitidas =
    layoutAtual.coresFundoPermitidas || ["preto", "amarelo", "bege", "branco"];

  const cores = temaAtivo.cores;

  // ============================================================
  // SEÇÕES (definidas uma vez, arranjadas conforme o modo)
  // ============================================================

  const secTema = (
    <div key="tema">
      <Label icone={<Palette size={12} />}>Tema visual</Label>
      <div className="grid grid-cols-1 gap-1.5">
        {TEMAS_DISPONIVEIS.map((t) => {
          const ativo = temaId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTrocarTema(t.id)}
              className={`text-left px-3 py-2 rounded-md border transition-all ${
                ativo
                  ? "bg-[#FFC528] text-black border-[#FFC528]"
                  : "bg-[#0f0f0f] border-gray-800 text-gray-300 hover:border-[#FFC528]"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  <span
                    className="w-3 h-3 rounded-sm"
                    style={{ background: t.cores.preto, border: "1px solid #333" }}
                  />
                  <span className="w-3 h-3 rounded-sm" style={{ background: t.cores.amarelo }} />
                  <span
                    className="w-3 h-3 rounded-sm"
                    style={{ background: t.cores.bege, border: "1px solid #333" }}
                  />
                </div>
                <span className="text-xs font-bold uppercase tracking-wide">{t.nome}</span>
              </div>
              <div className={`text-[10px] mt-1 ${ativo ? "text-black/70" : "text-gray-500"}`}>
                {t.descricao}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const secLayout = (
    <div key="layout">
      <Label icone={<Layout size={12} />}>Layout</Label>
      <div className="grid grid-cols-1 gap-1.5">
        {temaAtivo.layouts.map((l) => {
          const ativo = slide.layout === l.id;
          return (
            <button
              key={l.id}
              onClick={() => onChange({ layout: l.id })}
              className={`text-left px-3 py-2 rounded-md border transition-all ${
                ativo
                  ? "bg-[#FFC528] text-black border-[#FFC528]"
                  : "bg-[#0f0f0f] border-gray-800 text-gray-300 hover:border-[#FFC528]"
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-wide">{l.nome}</div>
              <div className={`text-[10px] mt-0.5 ${ativo ? "text-black/70" : "text-gray-500"}`}>
                {l.descricao}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const secCorFundo =
    coresFundoPermitidas.length > 1 ? (
      <div key="corfundo">
        <Label>Cor de fundo</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {(["preto", "amarelo", "bege", "branco"] as const)
            .filter((c) => coresFundoPermitidas.includes(c))
            .map((c) => {
              const ativo = slide.corFundo === c;
              const bg =
                c === "preto"
                  ? "#0a0a0a"
                  : c === "amarelo"
                  ? "#FFC528"
                  : c === "bege"
                  ? "#F4F1EA"
                  : "#ffffff";
              return (
                <button
                  key={c}
                  onClick={() => onChange({ corFundo: c })}
                  className={`h-10 rounded-md border-2 transition-all ${
                    ativo
                      ? "border-[#FFC528] ring-2 ring-[#FFC528]/30"
                      : "border-gray-800 hover:border-gray-600"
                  }`}
                  style={{ background: bg }}
                  title={c}
                />
              );
            })}
        </div>
      </div>
    ) : null;

  const secTipografia = (
    <PainelTipografia key="tipo" slide={slide} onChange={onChange} temaAtivo={temaAtivo} />
  );

  const secTextos = (
    <div key="textos" className="space-y-3">
      <Label icone={<Type size={12} />}>Textos</Label>

      <CampoTexto
        label="Kicker"
        dica="ex: TESE Nº 1, MITO, CONCLUSÃO"
        valor={slide.kicker}
        onChange={(v) => onChange({ kicker: v })}
        maxLen={80}
      />

      <CampoTexto
        label="Headline"
        dica="use ↵ Enter para quebrar linha"
        valor={slide.headline}
        onChange={(v) => onChange({ headline: v })}
        multiline
        rows={3}
        maxLen={200}
      />

      <CampoTexto
        label="Big Number"
        dica='Opcional. Ex: "+32%" — usado em alguns layouts'
        valor={slide.numero}
        onChange={(v) => onChange({ numero: v })}
        maxLen={12}
      />

      <CampoTexto
        label="Corpo"
        valor={slide.corpo}
        onChange={(v) => onChange({ corpo: v })}
        multiline
        rows={4}
        maxLen={500}
      />

      <CampoTexto
        label="Destaque"
        dica="Frase em cor de destaque"
        valor={slide.destaque}
        onChange={(v) => onChange({ destaque: v })}
        maxLen={180}
      />

      {usaDuasFotos && (
        <CampoTexto
          label="Legenda das fotos"
          valor={slide.legendaFoto}
          onChange={(v) => onChange({ legendaFoto: v })}
          maxLen={120}
        />
      )}
    </div>
  );

  const secCoresTextos = (
    <div key="corestextos" className="space-y-2 pt-2 border-t border-gray-800">
      <div className="flex items-center justify-between">
        <Label icone={<Palette size={12} />}>Cores dos textos</Label>
        <button
          onClick={() =>
            onChange({ corKicker: undefined, corHeadline: undefined, corDestaque: undefined })
          }
          className="text-[10px] text-gray-500 hover:text-[#FFC528] flex items-center gap-1"
          title="Voltar às cores padrão do tema"
        >
          <RotateCcw size={10} />
          Resetar
        </button>
      </div>

      <ColorField
        label="Kicker"
        valor={slide.corKicker}
        fallback={cores.amarelo}
        tema={temaAtivo}
        onChange={(v) => onChange({ corKicker: v })}
      />
      <ColorField
        label="Headline"
        valor={slide.corHeadline}
        fallback={cores.amarelo}
        tema={temaAtivo}
        onChange={(v) => onChange({ corHeadline: v })}
      />
      <ColorField
        label="Destaque"
        valor={slide.corDestaque}
        fallback={cores.amarelo}
        tema={temaAtivo}
        onChange={(v) => onChange({ corDestaque: v })}
      />
    </div>
  );

  const secLegendas = (
    <div key="legendas" className="space-y-2 pt-2 border-t border-gray-800">
      <div className="flex items-center justify-between">
        <Label icone={<Palette size={12} />}>Legendas (topo · rodapé)</Label>
        <button
          onClick={() =>
            onChange({ corTopbar: undefined, corRodape: undefined, corNumero: undefined })
          }
          className="text-[10px] text-gray-500 hover:text-[#FFC528] flex items-center gap-1"
          title="Voltar às cores padrão do tema"
        >
          <RotateCcw size={10} />
          Resetar
        </button>
      </div>

      <ColorField
        label="Topo"
        valor={slide.corTopbar}
        fallback={slide.corFundo === "preto" ? cores.amarelo : cores.preto}
        tema={temaAtivo}
        onChange={(v) => onChange({ corTopbar: v })}
      />
      <ColorField
        label="Rodapé"
        valor={slide.corRodape}
        fallback={slide.corFundo === "preto" ? cores.branco : cores.preto}
        tema={temaAtivo}
        onChange={(v) => onChange({ corRodape: v })}
      />
      <ColorField
        label="Numeração"
        valor={slide.corNumero}
        fallback={slide.corFundo === "preto" ? cores.amarelo : cores.preto}
        tema={temaAtivo}
        onChange={(v) => onChange({ corNumero: v })}
      />
      <p className="text-[10px] text-gray-600 leading-relaxed pl-1">
        Topo: marca + textos do cabeçalho. Rodapé: texto inferior (ex: "▶ BRANDS PAGE 5/000").
        Numeração: contador "01 / 06".
      </p>
    </div>
  );

  const secElementos = (
    <div key="elementos" className="space-y-2 pt-2 border-t border-gray-800">
      <div className="flex items-center justify-between">
        <Label icone={<Eye size={12} />}>Elementos do slide</Label>
        <button
          onClick={() =>
            onChange({
              mostrarTopbar: undefined,
              mostrarRodape: undefined,
              mostrarSetinha: undefined,
            })
          }
          className="text-[10px] text-gray-500 hover:text-[#FFC528] flex items-center gap-1"
          title="Voltar todos os elementos ao padrão (visíveis)"
        >
          <RotateCcw size={10} />
          Resetar
        </button>
      </div>

      <ToggleElemento
        label="Topbar"
        dica="Marca + numeração no topo"
        ativo={slide.mostrarTopbar !== false}
        onChange={(v) => onChange({ mostrarTopbar: v ? undefined : false })}
      />
      <ToggleElemento
        label="Rodapé"
        dica='Texto inferior (ex: "▶ BRANDS PAGE 5/000")'
        ativo={slide.mostrarRodape !== false}
        onChange={(v) => onChange({ mostrarRodape: v ? undefined : false })}
      />
      <ToggleElemento
        label="Setinha"
        dica="Indicador de deslize no canto inferior direito"
        ativo={slide.mostrarSetinha !== false}
        onChange={(v) => onChange({ mostrarSetinha: v ? undefined : false })}
      />
    </div>
  );

  const secSetinha =
    slide.mostrarSetinha !== false ? (
      <div key="setinha" className="space-y-2 pt-2 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <Label icone={<ArrowRight size={12} />}>Setinha (avançado)</Label>
          <button
            onClick={() =>
              onChange({
                tamSetinha: undefined,
                corSetinha: undefined,
                espessuraSetinha: undefined,
              })
            }
            className="text-[10px] text-gray-500 hover:text-[#FFC528] flex items-center gap-1"
          >
            <RotateCcw size={10} />
            Resetar
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-gray-400">Tamanho: {slide.tamSetinha ?? 80}px</label>
          <input
            type="range"
            min={32}
            max={120}
            step={4}
            value={slide.tamSetinha ?? 80}
            onChange={(e) => onChange({ tamSetinha: parseInt(e.target.value, 10) })}
            className="w-full accent-[#FFC528]"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-gray-400">
            Espessura do stroke: {(slide.espessuraSetinha ?? 5).toFixed(1)}
          </label>
          <input
            type="range"
            min={1}
            max={6}
            step={0.5}
            value={slide.espessuraSetinha ?? 5}
            onChange={(e) => onChange({ espessuraSetinha: parseFloat(e.target.value) })}
            className="w-full accent-[#FFC528]"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[10px] text-gray-400 flex-shrink-0 w-14">Cor:</label>
          <input
            type="color"
            value={slide.corSetinha || "#FFC528"}
            onChange={(e) => onChange({ corSetinha: e.target.value })}
            className="w-8 h-7 rounded border border-gray-800 bg-[#0f0f0f] cursor-pointer"
          />
          <input
            type="text"
            value={slide.corSetinha || ""}
            onChange={(e) => onChange({ corSetinha: e.target.value || undefined })}
            placeholder="(usa cor do tema)"
            maxLength={7}
            className="flex-1 px-2 py-1 text-[10px] bg-[#0f0f0f] border border-gray-800 rounded text-gray-300 font-mono"
          />
        </div>
      </div>
    ) : null;

  const secTextura = (
    <div key="textura" className="space-y-2 pt-2 border-t border-gray-800">
      <Label icone={<Sparkles size={12} />}>Textura overlay</Label>
      <ToggleElemento
        label="Aplicar textura granulada"
        dica="Mancha colorida + grão (mode Overlay 75%)"
        ativo={!!slide.mostrarTextura}
        onChange={(v) => onChange({ mostrarTextura: v || undefined })}
      />
      {slide.mostrarTextura && (
        <div className="space-y-1 pl-1">
          <label className="text-[10px] text-gray-400">
            Opacidade: {Math.round((slide.opacidadeTextura ?? 0.75) * 100)}%
          </label>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={slide.opacidadeTextura ?? 0.75}
            onChange={(e) => onChange({ opacidadeTextura: parseFloat(e.target.value) })}
            className="w-full accent-[#FFC528]"
          />
        </div>
      )}
    </div>
  );

  const secPill = (
    <div key="pill" className="space-y-2 pt-2 border-t border-gray-800">
      <label className="flex items-center gap-2 text-xs text-gray-300">
        <input
          type="checkbox"
          checked={slide.mostrarPill}
          onChange={(e) => onChange({ mostrarPill: e.target.checked })}
          className="accent-[#FFC528]"
        />
        Mostrar pill de CTA
      </label>
      {slide.mostrarPill && (
        <CampoTexto
          label="Texto do CTA"
          valor={slide.textoPill}
          onChange={(v) => onChange({ textoPill: v })}
          maxLen={40}
        />
      )}
    </div>
  );

  const secFoto = usaFoto ? (
    <div key="foto" className="space-y-3 pt-2 border-t border-gray-800">
      <SecaoImagemIA slide={slide} onChange={onChange} onGerarImagem={onGerarImagem} />

      <div className="space-y-2">
        <Label icone={<ImageIcon size={12} />}>{usaDuasFotos ? "Foto 1 (topo)" : "Foto manual"}</Label>
        <UnsplashSearch
          grupoIndex={0}
          valorAtual={slide.fotoUrl}
          onSelectImage={(url) =>
            onChange({ fotoUrl: url, fotoOrigem: "manual", imgStatus: "idle", imgErro: undefined })
          }
        />

        {slide.fotoUrl && (
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                Zoom da foto: {((slide.fotoZoom ?? 1) * 100).toFixed(0)}%
              </span>
              {((slide.fotoZoom ?? 1) !== 1 ||
                (slide.fotoOffsetX ?? 0) !== 0 ||
                (slide.fotoOffsetY ?? 0) !== 0) && (
                <button
                  type="button"
                  onClick={() =>
                    onChange({ fotoZoom: undefined, fotoOffsetX: undefined, fotoOffsetY: undefined })
                  }
                  className="text-[10px] text-gray-500 hover:text-gray-300 underline"
                >
                  Resetar
                </button>
              )}
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={slide.fotoZoom ?? 1}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                onChange({ fotoZoom: v === 1 ? undefined : v });
              }}
              className="w-full"
              style={{ accentColor: "#FFC528" }}
            />
            <p className="text-[10px] text-gray-500 italic">
              {(slide.fotoZoom ?? 1) > 1
                ? "💡 Arraste a foto no preview pra reposicionar"
                : "Aumente o zoom pra arrastar a foto"}
            </p>
          </div>
        )}

        {usaDuasFotos && (
          <>
            <Label icone={<ImageIcon size={12} />}>Foto 2 (meio)</Label>
            <UnsplashSearch
              grupoIndex={1}
              valorAtual={slide.fotoUrl2}
              onSelectImage={(url) => onChange({ fotoUrl2: url })}
            />
          </>
        )}
      </div>
    </div>
  ) : null;

  const semFotoMsg = (
    <div key="semfoto" className="text-center py-8 px-4">
      <ImageIcon size={28} className="mx-auto text-gray-700 mb-2" />
      <p className="text-xs text-gray-500 leading-relaxed">
        O layout <b className="text-gray-400">{layoutAtual.nome}</b> não usa foto. Troque para um
        layout com imagem para gerar ou enviar uma foto.
      </p>
    </div>
  );

  // ============================================================
  // ARRANJOS
  // ============================================================
  const conteudoTudo = (
    <div className="space-y-4">
      {secTema}
      {secLayout}
      {secCorFundo}
      {secTipografia}
      {secTextos}
      {secCoresTextos}
      {secLegendas}
      {secElementos}
      {secSetinha}
      {secTextura}
      {secPill}
      {secFoto}
    </div>
  );

  const conteudoAbas = (
    <div className="space-y-4 animate-[fadeIn_150ms_ease-out]">
      {aba === "conteudo" && (
        <div className="space-y-4">
          {secTextos}
          {secPill}
        </div>
      )}
      {aba === "imagem" && (usaFoto ? secFoto : semFotoMsg)}
      {aba === "design" && (
        <div className="space-y-4">
          {secTema}
          {secLayout}
          {secCorFundo}
          {secTipografia}
          {secCoresTextos}
          {secLegendas}
        </div>
      )}
      {aba === "elementos" && (
        <div className="space-y-4">
          {secElementos}
          {secSetinha}
          {secTextura}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Alternador de modo */}
      <div className="flex items-center gap-1 bg-[#0a0a0a] border border-gray-800 rounded-lg p-1">
        <button
          onClick={() => setModo("tudo")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-bold transition-all ${
            modo === "tudo" ? "bg-[#FFC528] text-black" : "text-gray-400 hover:text-white"
          }`}
          title="Tudo em uma rolagem só (padrão)"
        >
          <List size={13} /> Tudo
        </button>
        <button
          onClick={() => setModo("abas")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-bold transition-all ${
            modo === "abas" ? "bg-[#FFC528] text-black" : "text-gray-400 hover:text-white"
          }`}
          title="Agrupado em abas"
        >
          <Layers size={13} /> Abas
        </button>
      </div>

      {/* Barra de abas (só no modo abas) */}
      {modo === "abas" && (
        <div className="grid grid-cols-4 gap-1 bg-[#0a0a0a] border border-gray-800 rounded-lg p-1">
          {ABAS.map((a) => {
            const ativo = aba === a.id;
            const alerta = a.id === "imagem" && slide.imgStatus === "erro";
            return (
              <button
                key={a.id}
                onClick={() => setAba(a.id)}
                className={`relative flex flex-col items-center gap-1 py-2 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${
                  ativo ? "bg-[#FFC528] text-black" : "text-gray-400 hover:text-white hover:bg-[#141414]"
                }`}
              >
                {a.icone}
                {a.label}
                {alerta && (
                  <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {modo === "tudo" ? conteudoTudo : conteudoAbas}
    </div>
  );
}

// ============================================================
// SEÇÃO: IMAGEM POR IA (v7.8)
// ============================================================
function SecaoImagemIA({
  slide,
  onChange,
  onGerarImagem,
}: {
  slide: SlideData;
  onChange: (patch: Partial<SlideData>) => void;
  onGerarImagem?: (forcar?: boolean) => void;
}) {
  const gerando = slide.imgStatus === "gerando";
  const temPrompt = Boolean((slide.imgPrompt || "").trim());
  const fotoIA = slide.fotoOrigem === "ia" && Boolean(slide.fotoUrl);

  return (
    <div className="space-y-2 bg-[#0a0a0a] border border-[#FFC528]/25 rounded-lg p-3">
      <div className="flex items-center gap-1.5">
        <Wand2 size={13} className="text-[#FFC528]" />
        <span className="text-[11px] font-bold text-white uppercase tracking-wider">
          Imagem por IA
        </span>
        {fotoIA && (
          <span className="ml-auto inline-flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
            <Check size={10} /> Gerada
          </span>
        )}
      </div>

      <textarea
        value={slide.imgPrompt || ""}
        onChange={(e) => onChange({ imgPrompt: e.target.value })}
        rows={3}
        placeholder="Descreva só a CENA: quem, onde, enquadramento, espaço livre p/ texto…"
        className="w-full bg-[#0f0f0f] border border-gray-800 rounded-md px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#FFC528] placeholder:text-gray-600 resize-none leading-relaxed"
      />
      <p className="text-[10px] text-gray-600 leading-relaxed">
        Estética e proporção são aplicadas pelo <b className="text-gray-400">Estilo visual</b> global
        (barra superior). Aqui vai só a cena.
      </p>

      {slide.imgStatus === "erro" && slide.imgErro && (
        <div className="flex items-start gap-1.5 text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1.5">
          <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
          <span className="leading-snug">{slide.imgErro}</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-0.5">
        {fotoIA ? (
          <button
            onClick={() => onGerarImagem?.(true)}
            disabled={gerando || !temPrompt}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-bold bg-[#1a1a1a] border border-gray-700 text-gray-200 hover:border-[#FFC528] hover:text-white transition-all disabled:opacity-40"
          >
            {gerando ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Gerando…
              </>
            ) : (
              <>
                <RefreshCw size={13} /> Regerar variação
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => onGerarImagem?.(false)}
            disabled={gerando || !temPrompt}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[11px] font-bold bg-[#FFC528] text-black hover:bg-[#ffd55a] transition-all disabled:opacity-40 disabled:hover:bg-[#FFC528]"
            title={!temPrompt ? "Escreva um prompt de cena primeiro" : "Gerar imagem"}
          >
            {gerando ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Gerando…
              </>
            ) : (
              <>
                <ImagePlus size={13} /> Gerar imagem
              </>
            )}
          </button>
        )}
      </div>
      {!temPrompt && (
        <p className="text-[10px] text-gray-600 italic">
          Escreva um prompt acima (ou use IMGPROMPT no "Colar conteúdo") para habilitar.
        </p>
      )}
    </div>
  );
}

// ============================================================
// COLOR FIELD
// ============================================================
function ColorField({
  label,
  valor,
  fallback,
  tema,
  onChange,
}: {
  label: string;
  valor: string | undefined;
  fallback: string;
  tema: ReturnType<typeof obterTema>;
  onChange: (v: string | undefined) => void;
}) {
  const corEfetiva = valor || fallback;
  const sugestoes = [
    tema.cores.amarelo,
    tema.cores.preto,
    tema.cores.branco,
    tema.cores.bege,
    "#FF4444",
    "#4CAF50",
  ];

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 text-[11px] text-gray-400">{label}</div>
      <input
        type="color"
        value={corEfetiva}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border border-gray-800 cursor-pointer bg-transparent"
        style={{ padding: 0 }}
      />
      <input
        type="text"
        value={corEfetiva}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-[#0f0f0f] border border-gray-800 rounded-md px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#FFC528] font-mono uppercase"
        maxLength={7}
      />
      <div className="flex gap-0.5">
        {sugestoes.slice(0, 3).map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className="w-5 h-5 rounded-sm border border-gray-800 hover:scale-110 transition-transform"
            style={{ background: c }}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}

function Label({ children, icone }: { children: React.ReactNode; icone?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
      {icone}
      {children}
    </div>
  );
}

// ============================================================
// TOGGLE ELEMENTO
// ============================================================
function ToggleElemento({
  label,
  dica,
  ativo,
  onChange,
}: {
  label: string;
  dica?: string;
  ativo: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-[#0f0f0f] border border-gray-800 hover:border-gray-700 cursor-pointer transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold text-gray-300">{label}</div>
        {dica && <div className="text-[10px] text-gray-600 mt-0.5">{dica}</div>}
      </div>
      <div className="relative shrink-0">
        <input
          type="checkbox"
          checked={ativo}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-gray-800 peer-checked:bg-[#FFC528] rounded-full transition-colors" />
        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white peer-checked:translate-x-4 rounded-full transition-transform shadow-sm" />
      </div>
    </label>
  );
}

function CampoTexto({
  label,
  valor,
  onChange,
  multiline,
  rows,
  maxLen,
  dica,
}: {
  label: string;
  valor: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  maxLen?: number;
  dica?: string;
}) {
  const props = {
    value: valor,
    onChange: (e: React.ChangeEvent<any>) => onChange(e.target.value),
    maxLength: maxLen,
    className:
      "w-full bg-[#0f0f0f] border border-gray-800 rounded-md px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#FFC528] placeholder:text-gray-600 resize-none",
  };
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <label className="text-[11px] font-medium text-gray-400">{label}</label>
        {maxLen && (
          <span
            className={`text-[9px] ${
              valor.length > maxLen * 0.85 ? "text-[#FFC528]" : "text-gray-600"
            }`}
          >
            {valor.length}/{maxLen}
          </span>
        )}
      </div>
      {multiline ? <textarea rows={rows || 3} {...props} /> : <input type="text" {...props} />}
      {dica && <p className="text-[10px] text-gray-600 mt-1">{dica}</p>}
    </div>
  );
}

// ============================================================
// PAINEL DE TIPOGRAFIA AVANÇADA
// ============================================================
const ELEMENTOS: { id: ElementoTipo; label: string; ehNumero?: boolean }[] = [
  { id: "kicker", label: "Kicker" },
  { id: "headline", label: "Headline" },
  { id: "corpo", label: "Corpo" },
  { id: "destaque", label: "Destaque" },
  { id: "numero", label: "Big Number", ehNumero: true },
  { id: "pill", label: "Pill / CTA" },
];

function PainelTipografia({
  slide,
  onChange,
  temaAtivo,
}: {
  slide: SlideData;
  onChange: (patch: Partial<SlideData>) => void;
  temaAtivo: any;
}) {
  const [mostrarAvancado, setMostrarAvancado] = useState(false);
  const escalaGeral = slide.escalaGeral ?? 1;

  const fonteAtual = slide.fonteHeadline || temaAtivo.fonteHeadlineDefault;
  const headlineCapsAtual = slide.headlineCaps;

  const capsSimples: "padrao" | "caps" | "min" =
    headlineCapsAtual === undefined ? "padrao" : headlineCapsAtual ? "caps" : "min";

  const setCapsSimples = (modoCaps: "padrao" | "caps" | "min") => {
    if (modoCaps === "padrao") onChange({ headlineCaps: undefined });
    else if (modoCaps === "caps") onChange({ headlineCaps: true });
    else onChange({ headlineCaps: false });
  };

  const resetar = () => {
    onChange({
      escalaGeral: undefined,
      fonteHeadline: undefined,
      headlineCaps: undefined,
      headlineEscala: undefined,
      tipoKicker: undefined,
      tipoHeadline: undefined,
      tipoCorpo: undefined,
      tipoDestaque: undefined,
      tipoNumero: undefined,
      tipoPill: undefined,
    });
  };

  const temAlgumOverride =
    slide.escalaGeral !== undefined ||
    slide.fonteHeadline !== undefined ||
    slide.headlineCaps !== undefined ||
    slide.headlineEscala !== undefined ||
    slide.tipoKicker !== undefined ||
    slide.tipoHeadline !== undefined ||
    slide.tipoCorpo !== undefined ||
    slide.tipoDestaque !== undefined ||
    slide.tipoNumero !== undefined ||
    slide.tipoPill !== undefined;

  return (
    <div className="space-y-3 pt-2 border-t border-gray-800">
      <div className="flex items-center justify-between">
        <Label icone={<Type size={12} />}>Tipografia</Label>
        {temAlgumOverride && (
          <button
            onClick={resetar}
            className="text-[10px] text-gray-500 hover:text-[#FFC528] flex items-center gap-1 transition-colors"
            title="Voltar todos os controles ao padrão do tema"
          >
            <RotateCcw size={10} />
            Resetar
          </button>
        )}
      </div>

      <div className="space-y-3 bg-[#0a0a0a] border border-gray-800 rounded-md p-3">
        <SliderTamanhoGeral
          valor={escalaGeral}
          onChange={(v) => onChange({ escalaGeral: v === 1 ? undefined : v })}
        />

        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
            Caso do headline
          </div>
          <div className="grid grid-cols-3 gap-1">
            <BotaoCaso ativo={capsSimples === "padrao"} onClick={() => setCapsSimples("padrao")}>
              Padrão
            </BotaoCaso>
            <BotaoCaso ativo={capsSimples === "caps"} onClick={() => setCapsSimples("caps")}>
              CAPS
            </BotaoCaso>
            <BotaoCaso ativo={capsSimples === "min"} onClick={() => setCapsSimples("min")}>
              minúsculas
            </BotaoCaso>
          </div>
        </div>

        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
            Fonte do headline
          </div>
          <select
            value={fonteAtual}
            onChange={(e) => onChange({ fonteHeadline: e.target.value as FonteId })}
            className="w-full bg-[#0f0f0f] border border-gray-800 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#FFC528]"
            style={{ fontFamily: FONTE_FAMILIAS[fonteAtual] }}
          >
            {(Object.keys(FONTE_LABELS) as FonteId[]).map((f) => (
              <option key={f} value={f} style={{ fontFamily: FONTE_FAMILIAS[f] }}>
                {FONTE_LABELS[f]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={() => setMostrarAvancado((v) => !v)}
        className="w-full flex items-center justify-between text-[11px] text-gray-400 hover:text-[#FFC528] transition-colors py-1.5 px-1"
      >
        <span className="flex items-center gap-1.5">
          <Sparkles size={11} />
          Tipografia avançada por elemento
        </span>
        <ChevronRight
          size={14}
          className={`transition-transform ${mostrarAvancado ? "rotate-90" : ""}`}
        />
      </button>

      {mostrarAvancado && (
        <div className="space-y-2">
          {ELEMENTOS.map((el) => (
            <SecaoElemento
              key={el.id}
              elementoId={el.id}
              label={el.label}
              ehNumero={el.ehNumero}
              slide={slide}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SliderTamanhoGeral({ valor, onChange }: { valor: number; onChange: (v: number) => void }) {
  const pct = Math.round(valor * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Tamanho geral</span>
        <span className="text-[10px] text-[#FFC528] font-mono">{pct}%</span>
      </div>
      <input
        type="range"
        min={70}
        max={150}
        step={5}
        value={pct}
        onChange={(e) => onChange(parseInt(e.target.value, 10) / 100)}
        className="w-full accent-[#FFC528]"
      />
    </div>
  );
}

function BotaoCaso({
  children,
  ativo,
  onClick,
}: {
  children: React.ReactNode;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] py-1.5 rounded transition-all ${
        ativo
          ? "bg-[#FFC528] text-black font-bold"
          : "bg-[#0f0f0f] border border-gray-800 text-gray-400 hover:border-gray-600"
      }`}
    >
      {children}
    </button>
  );
}

function SecaoElemento({
  elementoId,
  label,
  ehNumero,
  slide,
  onChange,
}: {
  elementoId: ElementoTipo;
  label: string;
  ehNumero?: boolean;
  slide: SlideData;
  onChange: (patch: Partial<SlideData>) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const campoOverride = `tipo${
    elementoId.charAt(0).toUpperCase() + elementoId.slice(1)
  }` as keyof SlideData;
  const override = (slide[campoOverride] as TipografiaOverride | undefined) || {};

  const tamanhoBase = ehNumero
    ? 240
    : elementoId === "headline"
    ? 88
    : elementoId === "kicker"
    ? 14
    : elementoId === "pill"
    ? 14
    : 24;

  const aplicar = (patch: Partial<TipografiaOverride>) => {
    const novo = { ...override, ...patch };
    const limpo: TipografiaOverride = {};
    if (novo.escala !== undefined) limpo.escala = novo.escala;
    if (novo.tamanhoPx !== undefined) limpo.tamanhoPx = novo.tamanhoPx;
    if (novo.fonte !== undefined) limpo.fonte = novo.fonte;
    if (novo.peso !== undefined) limpo.peso = novo.peso;
    if (novo.caps !== undefined) limpo.caps = novo.caps;
    if (novo.tracking !== undefined) limpo.tracking = novo.tracking;

    onChange({
      [campoOverride]: Object.keys(limpo).length > 0 ? limpo : undefined,
    } as Partial<SlideData>);
  };

  const limpar = () => onChange({ [campoOverride]: undefined } as Partial<SlideData>);

  const temOverride = Object.keys(override).length > 0;

  return (
    <div className="bg-[#0a0a0a] border border-gray-800 rounded-md overflow-hidden">
      <button
        onClick={() => setAberto((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#0f0f0f] transition-colors"
      >
        <span className="text-[11px] font-bold text-gray-300 flex items-center gap-2">
          {label}
          {temOverride && (
            <span className="text-[8px] bg-[#FFC528] text-black px-1.5 py-0.5 rounded font-bold">
              EDITADO
            </span>
          )}
        </span>
        <ChevronRight
          size={12}
          className={`text-gray-500 transition-transform ${aberto ? "rotate-90" : ""}`}
        />
      </button>

      {aberto && (
        <div className="px-3 pb-3 pt-1 space-y-2.5 border-t border-gray-800">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider">
                Tamanho ({tamanhoBase}px padrão)
              </span>
              <span className="text-[9px] text-gray-400 font-mono">
                {override.tamanhoPx ?? Math.round(tamanhoBase * (override.escala ?? 1))}px
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={Math.round(tamanhoBase * 0.4)}
                max={Math.round(tamanhoBase * 1.8)}
                step={1}
                value={override.tamanhoPx ?? Math.round(tamanhoBase * (override.escala ?? 1))}
                onChange={(e) =>
                  aplicar({ tamanhoPx: parseInt(e.target.value, 10), escala: undefined })
                }
                className="flex-1 accent-[#FFC528]"
              />
              <input
                type="number"
                value={override.tamanhoPx ?? Math.round(tamanhoBase * (override.escala ?? 1))}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v)) aplicar({ tamanhoPx: v, escala: undefined });
                }}
                className="w-14 bg-[#0f0f0f] border border-gray-800 rounded px-1.5 py-1 text-[10px] text-white focus:outline-none focus:border-[#FFC528]"
              />
            </div>
          </div>

          <div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Fonte</div>
            <select
              value={override.fonte || ""}
              onChange={(e) =>
                aplicar({ fonte: (e.target.value || undefined) as FonteId | undefined })
              }
              className="w-full bg-[#0f0f0f] border border-gray-800 rounded px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-[#FFC528]"
            >
              <option value="">— padrão —</option>
              {(Object.keys(FONTE_LABELS) as FonteId[]).map((f) => (
                <option key={f} value={f}>
                  {FONTE_LABELS[f]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Peso</div>
            <select
              value={override.peso ?? ""}
              onChange={(e) =>
                aplicar({
                  peso: e.target.value ? (parseInt(e.target.value, 10) as PesoFonte) : undefined,
                })
              }
              className="w-full bg-[#0f0f0f] border border-gray-800 rounded px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-[#FFC528]"
            >
              <option value="">— padrão —</option>
              {(Object.keys(PESO_LABELS) as unknown as PesoFonte[]).map((p) => (
                <option key={p} value={p}>
                  {PESO_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">
              Capitalização
            </div>
            <select
              value={override.caps || "padrao"}
              onChange={(e) =>
                aplicar({
                  caps: e.target.value === "padrao" ? undefined : (e.target.value as ModoCaps),
                })
              }
              className="w-full bg-[#0f0f0f] border border-gray-800 rounded px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-[#FFC528]"
            >
              {(Object.keys(CAPS_LABELS) as ModoCaps[]).map((c) => (
                <option key={c} value={c}>
                  {CAPS_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider">Espaçamento</span>
              <span className="text-[9px] text-gray-400 font-mono">{override.tracking ?? 0}px</span>
            </div>
            <input
              type="range"
              min={-5}
              max={10}
              step={0.5}
              value={override.tracking ?? 0}
              onChange={(e) => aplicar({ tracking: parseFloat(e.target.value) || undefined })}
              className="w-full accent-[#FFC528]"
            />
          </div>

          {temOverride && (
            <button
              onClick={limpar}
              className="w-full text-[9px] text-gray-500 hover:text-[#FFC528] py-1 flex items-center justify-center gap-1 transition-colors"
            >
              <RotateCcw size={9} />
              Limpar este elemento
            </button>
          )}
        </div>
      )}
    </div>
  );
}
