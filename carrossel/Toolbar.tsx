import { FileText, Sparkles, Download, Loader2, Wand2, ImagePlus, Palette, Trash2 } from "lucide-react";
import type { Status } from "./useStatus";

interface ToolbarProps {
  marca: string;
  onMarcaChange: (v: string) => void;
  numSlides: number;
  status: Status;
  mostrarPainelCola: boolean;
  mostrarPainelIA: boolean;
  onTogglePainelCola: () => void;
  onTogglePainelIA: () => void;
  onExportarSlideAtual: () => void;
  onExportarTudo: () => void;
  // v7.8 — geração de imagens
  mostrarPainelEstilo: boolean;
  onTogglePainelEstilo: () => void;
  onGerarImagens: () => void;
  gerandoImagens: boolean;
  progressoImagens: { atual: number; total: number } | null;
  slidesPendentes: number;
  onInverterCores: () => void;
  onLimparTudo: () => void;
}

/**
 * Top actions: input da marca + botões de Cola, IA, Estilo visual,
 * Gerar imagens (IA), Baixar slide, Baixar ZIP.
 */
export default function Toolbar({
  marca,
  onMarcaChange,
  numSlides,
  status,
  mostrarPainelCola,
  mostrarPainelIA,
  onTogglePainelCola,
  onTogglePainelIA,
  onExportarSlideAtual,
  onExportarTudo,
  mostrarPainelEstilo,
  onTogglePainelEstilo,
  onGerarImagens,
  gerandoImagens,
  progressoImagens,
  slidesPendentes,
  onInverterCores,
  onLimparTudo,
}: ToolbarProps) {
  const exportando = status.tipo === "exportando";

  return (
    <div className="flex flex-wrap gap-3 items-center justify-between">
      <div className="flex items-center gap-3">
        <div>
          <input
            type="text"
            value={marca}
            onChange={(e) => onMarcaChange(e.target.value)}
            className="bg-[#1a1a1a] border border-gray-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFC528] font-mono tracking-wide"
            placeholder="MARCA · SEÇÃO"
          />
          <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-wider">
            Aparece no topo de cada slide · <span style={{ color: "#10b981" }}>● Auto-save ativo</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onTogglePainelCola}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${
            mostrarPainelCola
              ? "bg-[#FFC528] text-black"
              : "bg-[#1a1a1a] border border-gray-800 text-gray-300 hover:border-[#FFC528] hover:text-white"
          }`}
          title="Cole texto pronto e o app organiza nos slides"
        >
          <FileText size={16} />
          Colar conteúdo
        </button>
        <button
          onClick={onTogglePainelIA}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${
            mostrarPainelIA
              ? "bg-[#FFC528] text-black"
              : "bg-[#1a1a1a] border border-gray-800 text-gray-300 hover:border-[#FFC528] hover:text-white"
          }`}
        >
          <Sparkles size={16} />
          Formatar com IA
        </button>
        <button
          onClick={onTogglePainelEstilo}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${
            mostrarPainelEstilo
              ? "bg-[#FFC528] text-black"
              : "bg-[#1a1a1a] border border-gray-800 text-gray-300 hover:border-[#FFC528] hover:text-white"
          }`}
          title="Estética global aplicada a todas as imagens geradas"
        >
          <Wand2 size={16} />
          Estilo visual
        </button>
        <button
          onClick={onInverterCores}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold bg-[#1a1a1a] border border-gray-800 text-gray-300 hover:border-[#FFC528] hover:text-white transition-all"
          title="Inverte a cor de fundo (preto ⇄ amarelo) de todos os slides — útil pra variar entre carrosséis"
        >
          <Palette size={16} />
          Inverter cores
        </button>
        <button
          onClick={onGerarImagens}
          disabled={gerandoImagens || slidesPendentes === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold bg-[#1a1a1a] border border-[#FFC528]/40 text-[#FFC528] hover:bg-[#FFC528]/10 transition-all disabled:opacity-40 disabled:hover:bg-[#1a1a1a]"
          title={
            slidesPendentes === 0
              ? "Nenhum slide com IMGPROMPT pendente. Adicione IMGPROMPT no 'Colar conteúdo' ou no painel do slide."
              : "Gera a imagem de todos os slides com IMGPROMPT que ainda não têm foto"
          }
        >
          {gerandoImagens ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {progressoImagens
                ? `Gerando ${progressoImagens.atual} de ${progressoImagens.total}`
                : "Gerando…"}
            </>
          ) : (
            <>
              <ImagePlus size={16} />
              Gerar imagens (IA)
              {slidesPendentes > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#FFC528] text-black text-[10px] font-bold">
                  {slidesPendentes}
                </span>
              )}
            </>
          )}
        </button>
        <button
          onClick={onExportarSlideAtual}
          disabled={exportando}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-[#1a1a1a] border border-gray-800 text-gray-300 hover:border-[#FFC528] hover:text-white transition-all disabled:opacity-40"
        >
          <Download size={16} />
          Baixar slide atual
        </button>
        <button
          onClick={onExportarTudo}
          disabled={exportando}
          className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-bold bg-[#FFC528] text-black hover:bg-[#ffd55a] transition-all disabled:opacity-40 shadow-md"
        >
          {exportando ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          Baixar ZIP ({numSlides} slides)
        </button>
        <button
          onClick={onLimparTudo}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-[#1a1a1a] border border-gray-800 text-gray-400 hover:border-red-500 hover:text-red-400 transition-all"
          title="Apaga os slides atuais e recarrega a estrutura padrão de 7 slides"
        >
          <Trash2 size={16} />
          Limpar tudo
        </button>
      </div>
    </div>
  );
}
