/**
 * SlideList — painel lateral com lista de slides e drag-and-drop.
 * Usa react-dnd (já instalado) para reordenação fluida.
 */
import React, { useRef, useCallback, memo } from "react";
import { useDrag, useDrop } from "react-dnd";
import { Plus, Copy, Trash2, GripVertical } from "lucide-react";
import CarrosselSlide, { SlideData, TemaId } from "./CarrosselSlide";
import { EmptyState } from "./ui/EmptyState";
import { motion, AnimatePresence } from "motion/react";

const ITEM_TYPE = "SLIDE";

// ============================================================
// MINI SLIDE CARD (lista)
// ============================================================
interface MiniSlideProps {
  slide: SlideData;
  indice: number;
  total: number;
  ativo: boolean;
  temaId: TemaId;
  nomeLayout: string;
  onClick: () => void;
  onRemover: () => void;
  onDuplicar: () => void;
  onMover: (de: number, para: number) => void;
  podeRemover: boolean;
}

const MiniSlideCard = memo(function MiniSlideCard({
  slide,
  indice,
  total,
  ativo,
  temaId,
  nomeLayout,
  onClick,
  onRemover,
  onDuplicar,
  onMover,
  podeRemover,
}: MiniSlideProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE,
    item: { indice },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver }, drop] = useDrop<{ indice: number }, void, { isOver: boolean }>({
    accept: ITEM_TYPE,
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    hover(item) {
      if (item.indice !== indice) {
        onMover(item.indice, indice);
        item.indice = indice;
      }
    },
  });

  preview(drop(ref));

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0.4 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className={`group relative rounded-lg border-2 transition-colors overflow-hidden cursor-pointer ${
        ativo
          ? "border-[#FFC528] bg-[var(--v6-bg-sunken)]"
          : "border-transparent bg-[var(--v6-bg-base)] hover:border-[var(--v6-border)]"
      } ${isOver ? "border-[#FFC528]/50 bg-[#FFC528]/5" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-stretch gap-2 p-1.5">
        {/* Drag handle */}
        <div
          ref={drag as unknown as React.RefObject<HTMLDivElement>}
          className="flex-shrink-0 flex items-center px-0.5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={12} className="text-[var(--v6-text-muted)]" />
        </div>

        {/* Mini preview */}
        <div
          style={{ width: 48, height: 60, overflow: "hidden", borderRadius: 3, flexShrink: 0, background: "#000" }}
        >
          <CarrosselSlide
            slide={slide}
            index={indice}
            total={total}
            marca=""
            temaId={temaId}
            escala={0.044}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 py-0.5">
          <div className="text-xs font-bold text-[var(--v6-text-primary)] truncate">
            {String(indice + 1).padStart(2, "0")} · {nomeLayout}
          </div>
          <div className="text-[10px] text-[var(--v6-text-muted)] truncate leading-tight mt-0.5">
            {slide.headline.replace(/\n/g, " ") || slide.kicker || "Vazio"}
          </div>
        </div>
      </div>

      {/* Ações — aparecem no hover */}
      <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <SlideActionBtn
          onClick={(e) => { e.stopPropagation(); onDuplicar(); }}
          title="Duplicar (D)"
        >
          <Copy size={10} />
        </SlideActionBtn>
        <SlideActionBtn
          onClick={(e) => { e.stopPropagation(); onRemover(); }}
          disabled={!podeRemover}
          title="Remover (Delete)"
          danger
        >
          <Trash2 size={10} />
        </SlideActionBtn>
      </div>

      {/* Número do slide — badge */}
      <div
        className={`absolute bottom-1 left-1 text-[8px] font-black px-1 py-0.5 rounded transition-colors ${
          ativo ? "bg-[#FFC528] text-black" : "bg-[var(--v6-bg-sunken)] text-[var(--v6-text-muted)]"
        }`}
      >
        {indice + 1}
      </div>
    </motion.div>
  );
});

function SlideActionBtn({
  onClick,
  children,
  disabled,
  title,
  danger,
}: {
  onClick: React.MouseEventHandler;
  children: React.ReactNode;
  disabled?: boolean;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-5 h-5 flex items-center justify-center rounded bg-black/70 text-white text-[10px]
        transition-colors disabled:opacity-30
        ${danger ? "hover:bg-red-600" : "hover:bg-[#FFC528] hover:text-black"}`}
    >
      {children}
    </button>
  );
}

// ============================================================
// SLIDE LIST
// ============================================================
interface SlideListProps {
  slides: SlideData[];
  indiceAtivo: number;
  temaId: TemaId;
  layoutNome: (slide: SlideData) => string;
  onSelect: (i: number) => void;
  onRemover: (i: number) => void;
  onDuplicar: (i: number) => void;
  onMover: (de: number, para: number) => void;
  onAdicionarSlide: () => void;
}

export function SlideList({
  slides,
  indiceAtivo,
  temaId,
  layoutNome,
  onSelect,
  onRemover,
  onDuplicar,
  onMover,
  onAdicionarSlide,
}: SlideListProps) {
  return (
    <aside className="col-span-12 md:col-span-2">
      <div
        className="rounded-xl border border-[var(--v6-border)] p-3 sticky top-24 flex flex-col gap-3"
        style={{ backgroundColor: "var(--v6-bg-elevated)", maxHeight: "calc(100vh - 140px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <h3 className="text-xs font-bold text-[var(--v6-text-muted)] uppercase tracking-wider">
            Slides
          </h3>
          <span className="text-xs font-bold text-[#FFC528]">{slides.length}</span>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 min-h-0">
          {slides.length === 0 ? (
            <EmptyState
              title="Nenhum slide"
              description="Clique em + para adicionar"
              illustration="carousel"
            />
          ) : (
            <AnimatePresence mode="popLayout">
              {slides.map((s, i) => (
                <MiniSlideCard
                  key={s.id}
                  slide={s}
                  indice={i}
                  total={slides.length}
                  ativo={i === indiceAtivo}
                  temaId={temaId}
                  nomeLayout={layoutNome(s)}
                  onClick={() => onSelect(i)}
                  onRemover={() => onRemover(i)}
                  onDuplicar={() => onDuplicar(i)}
                  onMover={onMover}
                  podeRemover={slides.length > 1}
                />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Botão novo slide */}
        <button
          onClick={onAdicionarSlide}
          className="flex-shrink-0 w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold
            border border-dashed border-[var(--v6-border)] text-[var(--v6-text-muted)]
            hover:border-[#FFC528] hover:text-[#FFC528] hover:bg-[#FFC528]/5
            active:scale-[0.98] transition-all"
        >
          <Plus size={13} />
          Novo slide <span className="opacity-50 text-[9px]">(N)</span>
        </button>
      </div>
    </aside>
  );
}
