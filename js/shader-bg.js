/* Fundo "Waves" da capa — porte em JS puro do ShaderBackground do 21st.dev
   (Shader Builder), com a paleta trocada do azul para os verdes da marca.
   Uso: const bg = ShaderBackground(canvas); bg.start(); bg.stop(); bg.frame(t) */
(() => {
  const VERT = `attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`;

  const FRAG = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec3 u_colors[8];
uniform vec4 u_scene;
uniform vec4 u_shape;
uniform vec4 u_surface;
uniform vec4 u_finish;
uniform vec4 u_transform;
uniform vec4 u_space;
uniform vec4 u_cursor;
#define u_resolution u_scene.xy
#define u_time u_scene.z
#define u_colorCount u_scene.w
#define u_scale u_shape.x
#define u_intensity u_shape.y
#define u_paramA u_shape.z
#define u_warp u_shape.w
#define u_detail u_surface.x
#define u_contrast u_surface.y
#define u_brightness u_surface.z
#define u_saturation u_surface.w
#define u_hue u_finish.x
#define u_vignette u_finish.y
#define u_blur u_finish.z
#define u_grain u_finish.w
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define u_seed u_transform.x
#else
#define u_seed mod(u_transform.x, 31.0)
#endif
#define u_rotate u_transform.y
#define u_drift u_transform.z
#define u_oklab u_transform.w
#define u_offset u_space.xy
float hash21(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float grainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.2);
    a *= 0.5;
  }
  return v;
}
vec3 palette(float x) {
  float n = max(u_colorCount - 1.0, 1.0);
  float f = clamp(x, 0.0, 1.0) * n;
  vec3 col = u_colors[0];
  for (int i = 0; i < 7; i++) {
    if (float(i) < n)
      col = mix(col, u_colors[i + 1], smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));
  }
  return col;
}
vec3 shade(vec2 uv, vec2 p, float t) {
  float y = uv.y
    + sin(uv.x * (3.0 + u_intensity * 9.0) + t * 0.8) * 0.08
    + (fbm(p * 2.0 + t * 0.1) - 0.5) * u_intensity * 0.6;
  return palette(y);
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 screenUv = uv;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  uv = p * min(u_resolution.x, u_resolution.y) / u_resolution.xy + 0.5;
  p *= u_scale;
  if (abs(u_rotate) > 0.0001) {
    float cr = cos(u_rotate), sr = sin(u_rotate);
    p = mat2(cr, -sr, sr, cr) * p;
  }
  p += u_offset;
  if (u_drift > 0.0001) p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));
  if (u_warp > 0.0) {
    p += u_warp * (vec2(fbm(p * u_detail + u_seed), fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);
  }
  vec3 col;
  if (u_blur > 0.0) {
    float e = u_blur;
    float pe = e * u_scale;
    vec2 uvE = vec2(e) * min(u_resolution.x, u_resolution.y) / u_resolution.xy;
    col  = shade(uv, p, u_time) * 0.36;
    col += shade(uv + vec2(uvE.x, 0.0), p + vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv - vec2(uvE.x, 0.0), p - vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv + vec2(0.0, uvE.y), p + vec2(0.0, pe), u_time) * 0.16;
    col += shade(uv - vec2(0.0, uvE.y), p - vec2(0.0, pe), u_time) * 0.16;
  } else {
    col = shade(uv, p, u_time);
  }
  if (abs(u_contrast - 1.0) > 0.0001) col = (col - 0.5) * u_contrast + 0.5;
  if (abs(u_saturation - 1.0) > 0.0001) {
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, u_saturation);
  }
  if (abs(u_brightness) > 0.0001) col += u_brightness;
  if (u_vignette > 0.0001) {
    float vd = length(screenUv - 0.5) * 1.41421356;
    col *= 1.0 - u_vignette * smoothstep(0.35, 1.0, vd);
  }
  if (u_grain > 0.0001)
    col += (grainHash(gl_FragCoord.xy + vec2(u_seed * 17.0, u_seed * 31.0)) - 0.5) * u_grain;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  // paleta original: #031C26 → #1B6CA8 → #5AD2F4 → #EAF9FF ; aqui em verde
  const COLORS = ['#04140A', '#2C7A45', '#8CCB66', '#EEF8E6'];
  const U = {
    scale: 2.0, intensity: 0.54, paramA: 0.47, warp: 0.042,
    detail: 1.536, contrast: 1.158, brightness: 0, saturation: 1,
    hue: 0, vignette: 0.21, blur: 0.002, grain: 0.101,
    seed: 4012, rotate: 5.6549, drift: 0.116, oklab: 0,
    offsetX: 0.11, offsetY: -0.19, timeScale: -0.727,
  };

  window.ShaderBackground = canvas => {
    const gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: true });
    if (!gl) return { start() {}, stop() {}, frame() {}, kill() {} };
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = n => gl.getUniformLocation(prog, n);
    const cols = COLORS.map(hex);
    while (cols.length < 8) cols.push(cols[cols.length - 1]);
    gl.uniform3fv(u('u_colors'), new Float32Array(cols.flat()));
    gl.uniform4f(u('u_shape'), U.scale, U.intensity, U.paramA, U.warp);
    gl.uniform4f(u('u_surface'), U.detail, U.contrast, U.brightness, U.saturation);
    gl.uniform4f(u('u_finish'), U.hue, U.vignette, U.blur, U.grain);
    gl.uniform4f(u('u_transform'), U.seed, U.rotate, U.drift, U.oklab);
    gl.uniform4f(u('u_space'), U.offsetX, U.offsetY, 0, 0);
    gl.uniform4f(u('u_cursor'), 0, 0, 0, 0);
    const uScene = u('u_scene');

    // resolução: acompanha o tamanho real na tela, até ~2 MP
    const size = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let w = Math.max(1, r.width * dpr), h = Math.max(1, r.height * dpr);
      const k = Math.min(1, Math.sqrt(2e6 / (w * h)));
      w = Math.round(w * k); h = Math.round(h * k);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    };
    const frame = t => {
      size();
      gl.uniform4f(uScene, canvas.width, canvas.height, t * U.timeScale, COLORS.length);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    let raf = 0, t0 = performance.now();
    const loop = now => { frame((now - t0) / 1000); raf = requestAnimationFrame(loop); };
    const api = {
      frame,
      start() { if (!raf) raf = requestAnimationFrame(loop); },
      stop() { cancelAnimationFrame(raf); raf = 0; },
    };
    api.kill = api.stop; // compatível com ctx.loop()
    frame(0);
    return api;
  };
})();
