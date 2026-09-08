import React from "react";
import { 
  Palette, 
  Layout, 
  Type, 
  Image as ImageIcon, 
  RotateCcw, 
  ChevronDown 
} from "lucide-react";
import { SlideData, TemaId } from "./CarrosselSlide";
import { TEMAS_DISPONIVEIS, obterTema } from "./temas";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "./ui/accordion";
import { 
  FieldWrapper, 
  TextInput, 
  Textarea, 
  ToggleField, 
  Select 
} from "./ui/SharedInputs";
import UnsplashSearch from "./UnsplashSearch";

interface EditPanelProps {
  slide: SlideData;
  onChange: (patch: Partial<SlideData>) => void;
  temaId: TemaId;
  onTrocarTema: (id: TemaId) => void;
  temaAtivo: ReturnType<typeof obterTema>;
}

export default function EditPanel({
  slide,
  onChange,
  temaId,
  onTrocarTema,
  temaAtivo,
}: EditPanelProps) {
  const layoutAtual = temaAtivo.layouts.find((l) => l.id === slide.layout) || temaAtivo.layouts[0];
  const usaFoto = layoutAtual.usaFoto;
  const usaDuasFotos = Boolean(layoutAtual.usaDuasFotos);
  const coresFundoPermitidas = layoutAtual.coresFundoPermitidas || ["preto", "amarelo", "bege", "branco"];
  const cores = temaAtivo.cores;

  return (
    <div className="flex flex-col h-full bg-[var(--v6-bg-surface)] border-l border-[var(--v6-border)] w-80 overflow-y-auto">
      <div className="p-4 border-b border-[var(--v6-border)]">
        <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Palette size={16} className="text-[#FFC528]" />
          Editor do Slide
        </h2>
      </div>

      <Accordion type="multiple" defaultValue={["visual"]} className="flex-1">
        {/* ============================================================
            SEÇÃO: VISUAL (Tema & Layout)
           ============================================================ */}
        <AccordionItem value="visual">
          <AccordionTrigger className="px-4">Visual & Estrutura</AccordionTrigger>
          <AccordionContent className="px-4 space-y-6">
            {/* Temas */}
            <FieldWrapper label="Tema Visual" htmlFor="tema-select">
              <div className="grid grid-cols-1 gap-2">
                {TEMAS_DISPONIVEIS.map((t) => {
                  const ativo = temaId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onTrocarTema(t.id)}
                      className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                        ativo
                          ? "bg-[#FFC528] text-black border-[#FFC528]"
                          : "bg-[var(--v6-bg-sunken)] border-[var(--v6-border)] text-[var(--v6-text-secondary)] hover:border-[#FFC528]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wide">{t.nome}</span>
                        <div className="flex gap-1">
                          <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ background: t.cores.preto }} />
                          <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ background: t.cores.amarelo }} />
                        </div>
                      </div>
                      <div className={`text-[10px] mt-1 leading-tight ${ativo ? "text-black/70" : "text-[var(--v6-text-muted)]"}`}>
                        {t.descricao}
                      </div>
                    </button>
                  );
                })}
              </div>
            </FieldWrapper>

            {/* Layouts */}
            <FieldWrapper label="Layout do Slide" htmlFor="layout-select">
              <div className="grid grid-cols-1 gap-2">
                {temaAtivo.layouts.map((l) => {
                  const ativo = slide.layout === l.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => onChange({ layout: l.id })}
                      className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                        ativo
                          ? "bg-[#FFC528] text-black border-[#FFC528]"
                          : "bg-[var(--v6-bg-sunken)] border-[var(--v6-border)] text-[var(--v6-text-secondary)] hover:border-[#FFC528]"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wide">{l.nome}</span>
                      <div className={`text-[10px] mt-1 leading-tight ${ativo ? "text-black/70" : "text-[var(--v6-text-muted)]"}`}>
                        {l.descricao}
                      </div>
                    </button>
                  );
                })}
              </div>
            </FieldWrapper>

            {/* Cores de Fundo */}
            {coresFundoPermitidas.length > 1 && (
              <FieldWrapper label="Cor de Fundo" htmlFor="bg-select">
                <div className="grid grid-cols-4 gap-2">
                  {(["preto", "amarelo", "bege", "branco"] as const)
                    .filter((c) => coresFundoPermitidas.includes(c))
                    .map((c) => {
                      const ativo = slide.corFundo === c;
                      const bg =
                        c === "preto" ? "#0a0a0a"
                        : c === "amarelo" ? "#FFC528"
                        : c === "bege" ? "#F4F1EA"
                        : "#ffffff";
                      return (
                        <button
                          key={c}
                          onClick={() => onChange({ corFundo: c })}
                          className={`h-9 rounded-lg border-2 transition-all ${
                            ativo ? "border-[#FFC528] ring-2 ring-[#FFC528]/20" : "border-[var(--v6-border)] hover:border-[var(--v6-text-muted)]"
                          }`}
                          style={{ background: bg }}
                          title={c}
                        />
                      );
                    })}
                </div>
              </FieldWrapper>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* ============================================================
            SEÇÃO: TEXTOS
           ============================================================ */}
        <AccordionItem value="textos">
          <AccordionTrigger className="px-4">Conteúdo Escrito</AccordionTrigger>
          <AccordionContent className="px-4 space-y-5">
            <FieldWrapper label="Kicker (Antetítulo)" htmlFor="slide-kicker">
              <TextInput 
                id="slide-kicker"
                value={slide.kicker || ""} 
                onChange={(v) => onChange({ kicker: v })} 
                placeholder="Ex: INSIGHT #1"
                maxLength={80}
              />
            </FieldWrapper>

            <FieldWrapper label="Headline (Título Principal)" htmlFor="slide-headline">
              <Textarea 
                id="slide-headline"
                value={slide.headline || ""} 
                onChange={(v) => onChange({ headline: v })} 
                placeholder="O título que chama atenção..."
                rows={3}
                maxLength={200}
              />
            </FieldWrapper>

            <FieldWrapper label="Big Number (Opcional)" htmlFor="slide-number">
              <TextInput 
                id="slide-number"
                value={slide.numero || ""} 
                onChange={(v) => onChange({ numero: v })} 
                placeholder="Ex: +45%"
                maxLength={12}
              />
            </FieldWrapper>

            <FieldWrapper label="Corpo do Texto" htmlFor="slide-corpo">
              <Textarea 
                id="slide-corpo"
                value={slide.corpo || ""} 
                onChange={(v) => onChange({ corpo: v })} 
                placeholder="Desenvolva sua ideia aqui..."
                rows={4}
                maxLength={500}
              />
            </FieldWrapper>

            <FieldWrapper label="Destaque" htmlFor="slide-destaque">
              <TextInput 
                id="slide-destaque"
                value={slide.destaque || ""} 
                onChange={(v) => onChange({ destaque: v })} 
                placeholder="Frase de impacto final..."
                maxLength={180}
              />
            </FieldWrapper>
          </AccordionContent>
        </AccordionItem>

        {/* ============================================================
            SEÇÃO: MÍDIA (Fotos)
           ============================================================ */}
        {usaFoto && (
          <AccordionItem value="midia">
            <AccordionTrigger className="px-4">Imagens & Fotos</AccordionTrigger>
            <AccordionContent className="px-4 space-y-5">
              <div className="space-y-3">
                <FieldWrapper label={usaDuasFotos ? "Foto Principal (Topo)" : "Imagem do Slide"} htmlFor="unsplash-1">
                  <UnsplashSearch
                    grupoIndex={0}
                    valorAtual={slide.fotoUrl}
                    onSelectImage={(url) => onChange({ fotoUrl: url })}
                  />
                </FieldWrapper>

                {usaDuasFotos && (
                  <FieldWrapper label="Foto Secundária (Base)" htmlFor="unsplash-2">
                    <UnsplashSearch
                      grupoIndex={1}
                      valorAtual={slide.fotoUrl2}
                      onSelectImage={(url) => onChange({ fotoUrl2: url })}
                    />
                  </FieldWrapper>
                )}

                {usaDuasFotos && (
                  <FieldWrapper label="Legenda das Fotos" htmlFor="slide-legenda">
                    <TextInput 
                      id="slide-legenda"
                      value={slide.legendaFoto || ""} 
                      onChange={(v) => onChange({ legendaFoto: v })} 
                      placeholder="Descrição breve..."
                      maxLength={120}
                    />
                  </FieldWrapper>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* ============================================================
            SEÇÃO: CALL TO ACTION (CTA)
           ============================================================ */}
        <AccordionItem value="cta">
          <AccordionTrigger className="px-4">Call to Action (Pill)</AccordionTrigger>
          <AccordionContent className="px-4">
            <ToggleField 
              id="show-pill"
              label="Exibir botão/pílula de CTA"
              checked={slide.mostrarPill || false}
              onChange={(v) => onChange({ mostrarPill: v })}
            >
              <div className="pt-2">
                <TextInput 
                  id="pill-text"
                  value={slide.textoPill || ""} 
                  onChange={(v) => onChange({ textoPill: v })} 
                  placeholder="Ex: SAIBA MAIS"
                  maxLength={40}
                  disabled={!slide.mostrarPill}
                />
              </div>
            </ToggleField>
          </AccordionContent>
        </AccordionItem>

        {/* ============================================================
            SEÇÃO: AVANÇADO (Cores & Tipografia)
           ============================================================ */}
        <AccordionItem value="avancado">
          <AccordionTrigger className="px-4">Cores & Tipografia</AccordionTrigger>
          <AccordionContent className="px-4 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--v6-text-muted)]">Cores Custom</span>
                <button
                  onClick={() => onChange({ corKicker: undefined, corHeadline: undefined, corDestaque: undefined })}
                  className="text-[10px] text-[#FFC528] hover:underline flex items-center gap-1"
                >
                  <RotateCcw size={10} />
                  Resetar para o tema
                </button>
              </div>

              <div className="space-y-3">
                <ColorFieldCompact 
                  label="Kicker" 
                  valor={slide.corKicker} 
                  fallback={cores.amarelo} 
                  onChange={(v) => onChange({ corKicker: v })} 
                />
                <ColorFieldCompact 
                  label="Headline" 
                  valor={slide.corHeadline} 
                  fallback={cores.amarelo} 
                  onChange={(v) => onChange({ corHeadline: v })} 
                />
                <ColorFieldCompact 
                  label="Destaque" 
                  valor={slide.corDestaque} 
                  fallback={cores.amarelo} 
                  onChange={(v) => onChange({ corDestaque: v })} 
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function ColorFieldCompact({ 
  label, 
  valor, 
  fallback, 
  onChange 
}: { 
  label: string; 
  valor?: string; 
  fallback: string; 
  onChange: (v: string) => void; 
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-[var(--v6-text-secondary)]">{label}</span>
      <div className="flex items-center gap-2">
        <div 
          className="w-5 h-5 rounded-full border border-[var(--v6-border)]" 
          style={{ background: valor || fallback }}
        />
        <input 
          type="color" 
          value={valor || fallback} 
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 opacity-0 absolute cursor-pointer"
        />
        <TextInput 
          value={valor || ""} 
          onChange={onChange} 
          placeholder={fallback}
          className="w-24 h-8 py-1 px-2 text-[10px] font-mono"
        />
      </div>
    </div>
  );
}
