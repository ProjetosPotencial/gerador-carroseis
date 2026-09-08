# Gerador Potencial v6 — Premium Edition

## O que mudou nesta versão

### 🎨 Sistema de design fintech
- **Dark/Light mode** com toggle no header (sol/lua), persistido no localStorage
- **Paleta calibrada**: amarelos Potencial em 4 variações (`#FFC528` default, soft, deep, cream) + grafites em 5 camadas (void → border) + neutros light
- **Tipografia Poppins** com 9 pesos (300 a 900) + JetBrains Mono + Instrument Serif
- **8-point grid**: todos espaçamentos em múltiplos de 8 (8, 16, 24, 32, 48, 64)
- **Radius** em múltiplos de 4 (4, 8, 12, 16, 20, 24)
- **Shadows**, transitions, focus rings e animações padronizados

### 📁 Nova arquitetura
```
src/app/
├── lib/
│   ├── designSystem.ts      ← tokens (cores, espaçamentos, tipografia)
│   └── ThemeProvider.tsx    ← context dark/light
├── components/
│   └── ui-premium.tsx       ← Button, Card, Input, Badge, Toggle...
└── styles/
    └── theme.css            ← CSS vars --v6-* + overrides automáticos
```

### 🌓 Como funciona o light mode
1. `ThemeProvider` aplica `data-theme="light"` ou `"dark"` no `<html>`
2. CSS vars `--v6-bg-base`, `--v6-text-primary` etc. mudam automaticamente
3. Overrides em `theme.css` traduzem cores hard-coded antigas (`bg-[#0f0f0f]`) pros tokens
4. O preview dos carrosséis continua escuro (correto — é a arte final pro Instagram)

### 🤖 IA integrada via OpenRouter (v5, mantida)
- Endpoint `api/ia.ts` (Vercel Edge Function)
- 10 modelos disponíveis (4 premium + 6 grátis)
- Parser super tolerante — acha JSON mesmo com texto ao redor

---

## Deploy na Vercel

### 1. Subir projeto
```bash
# Se for primeira vez
npm install -g vercel
vercel login

# Deploy
cd projeto
vercel
```

Ou conecte o repositório via Dashboard Vercel → "Add New Project".

### 2. Configurar chave do OpenRouter
No Dashboard da Vercel:
```
Project → Settings → Environment Variables → Add New
Nome:   OPENROUTER_API_KEY
Valor:  sk-or-v1-xxxxxxxxx  (pegue em openrouter.ai/keys)
```

Depois redeploy pra aplicar.

### 3. Modelos grátis recomendados
Se não quiser gastar nada:
- `google/gemini-2.0-flash-exp:free` (melhor grátis)
- `meta-llama/llama-3.3-70b-instruct:free`
- `deepseek/deepseek-r1:free`

### 4. Modo manual (sem API)
Se preferir não configurar OpenRouter, clique em "Modo avançado (copiar/colar)"
no painel IA e use qualquer chat gratuito (Claude.ai, ChatGPT, Gemini).

---

## Fluxo de uso

### Carrosséis
1. Escolha o **tema visual** (Classic, Refined, Tweet, Keynote)
2. Descreva o tema editorial no painel "Gerar com IA"
3. Clique **"Gerar N slides"** → IA escreve tudo em 10s
4. Ajuste textos, troque fotos (Unsplash ou upload), escolha fontes/cores
5. Baixe ZIP (todos slides em PNG 1080×1350)

### Capas LinkedIn
- **Aba Capa**: uma capa individual por vez
- **Aba Lote**: várias capas em ZIP
- Ícones alinhados ao shape (fix v5)
- Logo Parcele Aqui aumentado

---

## Rodando localmente
```bash
cd projeto
npm install
npm run dev
```

Abra `http://localhost:5173`. Pra testar a função IA localmente precisa:
```bash
npm i -g vercel
vercel dev
```

---

## Sugestão de commit pra v6

```
feat: v6 premium — design system + dark/light toggle + OpenRouter

- Sistema de tokens em lib/designSystem.ts (cores, espaçamentos, radius)
- ThemeProvider com dark/light persistido e toggle sol/lua no header
- Biblioteca de componentes primitivos (ui-premium.tsx)
- Header refatorado: backdrop-blur, pill buttons, badges ativos
- Tipografia Poppins 9 pesos + JetBrains Mono + Instrument Serif
- 8-point grid aplicado em todos espaçamentos
- CSS vars --v6-* com overrides automáticos pra modo claro
- Mantém todas features v5 (4 temas, 21 layouts, IA OpenRouter)
```
