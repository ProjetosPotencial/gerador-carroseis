/**
 * SlidePreview — área central de preview com toggle de formato.
 */
import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import CarrosselSlide, { SlideData, TemaId } from "./CarrosselSlide";
import { motion, AnimatePresence } from "motion/react";

export type FormatoPreview = "instagram_feed" | "instagram_stories" | "linkedin" | "quadrado";

interface FormatoDef {
  id: FormatoPreview;
  label: string;
  short: string;
  // Dimensões reais de saída
  w: number;
  h: number;
  // Dimensões de exibição no preview (w, h do container)
  previewW: number;
  previewH: number;
}

const FORMATOS: FormatoDef[] = [
  { id: "instagram_feed",    label: "Instagram Feed",    short: "4:5",  w: 1080, h: 1350, previewW: 432, previewH: 540 },
  { id: "instagram_stories", label: "Stories",           short: "9:16", w: 1080, h: 1920, previewW: 270, previewH: 480 },
  { id: "quadrado",          label: "Quadrado",          short: "1:1",  w: 1080, h: 1080, previewW: 450, previewH: 450 },
  { id: "linkedin",          label: "LinkedIn",          short: "16:9", w: 1280, h: 720,  previewW: 540, previewH: 304 },
];

interface SlidePreviewProps {
  slides: SlideData[];
  indiceAtivo: number;
  marca: string;
  temaId: TemaId;
  onPrev: () => void;
  onNext: () => void;
  onExportarAtual: () => void;
  exporting: boolean;
}

export function SlidePreview({
  slides,
  indiceAtivo,
  marca,
  temaId,
  onPrev,
  onNext,
  onExportarAtual,
  exporting,
}: SlidePreviewProps) {
  const [formato, setFormato] = useState<FormatoPreview>("instagram_feed");
  const slideAtivo = slides[indiceAtivo];
  const fmt = FORMATOS.find((f) => f.id === formato)!;
  const escala = fmt.previewW / fmt.w;

  return (
    <section className="col-span-12 md:col-span-6">
      <div
        className="rounded-xl border border-[var(--v6-border)] p-4 flex flex-col gap-4"
        style={{ backgroundColor: "var(--v6-bg-elevated)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-[var(--v6-text-primary)] uppercase tracking-wider">
              Preview
            </h2>
            <span className="text-xs text-[var(--v6-text-muted)] font-mono">
              {indiceAtivo + 1} / {slides.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Navegação */}
            <button
              onClick={onPrev}
              disabled={indiceAtivo === 0}
              title="Slide anterior (←)"
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                bg-[var(--v6-bg-sunken)] border border-[var(--v6-border)]
                text-[var(--v6-text-secondary)] hover:text-[var(--v6-text-primary)]
                hover:border-[#FFC528] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={onNext}
              disabled={indiceAtivo === slides.length - 1}
              title="Próximo slide (→)"
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                bg-[var(--v6-bg-sunken)] border border-[var(--v6-border)]
                text-[var(--v6-text-secondary)] hover:text-[var(--v6-text-primary)]
                hover:border-[#FFC528] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={15} />
            </button>

            {/* Download slide atual */}
            <button
              onClick={onExportarAtual}
              disabled={exporting}
              title="Baixar slide atual (Ctrl+E)"
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors
                bg-[var(--v6-bg-sunken)] border border-[var(--v6-border)]
                text-[var(--v6-text-secondary)] hover:text-[#FFC528] hover:border-[#FFC528]
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* Toggle de formato */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--v6-bg-sunken)] w-fit">
          {FORMATOS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFormato(f.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                formato === f.id
                  ? "bg-[#FFC528] text-black shadow-sm"
                  : "text-[var(--v6-text-muted)] hover:text-[var(--v6-text-primary)]"
              }`}
            >
              {f.short}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="flex justify-center items-start">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${indiceAtivo}-${formato}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              style={{
                width: fmt.previewW,
                height: fmt.previewH,
                overflow: "hidden",
                borderRadius: 8,
                boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
                flexShrink: 0,
              }}
            >
              <CarrosselSlide
                slide={slideAtivo}
                index={indiceAtivo}
                total={slides.length}
                marca={marca}
                temaId={temaId}
                escala={escala}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Metadados de saída */}
        <p className="text-center text-[10px] text-[var(--v6-text-muted)] font-mono">
          Saída: {fmt.w} × {fmt.h} px · {fmt.label}
        </p>
      </div>
    </section>
  );
}
