import { useState } from "react";
import {
  Wand2,
  RotateCcw,
  Save,
  Trash2,
  KeyRound,
  ExternalLink,
  X,
  Palette,
} from "lucide-react";
import type { EstiloVisualControls } from "./useImagens";

interface EstiloVisualPanelProps {
  img: EstiloVisualControls;
  onFechar: () => void;
}

export default function EstiloVisualPanel({ img, onFechar }: EstiloVisualPanelProps) {
  const [nomePreset, setNomePreset] = useState("");
  const [mostrarChave, setMostrarChave] = useState(false);

  return (
    <div className="bg-[#141414] border border-gray-800 rounded-xl p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wand2 size={18} className="text-[#FFC528]" />
          <div>
            <h3 className="text-sm font-bold text-white">Estilo visual das imagens</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Aplicado automaticamente a todas as imagens geradas por IA. O IMGPROMPT
              de cada slide descreve só a cena.
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

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          <Palette size={12} />
          Presets de estilo
        </div>
        <div className="flex flex-wrap gap-1.5">
          {img.presets.length === 0 && (
            <span className="text-[11px] text-gray-600 italic">
              Nenhum preset salvo ainda.
            </span>
          )}
          {img.presets.map((p) => (
            <span
              key={p.id}
              className="group inline-flex items-center gap-1.5 bg-[#0f0f0f] border border-gray-800 rounded-full pl-3 pr-1.5 py-1"
            >
              <button
                onClick={() => img.aplicarPreset(p.id)}
                className="text-[11px] text-gray-300 hover:text-[#FFC528] transition-colors"
                title="Aplicar este estilo"
              >
                {p.nome}
              </button>
              <button
                onClick={() => img.removerPreset(p.id)}
                className="text-gray-600 hover:text-red-400 transition-colors"
                title="Remover preset"
              >
                <Trash2 size={11} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={nomePreset}
            onChange={(e) => setNomePreset(e.target.value)}
            placeholder='Nome do preset (ex: "Editorial anos 90")'
            className="flex-1 bg-[#0f0f0f] border border-gray-800 rounded-md px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#FFC528] placeholder:text-gray-600"
          />
          <button
            onClick={() => {
              img.salvarPresetAtual(nomePreset);
              setNomePreset("");
            }}
            disabled={!nomePreset.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold bg-[#1a1a1a] border border-gray-800 text-gray-300 hover:border-[#FFC528] hover:text-white transition-all disabled:opacity-40"
          >
            <Save size={12} />
            Salvar atual
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Estética (estilo visual)
          </label>
          <button
            onClick={img.resetarEstiloPadrao}
            className="text-[10px] text-gray-500 hover:text-[#FFC528] flex items-center gap-1 transition-colors"
            title="Voltar ao padrão do Design System"
          >
            <RotateCcw size={10} />
            Restaurar padrão do DS
          </button>
        </div>
        <textarea
          value={img.estiloVisual}
          onChange={(e) => img.setEstiloVisual(e.target.value)}
          rows={5}
          className="w-full bg-[#0f0f0f] border border-gray-800 rounded-md px-3 py-2 text-xs text-white leading-relaxed focus:outline-none focus:border-[#FFC528] resize-none"
        />
        <p className="text-[10px] text-gray-600">
          Dica do DS: peça a cor da Portra 400 <b>sem grão</b> — o grão entra depois em
          pós (2–4%).
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Negative prompt (o que evitar)
        </label>
        <textarea
          value={img.negativePrompt}
          onChange={(e) => img.setNegativePrompt(e.target.value)}
          rows={3}
          className="w-full bg-[#0f0f0f] border border-gray-800 rounded-md px-3 py-2 text-xs text-white leading-relaxed focus:outline-none focus:border-[#FFC528] resize-none"
        />
      </div>

      <div className="space-y-2 pt-3 border-t border-gray-800">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          <KeyRound size={12} />
          Chave do Gemini
        </div>
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Opcional. Se o projeto já tem <code className="text-gray-400">GEMINI_API_KEY</code>{" "}
          na Vercel, deixe em branco. Sua chave fica só neste navegador e tem prioridade.
        </p>
        <div className="flex items-center gap-2">
          <input
            type={mostrarChave ? "text" : "password"}
            value={img.chaveGemini}
            onChange={(e) => img.setChaveGemini(e.target.value)}
            placeholder="AIza… (deixe vazio p/ usar a do servidor)"
            className="flex-1 bg-[#0f0f0f] border border-gray-800 rounded-md px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#FFC528] font-mono placeholder:text-gray-600"
          />
          <button
            onClick={() => setMostrarChave((v) => !v)}
            className="px-2.5 py-1.5 rounded-md text-[10px] bg-[#1a1a1a] border border-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            {mostrarChave ? "Ocultar" : "Ver"}
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-[#FFC528] hover:underline"
          >
            Gerar chave grátis <ExternalLink size={10} />
          </a>
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] text-gray-500">Modelo:</label>
            <select
              value={img.modelo}
              onChange={(e) => img.setModelo(e.target.value)}
              className="bg-[#0f0f0f] border border-gray-800 rounded px-2 py-1 text-[10px] text-white focus:outline-none focus:border-[#FFC528]"
            >
              <option value="gemini-2.5-flash-image">Flash Image (grátis · Nano Banana)</option>
              <option value="gemini-3-flash-image">Flash Image 3 (Nano Banana 2)</option>
              <option value="gemini-3-pro-image">Pro Image (Nano Banana Pro)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
