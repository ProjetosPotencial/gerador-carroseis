import { useState } from "react";
import { FileText, X, CheckCircle2 } from "lucide-react";
import { EXEMPLO_TEXTO_COLADO } from "../../lib/parsearTextoColado";

interface PastePanelProps {
  texto: string;
  onTextoChange: (v: string) => void;
  onAplicar: () => void;
  onFechar: () => void;
}

/**
 * Modal de cola de texto rotulado (formato KICKER:, HEADLINE:, etc.)
 * Funciona offline (sem IA), só parseia o que foi colado.
 */
export default function PastePanel({
  texto,
  onTextoChange,
  onAplicar,
  onFechar,
}: PastePanelProps) {
  const [mostrarExemplo, setMostrarExemplo] = useState(false);
  const numLinhas = texto.split("\n").length;
  const numSlidesEstimado = (() => {
    if (!texto.trim()) return 0;
    const porSlideMarker = (texto.match(/^[\s]*(?:={3,}\s*)?(?:SLIDE)\s*(?:[#:.]?\s*\d+)?(?:\s*={3,})?[\s]*$/gim) || []).length;
    if (porSlideMarker > 0) return porSlideMarker;
    const porDivisor = (texto.match(/^[\s]*-{3,}[\s]*$/gm) || []).length;
    if (porDivisor > 0) return porDivisor + 1;
    const porLinhaBranca = texto.split(/\n\s*\n\s*\n+/).filter((b) => b.trim()).length;
    if (porLinhaBranca > 1) return porLinhaBranca;
    const blocos = texto.split(/\n\s*\n/).filter((b) => b.trim());
    return blocos.length || 1;
  })();

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#141414] border border-[#FFC528]/30 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[#FFC528]">
          <FileText size={18} />
          <h3 className="text-sm font-bold uppercase tracking-wider">Colar conteúdo</h3>
          <span className="text-[10px] text-gray-500 normal-case font-normal">
            · sem usar IA, organiza o texto direto nos slides
          </span>
        </div>
        <button
          onClick={onFechar}
          className="text-gray-500 hover:text-white transition-colors"
          title="Fechar"
        >
          <X size={18} />
        </button>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        Cole texto rotulado (formato <code className="text-[#FFC528]">KICKER:</code>,{" "}
        <code className="text-[#FFC528]">HEADLINE:</code>,{" "}
        <code className="text-[#FFC528]">CORPO:</code>...). Separe slides com linha em
        branco dupla, <code className="text-[#FFC528]">---</code>, ou marcadores{" "}
        <code className="text-[#FFC528]">SLIDE 1</code>,{" "}
        <code className="text-[#FFC528]">SLIDE 2</code>. O número de slides do app é
        ajustado automaticamente.
      </p>

      <div className="flex items-center gap-4 text-[11px] text-gray-500">
        <span>
          📝 {numLinhas} {numLinhas === 1 ? "linha" : "linhas"}
        </span>
        <span>
          🎴 {numSlidesEstimado}{" "}
          {numSlidesEstimado === 1 ? "slide detectado" : "slides detectados"}
        </span>
        <button
          onClick={() => setMostrarExemplo((v) => !v)}
          className="ml-auto text-[#FFC528] hover:underline"
        >
          {mostrarExemplo ? "Esconder exemplo" : "Ver exemplo de formato"}
        </button>
      </div>

      {mostrarExemplo && (
        <div className="bg-[#0f0f0f] border border-gray-800 rounded-md p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              Formato esperado
            </span>
            <button
              onClick={() => onTextoChange(EXEMPLO_TEXTO_COLADO)}
              className="text-[10px] text-[#FFC528] hover:underline"
            >
              Usar este exemplo
            </button>
          </div>
          <pre className="text-[11px] text-gray-400 font-mono whitespace-pre-wrap leading-relaxed">
            {EXEMPLO_TEXTO_COLADO}
          </pre>
          <div className="text-[10px] text-gray-600 pt-2 border-t border-gray-800 space-y-1">
            <div>
              <strong className="text-gray-400">Rótulos aceitos:</strong> KICKER,
              HEADLINE/TITULO, CORPO/TEXTO, DESTAQUE, NUMERO, LEGENDA, PILL/CTA, LAYOUT,
              CORFUNDO/FUNDO, <span className="text-[#FFC528]">IMGPROMPT</span>
            </div>
            <div>
              <strong className="text-gray-400">IMGPROMPT:</strong> descreve só a{" "}
              <em>cena</em> da imagem (quem, onde, enquadramento). A estética e a
              proporção vêm do "Estilo visual" global. Depois clique em "Gerar imagens
              (IA)".
            </div>
            <div>
              <strong className="text-gray-400">Cores de fundo:</strong> preto, amarelo,
              bege, branco
            </div>
            <div>
              <strong className="text-gray-400">Multi-linha:</strong> se um campo
              continua na linha de baixo, basta não começar com outro RÓTULO:
            </div>
          </div>
        </div>
      )}

      <textarea
        value={texto}
        onChange={(e) => onTextoChange(e.target.value)}
        placeholder={`Cole seu conteúdo aqui. Por exemplo:

KICKER: TESE Nº 1
HEADLINE: Por décadas, algo foi assunto de poucos.
CORPO: Aqui você desenvolve o tema...
DESTAQUE: E então aconteceu a virada.

---

KICKER: O DADO
HEADLINE: +32%
CORPO: Justifique o número.`}
        rows={14}
        className="w-full bg-[#0f0f0f] border border-gray-800 rounded-md px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#FFC528] resize-y font-mono"
        spellCheck={false}
      />

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[10px] text-gray-600 flex-1 min-w-0">
          💡 Os slides existentes vão ser{" "}
          <strong className="text-gray-400">substituídos</strong>, mas as fotos já
          carregadas são <strong className="text-gray-400">preservadas</strong>.
        </p>
        <button
          onClick={() => onTextoChange("")}
          disabled={!texto}
          className="text-[11px] text-gray-500 hover:text-white px-3 py-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Limpar
        </button>
        <button
          onClick={onAplicar}
          disabled={!texto.trim()}
          className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-bold bg-[#FFC528] text-black hover:bg-[#ffd55a] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <CheckCircle2 size={16} />
          Aplicar{" "}
          {numSlidesEstimado > 0
            ? `(${numSlidesEstimado} ${numSlidesEstimado === 1 ? "slide" : "slides"})`
            : ""}
        </button>
      </div>
    </div>
  );
}
