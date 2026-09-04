# v7.29 — Motor de diagramação, fim da tela de login e fechamento da /api/ia

Este patch inclui tudo que estava no v7.28 e substitui aquele arquivo.

Tipografia: **Kufam permanece**. Nada de fonte foi trocado neste patch.

---

## 1. A tela de login saiu

O app abre direto no editor. Não existe mais etapa nenhuma no meio do caminho.

### Como as chamadas continuam autorizadas

O que autoriza as rotas `/api/*` passa a ser uma **chave de acesso
compartilhada**, enviada automaticamente pelo navegador. Duas variáveis de
ambiente na Vercel, com o mesmo valor:

| variável | onde | para quê |
|---|---|---|
| `CHAVE_ACESSO` | servidor | as rotas conferem contra ela |
| `VITE_CHAVE_ACESSO` | build | o navegador manda no cabeçalho |

Gere um valor longo e aleatório, por exemplo `openssl rand -hex 32`.

Se você já usa `CRON_SECRET` nas automações, ele continua funcionando. As rotas
aceitam `CHAVE_ACESSO` ou `CRON_SECRET`.

### O que isso significa, sem meias palavras

Quem abrir a URL do app **vê a interface**. Gerar texto, gerar imagem, salvar
slides, importar legendas e aprovar a semana continuam exigindo a chave, então
sua cota de IA e o banco no Supabase seguem protegidos.

A chave viaja dentro do bundle do navegador. Isso segura visitante casual e
robô de busca. Não segura alguém que abra o código-fonte da página e leia a
chave. Para um app interno com URL não divulgada, é uma troca razoável. Se um
dia precisar de proteção real sem tela de login, o caminho é colocar o app atrás
do Vercel Password Protection ou de um proxy autenticado.

### Como voltar atrás

`VITE_LOGIN=on` no build. O magic link volta como era, com uma diferença: o
acesso fica gravado no navegador, a revalidação roda em segundo plano e falha de
rede não desloga mais ninguém no meio do expediente. Sai também por `?logout=1`.

### Passo no Supabase (só se religar o login)

Authentication → Sessions: deixe *Time-box user sessions* e *Inactivity timeout*
vazios.

---

## 2. A /api/ia estava aberta

Achado durante a implementação: `api/ia.ts` era a única rota **sem verificação
nenhuma**. Qualquer pessoa com a URL podia disparar chamadas e queimar a
`OPENROUTER_API_KEY`, incluindo os modelos pagos (Claude Sonnet 4.5, GPT-4o).

Agora ela aceita a chave de acesso ou uma sessão do Supabase cujo e-mail esteja
na allowlist. Sem `EMAILS_AUTORIZADOS` nem `CHAVE_ACESSO` configurados, o
comportamento continua liberado, igual às outras rotas.

Validado com oito casos em Node:

| cenário | resultado |
|---|---|
| sem allowlist e sem chave (comportamento antigo) | passa |
| chave configurada, requisição sem token | 401 |
| chave configurada, token errado | 401 |
| chave configurada, token certo | passa |
| `CRON_SECRET` antigo | passa |
| allowlist sem Supabase configurado | passa, igual às outras rotas |
| allowlist com Supabase, sem token | 401 |
| allowlist com Supabase + chave certa | passa |

---

## 3. Motor de auto-ajuste tipográfico

### O que estava acontecendo

`Headline` recebia `tamanho = 88` e desenhava 88px, com `whiteSpace: "pre-line"`
e quebra de linha digitada na mão. Não existia medição de texto no app. Como o
tamanho era fixo, cada caso pedia um escape: `escalaGeral`, `headlineEscala`,
`tamanhoPx`, `escala`, `tracking`, `caps`, por bloco e por slide. Esse é o tempo
que ia embora toda semana.

### O que passa a acontecer

O `tamanho` que o layout informa vira **teto**. O motor mede o texto no DOM e faz
busca binária no corpo da fonte até caber na caixa, respeitando altura útil e
teto de linhas. Quando não cabe nem no piso, não encolhe até ficar ilegível:
devolve o veredito de quantos caracteres precisam sair da copy.

Medido em Chromium, caixa de headline 952 × 300 px, teto 106, piso 44, 4 linhas:

| copy | corpo calculado | linhas | coube |
|---|---|---|---|
| curta (13 car.) | 106 px, o teto | 1 | sim |
| média (65 car.) | 77,7 px | 3 | sim |
| longa (128 car.) | 62,5 px | 4 | sim |
| longa demais (250 car.) | 44 px, o piso | 6 | **não, corte ~86 caracteres** |

Quebra manual com `\n` continua funcionando.

### Compatibilidade

- Quem fixou `tamanhoPx` na mão continua com o tamanho que fixou. O motor sai da frente.
- `escalaGeral`, `headlineEscala`, fonte, peso, caps e tracking seguem valendo. Definem o teto; o motor decide de onde para baixo.
- `ajustar={false}` em qualquer primitivo volta ao comportamento da v7.27.
- Sem caixa declarada, vale o teto de linhas padrão (headline 5, corpo 7, destaque 4, kicker 2). Só isso já elimina a maior parte do transbordo.

### Refinar um layout

```tsx
<Headline
  texto={slide.headline}
  tamanho={104}
  caixa={{ alturaMax: 300, maxLinhas: 4, min: 44 }}
  slide={slide}
  {...resto}
/>
```

### Selo de publicação

```ts
import { diagnosticoDoSlide, diagnosticoDeVarios, assinarDiagnostico } from "./temas/autoAjuste";

const d = diagnosticoDoSlide(slide.id);
// d.nivel: "ok" | "atencao" | "erro"
// d.mensagem: "Pronto para publicar" | "Não cabe. headline: corte ~86 caracteres"
```

`assinarDiagnostico(fn)` avisa quando algo muda. `diagnosticoDeVarios(ids)`
consolida o carrossel inteiro, para travar o export em lote quando algum slide
estiver estourando.

### Temas ainda não cobertos

`tema_classic` e `tema_refined` usam os primitivos e já entram no motor.

`tema_tweet`, `tema_keynote` e `tema_editorial_pontencial` montam a tipografia
inline com `aplicarTipoElemento`. A migração de cada bloco é uma linha:

```tsx
<AutoFit slide={slide} elemento="headline" maxLinhas={4} alturaMax={300}>
  <div style={{ ...aplicarTipoElemento(slide, "headline", { tamanho: 100 }), color: CORES.creme }}>
    {slide.headline}
  </div>
</AutoFit>
```

São 47 blocos nos três arquivos, para fazer com o app rodando na frente.

---

## Arquivos

**Novos**

- `src/app/components/temas/autoAjuste.ts` — motor e diagnóstico
- `src/app/components/temas/useAjuste.ts` — hook de medição

**Alterados**

- `src/app/components/temas/primitivos.tsx` — primitivos com auto-ajuste, componente `AutoFit`
- `src/app/components/AuthGate.tsx` — sem tela por padrão, magic link opcional via `VITE_LOGIN=on`
- `src/app/lib/supabaseClient.ts` — `chaveAcesso`, `authHeaders` com fallback, `storageKey` fixa
- `src/app/lib/formatarCarrossel.ts` — passa a mandar o cabeçalho de acesso na chamada de IA
- `api/ia.ts` — controle de acesso (era a única rota aberta) e `Authorization` no preflight
- `api/imagem.ts` — aceita `CHAVE_ACESSO` além de `CRON_SECRET`
- `api/auth/check.ts`, `api/credito/recarga.ts`, `api/credito/status.ts`, `api/imagens/list.ts`, `api/legendas/importar.ts`, `api/legendas/list.ts`, `api/semana/aprovar.ts`, `api/slack/conferencia.ts`, `api/slides/finalizar.ts`, `api/slides/salvar.ts` — aceitam a chave de acesso

---

## Como aplicar

1. Copie os arquivos por cima do projeto, mantendo os caminhos.
2. Na Vercel, crie `CHAVE_ACESSO` e `VITE_CHAVE_ACESSO` com o mesmo valor aleatório.
3. `npm run dev` e confira que o app abre direto no editor, sem tela nenhuma.
4. Abra um carrossel do tema Brands Decoded Classic e cole uma manchete propositalmente longa. Deve encolher sozinha até caber, sem tocar em nenhum controle.
5. Cole uma manchete absurda. Deve parar no piso e o diagnóstico deve dizer quantos caracteres cortar.
6. Confira que slides antigos com `tamanhoPx` fixado continuam idênticos.
7. Gere um texto pela IA para confirmar que a chave está passando. Se voltar 401, as duas variáveis não estão com o mesmo valor.

O modo headless `?render=1` não foi tocado.
