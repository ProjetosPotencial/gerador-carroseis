import { useState } from "react";
import {
  Sparkles,
  Loader2,
  Wand2,
  ClipboardCopy,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface IAPanelProps {
  tema: string;
  onTemaChange: (v: string) => void;
  numSlides: number;
  prompt: string;
  onCopiarPrompt: () => void;
  promptCopiado: boolean;
  resposta: string;
  onRespostaChange: (v: string) => void;
  onFormatar: () => void;
  onGerarViaAPI: () => void;
  gerandoViaAPI: boolean;
  modeloIA: string;
  onModeloChange: (m: string) => void;
  chaveManualIA: string;
  onChaveManualChange: (v: string) => void;
}

/**
 * Modal de IA com dois modos:
 *   - Simples: chama /api/ia (Vercel + OpenRouter) direto
 *   - Avançado: copia prompt pra colar em Claude.ai/ChatGPT/Gemini, depois cola resposta
 */
export default function IAPanel({
  tema,
  onTemaChange,
  numSlides,
  prompt,
  onCopiarPrompt,
  promptCopiado,
  resposta,
  onRespostaChange,
  onFormatar,
  onGerarViaAPI,
  gerandoViaAPI,
  modeloIA,
  onModeloChange,
  chaveManualIA,
  onChaveManualChange,
}: IAPanelProps) {
  const temPrompt = Boolean(prompt);
  const temResposta = Boolean(resposta.trim());
  const [modoAvancado, setModoAvancado] = useState(false);
  const [mostrarChave, setMostrarChave] = useState(false);
  const [expandirChaveManual, setExpandirChaveManual] = useState(Boolean(chaveManualIA));

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#141414] border border-[#FFC528]/30 rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[#FFC528]">
          <Sparkles size={18} />
          <h3 className="text-sm font-bold uppercase tracking-wider">Gerar com IA</h3>
        </div>
        <button
          onClick={() => setModoAvancado((v) => !v)}
          className="text-[10px] text-gray-500 hover:text-[#FFC528] underline"
        >
          {modoAvancado ? "Voltar ao modo simples" : "Modo avançado (copiar/colar)"}
        </button>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        Descreva o tema e clique em "Gerar" — a IA escreve o carrossel completo. Usa o
        endpoint <code className="text-[#FFC528] font-mono">/api/ia</code> (Vercel +
        OpenRouter). Se preferir usar uma IA grátis manualmente, ative o modo avançado.
      </p>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#FFC528] text-black text-xs font-black flex items-center justify-center">
            1
          </div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Descreva o tema
          </h4>
        </div>

        <textarea
          value={tema}
          onChange={(e) => onTemaChange(e.target.value)}
          placeholder="Ex: A psicologia por trás de por que brasileiros não investem — foco em provocar tomadores de decisão do mercado financeiro"
          rows={3}
          className="w-full bg-[#0f0f0f] border border-gray-800 rounded-md px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#FFC528] resize-none"
        />
      </div>

      {!modoAvancado && (
        <div className="space-y-3 pt-2 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#FFC528] text-black text-xs font-black flex items-center justify-center">
              2
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Escolha o modelo e gere
            </h4>
          </div>

          <select
            value={modeloIA}
            onChange={(e) => onModeloChange(e.target.value)}
            className="w-full bg-[#0f0f0f] border border-gray-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FFC528]"
          >
            <optgroup label="💎 Premium (melhor qualidade)">
              <option value="anthropic/claude-3.5-sonnet">
                Claude 3.5 Sonnet (recomendado)
              </option>
              <option value="openai/gpt-4o">GPT-4o</option>
              <option value="anthropic/claude-3.5-haiku">
                Claude 3.5 Haiku (barato e ótimo)
              </option>
              <option value="openai/gpt-4o-mini">GPT-4o mini (barato)</option>
              <option value="google/gemini-flash-1.5">Gemini Flash 1.5 (rápido)</option>
              <option value="deepseek/deepseek-chat">DeepSeek Chat</option>
            </optgroup>
            <optgroup label="🆓 Grátis (tier gratuito OpenRouter)">
              <option value="deepseek/deepseek-r1:free">
                DeepSeek R1 (grátis · qualidade alta)
              </option>
              <option value="meta-llama/llama-3.3-70b-instruct:free">
                Llama 3.3 70B (grátis)
              </option>
              <option value="qwen/qwen-2.5-72b-instruct:free">Qwen 2.5 72B (grátis)</option>
              <option value="mistralai/mistral-nemo:free">
                Mistral Nemo (grátis · leve)
              </option>
              <option value="google/gemma-2-9b-it:free">Gemma 2 9B (grátis · leve)</option>
            </optgroup>
          </select>

          <div className="border border-gray-800 rounded-md overflow-hidden">
            <button
              onClick={() => setExpandirChaveManual((v) => !v)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[#0f0f0f] hover:bg-[#141414] transition-colors text-xs"
            >
              <span className="flex items-center gap-2 text-gray-400">
                <span className="text-[#FFC528]">🔑</span>
                <span className="font-bold uppercase tracking-wider">
                  Chave manual (opcional)
                </span>
                {chaveManualIA && (
                  <span className="bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded text-[9px] font-bold">
                    ATIVA
                  </span>
                )}
              </span>
              <span className="text-gray-600 text-[10px]">
                {expandirChaveManual ? "▲ ocultar" : "▼ expandir"}
              </span>
            </button>

            {expandirChaveManual && (
              <div className="p-3 bg-[#0a0a0a] border-t border-gray-800 space-y-2">
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Cole sua chave do OpenRouter aqui se quiser usar a sua conta em vez da
                  configurada na Vercel. A chave fica salva no localStorage do seu
                  navegador (não vai pro repositório, log ou servidor além do
                  OpenRouter). Ideal pra escolher o modelo grátis sem rate-limit ou usar
                  créditos próprios.
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={mostrarChave ? "text" : "password"}
                      value={chaveManualIA}
                      onChange={(e) => onChaveManualChange(e.target.value)}
                      placeholder="sk-or-v1-..."
                      className="w-full bg-[#0f0f0f] border border-gray-800 rounded-md px-3 py-2 pr-9 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:border-[#FFC528] font-mono"
                    />
                    <button
                      onClick={() => setMostrarChave((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#FFC528] text-[10px]"
                      title={mostrarChave ? "Ocultar" : "Mostrar"}
                    >
                      {mostrarChave ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {chaveManualIA && (
                    <button
                      onClick={() => onChaveManualChange("")}
                      className="px-3 py-2 bg-[#1a0f0f] border border-red-900/40 rounded-md text-[10px] text-red-400 hover:bg-red-900/20 hover:border-red-700 transition-colors font-bold uppercase tracking-wider"
                      title="Remover chave do localStorage"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-[#FFC528] hover:underline inline-flex items-center gap-1"
                >
                  → Pegar/criar chave no OpenRouter
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[10px] text-gray-600 flex-1 min-w-0">
              {chaveManualIA ? (
                "Usando sua chave manual (do navegador)"
              ) : (
                <>
                  Usando <code className="text-[#FFC528]">OPENROUTER_API_KEY</code> da
                  Vercel
                </>
              )}
            </p>
            <button
              onClick={onGerarViaAPI}
              disabled={!tema.trim() || gerandoViaAPI}
              className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-bold bg-[#FFC528] text-black hover:bg-[#ffd55a] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {gerandoViaAPI ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  Gerar {numSlides} slides
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {modoAvancado && (
        <>
          {temPrompt && (
            <div className="space-y-3 pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#FFC528] text-black text-xs font-black flex items-center justify-center">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Copie o prompt e cole em uma IA grátis
                  </h4>
                </div>

                <button
                  onClick={onCopiarPrompt}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    promptCopiado
                      ? "bg-emerald-500 text-black"
                      : "bg-[#FFC528] text-black hover:bg-[#ffd55a]"
                  }`}
                >
                  {promptCopiado ? (
                    <>
                      <CheckCircle2 size={12} />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <ClipboardCopy size={12} />
                      Copiar prompt
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  value={prompt}
                  rows={6}
                  className="w-full bg-[#0a0a0a] border border-gray-800 rounded-md px-3 py-2 text-[11px] text-gray-400 font-mono resize-none focus:outline-none focus:border-[#FFC528]"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <p className="text-[10px] text-gray-600 mt-2">
                  {prompt.length} caracteres · vai gerar {numSlides} slides
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <LinkIA
                  href="https://claude.ai/new"
                  nome="Claude"
                  desc="Melhor qualidade editorial"
                />
                <LinkIA
                  href="https://chatgpt.com/"
                  nome="ChatGPT"
                  desc="Mais disponibilidade"
                />
                <LinkIA href="https://gemini.google.com/app" nome="Gemini" desc="Google, grátis" />
              </div>
            </div>
          )}

          {temPrompt && (
            <div className="space-y-3 pt-4 border-t border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#FFC528] text-black text-xs font-black flex items-center justify-center">
                  3
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Cole a resposta da IA aqui
                </h4>
              </div>

              <textarea
                value={resposta}
                onChange={(e) => onRespostaChange(e.target.value)}
                placeholder='A IA vai responder com um array JSON começando com [ e terminando com ]. Cole a resposta inteira aqui — o app cuida do resto.'
                rows={6}
                className="w-full bg-[#0f0f0f] border border-gray-800 rounded-md px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#FFC528] resize-none font-mono"
              />

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-[10px] text-gray-600 flex-1 min-w-0">
                  Aceita resposta com ou sem cercas ```json — o parser é tolerante.
                </p>
                <button
                  onClick={onFormatar}
                  disabled={!temResposta}
                  className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-bold bg-[#FFC528] text-black hover:bg-[#ffd55a] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Wand2 size={16} />
                  Formatar {numSlides} slides
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-[10px] text-gray-600 pt-2 border-t border-gray-800">
        💡 Dica: a resposta da IA substitui os textos atuais de todos os slides, mas
        preserva as fotos já escolhidas. Você pode editar tudo manualmente depois.
      </p>
    </div>
  );
}

function LinkIA({ href, nome, desc }: { href: string; nome: string; desc: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#0f0f0f] border border-gray-800 hover:border-[#FFC528] hover:bg-[#1a1a1a] transition-all group"
    >
      <ExternalLink size={12} className="text-gray-500 group-hover:text-[#FFC528]" />
      <div>
        <div className="text-xs font-bold text-white">{nome}</div>
        <div className="text-[10px] text-gray-500">{desc}</div>
      </div>
    </a>
  );
}
