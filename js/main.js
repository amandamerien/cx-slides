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
    // 3 · O problema: os cards chegam como vidro estilhaçado
    (s, tl, ctx) => {
      const src = s.querySelector('.s3-cards');
      const sh = s.querySelector('.shatter') || buildShatter(s, src);
      const shards = [...sh.querySelectorAll('.shard')];
      const tilt = sh.querySelector('.tilt'), inner = sh.querySelector('.inner'), impact = sh.querySelector('.impact');
      tl.from(s.querySelector('.pill'), up(20))
        .from(s.querySelector('.t-h2'), up(), '-=.4')
        .from(s.querySelector('.s3-left .body'), up(20), '-=.35');
      // impacto: os cacos voam de fora e se encaixam, mas ficam quebrados
      shards.forEach((el, i) => {
        const d = el._d;
        tl.fromTo(el, {
          x: d.ux * (260 + d.ring * 220), y: d.uy * (260 + d.ring * 220), z: 420,
          rotationZ: (Math.random() - .5) * 50, rotationX: (Math.random() - .5) * 70, rotationY: (Math.random() - .5) * 70, opacity: 0,
        }, { x: d.fx, y: d.fy, z: d.z, rotationZ: d.rz, rotationX: d.rx, rotationY: d.ry, opacity: 1, duration: .8, ease: 'power3.out' }, .4 + (d.ring * .12) + (i % 8) * .025);
      });
      tl.fromTo(impact, { opacity: .95, scale: .2 }, { opacity: 0, scale: 1.8, duration: .7, ease: 'power2.out' }, 1.15)
        .fromTo(sh, { x: 0 }, { keyframes: [{ x: -7 }, { x: 6 }, { x: -3 }, { x: 0 }], duration: .32, ease: 'none' }, 1.15);

      // luz especular: cada caco brilha conforme a direção da inclinação
      const light = (mx, my) => {
        const ma = Math.atan2(my, mx), k = Math.min(1, Math.hypot(mx, my));
        shards.forEach(el => el.style.setProperty('--spec', (.04 + .34 * k * Math.max(0, Math.cos(el._d.a - ma))).toFixed(3)));
      };
      light(.4, -.6);
      // sem mouse: o painel oscila sozinho (funciona no autoplay e na gravação)
      const idle = { t: 0 };
      ctx.loop(gsap.to(idle, { t: Math.PI * 2, duration: 9, ease: 'none', repeat: -1, onUpdate: () => {
        const ry = Math.sin(idle.t) * 5, rx = Math.cos(idle.t * 1.3) * 3;
        gsap.set(inner, { rotationY: ry, rotationX: rx });
        if (!mouse) light(ry / 5, -rx / 3);
      } }));
      // com mouse: inclina e cria paralaxe entre os cacos
      let mouse = false, mt;
      const toY = gsap.quickTo(tilt, 'rotationY', { duration: .6, ease: 'power3.out' });
      const toX = gsap.quickTo(tilt, 'rotationX', { duration: .6, ease: 'power3.out' });
      const onMove = e => {
        const mx = e.clientX / innerWidth * 2 - 1, my = e.clientY / innerHeight * 2 - 1;
        mouse = true; clearTimeout(mt); mt = setTimeout(() => { mouse = false; toY(0); toX(0); }, 2500);
        toY(mx * 9); toX(-my * 7); light(mx, my);
      };
      addEventListener('mousemove', onMove);
      ctx.loop({ kill: () => { removeEventListener('mousemove', onMove); clearTimeout(mt); } });
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
    (s, tl) => {
      tl.from(s.querySelector('.pill'), up(20))
        .from(s.querySelectorAll('.w'), { y: 40, opacity: 0, duration: .5, ease: EASE, stagger: .07 }, .2)
        .from(s.querySelector('.lead'), up(20), '-=.2');
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
    (s, tl) => {
      tl.from(s.querySelector('.top-pill'), up(20))
        .from(s.querySelector('.s12-title'), { y: 60, opacity: 0, duration: .8, ease: 'power4.out' }, .1)
        .from(s.querySelectorAll('.trio .tcard'), { y: 120, opacity: 0, duration: .7, ease: EASE, stagger: .16 }, '-=.2');
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
    // 16 · Próximos passos: fotos presas por mola (Cabral em vermelho, Amanda em verde)
    (s, tl, ctx) => {
      const solo = s.querySelector('.solo'), group = s.querySelector('.s16-group');
      const cards = s.querySelectorAll('.ncard');
      // âncoras medidas antes de qualquer transform da entrada
      const a1 = rel(solo, s), a2 = rel(group, s);
      const springs = [
        makeSpring(ctx, s.querySelector('.avatar.red'), s.querySelector('.spr.red'), { x: a1.x + a1.w * .72, y: a1.y }, { x: 62, y: -78 }),
        makeSpring(ctx, s.querySelector('.avatar.green'), s.querySelector('.spr.green'), { x: a2.x + a2.w * .74, y: a2.y + a2.h }, { x: 132, y: -6 }),
      ];
      tl.from(s.querySelector('.top-pill'), up(20))
        .from(s.querySelector('.top-title'), up(), '-=.4')
        .from(solo, { y: 70, opacity: 0, duration: .65, ease: EASE }, '-=.25')
        .from(group, { opacity: 0, scale: .97, duration: .6, ease: EASE }, '-=.45')
        .from(group.querySelectorAll('.ncard'), { y: 50, opacity: 0, duration: .6, ease: EASE, stagger: .14 }, '-=.4')
        .from(s.querySelectorAll('.ncard .num'), { scale: 0, duration: .45, ease: 'back.out(2.4)', stagger: .12 }, '-=.5')
        .fromTo(cards[0], { boxShadow: '0 0 0 0 rgba(122,193,88,0)' }, { boxShadow: '0 0 60px 6px rgba(122,193,88,.45)', duration: .45, yoyo: true, repeat: 1, ease: 'power2.out' }, '-=.1');
      // as fotos saltam da âncora quando os cards já estão no lugar
      springs.forEach((sp, i) => tl.call(() => sp.launch(), null, tl.duration() - .5 + i * .25));
      tl.from(s.querySelectorAll('.avatar, .spr'), { opacity: 0, duration: .25 }, tl.duration() - .75);
      ctx.done(() => springs.forEach(sp => sp.wake())); // ao voltar para o slide (já montado), a mola segue viva
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

  /* ---------- Mola (slide 16), porte do "spring-element" do 21st.dev sem React ---------- */
  function springPath(x1, y1, x2, y2, { coils = 9, ampMin = 9, ampMax = 22, crMin = .5, crMax = 1, bez = 9 } = {}) {
    const dx = x2 - x1, dy = y2 - y1, dist = Math.hypot(dx, dy);
    if (dist < 2) return `M${x1},${y1}`;
    const d = dist / coils, h = Math.max(.8, 1 - (dist - 40) / 200);
    const amp = Math.max(ampMin, Math.min(ampMax, ampMax * h));
    const cr = dist <= 40 ? crMax : dist <= 120 ? crMax - ((dist - 40) / 80) * (crMax - crMin) : crMin;
    const ux = dx / dist, uy = dy / dist, px = -uy, py = ux;
    const out = [];
    for (let i = 0; i < coils; i++) {
      const sx = x1 + ux * i * d, sy = y1 + uy * i * d, ex = x1 + ux * (i + 1) * d, ey = y1 + uy * (i + 1) * d;
      const mx = x1 + ux * (i + .5) * d + px * amp, my = y1 + uy * (i + .5) * d + py * amp;
      out.push(i ? `L${sx},${sy}` : `M${sx},${sy}`,
        `C${sx + d * cr * ux},${sy + d * cr * uy} ${mx + ux * bez},${my + uy * bez} ${mx},${my}`,
        `C${mx - ux * bez},${my - uy * bez} ${ex - d * cr * ux},${ey - d * cr * uy} ${ex},${ey}`);
    }
    return out.join(' ');
  }

  // física de mola (rigidez 200, amortecimento 16, como no original) + arraste + balanço sozinho
  function makeSpring(ctx, el, path, anchor, rest) {
    const p = { x: rest.x, y: rest.y }, v = { x: 0, y: 0 };
    let target = rest, drag = null, nextKick = 2, idleT = 0, live = false;
    const draw = () => {
      el.style.transform = `translate(${anchor.x + p.x}px, ${anchor.y + p.y}px)`;
      path.setAttribute('d', springPath(anchor.x, anchor.y, anchor.x + p.x, anchor.y + p.y));
    };
    const step = () => {
      if (!live) return;
      let dt = Math.min(gsap.ticker.deltaRatio(60) / 60, .05);
      const n = 4; dt /= n;
      for (let i = 0; i < n; i++) {
        v.x += (-200 * (p.x - target.x) - 16 * v.x) * dt; v.y += (-200 * (p.y - target.y) - 16 * v.y) * dt;
        p.x += v.x * dt; p.y += v.y * dt;
      }
      if (!drag && (idleT += dt * n) > nextKick) { // de vez em quando leva um "peteleco"
        idleT = 0; nextKick = 2 + Math.random() * 1.6;
        const ang = Math.random() * Math.PI * 2; v.x += Math.cos(ang) * 520; v.y += Math.sin(ang) * 520;
      }
      draw();
    };
    const stagePt = e => { const r = stage.getBoundingClientRect(); return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale }; };
    const down = e => { e.stopPropagation(); try { el.setPointerCapture(e.pointerId); } catch {} el.classList.add('dragging'); const q = stagePt(e); drag = { dx: anchor.x + p.x - q.x, dy: anchor.y + p.y - q.y }; };
    const move = e => { if (!drag) return; const q = stagePt(e); target = { x: q.x + drag.dx - anchor.x, y: q.y + drag.dy - anchor.y }; };
    const release = () => { if (!drag) return; drag = null; target = rest; el.classList.remove('dragging'); idleT = 0; };
    const stop = e => e.stopPropagation(); // não deixa o clique avançar o slide
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', release); el.addEventListener('pointercancel', release); el.addEventListener('click', stop);
    draw();
    gsap.ticker.add(step);
    ctx.loop({ kill: () => {
      live = false; gsap.ticker.remove(step);
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', release); el.removeEventListener('pointercancel', release); el.removeEventListener('click', stop);
    } });
    return {
      launch() { p.x = 0; p.y = 0; v.x = rest.x * 9; v.y = rest.y * 9; live = !reduce.matches; draw(); if (!live) { p.x = rest.x; p.y = rest.y; draw(); } },
      wake() { if (!live && !reduce.matches) live = true; },
    };
  }

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
    const all = [...st.slide.querySelectorAll('*')];
    // [data-keep-style] guarda clip-path/origens geradas em JS: limpa só o movimento
    gsap.set(all.filter(el => !el.closest('[data-keep-style]')), { clearProps: 'all' });
    gsap.set(all.filter(el => el.closest('[data-keep-style]')), { clearProps: 'transform,opacity' });
  }

  /* ---------- Vidro estilhaçado (slide 3), inspirado em "Broken by Design" (21st.dev) ---------- */
  function buildShatter(slide, src) {
    const W = src.offsetWidth, H = src.offsetHeight;
    const cx = W * .52, cy = H * .26;                 // ponto de impacto (área vazia dos cards)
    const N = 8, rnd = (a, b) => a + Math.random() * (b - a);
    const angles = Array.from({ length: N }, (_, i) => (i + rnd(-.28, .28)) / N * Math.PI * 2);
    const r1 = angles.map(() => rnd(150, 270));
    const far = Math.hypot(W, H);
    const pt = (a, r) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    const polys = [];
    for (let i = 0; i < N; i++) {
      const a0 = angles[i], a1 = angles[(i + 1) % N] + (i === N - 1 ? Math.PI * 2 : 0);
      const p0 = pt(a0, r1[i]), p1 = pt(a1, r1[(i + 1) % N]);
      polys.push({ pts: [[cx, cy], p0, p1], a: (a0 + a1) / 2, ring: 0 });
      polys.push({ pts: [p0, pt(a0, far), pt(a1, far), p1], a: (a0 + a1) / 2, ring: 1 });
    }
    // recorta um polígono ao retângulo do painel (Sutherland–Hodgman)
    const clipRect = pts => {
      const edges = [[p => p[0] >= 0, (a, b) => { const t = -a[0] / (b[0] - a[0]); return [0, a[1] + t * (b[1] - a[1])]; }],
        [p => p[0] <= W, (a, b) => { const t = (W - a[0]) / (b[0] - a[0]); return [W, a[1] + t * (b[1] - a[1])]; }],
        [p => p[1] >= 0, (a, b) => { const t = -a[1] / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), 0]; }],
        [p => p[1] <= H, (a, b) => { const t = (H - a[1]) / (b[1] - a[1]); return [a[0] + t * (b[0] - a[0]), H]; }]];
      let out = pts;
      for (const [inside, cut] of edges) {
        const inp = out; out = [];
        inp.forEach((cur, i) => {
          const prev = inp[(i + inp.length - 1) % inp.length];
          if (inside(cur)) { if (!inside(prev)) out.push(cut(prev, cur)); out.push(cur); }
          else if (inside(prev)) out.push(cut(prev, cur));
        });
      }
      return out;
    };
    const onEdge = (a, b) => [[0, 0], [W, 0], [0, 1], [H, 1]].some(([v, k]) => Math.abs(a[k] - v) < .5 && Math.abs(b[k] - v) < .5);
    // encolhe cada caco em direção ao centro dele: abre as frestas
    const shrink = (pts, px) => {
      const c = pts.reduce((m, p) => [m[0] + p[0] / pts.length, m[1] + p[1] / pts.length], [0, 0]);
      return { c, pts: pts.map(([x, y]) => { const d = Math.hypot(x - c[0], y - c[1]) || 1; return [x - (x - c[0]) / d * px, y - (y - c[1]) / d * px]; }) };
    };
    const wrap = document.createElement('div');
    wrap.className = 'shatter';
    wrap.dataset.keepStyle = '';
    Object.assign(wrap.style, { left: src.offsetLeft + 'px', top: src.offsetTop + 'px', width: W + 'px', height: H + 'px' });
    wrap.innerHTML = '<div class="tilt"><div class="inner"></div></div><i class="impact"></i>';
    const inner = wrap.querySelector('.inner');
    polys.forEach((poly, i) => {
      const clipped = clipRect(poly.pts);
      if (clipped.length < 3) return;
      // só as arestas de rachadura ganham borda de vidro (não a borda do painel)
      const cracks = clipped.map((p, k) => [p, clipped[(k + 1) % clipped.length]]).filter(([a, b]) => !onEdge(a, b));
      const { c, pts } = shrink(clipped, 2.5);
      const vc = c;
      const el = document.createElement('div');
      el.className = 'shard';
      const path = pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',');
      el.style.clipPath = `polygon(${path})`;
      el.style.transformOrigin = `${vc[0]}px ${vc[1]}px`;
      const clone = src.cloneNode(true);
      clone.classList.add('shard-copy');
      el.appendChild(clone);
      el.insertAdjacentHTML('beforeend', `<b class="spec" style="--a:${(poly.a * 180 / Math.PI + 90).toFixed(0)}deg"></b><svg viewBox="0 0 ${W} ${H}"><path d="${cracks.map(([a, b]) => `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`).join('')}"/></svg>`);
      const ux = Math.cos(poly.a), uy = Math.sin(poly.a);
      el._d = { a: poly.a, ux, uy, ring: poly.ring,
        fx: ux * rnd(1.5, 5), fy: uy * rnd(1.5, 5),
        z: rnd(8, 46) * (poly.ring ? 1 : 1.3), rz: rnd(-.7, .7), rx: rnd(-1.6, 1.6), ry: rnd(-1.6, 1.6) };
      inner.appendChild(el);
    });
    wrap.querySelector('.impact').style.cssText = `left:${cx}px;top:${cy}px`;
    src.classList.add('is-shattered');
    slide.appendChild(wrap);
    return wrap;
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
