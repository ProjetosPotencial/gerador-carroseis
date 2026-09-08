import { useState, useRef, useMemo } from "react";
import LinkedInCover from "./LinkedInCover";
import * as LucideIcons from "lucide-react";
import UnsplashSearch from "./UnsplashSearch";
import { gerarCapaBlob } from "../lib/gerarCapa";
import { useLocalStorage } from "../lib/useLocalStorage";
import SelectIconeComPreview, { iconesDisponiveis } from "./SelectIconeComPreview";
import MiniPreviewBloco from "./MiniPreviewBloco";
import JSZip from "jszip";

function IconeCustomizado({ IconeComponente }: { IconeComponente: any }) {
  return (
    <div
      className="absolute flex items-center justify-center"
      style={{ left: "79.5px", top: "303.5px", width: "80px", height: "80px" }}
    >
      <IconeComponente size={48} strokeWidth={1.5} color="#371B01" />
    </div>
  );
}

interface CapaConfig {
  numero: string;
  titulo: string;
  legendaLinha1: string;
  legendaLinha2: string;
  fotoUrl: string;
  icone: string;
  usarLegenda1: boolean;
  usarSubtitulo: boolean;
}

/** Configuração por bloco (cada grupo de N capas) */
interface BlocoConfig {
  icone: string;
  imagem: string;
  legendaLinha1: string;
  legendaLinha2: string;
  usarLegenda1: boolean;
  usarLegenda2: boolean;
}

type ProgressoLote =
  | { tipo: "idle" }
  | { tipo: "gerando"; atual: number; total: number; sucessos: number; erros: number }
  | { tipo: "concluido"; sucessos: number; erros: number };

const LEGENDA_PADRAO_L1 = "Tecnologia que destrava";
const LEGENDA_PADRAO_L2 = "o seu dia a dia financeiro.";
const FOTO_PADRAO = "/assets/94f0de88dd7da2aa7b58f6680bcc081b5b16c90f.png";
const ICONES_PADRAO = [
  "CreditCard",
  "Wallet",
  "TrendingUp",
  "DollarSign",
  "Sparkles",
  "Target",
];

function criarBlocoPadrao(index: number): BlocoConfig {
  return {
    icone: ICONES_PADRAO[index % ICONES_PADRAO.length],
    imagem: index === 0 ? FOTO_PADRAO : "",
    legendaLinha1: LEGENDA_PADRAO_L1,
    legendaLinha2: LEGENDA_PADRAO_L2,
    usarLegenda1: true,
    usarLegenda2: true,
  };
}

// Auto-save (v7.7.15)
const KEY_LOTE = (campo: string) => `parceleaqui:lote:${campo}:v1`;

export default function GeradorLote() {
  const [numeroInicial, setNumeroInicial] = useLocalStorage(KEY_LOTE("numeroInicial"), "1");
  const [titulos, setTitulos] = useLocalStorage(KEY_LOTE("titulos"), "");
  const [quantidadePorVez, setQuantidadePorVez] = useLocalStorage(KEY_LOTE("qtdPorVez"), 10);
  // v7.7.5: textura overlay aplicada em todas as capas geradas em lote
  const [mostrarTextura, setMostrarTextura] = useLocalStorage(KEY_LOTE("mostrarTextura"), false);
  const [opacidadeTextura, setOpacidadeTextura] = useLocalStorage(KEY_LOTE("opacidadeTextura"), 0.75);
  const capaRef = useRef<HTMLDivElement>(null);

  /** Array de blocos (1 config por grupo de N capas) */
  const [blocos, setBlocos] = useLocalStorage<BlocoConfig[]>(
    KEY_LOTE("blocos"),
    Array.from({ length: 6 }, (_, i) => criarBlocoPadrao(i))
  );

  const [capasGeradas, setCapasGeradas] = useState<CapaConfig[]>([]);
  const [visualizandoIndice, setVisualizandoIndice] = useState<number | null>(null);
  const [progresso, setProgresso] = useState<ProgressoLote>({ tipo: "idle" });

  const quantidadeTitulos = useMemo(
    () => titulos.split("\n").filter((t) => t.trim() !== "").length,
    [titulos]
  );

  /** Quantos blocos distintos serão usados baseado no número de títulos */
  const quantidadeBlocosNecessarios = useMemo(
    () => Math.max(1, Math.ceil(quantidadeTitulos / quantidadePorVez)),
    [quantidadeTitulos, quantidadePorVez]
  );

  /** Atualiza um campo específico de um bloco */
  const atualizarBloco = (index: number, patch: Partial<BlocoConfig>) => {
    setBlocos((prev) =>
      prev.map((b, i) => (i === index ? { ...b, ...patch } : b))
    );
  };

  const gerarCapas = () => {
    const linhasTitulos = titulos.split("\n").filter((t) => t.trim() !== "");
    const numeroInicialInt = parseInt(numeroInicial) || 1;

    const capas: CapaConfig[] = linhasTitulos.map((titulo, index) => {
      const grupoIndex = Math.floor(index / quantidadePorVez);
      const bloco = blocos[grupoIndex] || blocos[0];
      return {
        numero: (numeroInicialInt + index).toString(),
        titulo: titulo.trim(),
        legendaLinha1: bloco.legendaLinha1,
        legendaLinha2: bloco.legendaLinha2,
        fotoUrl: bloco.imagem || FOTO_PADRAO,
        icone: bloco.icone,
        usarLegenda1: bloco.usarLegenda1,
        usarSubtitulo: bloco.usarLegenda2,
      };
    });

    setCapasGeradas(capas);
    setVisualizandoIndice(capas.length > 0 ? 0 : null);
    setProgresso({ tipo: "idle" });
  };

  const limparCapas = () => {
    setCapasGeradas([]);
    setVisualizandoIndice(null);
    setProgresso({ tipo: "idle" });
  };

  const selecionarImagemUnsplash = (url: string, grupoIndex: number) => {
    atualizarBloco(grupoIndex, { imagem: url });
  };

  const gerarImagens = async () => {
    if (capasGeradas.length === 0 || !capaRef.current) return;

    const total = capasGeradas.length;
    let sucessos = 0;
    let erros = 0;
    const zip = new JSZip();
    const pastaCapas = zip.folder(`parcele-news-capas`);

    setProgresso({ tipo: "gerando", atual: 0, total, sucessos: 0, erros: 0 });

    for (let i = 0; i < total; i++) {
      setVisualizandoIndice(i);
      // aguarda render após mudança de índice
      await new Promise((resolve) => setTimeout(resolve, 350));

      if (!capaRef.current) break;

      const slug = capasGeradas[i].titulo
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);

      const numeroPadded = capasGeradas[i].numero.padStart(2, "0");
      const nomeArquivo = `parcele-news-${numeroPadded}-${slug || "capa"}.png`;

      try {
        const blob = await gerarCapaBlob(capaRef.current);
        pastaCapas?.file(nomeArquivo, blob);
        sucessos++;
      } catch (err) {
        console.error(`[lote] Erro na capa ${i + 1}:`, err);
        erros++;
      }

      setProgresso({ tipo: "gerando", atual: i + 1, total, sucessos, erros });
      // pequeno delay pra não travar a UI
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    // Gera o arquivo ZIP e dispara download
    if (sucessos > 0) {
      try {
        const zipBlob = await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        });

        const dataStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const link = document.createElement("a");
        link.href = URL.createObjectURL(zipBlob);
        link.download = `parcele-news-capas-${dataStr}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // libera memória
        setTimeout(() => URL.revokeObjectURL(link.href), 2000);
      } catch (err) {
        console.error("[lote] Erro ao gerar ZIP:", err);
        erros = sucessos; // reporta todos como erro se ZIP falhar
        sucessos = 0;
      }
    }

    setProgresso({ tipo: "concluido", sucessos, erros });
  };

  const capaAtual = visualizandoIndice !== null ? capasGeradas[visualizandoIndice] : null;
  const IconeComponente = capaAtual
    ? iconesDisponiveis[capaAtual.icone as keyof typeof iconesDisponiveis]
    : null;

  return (
    <div className="w-full min-h-screen bg-[#0f0f0f]">
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-6">
        {/* Preview */}
        {capasGeradas.length > 0 && capaAtual && IconeComponente && (
          <section className="bg-[#141414] rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white font-['Archivo',sans-serif]">
                  Preview — Capa {visualizandoIndice! + 1} de {capasGeradas.length}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  #{capaAtual.numero} · {capaAtual.titulo.slice(0, 60)}
                  {capaAtual.titulo.length > 60 ? "…" : ""}
                </p>
                <p className="text-xs text-gray-600 font-mono mt-0.5">Saída: 1280 × 720 px</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setVisualizandoIndice(Math.max(0, visualizandoIndice! - 1))}
                  disabled={visualizandoIndice === 0}
                  className="btn-secondary"
                  aria-label="Capa anterior"
                >
                  <LucideIcons.ChevronLeft size={18} />
                </button>
                <button
                  onClick={() =>
                    setVisualizandoIndice(Math.min(capasGeradas.length - 1, visualizandoIndice! + 1))
                  }
                  disabled={visualizandoIndice === capasGeradas.length - 1}
                  className="btn-secondary"
                  aria-label="Próxima capa"
                >
                  <LucideIcons.ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="flex justify-center overflow-hidden">
              <div
                style={{
                  transform: "scale(0.5)",
                  transformOrigin: "top center",
                  width: "1280px",
                  height: "360px",
                }}
              >
                <div ref={capaRef}>
                  <LinkedInCover
                    numero={capaAtual.numero}
                    titulo={capaAtual.titulo}
                    legendaLinha1={capaAtual.legendaLinha1}
                    legendaLinha2={capaAtual.legendaLinha2}
                    fotoUrl={capaAtual.fotoUrl}
                    usarLegenda1={capaAtual.usarLegenda1}
                    usarSubtitulo={capaAtual.usarSubtitulo}
                    mostrarTextura={mostrarTextura}
                    opacidadeTextura={opacidadeTextura}
                    IconeCustomizado={() => <IconeCustomizado IconeComponente={IconeComponente} />}
                  />
                </div>
              </div>
            </div>

            {/* Grid de miniaturas */}
            <div className="pt-6 mt-6 border-t border-gray-800">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Todas as capas
              </h4>
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-[320px] overflow-y-auto pr-2">
                {capasGeradas.map((capa, idx) => (
                  <button
                    key={idx}
                    onClick={() => setVisualizandoIndice(idx)}
                    className={`p-3 rounded-lg text-left transition-all border ${
                      visualizandoIndice === idx
                        ? "border-[#FFC528] bg-[#FFC528]/10"
                        : "border-gray-800 hover:border-gray-600 bg-[#1a1a1a]"
                    }`}
                  >
                    <div className="text-sm font-bold text-white">#{capa.numero}</div>
                    <div className="text-xs text-gray-400 line-clamp-2 mt-0.5">{capa.titulo}</div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Configuração */}
        <section className="bg-[#141414] rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#FFC528] flex items-center justify-center">
              <LucideIcons.Layers size={16} className="text-black" />
            </div>
            <h2 className="text-xl font-semibold text-white font-['Archivo',sans-serif]">
              Gerador em Lote
            </h2>
            <span className="text-[10px] uppercase tracking-wider ml-2" style={{ color: "#10b981" }}>
              ● Auto-save ativo
            </span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Coluna esquerda */}
            <div className="space-y-5">
              <FieldWrapper label="Número inicial" htmlFor="num-inicial" hint="O primeiro número é incrementado automaticamente">
                <input
                  id="num-inicial"
                  type="text"
                  value={numeroInicial}
                  onChange={(e) => setNumeroInicial(e.target.value.replace(/[^\d]/g, ""))}
                  className="input-base w-32"
                  placeholder="1"
                />
              </FieldWrapper>

              <FieldWrapper
                label="Títulos (um por linha)"
                htmlFor="titulos"
                hint={
                  <span className={quantidadeTitulos > 0 ? "text-[#FFC528]" : "text-gray-500"}>
                    {quantidadeTitulos} capa(s) detectada(s)
                  </span>
                }
              >
                <textarea
                  id="titulos"
                  value={titulos}
                  onChange={(e) => setTitulos(e.target.value)}
                  rows={10}
                  className="input-base resize-y font-mono text-sm"
                  placeholder={
                    "Cole aqui os títulos, um por linha:\nPix domina, boleto parcelado cresce e cartão entra em crise\nEmbedded finance cresce 300% com pagamentos nativos\n..."
                  }
                />
              </FieldWrapper>

              <div className="bg-[#0f0f0f] rounded-lg p-4 border border-gray-800 space-y-2">
                <div className="flex items-start gap-2 text-xs text-gray-400">
                  <LucideIcons.Info size={14} className="flex-shrink-0 mt-0.5 text-[#FFC528]" />
                  <p>
                    Configure <strong className="text-gray-300">imagem, ícone e legendas</strong> de cada bloco separadamente
                    no painel à direita. Cada bloco pode ter textos e visuais diferentes.
                  </p>
                </div>
              </div>
            </div>

            {/* Coluna direita */}
            <div className="space-y-5">
              <FieldWrapper
                label="Tamanho de cada grupo"
                htmlFor="qtd-grupo"
                hint="A imagem, ícone e legendas mudam a cada N capas"
              >
                <select
                  id="qtd-grupo"
                  value={quantidadePorVez}
                  onChange={(e) => setQuantidadePorVez(Number(e.target.value))}
                  className="input-base"
                >
                  <option value={10}>10 capas por grupo</option>
                  <option value={20}>20 capas por grupo</option>
                  <option value={30}>30 capas por grupo</option>
                  <option value={40}>40 capas por grupo</option>
                  <option value={50}>50 capas por grupo</option>
                  <option value={60}>60 capas por grupo</option>
                </select>
              </FieldWrapper>

              {/* v7.7.5: Textura granulada global - aplicada em todas as capas do lote */}
              <div className="bg-[#0f0f0f] rounded-lg p-4 border border-gray-800 space-y-3">
                <ToggleField
                  id="lote-textura"
                  label="Textura granulada (overlay)"
                  checked={mostrarTextura}
                  onChange={setMostrarTextura}
                >
                  <div className="space-y-1">
                    <label
                      htmlFor="lote-opacidade"
                      className="text-xs text-gray-500"
                    >
                      Opacidade: {Math.round(opacidadeTextura * 100)}%
                    </label>
                    <input
                      id="lote-opacidade"
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={opacidadeTextura}
                      onChange={(e) => setOpacidadeTextura(parseFloat(e.target.value))}
                      disabled={!mostrarTextura}
                      className="w-full accent-[#FFC528]"
                    />
                  </div>
                </ToggleField>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Aplica a mesma textura overlay (igual Feed/Stories) em <strong className="text-gray-400">todas as capas</strong> geradas no lote.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-300">
                    Configuração por bloco
                  </h3>
                  <span className="text-xs text-gray-500">
                    {quantidadeBlocosNecessarios} de {blocos.length} em uso
                  </span>
                </div>

                {blocos.map((bloco, idx) => {
                  const capaInicio = idx * quantidadePorVez + 1;
                  const capaFim = (idx + 1) * quantidadePorVez;
                  const emUso = idx < quantidadeBlocosNecessarios;
                  return (
                    <details
                      key={idx}
                      className={`rounded-lg border overflow-hidden transition-opacity ${
                        emUso
                          ? "bg-[#0f0f0f] border-gray-800"
                          : "bg-[#0a0a0a] border-gray-900 opacity-60"
                      }`}
                      open={idx === 0}
                    >
                      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-300 hover:bg-[#141414] flex items-center justify-between select-none">
                        <span className="flex items-center gap-3">
                          {/* Thumbnail da imagem + ícone */}
                          <span className="flex items-center gap-1.5 flex-shrink-0">
                            {bloco.imagem ? (
                              <img
                                src={bloco.imagem}
                                alt=""
                                className="w-8 h-8 rounded object-cover border border-gray-700"
                                loading="lazy"
                                crossOrigin={bloco.imagem.startsWith("data:") ? undefined : "anonymous"}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-[#1a1a1a] border border-gray-700 flex items-center justify-center">
                                <LucideIcons.ImageOff size={12} className="text-gray-600" />
                              </div>
                            )}
                            {(() => {
                              const Ic = iconesDisponiveis[bloco.icone as keyof typeof iconesDisponiveis];
                              return Ic ? (
                                <div className="w-8 h-8 rounded bg-[#ffe8a4] flex items-center justify-center">
                                  <Ic size={16} strokeWidth={1.6} color="#371B01" />
                                </div>
                              ) : null;
                            })()}
                          </span>
                          <span className="flex flex-col items-start">
                            <span className="font-bold">Bloco {idx + 1}</span>
                            <span className="text-gray-500 text-xs">
                              Capas {capaInicio}–{capaFim}
                              {!emUso && " · não usado"}
                            </span>
                          </span>
                        </span>
                        <LucideIcons.ChevronDown size={16} />
                      </summary>

                      <div className="p-4 space-y-4 border-t border-gray-800">
                        {/* Ícone */}
                        <FieldWrapper label="Ícone" htmlFor={`icone-${idx}`}>
                          <SelectIconeComPreview
                            id={`icone-${idx}`}
                            valor={bloco.icone}
                            onChange={(novo) => atualizarBloco(idx, { icone: novo })}
                            tamanhoPreview="pequeno"
                          />
                        </FieldWrapper>

                        {/* Imagem */}
                        <FieldWrapper label="URL da imagem" htmlFor={`img-${idx}`}>
                          <input
                            id={`img-${idx}`}
                            type="text"
                            value={bloco.imagem}
                            onChange={(e) =>
                              atualizarBloco(idx, { imagem: e.target.value })
                            }
                            className="input-base"
                            placeholder="https://..."
                          />
                        </FieldWrapper>

                        <UnsplashSearch
                          onSelectImage={selecionarImagemUnsplash}
                          grupoIndex={idx}
                          valorAtual={bloco.imagem}
                        />

                        {/* Mini preview da capa do bloco */}
                        <div className="pt-3 border-t border-gray-800 space-y-2">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                            <LucideIcons.Eye size={12} />
                            Prévia do bloco
                          </h4>
                          <div className="flex justify-center">
                            <MiniPreviewBloco
                              numero={String((idx * quantidadePorVez) + (parseInt(numeroInicial) || 1))}
                              titulo={
                                titulos.split("\n").filter((t) => t.trim() !== "")[idx * quantidadePorVez] ||
                                "Título de exemplo do bloco"
                              }
                              icone={bloco.icone}
                              imagem={bloco.imagem || FOTO_PADRAO}
                              legendaLinha1={bloco.legendaLinha1}
                              legendaLinha2={bloco.legendaLinha2}
                              usarLegenda1={bloco.usarLegenda1}
                              usarLegenda2={bloco.usarLegenda2}
                              largura={360}
                            />
                          </div>
                          <p className="text-[10px] text-gray-600 text-center">
                            Primeira capa do bloco · {quantidadePorVez > 1 ? `${quantidadePorVez} capas compartilham esse visual` : "1 capa neste bloco"}
                          </p>
                        </div>

                        {/* Legendas do bloco */}
                        <div className="pt-3 border-t border-gray-800 space-y-3">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Legendas do bloco {idx + 1}
                          </h4>

                          <ToggleField
                            id={`leg1-${idx}`}
                            label="Linha 1 (regular)"
                            checked={bloco.usarLegenda1}
                            onChange={(v) =>
                              atualizarBloco(idx, { usarLegenda1: v })
                            }
                          >
                            <input
                              type="text"
                              value={bloco.legendaLinha1}
                              onChange={(e) =>
                                atualizarBloco(idx, {
                                  legendaLinha1: e.target.value,
                                })
                              }
                              disabled={!bloco.usarLegenda1}
                              className="input-base"
                              placeholder="Tecnologia que destrava"
                            />
                          </ToggleField>

                          <ToggleField
                            id={`leg2-${idx}`}
                            label="Linha 2 (negrito)"
                            checked={bloco.usarLegenda2}
                            onChange={(v) =>
                              atualizarBloco(idx, { usarLegenda2: v })
                            }
                          >
                            <input
                              type="text"
                              value={bloco.legendaLinha2}
                              onChange={(e) =>
                                atualizarBloco(idx, {
                                  legendaLinha2: e.target.value,
                                })
                              }
                              disabled={!bloco.usarLegenda2}
                              className="input-base"
                              placeholder="o seu dia a dia financeiro."
                            />
                          </ToggleField>
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <ProgressBar progresso={progresso} />

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={gerarCapas}
                disabled={quantidadeTitulos === 0}
                className="px-6 py-3 bg-[#FFC528] text-black rounded-lg hover:bg-[#FFD04F] active:bg-[#E8B320] transition-colors font-bold shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LucideIcons.Wand2 size={18} />
                Gerar {quantidadeTitulos || ""} capa{quantidadeTitulos !== 1 ? "s" : ""}
              </button>

              {capasGeradas.length > 0 && (
                <>
                  <button
                    onClick={gerarImagens}
                    disabled={progresso.tipo === "gerando"}
                    className="px-6 py-3 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400 transition-colors font-bold shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {progresso.tipo === "gerando" ? (
                      <>
                        <Spinner /> Processando...
                      </>
                    ) : (
                      <>
                        <LucideIcons.FileArchive size={18} />
                        Baixar ZIP ({capasGeradas.length} capas)
                      </>
                    )}
                  </button>
                  <button
                    onClick={limparCapas}
                    disabled={progresso.tipo === "gerando"}
                    className="btn-secondary disabled:opacity-50"
                  >
                    <LucideIcons.Trash2 size={16} />
                    Limpar
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      <GlobalStyles />
    </div>
  );
}

/* ============ Componentes auxiliares ============ */

function FieldWrapper({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      {children}
      {hint && <div className="text-xs">{hint}</div>}
    </div>
  );
}

function ToggleField({
  id,
  label,
  checked,
  onChange,
  children,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 accent-[#FFC528] rounded"
        />
        <span className="text-sm text-gray-300">{label}</span>
      </label>
      {children}
    </div>
  );
}

function ProgressBar({ progresso }: { progresso: ProgressoLote }) {
  if (progresso.tipo === "idle") return null;

  if (progresso.tipo === "gerando") {
    const pct = Math.round((progresso.atual / progresso.total) * 100);
    const finalizandoZip = progresso.atual === progresso.total;
    return (
      <div className="mb-4 p-4 bg-[#0f0f0f] rounded-lg border border-[#FFC528]/30">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-white font-medium">
            {finalizandoZip
              ? "Compactando ZIP..."
              : `Gerando imagens: ${progresso.atual} / ${progresso.total}`}
          </span>
          <span className="text-[#FFC528] font-mono">{pct}%</span>
        </div>
        <div className="h-2 bg-[#1f1f1f] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FFC528] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex gap-4 mt-2 text-xs text-gray-400">
          <span className="text-emerald-400">✓ {progresso.sucessos} processada(s)</span>
          {progresso.erros > 0 && <span className="text-red-400">✗ {progresso.erros} erro(s)</span>}
        </div>
      </div>
    );
  }

  // concluido
  const temErro = progresso.erros > 0;
  return (
    <div
      className={`mb-4 p-4 rounded-lg border ${
        temErro ? "bg-amber-500/10 border-amber-500/30" : "bg-emerald-500/10 border-emerald-500/30"
      }`}
    >
      <div className="flex items-center gap-2">
        {temErro ? (
          <LucideIcons.AlertTriangle size={18} className="text-amber-400" />
        ) : (
          <LucideIcons.CheckCircle2 size={18} className="text-emerald-400" />
        )}
        <span className="text-sm text-white font-medium">
          {progresso.sucessos > 0
            ? `ZIP baixado com ${progresso.sucessos} capa(s)`
            : "Falha ao gerar capas"}
          {temErro && progresso.sucessos > 0 && `, ${progresso.erros} com erro`}
        </span>
      </div>
    </div>
  );
}

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      className="animate-spin"
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      .input-base {
        width: 100%;
        padding: 10px 12px;
        background: #1f1f1f;
        border: 1px solid #333;
        color: white;
        border-radius: 8px;
        font-size: 14px;
        transition: border-color 0.15s, background 0.15s;
      }
      .input-base:focus {
        outline: none;
        border-color: #FFC528;
        background: #242424;
      }
      .input-base:disabled {
        background: #141414;
        color: #555;
        cursor: not-allowed;
      }
      .btn-secondary {
        padding: 10px 14px;
        background: #1f1f1f;
        border: 1px solid #333;
        color: #e5e5e5;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.15s;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
      }
      .btn-secondary:hover:not(:disabled) {
        background: #2a2a2a;
        border-color: #444;
      }
      .btn-secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `}</style>
  );
}
