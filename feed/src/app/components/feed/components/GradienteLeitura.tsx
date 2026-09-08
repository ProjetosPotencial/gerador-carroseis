/**
 * Gradiente sutil de leitura — v7.7.8.
 *
 * Aplica gradiente vertical preto→transparente (escurecendo a base, clareando
 * o topo) pra garantir legibilidade dos textos sobre fotos contrastadas.
 *
 * v7.7.8 — comportamento mudou:
 *  - O gradiente AGORA cobre 100% da altura da peça (`alturaTotal`), não só
 *    a área útil. Isso evita o corte visível em y=alturaUtil quando o rodapé
 *    PNG tem cantos arredondados/curvas (alpha) — o gradiente agora flui por
 *    trás do rodapé naturalmente, encoberto pela parte opaca dele.
 *  - Pra manter a curva de escurecimento concentrada onde os textos ficam,
 *    o ponto MAIS escuro (100% do gradiente CSS) é mapeado pra `alturaUtil`
 *    em vez de 1350/1920. Daí até a base, o gradiente fica em opacidade
 *    constante (no nível mais escuro), mas tudo isso fica encoberto pelo
 *    rodapé, então é invisível.
 *
 * Z-index: ABAIXO do rodapé (z-index 50) e ABAIXO dos textos.
 */
export default function GradienteLeitura({
  visivel = true,
  opacidade = 0.5,
  alturaUtil,
  alturaTotal,
  escala = 1,
}: {
  visivel?: boolean;
  /** Opacidade do gradiente (0-1). */
  opacidade?: number;
  /**
   * Altura em px (no espaço 1080×H) onde fica o PICO do escurecimento
   * (= base da área útil = início do rodapé). Ex: feed com rodapé de 462px
   * → alturaUtil = 888. O gradiente continua em opacidade plena daí até a
   * base mas fica encoberto pelo rodapé.
   */
  alturaUtil: number;
  /**
   * Altura total da peça em px (1350 ou 1920). O gradiente é renderizado
   * com este height pra cobrir toda a área e passar atrás do rodapé.
   */
  alturaTotal: number;
  escala?: number;
}) {
  if (!visivel) return null;

  // Calcula percentuais das paradas em RELAÇÃO à alturaTotal:
  // - 0% e 35% (ainda transparente)
  // - 65% começa a escurecer (proporcional ao alturaUtil)
  // - 100% no alturaUtil (pico de escurecimento)
  // Daí em diante (alturaUtil → alturaTotal), opacidade plena.
  const pctPico = (alturaUtil / alturaTotal) * 100;
  const pctMeio = pctPico * 0.65;
  const pctIniciaEscurecer = pctPico * 0.35;

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: `${1080 * escala}px`,
        height: `${alturaTotal * escala}px`,
        background: `linear-gradient(180deg,
          rgba(0,0,0,0) 0%,
          rgba(0,0,0,0) ${pctIniciaEscurecer.toFixed(2)}%,
          rgba(0,0,0,${opacidade * 0.5}) ${pctMeio.toFixed(2)}%,
          rgba(0,0,0,${opacidade}) ${pctPico.toFixed(2)}%,
          rgba(0,0,0,${opacidade}) 100%)`,
        pointerEvents: "none",
      }}
    />
  );
}
