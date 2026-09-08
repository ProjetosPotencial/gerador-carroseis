# PROMPT PARA FIGMA MAKE — Sistema de Capas Parcele News

Crie um sistema de geração de capas para LinkedIn do Parcele Aqui (marca financeira/fintech brasileira). O sistema deve produzir 60 capas seguindo rigorosamente o mesmo template visual, variando apenas título, número, ícone e foto.

---

## 1. ESPECIFICAÇÕES TÉCNICAS DA CAPA

**Dimensões exatas:** 1200 × 675 pixels (proporção 16:9, ideal LinkedIn)
**Resolução de export:** 2x (2400 × 1350) para qualidade retina
**Formato de saída:** PNG

---

## 2. PALETA DE CORES (use variáveis/tokens)

- **Amarelo principal (fundo do card):** `#FFC528`
- **Preto (textos e ícones):** `#1a1a1a`
- **Branco (fundo da página e card do ícone):** `#FFFFFF`
- **Cinza foto (placeholder):** gradiente linear 135° de `#d4cfc4` para `#b8b2a5`

---

## 3. TIPOGRAFIA

- **Fonte principal:** Inter (ou substitua pela fonte oficial do brand book se souber)
- **Hierarquia de pesos:**
  - Logo "parcele" → weight 700
  - Logo "aqui" → weight 800
  - "Parcele News" (label) → 15px, weight 600
  - "#XX" (número) → 28px, weight 900, letter-spacing -0.02em
  - **Título principal → 44px, weight 800, line-height 1.12, letter-spacing -0.025em**
  - Legenda sobre foto (linha 1) → 18px, weight 500
  - Legenda sobre foto (linha 2, destaque) → 18px, weight 800

---

## 4. ESTRUTURA DO LAYOUT

### 4.1. Fundo geral
Página inteira 1200×675 com fundo branco (`#FFFFFF`) e padding externo de 30px.

### 4.2. Header (topo, fora do card amarelo)
Posição: 30px do topo, 50px das laterais
Dois elementos lado a lado (justify-between):

**Esquerda — Logo:**
- Marca quadrada 34×34px com cantos arredondados 8px, fundo `#FFC528`
  - Dentro: círculo de 14×14px com borda preta de 3px
  - Ao lado do círculo, forma de "gota" preta (simulando logo Parcele Aqui)
- Texto "parcele" + "aqui" (aqui em bold), 20px, cor preta, letter-spacing -0.02em
- Gap entre marca e texto: 10px

**Direita — Badge de edição:**
- Duas linhas alinhadas à direita:
  - "Parcele News" (15px, weight 600)
  - "#{número}" (28px, weight 900)
- Line-height compacto: 1.1

### 4.3. Card amarelo principal
- Posição: top 85px, bottom 30px, left 30px, right 30px
- Fundo `#FFC528`
- Border-radius: 24px
- Overflow hidden
- Display flex (2 colunas)
- **Detalhe decorativo:** no canto superior direito do card, uma "mordida" de 300×60px em fundo amarelo com border-radius `0 0 0 60px` (cria curva suave onde a foto encontra o topo)

### 4.4. Lado esquerdo do card (flex: 1, max-width: 640px)
Padding: 50px 45px
Display flex, direção coluna, justify-content: space-between

**Topo:** Ícone em card branco
- 64×64px, fundo branco, border-radius 16px
- Sombra sutil: `0 2px 8px rgba(0,0,0,0.06)`
- Dentro: SVG de 34×34px (ícone temático do bloco)

**Base:** Título principal
- Até 3 linhas de texto em preto
- Max-width 560px
- Font-size 44px, weight 800, line-height 1.12

### 4.5. Lado direito do card (width: 520px)
Padding: 30px 30px 30px 0 (sem padding à esquerda — colado ao centro)
Display flex, align-items: flex-end

**Container da foto:**
- 100% width, 100% height
- **Border-radius especial:** `140px 24px 24px 24px` (apenas o canto superior esquerdo é MUITO arredondado, criando o formato orgânico característico)
- Fundo gradiente cinza (placeholder) OU foto real
- Overflow hidden
- Foto com object-fit: cover

**Legenda sobrepondo a foto (bottom-left):**
- Posição absoluta: bottom 60px, left 30px, right 60px
- Cor branca
- Text-shadow: `0 2px 12px rgba(0,0,0,0.4)` (legibilidade sobre qualquer foto)
- Duas linhas:
  - Linha 1 (regular): "Tecnologia que destrava"
  - Linha 2 (bold/800): texto variável por bloco

---

## 5. OS 6 BLOCOS (cada um com ícone + legenda próprios)

Cada capa pertence a um dos 6 blocos. O bloco define:
- Qual ícone SVG vai dentro do card branco
- Qual é a "linha bold" da legenda da foto

### BLOCO 1 — MEIOS DE PAGAMENTO (capas #1 a #10)
- **Ícone:** cartão de crédito (retângulo arredondado com faixa magnética e chip)
- **Legenda bold:** "o seu dia a dia financeiro."
- **SVG:**
```svg
<svg viewBox="0 0 24 24" fill="none">
  <rect x="2" y="5" width="20" height="14" rx="2.5" stroke="#1a1a1a" stroke-width="2"/>
  <rect x="2" y="9" width="20" height="2" fill="#1a1a1a"/>
  <rect x="5" y="14" width="5" height="1.5" rx="0.75" fill="#1a1a1a"/>
</svg>
```

### BLOCO 2 — NOTÍCIAS DE PAGAMENTOS (capas #11 a #20)
- **Ícone:** jornal/documento com notificação (retângulo com 3 linhas de texto + círculo amarelo no canto)
- **Legenda bold:** "as principais notícias do mercado."
- **SVG:**
```svg
<svg viewBox="0 0 24 24" fill="none">
  <path d="M3 5c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5z" stroke="#1a1a1a" stroke-width="2"/>
  <line x1="6" y1="7" x2="16" y2="7" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  <line x1="6" y1="11" x2="16" y2="11" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  <line x1="6" y1="15" x2="12" y2="15" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  <circle cx="19" cy="6" r="2.5" fill="#FFC528" stroke="#1a1a1a" stroke-width="2"/>
</svg>
```

### BLOCO 3 — PARCELAMENTO DE BOLETOS (capas #21 a #30)
- **Ícone:** código de barras dentro de um retângulo (boleto)
- **Legenda bold:** "o parcelamento dos seus boletos."
- **SVG:**
```svg
<svg viewBox="0 0 24 24" fill="none">
  <rect x="3" y="4" width="18" height="16" rx="2" stroke="#1a1a1a" stroke-width="2"/>
  <line x1="6" y1="8" x2="6" y2="16" stroke="#1a1a1a" stroke-width="1.5"/>
  <line x1="8" y1="8" x2="8" y2="16" stroke="#1a1a1a" stroke-width="2.5"/>
  <line x1="10.5" y1="8" x2="10.5" y2="16" stroke="#1a1a1a" stroke-width="1"/>
  <line x1="12.5" y1="8" x2="12.5" y2="16" stroke="#1a1a1a" stroke-width="2"/>
  <line x1="14.5" y1="8" x2="14.5" y2="16" stroke="#1a1a1a" stroke-width="1.5"/>
  <line x1="16.5" y1="8" x2="16.5" y2="16" stroke="#1a1a1a" stroke-width="1"/>
  <line x1="18" y1="8" x2="18" y2="16" stroke="#1a1a1a" stroke-width="2"/>
</svg>
```

### BLOCO 4 — SETORES (capas #31 a #40)
- **Ícone:** três prédios de alturas diferentes com janelinhas (skyline)
- **Legenda bold:** "o seu setor com mais flexibilidade."
- **SVG:**
```svg
<svg viewBox="0 0 24 24" fill="none">
  <rect x="3" y="8" width="6" height="12" stroke="#1a1a1a" stroke-width="2"/>
  <rect x="9" y="3" width="6" height="17" stroke="#1a1a1a" stroke-width="2"/>
  <rect x="15" y="11" width="6" height="9" stroke="#1a1a1a" stroke-width="2"/>
  <rect x="5" y="11" width="1.5" height="1.5" fill="#1a1a1a"/>
  <rect x="5" y="15" width="1.5" height="1.5" fill="#1a1a1a"/>
  <rect x="11" y="6" width="1.5" height="1.5" fill="#1a1a1a"/>
  <rect x="11" y="10" width="1.5" height="1.5" fill="#1a1a1a"/>
  <rect x="11" y="14" width="1.5" height="1.5" fill="#1a1a1a"/>
  <rect x="17" y="14" width="1.5" height="1.5" fill="#1a1a1a"/>
</svg>
```

### BLOCO 5 — PIX PARCELADO (capas #41 a #50)
- **Ícone:** losango do Pix com flecha interna (símbolo oficial estilizado)
- **Legenda bold:** "o futuro do Pix Parcelado."
- **SVG:**
```svg
<svg viewBox="0 0 24 24" fill="none">
  <path d="M12 2L22 12L12 22L2 12L12 2Z" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round"/>
  <path d="M8 12L10.5 9.5C11.3 8.7 12.7 8.7 13.5 9.5L16 12" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 12L10.5 14.5C11.3 15.3 12.7 15.3 13.5 14.5L16 12" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

### BLOCO 6 — FINTECHS E INOVAÇÕES (capas #51 a #60)
- **Ícone:** lâmpada com raio/relâmpago amarelo dentro (inovação + energia)
- **Legenda bold:** "a inovação nos pagamentos."
- **SVG:**
```svg
<svg viewBox="0 0 24 24" fill="none">
  <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round"/>
  <line x1="9" y1="21" x2="15" y2="21" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  <path d="M12 6L10.5 10H13.5L12 14" stroke="#FFC528" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

---

## 6. OS 60 TÍTULOS (já otimizados para caber em 3 linhas)

### BLOCO 1 — Meios de Pagamento
1. Pix domina, boleto parcelado cresce e cartão entra em crise
2. Embedded finance cresce 300% com pagamentos nativos em plataformas
3. Open Finance redefine personalização dos pagamentos com dados inteligentes
4. Cobrança híbrida Pix-boleto obrigatória transforma flexibilidade nos pagamentos
5. Pix por aproximação fracassa e QR codes trazem lições ao mercado
6. IA garante segurança em transações digitais com detecção de fraude em tempo real
7. Omnichannel integra parcelamento em WhatsApp, QR code, e-commerce, app e totem
8. Dados em tempo real guiam decisões e eficiência nos pagamentos
9. Inovação acelerada via Venture Builder cria novos modelos em pagamentos
10. Programa de afiliados gera receita recorrente de 1,5% em cada transação

### BLOCO 2 — Notícias de Pagamentos
11. Pix bate recorde e consolida liderança nos pagamentos no Brasil
12. Mercado Pago entra no boleto parcelado e acirra competição com Parcele Aqui
13. Forbes destaca fintechs promissoras e tendências em pagamentos em 2026
14. BC anuncia cobrança híbrida e duplicatas via Pix para 2026
15. Pix por aproximação completa 1 ano com 0,01% de adesão e QR vence disputa
16. BC confirma Pix Parcelado para 2026 com atraso de 6 meses
17. Tendências 2026: IA, Open Finance e Embedded Finance dominam o mercado
18. Regulação do BC coloca conformidade e segurança em primeiro lugar
19. Venture Builder acelera inovação e cria startups do zero no mercado
20. Programas de afiliados explodem em 2026 com comissão em cada transação

### BLOCO 3 — Parcelamento de Boletos
21. Mercado Pago lança boleto parcelado e acirra competição no mercado
22. Parcele Aqui cresce de forma exponencial com operação nacional consolidada
23. Parcelamento reduz inadimplência com dados reais divulgados pelo BC
24. Integração técnica sincroniza API, link, QR Code e WhatsApp no parcelamento
25. Certificações ISO, PCI DSS e LGPD garantem segurança no parcelamento
26. Liquidação em tempo real transforma fluxo de caixa no parcelamento
27. Comissão de 1,5% consolida modelo de receita recorrente comprovado
28. Até 3 cartões na mesma operação ampliam flexibilidade no parcelamento
29. Plataforma whitelabel ou original: qual escolher para seu negócio?
30. Futuro do parcelamento: Pix Parcelado, boleto parcelado ou cartão?

### BLOCO 4 — Setores
31. Setor imobiliário parcela ITBI, IPTU, caução, reforma e registro
32. Contábeis parcelam tributos, DAS, ICMS, IRPJ e encargos trabalhistas
33. Varejo aumenta ticket médio e conversão com parcelamento estratégico
34. B2B usa parcelamento de prazos para fluxo de caixa e melhor negociação
35. Saúde cresce com parcelamento de procedimentos, consultas e medicamentos
36. Educação democratiza acesso com parcelamento de mensalidades e cursos
37. Serviços aumentam contratos com parcelamento de honorários, taxas e encargos
38. Governo aumenta arrecadação com parcelamento de taxas, multas e regularizações
39. PMEs reduzem inadimplência e crescem com parcelamento para clientes
40. Grandes empresas ganham eficiência com parcelamento em volume e automação

### BLOCO 5 — Pix Parcelado
41. Pix Parcelado chega em 2026 após atraso de 6 meses pelo BC
42. Pix Parcelado democratiza crédito e abre acesso para classes D e E
43. Pix Parcelado aumenta conversão e ticket médio no varejo
44. Pix Parcelado surge como alternativa ao boleto parcelado
45. Open Finance integra Pix Parcelado com personalização avançada
46. Segurança no Pix Parcelado garantida por regulação do BC e certificações
47. Pix Parcelado oferece limite de parcelamento flexível em até 12x
48. Taxa zero no Pix Parcelado desafia juros altos do cartão
49. Cobrança híbrida Pix-boleto amplia opções e conversão nos pagamentos
50. Futuro dos pagamentos: Pix Parcelado, boleto e cartão em disputa

### BLOCO 6 — Fintechs e Inovações
51. IA em detecção de fraude usa algoritmos avançados em tempo real
52. Open Finance com 60% das instituições habilita personalização de pagamentos
53. Embedded finance cresce 300% e integra pagamentos em plataformas
54. LGPD garante proteção de dados pessoais em pagamentos digitais
55. Venture Builder do Grupo Potencial acelera inovação em pagamentos
56. Connect Pay cria rede de pontos substabelecidos para serviços financeiros
57. Wallee revoluciona e-commerce com checkout invertido integrado
58. Conta Democrática traz conta digital transparente para campanhas políticas
59. Parcerias estratégicas fortalecem ecossistema completo de pagamentos
60. Futuro dos pagamentos une IA, Open Finance, Pix e blockchain em 2026-2027

---

## 7. O QUE VOCÊ PRECISA ENTREGAR

1. **Um componente master no Figma** chamado `Capa Parcele News` com as seguintes propriedades editáveis (variants ou component properties):
   - `numero` (texto) → aparece no "#XX"
   - `titulo` (texto) → título principal com auto-layout que quebra em até 3 linhas
   - `bloco` (variant com 6 opções) → troca o ícone e a legenda bold automaticamente
   - `foto` (image fill) → permite arrastar foto direto pro slot da foto

2. **60 instâncias do componente** organizadas em 6 frames (um por bloco), com:
   - Cada instância preenchida com o título correspondente da lista acima
   - Numeração sequencial de #01 a #60
   - Bloco correto selecionado no variant
   - Slot de foto vazio (placeholder) — foto será adicionada manualmente depois

3. **Auto-layout configurado** em todos os grupos de texto para que títulos mais longos ou mais curtos se acomodem automaticamente sem quebrar o layout.

4. **Estilos de cor** criados como variáveis globais (`brand/amarelo`, `brand/preto`, `brand/branco`).

5. **Estilo de texto** criado para cada nível (`display/titulo`, `ui/label`, `ui/numero`, `overlay/caption`).

6. **Export configurado** em cada instância para PNG 2x.

---

## 8. OBSERVAÇÕES IMPORTANTES

- **O card amarelo tem um detalhe de "curva" no canto onde a foto encontra o topo** — mantenha esse recorte característico (border-radius top-left grande na foto = 140px).
- **A legenda sobre a foto deve ter sombra de texto forte** (`text-shadow`) para garantir legibilidade sobre qualquer foto clara ou escura.
- **O título principal é o elemento mais importante** — priorize legibilidade, quebra natural de linha e respiro em torno do texto.
- **Mantenha consistência total entre as 60 capas** — só o que muda é título, número, ícone (6 variantes) e foto. Todo o resto é fixo.
- **A marca é Parcele Aqui**, fintech brasileira especializada em parcelamento de boletos em cartão de crédito, parte do Grupo Potencial.

---

## 9. RESULTADO ESPERADO

Ao final, eu devo conseguir:
- Abrir o arquivo do Figma
- Ver 60 capas prontas, organizadas por bloco
- Selecionar uma capa, arrastar uma foto no slot da foto → a foto se adapta ao recorte automaticamente
- Exportar em PNG 2x com um clique
- Editar o texto/número de qualquer capa e o layout se ajusta sozinho

Crie este sistema completo, com todas as 60 capas já geradas e prontas para uso.