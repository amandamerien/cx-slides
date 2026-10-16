/* Nova estrutura do Design.MD — motor da apresentação (GSAP 3) */
(() => {
  const W = 1920, H = 1080;
  const NAV = ['Contexto', 'Nova estrutura', 'Páginas', 'Próximos passos'];
  const HOLD = 2600; // ms parados em cada slide no modo automático/gravação
  const EASE = 'power3.out';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const stage = document.getElementById('stage');
  const slides = [...document.querySelectorAll('.slide')];
  const counter = document.getElementById('counter');
  let cur = -1, scale = 1, state = null, busy = false, auto = null;

  /* ---------- Montagem estática ---------- */
  slides.forEach(s => {
    const sec = +s.dataset.sec;
    const bar = document.createElement('div');
    bar.className = 'topbar';
    bar.innerHTML = `<img class="logo" src="img/clickmax-logo.png" alt="Clickmax"><nav class="nav">${NAV.map((n, i) => `<span class="${i === sec ? 'on' : ''}">${n}</span>`).join('')}</nav>`;
    s.prepend(bar);
  });

  // Divide os títulos ".words" em palavras para a animação palavra por palavra
  document.querySelectorAll('.words').forEach(el => {
    const parts = [];
    el.childNodes.forEach(n => {
      if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(t => {
        if (!t) return;
        if (/^\s+$/.test(t)) parts.push(document.createTextNode(' '));
        else { const w = document.createElement('span'); w.className = 'w'; w.textContent = t; parts.push(w); }
      });
      else parts.push(n.cloneNode(true));
    });
    el.replaceChildren(...parts);
  });

  /* ---------- Escala 16:9 ---------- */
  function fit() {
    scale = Math.min(innerWidth / W, innerHeight / H);
    stage.style.transform = `translate(${-W * scale / 2}px, ${-H * scale / 2}px) scale(${scale})`;
  }
  addEventListener('resize', fit); fit();

  /* ---------- Utilidades de animação ---------- */
  const up = (y = 40) => ({ y, opacity: 0, duration: .6, ease: EASE });
  const rel = (el, ref) => { // posição de el relativa a ref, no espaço 1920×1080
    const a = el.getBoundingClientRect(), b = ref.getBoundingClientRect();
    return { x: (a.left - b.left) / scale, y: (a.top - b.top) / scale, w: a.width / scale, h: a.height / scale };
  };
  const float = (ctx, el, dy, dx, dur, delay = 0) => ctx.loop(gsap.to(el, { y: `+=${dy}`, x: `+=${dx}`, duration: dur, ease: 'sine.inOut', yoyo: true, repeat: -1, delay }));

  /* Cada builder recebe (s, tl, ctx). ctx.loop() registra animações contínuas;
     ctx.done() registra o que começa quando a entrada termina. */
  const builders = [
    // 1 · Capa: fundo "Waves" em WebGL (js/shader-bg.js)
    (s, tl, ctx) => {
      const q = sel => s.querySelector(sel), qa = sel => s.querySelectorAll(sel);
      const cv = q('.s1-bg');
      cv._bg = cv._bg || window.ShaderBackground(cv);
      cv._bg.frame(0);
      ctx.loop(cv._bg).start(); // para sozinho quando o slide sai (ou com reduced-motion)
      tl.from(cv, { opacity: 0, duration: .9, ease: 'power1.out' }, 0)
        .from(q('.s1-content .pill'), up(20), .3)
        .from(qa('.t-hero > span'), { y: 70, opacity: 0, duration: .8, ease: 'power4.out', stagger: .12 }, .4)
        .from(q('.s1-sub'), up(30), '-=.35')
        .from(q('.s1-by'), up(20), '-=.3');
    },
    // 2 · Como era
    (s, tl) => {
      tl.from(s.querySelector('.pill'), up(20))
        .from(s.querySelector('.t-h2'), up(), '-=.4')
        .from(s.querySelectorAll('.s2-left .body'), { ...up(20), stagger: .12 }, '-=.35')
        .from(s.querySelectorAll('.brand'), { y: 30, scale: .94, opacity: 0, duration: .5, ease: EASE, stagger: .08 }, .3);
    },
    // 3 · O problema
    (s, tl) => {
      tl.from(s.querySelector('.pill'), up(20))
        .from(s.querySelector('.t-h2'), up(), '-=.4')
        .from(s.querySelector('.s3-left .body'), up(20), '-=.35')
        .from(s.querySelectorAll('.pcard'), { x: -80, opacity: 0, duration: .7, ease: EASE, stagger: .22 }, .45)
        .from(s.querySelectorAll('.pcard .num'), { scale: 0, duration: .45, ease: 'back.out(2.4)', stagger: .22 }, .75);
    },
    // 4 · Estilo padrão
    (s, tl) => {
      const b = s.querySelector('.s4-b');
      tl.from(s.querySelector('.top-pill'), up(20))
        .from(s.querySelector('.top-title'), up(), '-=.4')
        .from(s.querySelector('.s4-a'), up(50), '-=.3')
        .from(s.querySelectorAll('.swatches i'), { scale: 0, opacity: 0, duration: .45, ease: 'back.out(2)', stagger: .1 }, '-=.25')
        .from(s.querySelectorAll('.s4-a p'), up(20), '-=.2')
        .from(b, { y: 50, opacity: 0, duration: .6, ease: EASE }, '+=.15')
        .fromTo(b, { boxShadow: '0 0 0 0 rgba(122,193,88,0)' }, { boxShadow: '0 0 0 3px rgba(122,193,88,.9), 0 0 70px 0 rgba(122,193,88,.35)', duration: .4, ease: 'power2.out', yoyo: true, repeat: 1 })
        .from(b.querySelectorAll('.pill'), { scale: .6, opacity: 0, backgroundColor: '#2A2A2C', color: '#A3A5AA', duration: .5, ease: 'back.out(2)', stagger: .12 }, '<')
        .from(b.querySelector('p'), up(20), '-=.2');
    },
    // 5 · Caixa vazia × imagem real (seção "Autoridade" do Figma)
    (s, tl, ctx) => {
      const box = s.querySelector('.emptybox'), swap = s.querySelector('.swap');
      const b = s.querySelector('.s5-b');
      tl.from(s.querySelector('.top-pill'), up(20))
        .from(s.querySelector('.top-title'), up(), '-=.4')
        .from(s.querySelector('.s5-a'), up(50), '-=.3')
        .from(s.querySelector('.s5-a .mockbox'), { opacity: 0, scale: .96, duration: .5, ease: EASE }, '-=.2')
        .from(box, { opacity: 0, duration: .4 }, '-=.1')
        .from(s.querySelector('.s5-a p'), up(20), '-=.2')
        .from(b, { x: 80, opacity: 0, duration: .7, ease: EASE }, '+=.1')
        .from(b.querySelector('.mockbox'), { opacity: 0, duration: .5, ease: 'power2.out' }, '-=.3')
        .from(b.querySelector('.auth-photo'), { opacity: 0, scale: .94, duration: .6, ease: EASE }, '-=.15')
        .from(b.querySelector('.auth-cutout'), { opacity: 0, y: 60, duration: .6, ease: EASE }, '-=.35')
        .from(b.querySelector('.auth-select'), { opacity: 0, scale: 1.04, duration: .4, ease: 'power2.out' }, '-=.2')
        .from(swap, { scale: 0, duration: .5, ease: 'back.out(2.2)' }, '-=.15')
        .from(b.querySelector('p'), up(20), '-=.25');
      ctx.done(() => {
        ctx.loop(gsap.timeline({ repeat: -1, repeatDelay: 1.4 })
          .to(box, { keyframes: [{ x: -14, rotation: -.6 }, { x: 14, rotation: .6 }, { x: -10, rotation: -.4 }, { x: 8, rotation: .2 }, { x: 0, rotation: 0 }], duration: .45, ease: 'none' }));
        ctx.loop(gsap.to(swap, { scale: 1.07, boxShadow: '0 0 0 22px rgba(122,193,88,.28)', duration: .8, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
      });
    },
    // 6 · O que decidimos
    (s, tl, ctx) => {
      const sp = s.querySelector('.sphere');
      tl.from(sp, { scale: .5, opacity: 0, duration: .8, ease: 'back.out(1.4)' }, 0)
        .from(s.querySelector('.pill'), up(20), .1)
        .from(s.querySelectorAll('.w'), { y: 40, opacity: 0, duration: .5, ease: EASE, stagger: .07 }, .3)
        .from(s.querySelector('.lead'), up(20), '-=.2');
      ctx.loop(gsap.to(sp, { scale: 1.06, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: .8 }));
      float(ctx, sp, -14, 0, 3.4);
    },
    // 7 · Fluxo
    (s, tl) => {
      const steps = [...s.querySelectorAll('.step')], last = steps[4];
      tl.from(s.querySelector('.top-pill'), up(20))
        .from(s.querySelector('.top-title'), up(), '-=.4')
        .fromTo(steps, { y: 30, opacity: 0 }, { y: 0, opacity: .28, duration: .5, ease: EASE, stagger: .05 }, '-=.3');
      let t = tl.duration() + .1;
      steps.forEach((st, i) => {
        tl.to(st, { opacity: 1, duration: .4, ease: 'power2.out' }, t)
          .fromTo(st.querySelector('.num'), { scale: .4 }, { scale: 1, duration: .45, ease: 'back.out(2.6)' }, t)
          .fromTo(st, { scale: 1 }, { scale: 1.035, duration: .2, ease: 'power2.out', yoyo: true, repeat: 1 }, t);
        if (i === 4) tl.to(last, { backgroundColor: '#0E0E0E', duration: .45 }, t)
          .to(last.querySelector('h3'), { color: '#7AC158', duration: .45 }, t)
          .to(last.querySelector('p'), { color: '#A3A5AA', duration: .45 }, t)
          .to(last.querySelector('.num'), { backgroundColor: '#2A2A2C', color: '#A3A5AA', duration: .45 }, t + .2);
        t += .32;
      });
      // o último card começa branco e "acende" em preto quando o caminho chega nele
      gsap.set(last, { backgroundColor: '#FFFFFF' });
      gsap.set(last.querySelector('h3'), { color: '#0E0E0E' });
      gsap.set(last.querySelector('p'), { color: '#5E6066' });
      gsap.set(last.querySelector('.num'), { backgroundColor: '#7AC158', color: '#FFFFFF' });
      tl.from(s.querySelector('.flow-note'), up(20), t + .1);
    },
    // 8 · Questionário
    (s, tl) => {
      tl.from(s.querySelector('.pill'), up(20))
        .from(s.querySelector('.t-h2'), up(), '-=.4')
        .from(s.querySelector('.s8-left .body'), up(20), '-=.35')
        .from(s.querySelectorAll('.q'), { x: 90, opacity: 0, duration: .65, ease: EASE, stagger: .45 }, .5)
        .from(s.querySelectorAll('.q .num'), { scale: 0, duration: .45, ease: 'back.out(2.4)', stagger: .45 }, .7);
    },
    // 9 · Etapas do lançamento
    (s, tl) => {
      tl.from(s.querySelector('.pill'), up(20))
        .from(s.querySelector('.t-h2'), up(), '-=.4')
        .from(s.querySelector('.note-card'), up(30), '-=.3');
      s.querySelectorAll('.bar-col').forEach((c, i) => {
        const t = .5 + i * .18;
        tl.from(c.querySelector('.bar'), { scaleY: 0, transformOrigin: '50% 100%', duration: .7, ease: 'power3.out' }, t)
          .from(c.querySelector('.bar-label'), { y: c.querySelector('.bar').offsetHeight * .6, opacity: 0, duration: .7, ease: 'power3.out' }, t);
      });
    },
    // 10 · Oito estruturas
    (s, tl) => {
      tl.from(s.querySelector('.top-pill'), up(20))
        .from(s.querySelector('.top-title'), up(), '-=.4')
        .from(s.querySelector('.side-note'), up(20), '-=.4')
        .from(s.querySelectorAll('.tcard'), { y: 40, scale: .94, opacity: 0, duration: .55, ease: EASE, stagger: .07 }, '-=.2')
        .to(s.querySelectorAll('.hl-green, .hl-black'), { scale: 1.04, duration: .25, ease: 'power2.out', yoyo: true, repeat: 1, stagger: .12 }, '+=.05');
    },
    // 11 · Arquitetura: pílulas voam para a lista (em loop infinito)
    (s, tl, ctx) => {
      const allLps = [...s.querySelectorAll('.lp')], lps = allLps.slice(0, 4);
      const rows = [...s.querySelectorAll('.s11-list .row')];
      // medir antes de qualquer transform
      const flights = lps.map((p, i) => {
        const from = rel(p, s), to = rel(rows[i].querySelector('.rt'), s);
        const f = p.cloneNode(true);
        f.classList.replace('lp', 'flyer');
        Object.assign(f.style, { left: from.x + 'px', top: from.y + 'px', margin: 0 });
        s.appendChild(f);
        return { f, dx: to.x - from.x - 24, dy: to.y + to.h / 2 - (from.y + from.h / 2) };
      });
      gsap.set(flights.map(o => o.f), { opacity: 0 });
      tl.from(s.querySelector('.top-pill'), up(20))
        .from(s.querySelector('.top-title'), up(), '-=.4')
        .from(s.querySelectorAll('.s11 > .card'), { ...up(50), stagger: .12 }, '-=.3')
        .from(allLps, { scale: .6, opacity: 0, duration: .4, ease: 'back.out(2)', stagger: .05 }, '-=.2')
        .from(s.querySelector('.lib-note'), up(20), '-=.2')
        .set(rows.map(r => r.children), { opacity: 0 }, 0);
      // um ciclo de voo: cada pílula sai da biblioteca e pousa na sua linha
      const fly = (target, t) => {
        flights.forEach(({ f, dx, dy }, i) => {
          const row = rows[i];
          target.set(f, { x: 0, y: 0, opacity: 1 }, t)
            .to(f, { keyframes: { x: [0, dx * .5, dx], y: [0, dy - 60, dy], easeEach: 'none' }, duration: .75, ease: 'power2.inOut' }, t)
            .to(f, { opacity: 0, duration: .2 }, t + .7)
            .to(row.children, { opacity: 1, duration: .3, stagger: .05 }, t + .62)
            .fromTo(row.querySelector('.num'), { scale: .4 }, { scale: 1, duration: .4, ease: 'back.out(2.6)' }, t + .62);
          t += .32;
        });
        return t;
      };
      fly(tl, tl.duration() + .15);
      // depois da entrada: a lista esvazia e as pílulas voam de novo, sem parar
      ctx.done(() => {
        const cycle = gsap.timeline({ repeat: -1, delay: 1.8, repeatDelay: 1.8 });
        cycle.to(rows.map(r => r.children), { opacity: 0, duration: .35, ease: 'power1.in', stagger: { each: .04, from: 'end' } }, 0);
        fly(cycle, .7);
        ctx.loop(cycle);
      });
    },
    // 12 · Argumento
    (s, tl, ctx) => {
      const sp = s.querySelector('.sphere');
      tl.from(sp, { scale: .5, opacity: 0, duration: .8, ease: 'back.out(1.4)' }, 0)
        .from(s.querySelector('.top-pill'), up(20), .1)
        .from(s.querySelector('.s12-title'), { y: 60, opacity: 0, duration: .8, ease: 'power4.out' }, .2)
        .from(s.querySelectorAll('.trio .tcard'), { y: 120, opacity: 0, duration: .7, ease: EASE, stagger: .16 }, '-=.2');
      float(ctx, sp, -18, -6, 4.4);
    },
    // 13 · Captura
    sectionsBuilder,
    // 14 · Vendas
    sectionsBuilder,
    // 15 · Outras estruturas
    (s, tl) => {
      const cards = s.querySelectorAll('.dcard');
      tl.from(s.querySelector('.top-pill'), up(20))
        .from(s.querySelector('.top-title'), up(), '-=.4')
        .from(s.querySelector('.side-note'), up(20), '-=.4')
        .fromTo(cards, { y: 30, opacity: 0 }, { y: 0, opacity: .35, duration: .55, ease: EASE, stagger: .1 }, '-=.2')
        .to(cards, { opacity: 1, duration: .8, ease: 'power1.inOut', stagger: .05 }, '+=.35');
    },
    // 16 · Próximos passos
    (s, tl) => {
      const cards = s.querySelectorAll('.ncard');
      tl.from(s.querySelector('.top-pill'), up(20))
        .from(s.querySelector('.top-title'), up(), '-=.4')
        .from(cards, { y: 70, opacity: 0, duration: .65, ease: EASE, stagger: .18 }, '-=.25')
        .from(s.querySelectorAll('.ncard .num'), { scale: 0, duration: .45, ease: 'back.out(2.4)', stagger: .18 }, '<.2')
        .fromTo(cards[0], { boxShadow: '0 0 0 0 rgba(122,193,88,0)' }, { boxShadow: '0 0 60px 6px rgba(122,193,88,.45)', duration: .45, yoyo: true, repeat: 1, ease: 'power2.out' }, '-=.1');
    },
    // 17 · O MD do futuro: carrossel infinito de seções
    (s, tl, ctx) => {
      const tracks = [...s.querySelectorAll('.track')];
      // duplica o conteúdo de cada faixa para o loop não ter emenda
      tracks.forEach(t => { if (!t.dataset.dup) { t.dataset.dup = 1; t.append(...[...t.children].map(c => c.cloneNode(true))); } });
      tl.from(s.querySelector('.top-pill'), up(20))
        .from(s.querySelector('.top-title'), up(), '-=.4')
        .from(s.querySelector('.s17-body'), up(20), '-=.35')
        .from(tracks, { y: 60, opacity: 0, duration: .8, ease: EASE, stagger: .15 }, '-=.3');
      tracks.forEach((t, i) => {
        const half = t.scrollWidth / 2;
        const rev = t.classList.contains('rev');
        ctx.loop(gsap.fromTo(t, { x: rev ? -half : 0 }, { x: rev ? 0 : -half, duration: half / (62 - i * 8), ease: 'none', repeat: -1 })); // ~62px/s e ~54px/s
      });
    },
  ];

  function sectionsBuilder(s, tl) {
    tl.from(s.querySelector('.pill'), up(20))
      .from(s.querySelector('.t-h2b'), up(), '-=.4')
      .from(s.querySelector('.st-left .body'), up(20), '-=.35')
      .from(s.querySelectorAll('.st-bottom > *'), { ...up(20), stagger: .12 }, '-=.3');
    s.querySelectorAll('.sec').forEach((r, i) => {
      const t = .45 + i * .14;
      tl.from(r, { x: 60, opacity: 0, duration: .5, ease: EASE }, t)
        .from(r.querySelector('em'), { scale: .5, opacity: 0, duration: .4, ease: 'back.out(2.2)' }, t + .2);
      if (r.classList.contains('req'))
        tl.fromTo(r, { boxShadow: '0 0 0 0 rgba(122,193,88,0)' }, { boxShadow: '0 0 0 3px rgba(122,193,88,1), 0 0 34px rgba(122,193,88,.45)', duration: .3, yoyo: true, repeat: 1, ease: 'power2.out' }, t + .25);
    });
  }

  /* ---------- Ciclo de vida dos slides ---------- */
  function teardown(st) {
    if (!st) return;
    st.tl.kill();
    st.loops.forEach(l => l.kill());
    st.slide.querySelectorAll('.flyer').forEach(f => f.remove());
    gsap.set(st.slide.querySelectorAll('*'), { clearProps: 'all' });
  }

  function build(i, jump) {
    const s = slides[i];
    const loops = [], doneFns = [];
    const ctx = { loop: a => (loops.push(a), a), done: f => doneFns.push(f) };
    const tl = gsap.timeline({ paused: true });
    builders[i](s, tl, ctx);
    let fired = false;
    const fireDone = () => { if (!fired) { fired = true; doneFns.forEach(f => f()); } };
    tl.eventCallback('onComplete', fireDone);
    const st = { slide: s, tl, loops, fireDone };
    if (reduce.matches) { loops.forEach(l => l.kill()); loops.length = 0; tl.progress(1); }
    else if (jump) { tl.progress(1); fireDone(); }
    else tl.delay(.12).play();
    return st;
  }

  const pending = new Map(); // slide -> estado aguardando limpeza após o fade-out

  function go(n, opts = {}) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === cur && !opts.force) return;
    const back = opts.jump ?? (n < cur);
    const prevState = state, prevSlide = prevState?.slide, next = slides[n];
    cur = n;
    counter.textContent = `${n + 1} / ${slides.length}`;
    history.replaceState(null, '', location.search + `#${n + 1}`);

    // se o slide de destino ainda está saindo, limpa-o já
    if (pending.has(next)) { gsap.killTweensOf(next); teardown(pending.get(next)); pending.delete(next); }

    if (prevSlide && prevSlide !== next) {
      prevState.tl.pause();
      pending.set(prevSlide, prevState);
      prevSlide.style.zIndex = 1;
      gsap.to(prevSlide, { opacity: 0, duration: reduce.matches ? .2 : .45, ease: 'power2.inOut', onComplete: () => {
        prevSlide.classList.remove('active');
        gsap.set(prevSlide, { clearProps: 'opacity,zIndex' });
        teardown(prevState); pending.delete(prevSlide);
      } });
    } else teardown(prevState);

    next.classList.add('active');
    next.style.zIndex = 2;
    gsap.fromTo(next, { opacity: 0 }, { opacity: 1, duration: reduce.matches ? .2 : .5, ease: 'power2.out' });
    state = build(n, back);
  }

  const next = () => go(cur + 1);
  const prev = () => go(cur - 1);

  /* ---------- Entrada ---------- */
  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) { e.preventDefault(); stopAuto(); next(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); stopAuto(); prev(); }
    else if (k === 'Home') { stopAuto(); go(0, { jump: false }); }
    else if (k === 'End') { stopAuto(); go(slides.length - 1); }
    else if (k === 'f' || k === 'F') toggleFull();
    else if (k === 'h' || k === 'H') document.body.classList.toggle('show-help');
    else if (k === 'p' || k === 'P') auto ? stopAuto() : runAuto();
    else if (k === 'r' || k === 'R') record();
    else if (/^[1-9]$/.test(k)) { stopAuto(); go(+k - 1, { jump: false }); }
  });
  addEventListener('click', e => { if (document.body.classList.contains('recording')) return; stopAuto(); e.shiftKey ? prev() : next(); });
  addEventListener('contextmenu', e => { e.preventDefault(); stopAuto(); prev(); });

  let hudTimer;
  addEventListener('mousemove', () => {
    document.body.classList.add('show-hud');
    clearTimeout(hudTimer); hudTimer = setTimeout(() => document.body.classList.remove('show-hud'), 1800);
  });

  function toggleFull() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }

  /* ---------- Modo automático ---------- */
  const wait = ms => new Promise(r => setTimeout(r, ms));
  function stopAuto() { if (auto) auto.cancelled = true; auto = null; }
  async function runAuto(from = cur) {
    const run = { cancelled: false }; auto = run;
    go(from, { force: true, jump: false });
    while (!run.cancelled) {
      await wait(state.tl.totalDuration() * 1000 + HOLD);
      if (run.cancelled) break;
      if (cur >= slides.length - 1) break;
      next();
    }
    if (auto === run) auto = null;
    return !run.cancelled;
  }

  /* ---------- Gravação em vídeo (MP4 quando o navegador suporta) ---------- */
  async function record() {
    if (document.body.classList.contains('recording')) return;
    if (!navigator.mediaDevices?.getDisplayMedia || !window.MediaRecorder) {
      alert('Este navegador não suporta gravação de aba. Use o Google Chrome.'); return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 60, width: { ideal: 1920 }, height: { ideal: 1080 }, displaySurface: 'browser' },
        audio: false, preferCurrentTab: true, selfBrowserSurface: 'include',
      });
    } catch { return; }
    const types = ['video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
    const mimeType = types.find(t => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 16_000_000 });
    const chunks = [];
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    const stopped = new Promise(r => (rec.onstop = r));

    document.body.classList.add('recording');
    stopAuto();
    gsap.set(stage, { opacity: 0 });
    await wait(1200);                    // dá tempo do aviso de compartilhamento sumir
    rec.start(250);
    await wait(200);
    gsap.to(stage, { opacity: 1, duration: .6, delay: .1 });
    await runAuto(0);
    gsap.set(stage, { clearProps: 'opacity' });
    await wait(600);
    rec.stop(); stream.getTracks().forEach(t => t.stop());
    await stopped;
    document.body.classList.remove('recording');

    const ext = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(chunks, { type: mimeType.split(';')[0] }));
    a.download = `nova-estrutura-design-md.${ext}`;
    document.body.appendChild(a); a.click(); a.remove();
  }

  // acesso para depuração no console: deck.go(4), deck.state().tl.progress(1)
  window.deck = { go: (n, o) => go(n, o), state: () => state };

  /* ---------- Início ---------- */
  const start = Math.max(0, (parseInt(location.hash.slice(1), 10) || 1) - 1);
  document.fonts.ready.then(() => {
    go(start, { jump: false });
    if (new URLSearchParams(location.search).has('autoplay')) runAuto(start);
  });
})();
