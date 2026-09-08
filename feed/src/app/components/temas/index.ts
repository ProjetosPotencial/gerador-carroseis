import { TEMA_BRANDS_DECODED_CLASSIC } from "./tema_classic";
import { TEMA_EDITORIAL_REFINED } from "./tema_refined";
import { TEMA_TWEET_STYLE } from "./tema_tweet";
import { TEMA_KEYNOTE_MINIMAL } from "./tema_keynote";
import { TEMA_EDITORIAL_PONTENCIAL } from "./tema_editorial_pontencial";
import type { TemaConfig, TemaId } from "./tipos";

export const TEMAS: Record<TemaId, TemaConfig> = {
  brands_decoded_classic: TEMA_BRANDS_DECODED_CLASSIC,
  editorial_refined: TEMA_EDITORIAL_REFINED,
  tweet_style: TEMA_TWEET_STYLE,
  keynote_minimal: TEMA_KEYNOTE_MINIMAL,
  editorial_pontencial: TEMA_EDITORIAL_PONTENCIAL,
};

export const TEMAS_DISPONIVEIS: TemaConfig[] = [
  TEMA_BRANDS_DECODED_CLASSIC,
  TEMA_EDITORIAL_REFINED,
  TEMA_TWEET_STYLE,
  TEMA_KEYNOTE_MINIMAL,
  TEMA_EDITORIAL_PONTENCIAL,
];

export function obterTema(id: TemaId): TemaConfig {
  return TEMAS[id] || TEMA_BRANDS_DECODED_CLASSIC;
}

export * from "./tipos";
