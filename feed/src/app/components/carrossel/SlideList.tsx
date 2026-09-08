import { Plus, Copy, Trash2 } from "lucide-react";
import CarrosselSlide from "../CarrosselSlide";
import type { SlideData, TemaId } from "../temas/tipos";

interface SlideListProps {
  slides: SlideData[];
  indiceAtivo: number;
  temaId: TemaId;
  nomeLayoutPorId: (id: string) => string;
  onSelect: (i: number) => void;
  onAdicionar: () => void;
  onRemover: (i: number) => void;
  onDuplicar: (i: number) => void;
  onMoverCima: (i: number) => void;
  onMoverBaixo: (i: number) => void;
}

/**
 * Coluna lateral com a lista de slides em miniatura.
 * Cada slide tem ações: mover, duplicar, remover.
 */
export default function SlideList({
  slides,
  indiceAtivo,
  temaId,
  nomeLayoutPorId,
  onSelect,
  onAdicionar,
  onRemover,
  onDuplicar,
  onMoverCima,
  onMoverBaixo,
}: SlideListProps) {
  return (
    <div className="bg-[#141414] rounded-xl border border-gray-800 p-3 sticky top-24">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          Slides ({slides.length})
        </h3>
      </div>

      <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
        {slides.map((s, i) => (
          <MiniSlide
            key={s.id}
            slide={s}
            indice={i}
            total={slides.length}
            ativo={i === indiceAtivo}
            temaId={temaId}
            nomeLayout={nomeLayoutPorId(s.layout)}
            onClick={() => onSelect(i)}
            onRemover={() => onRemover(i)}
            onDuplicar={() => onDuplicar(i)}
            onMoverCima={() => onMoverCima(i)}
            onMoverBaixo={() => onMoverBaixo(i)}
            podeRemover={slides.length > 1}
          />
        ))}
      </div>

      <button
        onClick={onAdicionar}
        className="w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold bg-[#1f1f1f] border border-gray-800 text-gray-300 hover:bg-[#FFC528] hover:text-black hover:border-[#FFC528] transition-all"
      >
        <Plus size={14} />
        Novo slide
      </button>
    </div>
  );
}

// ============================================================
// MINI SLIDE
// ============================================================
function MiniSlide({
  slide,
  indice,
  total,
  ativo,
  temaId,
  nomeLayout,
  onClick,
  onRemover,
  onDuplicar,
  onMoverCima,
  onMoverBaixo,
  podeRemover,
}: {
  slide: SlideData;
  indice: number;
  total: number;
  ativo: boolean;
  temaId: TemaId;
  nomeLayout: string;
  onClick: () => void;
  onRemover: () => void;
  onDuplicar: () => void;
  onMoverCima: () => void;
  onMoverBaixo: () => void;
  podeRemover: boolean;
}) {
  return (
    <div
      className={`group relative rounded-md border-2 transition-all overflow-hidden ${
        ativo
          ? "border-[#FFC528] bg-[#1f1f1f]"
          : "border-transparent bg-[#0f0f0f] hover:border-gray-700"
      }`}
    >
      <button
        onClick={onClick}
        className="w-full flex items-stretch gap-2 p-1.5 text-left"
        aria-label={`Slide ${indice + 1}`}
      >
        <div
          style={{
            width: 54,
            height: 67,
            overflow: "hidden",
            borderRadius: 4,
            flexShrink: 0,
            background: "#000",
          }}
        >
          <CarrosselSlide
            slide={slide}
            index={indice}
            total={total}
            marca=""
            temaId={temaId}
            escala={0.05}
          />
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <div className="text-xs font-bold text-white truncate">
            {String(indice + 1).padStart(2, "0")} · {nomeLayout}
          </div>
          <div className="text-[10px] text-gray-500 truncate leading-tight">
            {slide.headline.replace(/\n/g, " ") || slide.kicker || "Vazio"}
          </div>
        </div>
      </button>

      {/* Ações */}
      <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <IconBtn onClick={onMoverCima} disabled={indice === 0} title="Mover para cima">
          ↑
        </IconBtn>
        <IconBtn
          onClick={onMoverBaixo}
          disabled={indice === total - 1}
          title="Mover para baixo"
        >
          ↓
        </IconBtn>
        <IconBtn onClick={onDuplicar} title="Duplicar">
          <Copy size={10} />
        </IconBtn>
        <IconBtn onClick={onRemover} disabled={!podeRemover} title="Remover" vermelho>
          <Trash2 size={10} />
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({
  onClick,
  children,
  disabled,
  title,
  vermelho,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  title: string;
  vermelho?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={`w-5 h-5 flex items-center justify-center rounded bg-black/70 text-white text-[10px] hover:bg-black disabled:opacity-30 ${
        vermelho ? "hover:bg-red-600" : ""
      }`}
    >
      {children}
    </button>
  );
}
