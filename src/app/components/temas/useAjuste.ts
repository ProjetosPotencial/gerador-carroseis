/**
 * HOOK DE AUTO-AJUSTE — v7.28
 * ============================================================
 * Cola o motor de `autoAjuste.ts` nos primitivos. Cuida de três coisas que
 * o motor sozinho não resolve:
 *
 *   1. Descobrir a largura real da caixa (o layout posiciona, o hook mede).
 *   2. Recalcular quando as webfonts terminam de carregar, porque medir com
 *      fonte de fallback dá número errado.
 *   3. Reportar o resultado pro diagnóstico do slide, que alimenta o selo
 *      "pronto para publicar" na interface.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ajustarTexto,
  assinarFontes,
  geracaoAtualFontes,
  pisoPara,
  PADROES,
  registrarOcorrencia,
  type ElementoAjustavel,
  type EstiloMedicao,
  type ResultadoAjuste,
} from "./autoAjuste";

/** Caixa declarada pelo layout. Tudo opcional: o que faltar vira padrão. */
export interface CaixaLayout {
  /** Largura em px. Quando omitida, o hook mede o elemento renderizado. */
  largura?: number;
  /** Altura útil em px. Quando omitida, só o teto de linhas manda. */
  alturaMax?: number;
  /** Teto de linhas. Quando omitido, usa o padrão do elemento. */
  maxLinhas?: number;
  /** Piso do corpo da fonte. Quando omitido, deriva do tamanho base. */
  min?: number;
}

export interface ParametrosAjuste {
  texto: string;
  elemento: ElementoAjustavel;
  estilo: EstiloMedicao;
  /** Tamanho que o layout pediu. Vira o teto da busca. */
  tamanhoBase: number;
  lineHeight: number;
  preLine?: boolean;
  /** Desliga o motor (ex.: operador fixou tamanhoPx na mão). */
  desativado?: boolean;
  /** Id do slide, pro diagnóstico. */
  slideId?: string;
  caixa?: CaixaLayout;
}

export interface RetornoAjuste {
  /** Vai no elemento renderizado. */
  ref: React.RefObject<HTMLDivElement>;
  /** Corpo da fonte final em px. */
  fontSize: number;
  resultado: ResultadoAjuste;
}

const usarLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useAjuste(p: ParametrosAjuste): RetornoAjuste {
  const ref = useRef<HTMLDivElement>(null);
  const [larguraMedida, setLarguraMedida] = useState(0);
  const [geracao, setGeracao] = useState(() => geracaoAtualFontes());
  /**
   * Trava anti-oscilação. Em layout de bloco a largura do elemento não depende
   * do corpo da fonte, mas dentro de um flex que encolhe pro conteúdo ela pode
   * depender: fonte menor, caixa menor, recalcula, fonte maior, e assim por
   * diante. O contador corta esse laço depois de algumas leituras e a última
   * largura estável prevalece.
   */
  const leiturasRef = useRef(0);
  const LIMITE_LEITURAS = 8;

  // Recalcula quando as webfonts ficam prontas.
  useEffect(() => assinarFontes(() => setGeracao(geracaoAtualFontes())), []);

  // Texto novo é um começo novo: libera o orçamento de leituras.
  usarLayoutEffect(() => {
    leiturasRef.current = 0;
  }, [p.texto, p.elemento, p.tamanhoBase]);

  // Mede a largura real do elemento e acompanha mudanças de layout.
  usarLayoutEffect(() => {
    if (p.caixa?.largura) return; // largura declarada pelo layout, não precisa medir
    const el = ref.current;
    if (!el) return;

    const ler = () => {
      if (leiturasRef.current >= LIMITE_LEITURAS) return;
      const w = el.clientWidth || el.parentElement?.clientWidth || 0;
      if (!(w > 0)) return;
      setLarguraMedida((atual) => {
        // Ignora variação de menos de 1px: ruído de arredondamento não vale
        // um recálculo, e é justamente ele que alimenta o laço.
        if (Math.abs(atual - w) <= 1) return atual;
        leiturasRef.current += 1;
        return w;
      });
    };
    ler();

    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(ler);
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [p.caixa?.largura, p.texto, p.elemento]);

  const largura = p.caixa?.largura ?? larguraMedida;
  const padrao = PADROES[p.elemento];

  const resultado = useMemo(() => {
    if (p.desativado) {
      return {
        fontSize: p.tamanhoBase,
        coube: true,
        linhas: 1,
        altura: 0,
        cortarCaracteres: 0,
        apertado: false,
        folgado: false,
      } as ResultadoAjuste;
    }
    return ajustarTexto(p.texto, p.estilo, {
      largura,
      alturaMax: p.caixa?.alturaMax,
      maxLinhas: p.caixa?.maxLinhas ?? padrao.maxLinhas,
      min: p.caixa?.min ?? pisoPara(p.elemento, p.tamanhoBase),
      max: p.tamanhoBase,
      lineHeight: p.lineHeight,
      preLine: p.preLine !== false,
    });
    // `geracao` entra de propósito: muda quando as fontes carregam.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    p.texto,
    p.desativado,
    p.tamanhoBase,
    p.lineHeight,
    p.preLine,
    p.elemento,
    largura,
    p.caixa?.alturaMax,
    p.caixa?.maxLinhas,
    p.caixa?.min,
    p.estilo.fontFamily,
    p.estilo.fontWeight,
    p.estilo.letterSpacing,
    p.estilo.textTransform,
    p.estilo.fontStyle,
    geracao,
  ]);

  // Reporta pro diagnóstico do slide.
  useEffect(() => {
    if (!p.slideId || !p.texto?.trim() || largura <= 0) return;
    registrarOcorrencia(p.slideId, {
      elemento: p.elemento,
      coube: resultado.coube,
      fontSize: resultado.fontSize,
      linhas: resultado.linhas,
      cortarCaracteres: resultado.cortarCaracteres,
      apertado: resultado.apertado,
      folgado: resultado.folgado,
    });
  }, [p.slideId, p.elemento, p.texto, largura, resultado]);

  return { ref, fontSize: resultado.fontSize, resultado };
}
