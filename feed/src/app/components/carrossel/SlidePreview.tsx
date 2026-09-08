import { ChevronLeft, ChevronRight } from "lucide-react";
import CarrosselSlide from "../CarrosselSlide";
import type { SlideData, TemaId } from "../temas/tipos";

interface SlidePreviewProps {
  slide: SlideData;
  indiceAtivo: number;
  total: number;
  marca: string;
  temaId: TemaId;
  onAnterior: () => void;
  onProximo: () => void;
  /** v7.7.23: callback de drag da foto */
  onSlideChange?: (patch: Partial<SlideData>) => void;
}

/**
 * Coluna central com preview em escala 0.5 do slide ativo.
 * Inclui navegação anterior/próximo.
 */
export default function SlidePreview({
  slide,
  indiceAtivo,
  total,
  marca,
  temaId,
  onAnterior,
  onProximo,
  onSlideChange,
}: SlidePreviewProps) {
  return (
    <div className="bg-[#141414] rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Preview · Slide {indiceAtivo + 1} de {total}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onAnterior}
            disabled={indiceAtivo === 0}
            className="p-1.5 rounded-md bg-[#1f1f1f] text-gray-400 hover:text-white hover:bg-[#2a2a2a] disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={onProximo}
            disabled={indiceAtivo === total - 1}
            className="p-1.5 rounded-md bg-[#1f1f1f] text-gray-400 hover:text-white hover:bg-[#2a2a2a] disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <div
          style={{
            width: 540,
            height: 675,
            overflow: "hidden",
            borderRadius: 8,
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          }}
        >
          <CarrosselSlide
            slide={slide}
            index={indiceAtivo}
            total={total}
            marca={marca}
            temaId={temaId}
            escala={0.5}
            onSlideChange={onSlideChange}
          />
        </div>
      </div>

      <p className="text-center text-[10px] text-gray-600 mt-3 font-mono">
        Saída: 1080 × 1350 px (Instagram 4:5)
      </p>
    </div>
  );
}
