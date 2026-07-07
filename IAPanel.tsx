import React, { useState, useMemo, useCallback } from "react";
import { 
  Sparkles, 
  Wand2, 
  Loader2, 
  ClipboardCopy, 
  CheckCircle2, 
  ExternalLink,
  Info,
  Key,
  X,
  ChevronDown
} from "lucide-react";
import { 
  FieldWrapper, 
  TextInput, 
  Textarea, 
  Select 
} from "./ui/SharedInputs";
import { toast } from "sonner";
import { 
  gerarPromptParaIA, 
  parsearRespostaIA, 
  chamarIADireto 
} from "../lib/formatarCarrossel";
import { SlideData } from "./CarrosselSlide";
import { TemaConfig } from "./temas/tipos";
import { useLocalStorage } from "../lib/useLocalStorage";

interface IAPanelProps {
  numSlides: number;
  temaVisual: TemaConfig;
  marca: string;
  onAplicar: (slides: SlideData[]) => void;
  onClose: () => void;
}

export function IAPanel({
  numSlides,
  temaVisual,
  marca,
  onAplicar,
  onClose,
}: IAPanelProps) {
  // --- Estados Locais ---
  const [tema, setTema] = useState("");
  const [modeloIA, setModeloIA] = useLocalStorage("ia_modelo_preferido", "anthropic/claude-3.5-sonnet");
  const [chaveManualIA, setChaveManualIA] = useLocalStorage("ia_chave_manual", "");
  const [respostaManual, setRespostaManual] = useState("");
  
  const [modoAvancado, setModoAvancado] = useState(false);
  const [gerandoViaAPI, setGerandoViaAPI] = useState(false);
  const [promptCopiado, setPromptCopiado] = useState(false);
  const [mostrarChave, setMostrarChave] = useState(false);
  const [expandirChaveManual, setExpandirChaveManual] = useState(Boolean(chaveManualIA));

  // --- Memos ---
  const promptGerado = useMemo(() => {
    if (!tema.trim()) return "";
    return gerarPromptParaIA({
      tema,
      numeroSlides: numSlides,
      marca,
      temaVisual
    });
  }, [tema, numSlides, marca, temaVisual]);

  const temRespostaManual = Boolean(respostaManual.trim());

  // --- Callbacks ---

  const handleCopiarPrompt = async () => {
    if (!promptGerado) return;
    try {
      await navigator.clipboard.writeText(promptGerado);
      setPromptCopiado(true);
      toast.success("Prompt copiado para o clipboard!");
      setTimeout(() => setPromptCopiado(false), 3000);
    } catch {
      toast.error("Erro ao copiar. Selecione e copie manualmente.");
    }
  };

  const handleGerarViaAPI = async () => {
    if (!tema.trim()) {
      toast.error("Descreva o tema antes de gerar.");
      return;
    }
    setGerandoViaAPI(true);
    try {
      const resultado = await chamarIADireto({
        tema,
        numeroSlides: numSlides,
        marca,
        temaVisual,
        modelo: modeloIA,
        apiKey: chaveManualIA.trim() || undefined,
      });
      onAplicar(resultado.slides);
    } catch (err: any) {
      toast.error(err.message || "Erro ao chamar API");
    } finally {
      setGerandoViaAPI(false);
    }
  };

  const handleAplicarManual = () => {
    try {
      const slides = parsearRespostaIA(respostaManual);
      onAplicar(slides);
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar resposta da IA");
    }
  };

  return (
    <div className="flex flex-col bg-[var(--v6-bg-surface)] border border-[var(--v6-border)] rounded-2xl shadow-2xl overflow-hidden max-h-[85vh]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--v6-border)] flex items-center justify-between bg-[var(--v6-bg-elevated)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FFC528]/10 flex items-center justify-center">
            <Sparkles size={18} className="text-[#FFC528]" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider">Gerador com IA</h2>
            <p className="text-[10px] text-[var(--v6-text-muted)] font-medium">MAGIC ENGINE v2.0</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setModoAvancado(!modoAvancado)}
            className="text-[10px] font-bold text-[#FFC528] hover:underline uppercase tracking-tighter mr-2"
          >
            {modoAvancado ? "Modo Direto" : "Modo Manual"}
          </button>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-[var(--v6-bg-sunken)] text-[var(--v6-text-muted)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto">
        {/* Step 1: Theme Description */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-[var(--v6-text-muted)] uppercase tracking-widest">
            <div className="w-5 h-5 rounded-full bg-[var(--v6-bg-sunken)] border border-[var(--v6-border)] flex items-center justify-center text-[10px] text-[var(--v6-text-secondary)]">1</div>
            O que vamos criar hoje?
          </div>
          <Textarea
            value={tema}
            onChange={setTema}
            placeholder="Ex: Como a gamificação pode aumentar a retenção em apps de fintech..."
            rows={3}
            className="text-xs leading-relaxed"
          />
        </div>

        {/* --- MODO DIRETO --- */}
        {!modoAvancado && (
          <div className="space-y-4 pt-4 border-t border-[var(--v6-border)] animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-[var(--v6-text-muted)] uppercase tracking-widest">
                <div className="w-5 h-5 rounded-full bg-[var(--v6-bg-sunken)] border border-[var(--v6-border)] flex items-center justify-center text-[10px] text-[var(--v6-text-secondary)]">2</div>
                Cérebro da IA
              </div>
              <Select value={modeloIA} onChange={setModeloIA}>
                <optgroup label="💎 Premium (Recomendado)">
                  <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                  <option value="openai/gpt-4o">GPT-4o</option>
                  <option value="anthropic/claude-3.5-haiku">Claude 3.5 Haiku</option>
                </optgroup>
                <optgroup label="🆓 Grátis">
                  <option value="deepseek/deepseek-r1:free">DeepSeek R1 (Grátis)</option>
                  <option value="google/gemini-flash-1.5:free">Gemini Flash 1.5</option>
                  <option value="meta-llama/llama-3.3-70b-instruct:free">Llama 3.3 70B</option>
                </optgroup>
              </Select>
            </div>

            {/* API Key Toggle */}
            <div className="border border-[var(--v6-border)] rounded-xl overflow-hidden bg-[var(--v6-bg-sunken)]">
              <button
                onClick={() => setExpandirChaveManual(!expandirChaveManual)}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-[var(--v6-border)]/10 transition-colors text-xs"
              >
                <span className="flex items-center gap-2 text-[var(--v6-text-secondary)] font-bold uppercase tracking-tighter">
                  <Key size={12} className={chaveManualIA ? "text-[#FFC528]" : "text-gray-500"} />
                  Configuração de API (Opcional)
                </span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${expandirChaveManual ? "rotate-180" : ""}`} />
              </button>

              {expandirChaveManual && (
                <div className="p-4 pt-0 space-y-3 border-t border-[var(--v6-border)]/30">
                  <p className="text-[10px] text-[var(--v6-text-muted)] mt-2">
                    Use sua chave do OpenRouter para créditos próprios.
                  </p>
                  <div className="relative">
                    <TextInput
                      type={mostrarChave ? "text" : "password"}
                      value={chaveManualIA}
                      onChange={setChaveManualIA}
                      placeholder="sk-or-v1-..."
                      className="font-mono text-[10px] pr-10 h-8"
                    />
                    <button
                      onClick={() => setMostrarChave(!mostrarChave)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      {mostrarChave ? <X size={12} /> : <Info size={12} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleGerarViaAPI}
              disabled={!tema.trim() || gerandoViaAPI}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-[#FFC528] text-black font-black uppercase tracking-widest text-xs hover:bg-[#ffd55a] transition-all disabled:opacity-50 shadow-xl shadow-[#FFC528]/10 group"
            >
              {gerandoViaAPI ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Gerando Carrossel...
                </>
              ) : (
                <>
                  <Wand2 size={18} className="group-hover:rotate-12 transition-transform" />
                  Gerar {numSlides} Slides Agora
                </>
              )}
            </button>
          </div>
        )}

        {/* --- MODO MANUAL --- */}
        {modoAvancado && (
          <div className="space-y-6 pt-4 border-t border-[var(--v6-border)] animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[var(--v6-text-muted)] uppercase tracking-widest">2. O Prompt</span>
                <button
                  onClick={handleCopiarPrompt}
                  disabled={!tema.trim()}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                    promptCopiado ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "bg-[#FFC528] text-black hover:scale-105"
                  }`}
                >
                  {promptCopiado ? <CheckCircle2 size={12} /> : <ClipboardCopy size={12} />}
                  {promptCopiado ? "Copiado" : "Copiar Prompt"}
                </button>
              </div>
              <div className="relative">
                <Textarea
                  readOnly
                  value={promptGerado}
                  rows={4}
                  className="text-[10px] text-[var(--v6-text-muted)] bg-[var(--v6-bg-sunken)] font-mono"
                  onFocus={(e) => e.currentTarget.select()}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <IALink href="https://claude.ai" label="Claude" />
                <IALink href="https://chatgpt.com" label="ChatGPT" />
                <IALink href="https://gemini.google.com" label="Gemini" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-[var(--v6-text-muted)] uppercase tracking-widest">
                <div className="w-5 h-5 rounded-full bg-[var(--v6-bg-sunken)] border border-[var(--v6-border)] flex items-center justify-center text-[10px] text-[var(--v6-text-secondary)]">3</div>
                Resposta da IA
              </div>
              <Textarea
                value={respostaManual}
                onChange={setRespostaManual}
                placeholder="Cole o JSON retornado pela IA aqui..."
                rows={5}
                className="text-[10px] font-mono"
              />
              <button
                onClick={handleAplicarManual}
                disabled={!temRespostaManual}
                className="w-full py-4 rounded-xl bg-[#FFC528] text-black font-black uppercase tracking-widest text-xs hover:bg-[#ffd55a] transition-all disabled:opacity-50"
              >
                Aplicar Conteúdo
              </button>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="pt-4 border-t border-[var(--v6-border)] flex gap-3 text-[#FFC528]/80">
          <Info size={14} className="shrink-0 mt-0.5" />
          <p className="text-[10px] leading-relaxed italic">
            Dica: A IA substitui os textos de todos os slides de uma vez, mas preserva fotos e estilos personalizados.
          </p>
        </div>
      </div>
    </div>
  );
}

function IALink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-[var(--v6-bg-sunken)] border border-[var(--v6-border)] text-[9px] font-bold text-[var(--v6-text-secondary)] hover:border-[#FFC528] hover:text-white transition-all group"
    >
      <ExternalLink size={10} className="group-hover:scale-110 transition-transform" />
      {label}
    </a>
  );
}
