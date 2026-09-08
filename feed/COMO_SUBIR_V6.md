# 🚀 Como subir a v6 limpa no GitHub (via GitHub Desktop)

## Passo 1 — Instalar GitHub Desktop
1. Baixe: https://desktop.github.com/
2. Instale e abra
3. Faça login com sua conta GitHub
4. Aceite as permissões

## Passo 2 — Clonar o repositório
1. No GitHub Desktop: **File → Clone Repository**
2. Na aba "GitHub.com", procure `ProjetosPotencial/gerador-carroseis`
3. Escolha uma pasta local (ex: `~/Documents/GitHub/`)
4. Clica "Clone"
5. Aguarda baixar

## Passo 3 — Limpar o conteúdo atual (MUITO IMPORTANTE)
1. Abre a pasta do repo no Finder/Explorer (botão "Show in Finder" no GitHub Desktop)
2. **Seleciona TODOS os arquivos e pastas** (Ctrl+A / Cmd+A)
3. **EXCETO a pasta oculta `.git`** — essa você NÃO deleta (se não aparecer pasta oculta, tudo bem, deleta o que vê mesmo)
4. Apaga tudo (Delete)
5. A pasta agora deve estar vazia (só com `.git` oculto dentro)

💡 Dica: se você não consegue ver arquivos ocultos:
- **Mac**: Cmd + Shift + . (ponto)
- **Windows**: Explorer → Ver → Mostrar → Itens ocultos

## Passo 4 — Extrair e copiar o ZIP da v6
1. Baixa o arquivo `gerador_potencial_v6_raiz_limpa.zip` que entreguei
2. Extrai/descompacta ele em qualquer lugar
3. Abre a pasta extraída
4. **Seleciona TUDO que tá dentro** (Ctrl+A / Cmd+A)
5. Copia (Ctrl+C / Cmd+C)
6. Vai pra pasta do repo clonado (aquela que você esvaziou no Passo 3)
7. Cola (Ctrl+V / Cmd+V)

## Passo 5 — Commitar no GitHub Desktop
1. Volta pro GitHub Desktop
2. Ele vai mostrar **todas as mudanças** no painel esquerdo (uns 70+ arquivos)
3. No canto inferior esquerdo, preenche:
   - **Summary**: `feat: reorganização completa v6`
   - **Description**: `Sistema de design premium + ThemeProvider dark/light + 4 temas + OpenRouter integration`
4. Clica **"Commit to main"** (botão azul)
5. Clica **"Push origin"** (canto superior)
6. Aguarda terminar (1-3 minutos)

## Passo 6 — Verificar deploy na Vercel
1. Abre vercel.com → Dashboard → seu projeto
2. Aba **Deployments** — deve aparecer um deploy novo "Building"
3. Aguarda 30-60s até ficar "Ready"
4. Clica no deploy e clica **Visit**
5. Hard reload com **Ctrl+Shift+R**
6. O footer agora deve mostrar **v6.0.0**

## ✅ Como saber se deu certo
- ✅ Footer mostra "v6.0.0"
- ✅ Header tem botão sol/lua (toggle dark/light) no canto direito
- ✅ Aba Carrossel tem 4 temas: Classic, Refined, Tweet Style, Keynote Minimal
- ✅ Cada tema tem vários layouts disponíveis
- ✅ Botão "Gerar com IA" chama a API do OpenRouter

## ❌ Se algo der errado
- **Deploy com erro**: Clique no deploy na Vercel → aba Build Logs → me manda print
- **Tela branca**: Abre o console do navegador (F12) → aba Console → me manda print dos erros
- **Commit deu conflict**: GitHub Desktop vai avisar, clique "Resolve conflicts" e me pergunte
