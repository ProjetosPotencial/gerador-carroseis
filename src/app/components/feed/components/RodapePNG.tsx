/**
 * Rodapé como PNG fixo da pasta /public/rodapes/ — v7.32.
 *
 * Substitui SVG paths e textura programática nos templates Feed/Stories.
 * Sempre renderizado como TOP layer (z-index máximo): nada deve sobrepor
 * o rodapé — nem fotos, nem textura, nem gradiente de leitura.
 *
 * Tipos disponíveis:
 *  - "rodape_01" → amarelo cheio + grão + cantos arredondados (logo creme)
 *  - "rodape_02" → creme com curva amarela à esquerda (logo amarelo)
 *
 * O PNG já contém a URL e o logo na arte. Não há necessidade de renderizar
 * URL ou logo separadamente.
 *
 * v7.32: DUAS LINHAS EDITORIAIS. O rodapé segue a linha ativa:
 *   Parcele Aqui    → /rodapes/{tipo}_{formato}.png
 *   Grupo Potencial → /rodapes/gp/{tipo}_{formato}.png
 * A linha vem da aba Semana. A prop `marca` força uma linha específica quando
 * o slide precisar (peça de uma linha aberta dentro da outra, por exemplo).
 *
 * Os PNGs do Grupo Potencial precisam ter EXATAMENTE as mesmas dimensões dos
 * do Parcele Aqui, porque o componente força largura 1080 e altura fixa vinda
 * de ALTURAS_RODAPE. Proporção diferente distorce a arte:
 *   rodape_01_feed     1620 x 693
 *   rodape_01_stories  1620 x 699
 *   rodape_02_feed     2160 x 650
 *   rodape_02_stories  2160 x 878
 */
import type { FeedFormato } from "../templates/tipos";
import { obterAlturaRodape, type TipoRodape } from "../templates/tipos";

export type LinhaMarca = "parcele" | "potencial";

const CHAVE_LINHA_SEMANA = "parceleaqui:semana-ig:linha";

/** Linha editorial ativa, escolhida na aba Semana. Default: Parcele Aqui. */
function linhaAtual(): LinhaMarca {
  try {
    if (localStorage.getItem(CHAVE_LINHA_SEMANA) === "potencial") return "potencial";
  } catch {
    /* modo privado do navegador: cai no padrão */
  }
  return "parcele";
}

export function caminhoRodape(
  tipo: TipoRodape,
  formato: FeedFormato,
  marca?: LinhaMarca
): string {
  const linha = marca ?? linhaAtual();
  const pasta = linha === "potencial" ? "/rodapes/gp" : "/rodapes";
  return `${pasta}/${tipo}_${formato}.png`;
}

export default function RodapePNG({
  tipo,
  formato,
  escala = 1,
  marca,
}: {
  tipo: TipoRodape;
  formato: FeedFormato;
  escala?: number;
  /** Força a linha do rodapé. Sem isso, segue a linha ativa da aba Semana. */
  marca?: LinhaMarca;
}) {
  const altura = obterAlturaRodape(tipo, formato);
  const src = caminhoRodape(tipo, formato, marca);

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
