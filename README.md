# Nova estrutura do Design.MD — apresentação animada

16 slides em HTML/CSS/JS, 1920×1080 escalando para qualquer tela. Animações com GSAP 3.12.5 (já incluso em `vendor/`) e fonte Poppins local em `fonts/`. Funciona offline.

## Abrir

- **Online:** https://amandamerien.github.io/cx-slides/ (GitHub Pages; atualiza sozinho a cada push na `main`).
- **Mais simples:** dê dois cliques em `index.html` (Chrome recomendado).
- **Via servidor local:** dê dois cliques em `abrir.command` (abre em `http://localhost:8766`).
  Ou no Terminal, dentro desta pasta: `python3 -m http.server 8766` e abra `http://localhost:8766`.

## Atalhos

| Tecla | Ação |
|---|---|
| → · Espaço · Enter · clique | avançar |
| ← · Shift+clique · clique direito | voltar (o slide aparece já montado) |
| 1–9 · Home · End | ir direto a um slide |
| F | tela cheia |
| P | apresentação automática (liga/desliga) |
| R | gravar vídeo |
| H | mostrar/ocultar a ajuda |

`index.html#7` abre direto no slide 7; `index.html?autoplay` já começa no modo automático.

## Gravar como vídeo (MP4)

1. Abra no **Google Chrome** (o Chrome grava em MP4; o Safari também; navegadores sem suporte a MP4 gravam em WebM).
2. Deixe a janela em 1920×1080 ou maior, ou aperte **F** para tela cheia.
3. Aperte **R**, escolha **esta aba** no aviso de compartilhamento e confirme.
4. A apresentação roda sozinha do slide 1 ao 16 (cada slide fica ~2,6 s parado após a animação) e, ao final, baixa `nova-estrutura-design-md.mp4`.

Alternativa sem o botão: aperte **P** e grave a tela com o QuickTime (`⌘ + Shift + 5` → Gravar tela inteira).
Para converter um WebM em MP4 (se precisar): `ffmpeg -i video.webm -c:v libx264 -pix_fmt yuv420p video.mp4`.

## Exportar como PDF (estático)

No Chrome: `⌘ + P` → Destino **Salvar como PDF** → Margens **Nenhuma** → marque **Gráficos de plano de fundo**.
Cada slide vira uma página 1920×1080 no estado final.

## Cores

Paleta do Figma Clickmax: verde `#7AC158` (pílulas, números, destaques), gradiente `#B9ED80 → #85CD44 → #48B879` (orbes e cards verdes), preto `#0E0E0E`, cinza `#E9EAEC`. Tudo em variáveis no topo de `css/style.css`.

## Estrutura

```
index.html        conteúdo dos 16 slides
css/style.css     visual (cores, tipografia, layout de cada slide)
js/main.js        navegação, escala 16:9, animações por slide, autoplay e gravação
img/clickmax-logo.png  logo exportado do Figma (preto; nos slides escuros fica branco via CSS)
img/autoridade-*  foto, recorte e letras decorativas da seção "Autoridade" (Figma Pixel Builder), usada no slide 5
vendor/gsap.min.js
fonts/            Poppins 400/500/600/700; Inter e Archivo (só na seção do slide 5)
```

As animações de cada slide ficam no array `builders` em `js/main.js`, na mesma ordem dos slides.
Com `prefers-reduced-motion` ativo no sistema, os slides aparecem já montados, só com um fade curto.
