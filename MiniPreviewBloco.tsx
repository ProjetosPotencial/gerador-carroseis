import LinkedInCover from "./LinkedInCover";
import { iconesDisponiveis } from "./SelectIconeComPreview";
import type { IconeNome } from "./SelectIconeComPreview";

interface MiniPreviewBlocoProps {
  numero: string;
  titulo: string;
  icone: string;
  imagem: string;
  legendaLinha1: string;
  legendaLinha2: string;
  usarLegenda1: boolean;
  usarLegenda2: boolean;
  /** Largura final do preview em px (altura é calculada 16:9) */
  largura?: number;
}

/**
 * Preview em miniatura da capa, usado no painel de configuração
 * por bloco pra mostrar como vai ficar antes de gerar.
 * Renderiza o LinkedInCover real (1280×720) dentro de um container
 * escalado via CSS transform.
 */
export default function MiniPreviewBloco({
  numero,
  titulo,
  icone,
  imagem,
  legendaLinha1,
  legendaLinha2,
  usarLegenda1,
  usarLegenda2,
  largura = 360,
}: MiniPreviewBlocoProps) {
  const IconeComponente = iconesDisponiveis[icone as IconeNome] ?? iconesDisponiveis.CreditCard;
  const altura = Math.round((largura * 720) / 1280);
  const escala = largura / 1280;

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-gray-800 bg-white"
      style={{ width: `${largura}px`, height: `${altura}px` }}
    >
      <div
        style={{
          transform: `scale(${escala})`,
          transformOrigin: "top left",
          width: "1280px",
          height: "720px",
        }}
      >
        <LinkedInCover
          numero={numero}
          titulo={titulo}
          legendaLinha1={legendaLinha1}
          legendaLinha2={legendaLinha2}
          fotoUrl={imagem}
          usarLegenda1={usarLegenda1}
          usarSubtitulo={usarLegenda2}
          IconeCustomizado={() => (
            <div
              className="absolute flex items-center justify-center"
              style={{ left: "77px", top: "301px", width: "85px", height: "85px" }}
            >
              <IconeComponente size={51} strokeWidth={1.5} color="#371B01" />
            </div>
          )}
        />
      </div>
    </div>
  );
}
