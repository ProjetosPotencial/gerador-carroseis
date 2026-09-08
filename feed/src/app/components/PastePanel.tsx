import React, { useState } from "react";
import { 
  FileText, 
  X, 
  CheckCircle2, 
  Info,
  ChevronDown,
  Trash2
} from "lucide-react";
import { 
  FieldWrapper, 
  Textarea 
} from "./ui/SharedInputs";
import { toast } from "sonner";
import { parsearTextoColado, EXEMPLO_TEXTO_COLADO } from "../lib/parsearTextoColado";
import { SlideData } from "./CarrosselSlide";

interface PastePanelProps {
  onAplicar: (slides: SlideData[]) => void;
  onClose: () => void;
}

export function PastePanel({
  onAplicar,
  onClose,
}: PastePanelProps) {
  const [texto, setTexto] = useState("");
  const [mostrarExemplo, setMostrarExemplo] = useState(false);
  
  const numLinhas = texto.split("\n").length;
  
  // Estimativa de slides baseada no separador
  const numSlidesEstimado = (() => {
    if (!texto.trim()) return 0;
    const porSlideMarker = (texto.match(/^[\s]*(?:={3,}\s*)?(?:SLIDE)\s*(?:[#:.]?\s*\d+)?(?:\s*={3,})?[\s]*$/gim) || []).length;
    if (porSlideMarker > 0) return porSlideMarker;
    const porDivisor = (texto.match(/^[\s]*-{3,}[\s]*$/gm) || []).length;
    if (porDivisor > 0) return porDivisor + 1;
    const blocos = texto.split(/\n\s*\n/).filter(b => b.trim());
    return blocos.length || 1;
  })();

  const handleAplicar = () => {
    try {
      const result = parsearTextoColado(texto);
      onAplicar(result.slides);
      if (result.avisos.length > 0) {
        toast.warning(`${result.avisos.length} avisos de formatação`, {
          description: result.avisos[0]
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar texto");
    }
  };

  return (
    <div className="flex flex-col bg-[var(--v6-bg-surface)] border border-[var(--v6-border)] rounded-2xl shadow-2xl overflow-hidden max-h-[85vh]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--v6-border)] flex items-center justify-between bg-[var(--v6-bg-elevated)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FFC528]/10 flex items-center justify-center">
            <FileText size={18} className="text-[#FFC528]" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider">Colar Conteúdo</h2>
            <p className="text-[10px] text-[var(--v6-text-muted)] font-medium">TRANSFORME TEXTO EM SLIDES</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 rounded-full hover:bg-[var(--v6-bg-sunken)] text-[var(--v6-text-muted)] transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto">
        {/* Intro */}
        <div className="flex items-start gap-3 bg-[var(--v6-bg-sunken)] border border-[var(--v6-border)] rounded-xl p-3">
          <Info size={14} className="text-[#FFC528] mt-0.5" />
          <p className="text-xs text-[var(--v6-text-secondary)] leading-relaxed">
            Ideal para roteiros prontos. Use rótulos como <code className="text-[#FFC528]">HEADLINE:</code> e separe com <code className="text-[#FFC528]">---</code>.
          </p>
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-[var(--v6-text-muted)] uppercase tracking-widest">Seu Roteiro</span>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setTexto("")}
                disabled={!texto}
                className="text-[10px] text-red-400 hover:underline flex items-center gap-1 disabled:opacity-30"
              >
                <Trash2 size={10} /> Limpar
              </button>
              <button 
                onClick={() => setMostrarExemplo(!mostrarExemplo)}
                className="text-[10px] text-[#FFC528] hover:underline flex items-center gap-1"
              >
                Ver Exemplo <ChevronDown size={10} className={`transition-transform ${mostrarExemplo ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>
          
          <Textarea
            value={texto}
            onChange={setTexto}
            placeholder={`KICKER: INSIGHT\nHEADLINE: Como crescer em 2026\nCORPO: Use IA para automação...\n\n---\n\nKICKER: DICA\n...`}
            rows={12}
            className="text-xs font-mono leading-relaxed"
          />
          
          <div className="flex justify-between text-[10px] text-[var(--v6-text-muted)]">
            <span>{numLinhas} linhas</span>
            <span className="font-bold text-[var(--v6-text-secondary)]">{numSlidesEstimado} slides detectados</span>
          </div>
        </div>

        {/* Exemplo Panel */}
        {mostrarExemplo && (
          <div className="bg-[#000] border border-[var(--v6-border)] rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-[var(--v6-text-muted)]">Formato Recomendado</span>
              <button 
                onClick={() => { setTexto(EXEMPLO_TEXTO_COLADO); setMostrarExemplo(false); }}
                className="text-[10px] text-[#FFC528] hover:underline font-bold"
              >
                Copiar este exemplo
              </button>
            </div>
            <pre className="text-[10px] text-gray-500 font-mono leading-relaxed overflow-x-auto p-2 bg-[#0a0a0a] rounded-lg">
              {EXEMPLO_TEXTO_COLADO}
            </pre>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleAplicar}
          disabled={!texto.trim()}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-[#FFC528] text-black font-black uppercase tracking-widest text-xs hover:bg-[#ffd55a] transition-all disabled:opacity-50 shadow-xl shadow-[#FFC528]/10 group"
        >
          <CheckCircle2 size={18} className="group-hover:scale-110 transition-transform" />
          Aplicar agora ({numSlidesEstimado} Slides)
        </button>
      </div>
    </div>
  );
}
