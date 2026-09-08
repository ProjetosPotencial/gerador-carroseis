# v7.7.24 — FIX drag no Carrossel (overlays bloqueando mouse)

## Bug v7.7.23

Reportado: zoom funcionava no Carrossel, mas drag não respondia.

## Causa raiz

Os 4 temas do Carrossel têm vários `<div>` decorativos
posicionados POR CIMA da foto (gradientes de leitura, Topbar com
marca + numeração, divs de conteúdo textual). Esses elementos não
tinham `pointer-events: none`, então capturavam o mouse antes dele
chegar no `FotoOuPlaceholder`.

## Fix v7.7.24

Duas correções complementares:

### 1) `pointer-events: none` nos gradients overlays
Adicionado em todos os divs com `position: absolute; inset: 0;
background: linear-gradient(...)` que ficam por cima da foto:
- tema_classic.tsx: 1 fix (LayoutFotoCheia)
- tema_keynote.tsx: 1 fix
- tema_refined.tsx: 2 fixes

### 2) `z-index: 100` no FotoOuPlaceholder quando draggável
Quando `podeArrastar` é true (zoom > 1 + onPositionChange), o
container da foto recebe `zIndex: 100`. Isso garante que ele fica
ACIMA de qualquer overlay textual/gradient do layout, mesmo os que
não receberam `pointer-events: none`.

Trade-off: enquanto o usuário tá com zoom > 1, os textos do
template ficam visualmente atrás da foto. Como zoom > 1 já
"esconde" partes do layout (a foto cobre mais área), isso é
aceitável e o usuário só fica nesse modo enquanto reposiciona.

## Arquivos editados

- `src/app/components/temas/primitivos.tsx` — z-index 100 quando draggável
- `src/app/components/temas/tema_classic.tsx` — pointer-events:none no gradient
- `src/app/components/temas/tema_keynote.tsx` — idem
- `src/app/components/temas/tema_refined.tsx` — 2x idem
- `package.json` — version 7.7.24

## Validação
- Vite build production: ✅ 1668 módulos, 0 erros

## Texto do commit

**Summary:**
fix: v7.7.24 — Drag da foto no Carrossel funcionando

**Description:**
Bug v7.7.23: zoom no Carrossel funcionava mas drag não respondia.

Causa: gradient overlays e Topbars dos temas ficavam POR CIMA da foto sem pointer-events:none, bloqueando o mouse.

Fix duplo:
1. pointer-events:none adicionado em 4 gradient overlays (tema_classic, tema_keynote, tema_refined)
2. FotoOuPlaceholder ganha z-index:100 quando podeArrastar=true (zoom>1 + onPositionChange), garantindo que fica acima de qualquer overlay

Build OK, 1668 módulos, 0 erros.
