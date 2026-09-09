# v7.32 — Rodapé do Grupo Potencial e topbar por linha e categoria

Duas frentes. O rodapé já vem pronto; a topbar é uma alteração no orquestrador.

---

## 1. Rodapé do Grupo Potencial (pronto)

Quatro PNGs novos em `public/rodapes/gp/`, reconstruídos a partir da arte do
Parcele Aqui, com a mesma geometria medida pixel a pixel no original:

| arquivo | tamanho | renderiza |
|---|---|---|
| `gp/rodape_01_feed.png` | 1620 × 693 | 1080 × 462 |
| `gp/rodape_01_stories.png` | 1620 × 699 | 1080 × 466 |
| `gp/rodape_02_feed.png` | 2160 × 650 | 1080 × 325 |
| `gp/rodape_02_stories.png` | 2160 × 878 | 1080 × 439 |

Construção aprovada por você em 09/09: fundo da linha, wordmark do Grupo
Potencial à esquerda em tinta escura `#140D06`, com o acento amarelo do logo
preservado, sem linha de URL.

- `rodape_01` (amarelo): gradiente com grão e cantos superiores arredondados, raio 117 no feed e 147 no stories, medidos no original do Parcele.
- `rodape_02` (creme): fundo `#FFFAE7` com o bloco amarelo `#FFCC1B` no canto superior esquerdo e o recorte côncavo.
- Wordmark com 20% da altura do rodapé, margem esquerda de 7,5% da largura, base a 70% da altura. Igual nos quatro arquivos.

O arquivo que você mandou é a versão negativa, branca. Em branco o logo some no
creme e briga com o amarelo, então usei a versão escura nos dois fundos. Se
existir uma versão positiva oficial, é só mandar que eu troco.

**Sem URL.** O desenho aprovado leva só o wordmark, sem a linha de endereço que
o Parcele tem no canto esquerdo. Se quiser a URL de volta, ela entra à direita e
eu regenero os quatro.

## 2. `RodapePNG.tsx` (alterado)

O caminho do PNG passa a seguir a linha editorial ativa, lida da aba Semana:

```
Parcele Aqui    → /rodapes/{tipo}_{formato}.png
Grupo Potencial → /rodapes/gp/{tipo}_{formato}.png
```

Nada mais muda. O seletor de rodapé continua com as duas opções nas duas linhas,
e a prop nova `marca` permite forçar uma linha específica num slide quando
precisar.

---

## 3. Topbar por linha e categoria (alteração no orquestrador)

Descobri um atalho que evita mexer no app: o `tema_classic` já passa
`slide.textoTopbar || marca` para a topbar nos seis layouts. Então basta o
orquestrador carimbar `textoTopbar` em cada slide. Zero risco no editor.

Em `_automacao/orquestrador.mjs`, troque:

```js
const MARCA='POTENCIAL · MERCADO', TEMA='brands_decoded_classic';
```

por:

```js
// v7.32: topbar = MARCA DA LINHA · CATEGORIA DA PEÇA.
const MARCAS_LINHA   = { PA:'PARCELE AQUI', GP:'GRUPO POTENCIAL' };
const CATEGORIA_FALLBACK = { PA:'PARCELAMENTO', GP:'MERCADO' };
const MARCA = MARCAS_LINHA[LINHA] || MARCAS_LINHA.PA;
const TEMA  = 'brands_decoded_classic';

function categoriaDaPeca(texto){
  // 1) campo explicito no documento
  const m = String(texto||'').match(/^\s*CATEGORIA:\s*(.+)$/im);
  if (m) return m[1].trim().toUpperCase().slice(0,24);
  // 2) sem campo: usa o kicker da capa
  const k = String(texto||'').match(/^\s*KICKER:\s*(.+)$/im);
  if (k) return k[1].trim().toUpperCase().slice(0,24);
  // 3) nem isso: padrao da linha
  return CATEGORIA_FALLBACK[LINHA] || CATEGORIA_FALLBACK.PA;
}
function topbarDaPeca(texto){ return MARCA + ' · ' + categoriaDaPeca(texto); }
```

E, dentro do laço das peças, imediatamente antes do `plano.push(...)`:

```js
const topbar = topbarDaPeca(p.texto);
slides = slides.map(sl => ({ ...sl, textoTopbar: sl.textoTopbar || topbar }));
```

Resultado: `PARCELE AQUI · IPVA`, `GRUPO POTENCIAL · OPEN FINANCE`, e assim por
diante, conforme a peça.

### O campo CATEGORIA no documento

Escreva uma linha `CATEGORIA:` no cabeçalho de cada peça do `01-Prompts-App`.
Até 24 caracteres, uma palavra ou duas. Se faltar, o orquestrador usa o kicker
da capa, e se nem isso existir usa o padrão da linha. Ou seja, nada quebra em
semana já escrita.

Vou incluir esse campo no `Prompt-Chat-Gerador-Conteudo-v4.md` assim que você
confirmar os dois textos de marca, para não reescrever o documento duas vezes.

### Ressalva

O `textoTopbar` só está ligado no tema **Brands Decoded Classic**, que é o que
está em produção. Os temas Refined, Tweet, Keynote e Editorial não leem esse
campo: se um dia a linha mudar de tema, a topbar volta ao valor global. Entra
junto na migração desses três temas para o motor de auto-ajuste, que continua
pendente.

---

## Como aplicar

1. Copie `public/rodapes/gp/` e o `RodapePNG.tsx` por cima, mantendo os caminhos.
2. Aplique as duas mudanças no `orquestrador.mjs`.
3. `npm run dev`, aba Semana, troque a linha para Grupo Potencial e abra uma peça de feed. O rodapé deve vir com o logo do grupo.
4. Rode o orquestrador com `LINHA=GP` e confira a topbar de um carrossel.
