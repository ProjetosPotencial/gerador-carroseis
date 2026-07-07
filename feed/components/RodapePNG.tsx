/**
 * Rodapé como PNG fixo da pasta /public/rodapes/ — v7.7.6.
 *
 * Substitui SVG paths e textura programática nos templates Feed/Stories.
 * Sempre renderizado como TOP layer (z-index máximo): nada deve sobrepor
 * o rodapé — nem fotos, nem textura, nem gradiente de leitura.
 *
 * Tipos disponíveis:
 *  - "rodape_01" → amarelo cheio + grão + cantos arredondados (logo creme)
 *  - "rodape_02" → creme com curva amarela à esquerda (logo amarelo)
 *
 * O PNG já contém URL "parceleaqui.com.br" e o logo Parcele Aqui na arte.
 * Não há necessidade de renderizar URL ou logo separadamente.
 */
import type { FeedFormato } from "../templates/tipos";
import { obterAlturaRodape, type TipoRodape } from "../templates/tipos";

export default function RodapePNG({
  tipo,
  formato,
  escala = 1,
}: {
  tipo: TipoRodape;
  formato: FeedFormato;
  escala?: number;
}) {
  const altura = obterAlturaRodape(tipo, formato);
  const src = `/rodapes/${tipo}_${formato}.png`;

  return (
    <img
      src={src}
      alt=""
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        width: `${1080 * escala}px`,
        height: `${altura * escala}px`,
        pointerEvents: "none",
        // garante render por cima de tudo dentro do template
        zIndex: 50,
        display: "block",
      }}
      // crossOrigin pra não quebrar export via html-to-canvas / dom-to-image
      crossOrigin="anonymous"
      draggable={false}
    />
  );
}
