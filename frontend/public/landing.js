/* ============ WEBGL WAVE SHADER (hero background) ============ */
(function() {
  const cv = document.getElementById('shaderBg');
  const gl = cv.getContext('webgl', { antialias: false, alpha: true });
  if (!gl) { cv.style.display = 'none'; return; }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const VERT = `
    attribute vec2 aPos;
    void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
  `;
  const FRAG = `
    precision highp float;
    uniform vec2 uRes;
    uniform float uTime;
    uniform float uDark;

    void main() {
      vec2 p = (gl_FragCoord.xy * 2.0 - uRes) / min(uRes.x, uRes.y);

      float xScale = 1.0;
      float yScale = 0.5;
      float distortion = 0.05;
      float t = uTime * 0.6;

      float d = length(p) * distortion;

      float rx = p.x * (1.0 + d);
      float gx = p.x;
      float bx = p.x * (1.0 - d);

      float r = 0.05 / abs(p.y + sin((rx + t) * xScale) * yScale);
      float g = 0.05 / abs(p.y + sin((gx + t) * xScale) * yScale);
      float b = 0.05 / abs(p.y + sin((bx + t) * xScale) * yScale);

      vec3 darkCol = vec3(r * 0.62, g * 0.80, b * 1.30);
      float darkA = clamp(r + g + b, 0.0, 1.0);

      float li = clamp(pow(g, 0.9), 0.0, 1.0);
      float fr = clamp(r - g, 0.0, 1.0);
      float fb = clamp(b - g, 0.0, 1.0);
      vec3 lightCol = vec3(1.0)
        - vec3(0.55, 0.35, 0.05) * li
        - vec3(0.35, 0.10, 0.00) * fb
        - vec3(0.00, 0.15, 0.30) * fr;
      lightCol = clamp(lightCol, 0.0, 1.0);
      float lightA = clamp(li * 1.2 + (fr + fb) * 0.5, 0.0, 1.0) * 0.8;

      vec3 col = mix(lightCol, darkCol, uDark);
      float alpha = mix(lightA, darkA, uDark);

      float bottomFade = smoothstep(0.0, 0.18, gl_FragCoord.y / uRes.y);
      gl_FragColor = vec4(col, alpha * bottomFade);
    }
  `;

  function sh(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uDark = gl.getUniformLocation(prog, 'uDark');

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  function sizeGL() {
    const dpr = Math.min(devicePixelRatio, 1.5);
    cv.width = cv.offsetWidth * dpr;
    cv.height = cv.offsetHeight * dpr;
    gl.viewport(0, 0, cv.width, cv.height);
  }
  sizeGL();
  window.addEventListener('resize', sizeGL);

  const hero = document.getElementById('hero');
  let shaderVisible = true;
  function fade() {
    const r = hero.getBoundingClientRect();
    const f = clampS(r.bottom / (r.height * .85), 0, 1);
    const dark = document.documentElement.classList.contains('dark');
    cv.style.opacity = (dark ? 1 : .85) * f;
    shaderVisible = f > 0.01 && r.bottom > 0;
  }
  function clampS(v,a,b){ return Math.max(a, Math.min(b, v)); }
  window.addEventListener('scroll', fade, { passive: true });
  fade();

  function frame(t) {
    if (shaderVisible) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.uniform1f(uTime, reduced ? 12.0 : t / 1000);
      gl.uniform1f(uDark, document.documentElement.classList.contains('dark') ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (!reduced) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ============ THEME ============ */
const themeBtn = document.getElementById('themeBtn');
const savedTheme = localStorage.getItem('ca-theme');
if (savedTheme ? savedTheme === 'dark' : true) document.documentElement.classList.add('dark');
themeBtn.addEventListener('click', () => {
  const dark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('ca-theme', dark ? 'dark' : 'light');
});
window.addEventListener('scroll', () => {
  const navEl = document.getElementById('nav');
  if (navEl) navEl.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

/* ============ UTIL ============ */
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const lerp = (a,b,t) => a + (b-a)*t;
const smooth = t => t*t*(3-2*t);
const local = (p,a,b) => clamp((p-a)/(b-a), 0, 1);
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (REDUCED) document.getElementById('journey').classList.add('reduced');

function pal() {
  const s = getComputedStyle(document.documentElement);
  const dark = document.documentElement.classList.contains('dark');
  return {
    dark,
    primary: s.getPropertyValue('--primary').trim(),
    blue: s.getPropertyValue('--blue').trim(),
    blueSoft: s.getPropertyValue('--blue-soft').trim(),
    red: s.getPropertyValue('--red').trim(),
    yellow: s.getPropertyValue('--yellow').trim(),
    green: s.getPropertyValue('--green').trim(),
    border: s.getPropertyValue('--border').trim(),
    surface2: s.getPropertyValue('--surface-2').trim(),
    bg: s.getPropertyValue('--background').trim(),
    text: s.getPropertyValue('--text').trim(),
    muted: s.getPropertyValue('--muted').trim(),
  };
}

const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const journey = document.getElementById('journey');
const capBlocks = [...document.querySelectorAll('.panel')];
const labels = [...document.querySelectorAll('.lbl')];

let W, H, DPR, minWH, isMobile;
function resize() {
  DPR = Math.min(devicePixelRatio, 2);
  W = canvas.width = canvas.offsetWidth * DPR;
  H = canvas.height = canvas.offsetHeight * DPR;
  minWH = Math.min(W, H);
  isMobile = window.innerWidth <= 720;
}
resize(); window.addEventListener('resize', resize);

/* ============ 3D ============ */
const FOV = 900;
function proj3(x, y, z, rotY, rotX, cx, cy) {
  let x1 = x*Math.cos(rotY) - z*Math.sin(rotY);
  let z1 = x*Math.sin(rotY) + z*Math.cos(rotY);
  let y1 = y*Math.cos(rotX) - z1*Math.sin(rotX);
  let z2 = y*Math.sin(rotX) + z1*Math.cos(rotX);
  const s = FOV / (FOV + z2);
  return { x: cx + x1*s, y: cy + y1*s, s, z: z2 };
}

/* ============ ENTITIES ============ */
const docColors = ['blue', 'red', 'yellow', 'green'];

/* 4 documents orbiting in 3D */
const docs = [0,1,2,3].map(i => ({
  baseAngle: i * Math.PI / 2 + .4,
  color: docColors[i],
  yawSeed: Math.random() * Math.PI * 2,
}));

/* 36 hero fragments (9 per doc) + 150 ambient = unified particle field */
const FRAGS_PER_DOC = 9;
const HERO_N = 4 * FRAGS_PER_DOC;
const AMBIENT_N = 150;
const TOTAL = HERO_N + AMBIENT_N;

const cellPts = [];
for (let i = 0; i < TOTAL; i++) {
  const nucleus = i % 3 === 0;
  const r = nucleus ? .40 : 1;
  const phi = Math.acos(1 - 2*(i+.5)/TOTAL);
  const theta = Math.PI * (1 + Math.sqrt(5)) * i;
  cellPts.push({
    x: r*Math.sin(phi)*Math.cos(theta),
    y: r*Math.cos(phi)*.85,
    z: r*Math.sin(phi)*Math.sin(theta),
    nucleus,
  });
}

const parts = [];
for (let d = 0; d < 4; d++) {
  for (let f = 0; f < FRAGS_PER_DOC; f++) {
    const row = Math.floor(f/3) - 1, col = (f%3) - 1;
    parts.push({
      hero: true, docIdx: d, color: docColors[d],
      loX: col * .05, loY: row * .06,
      burstA: Math.random() * Math.PI * 2,
      burstD: .12 + Math.random() * .22,
      tumble: Math.random() * Math.PI * 2,
      scat: { x: (Math.random()-.5)*2.6, y: (Math.random()-.5)*1.9, z: (Math.random()-.5)*2.2 },
      cell: cellPts[d * FRAGS_PER_DOC + f],
      wob: Math.random() * Math.PI * 2,
    });
  }
}
for (let i = 0; i < AMBIENT_N; i++) {
  parts.push({
    hero: false, color: docColors[i % 4],
    scat: { x: (Math.random()-.5)*3.0, y: (Math.random()-.5)*2.2, z: (Math.random()-.5)*2.6 },
    cell: cellPts[HERO_N + i],
    wob: Math.random() * Math.PI * 2,
  });
}

const queryTarget = { x: .96, y: -.14, z: .30 };
const litIdx = parts
  .map((pt, i) => ({ i, d: Math.hypot(pt.cell.x-queryTarget.x, pt.cell.y-queryTarget.y, pt.cell.z-queryTarget.z) }))
  .sort((a,b) => a.d - b.d).slice(0, 5).map(o => o.i);

let progress = 0, smoothProg = 0, time = 0;
const partScreen = new Array(TOTAL);
const docScreen = new Array(4);
let queryScreen = null;

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x+r, y);
  c.arcTo(x+w, y, x+w, y+h, r);
  c.arcTo(x+w, y+h, x, y+h, r);
  c.arcTo(x, y+h, x, y, r);
  c.arcTo(x, y, x+w, y, r);
  c.closePath();
}

/* ============ FRAME ============ */
function draw(t) {
  time = t;
  smoothProg += (progress - smoothProg) * 0.16;
  const C = pal();
  ctx.clearRect(0, 0, W, H);
  const cx = W/2, cy = H*.5;
  const R = minWH * (isMobile ? .34 : .28);

  const p = smoothProg;
  const qIntro   = smooth(local(p, .00, .07));
  const qCollapse = smooth(local(p, .07, .12));
  const burst  = smooth(local(p, .18, .32));
  const embed  = smooth(local(p, .30, .44));
  const form   = smooth(local(p, .42, .54));
  const store  = smooth(local(p, .54, .62));
  const queryT = smooth(local(p, .62, .72));
  const retr   = smooth(local(p, .70, .80));
  const llmT   = smooth(local(p, .78, .86));
  const genT   = smooth(local(p, .84, .92));
  const conv   = smooth(local(p, .86, .93));
  const ansT   = local(p, .90, .96);

  const settle = 1 - conv * .75;
  const A = (REDUCED ? 0 : time * .00008) * settle + p * 2.6;
  const rotX = -.26;
  const docEntry = smooth(local(p, .12, .20));
  const docAlpha = docEntry * (1 - burst);
  const breathe = REDUCED ? 1 : 1 + Math.sin(time/950) * .02 * (1 - conv);

  /* ---- membrane ring ---- */
  if (form > .05) {
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.24 * breathe * lerp(.85, 1, form), 0, Math.PI*2);
    ctx.setLineDash([6*DPR, 9*DPR]);
    ctx.strokeStyle = C.dark ? C.blueSoft : C.primary;
    ctx.lineWidth = 1.3 * DPR;
    ctx.globalAlpha = (C.dark ? .40 : .55) * form * (1 - conv*.6);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (C.dark && form > .4) {
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, R*1.5);
    halo.addColorStop(0, `rgba(138,180,248,${.09 * form * (1 - conv*.5)})`);
    halo.addColorStop(1, 'rgba(138,180,248,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);
  }

  /* ---- documents (3D orbit, yaw, shading) ---- */
  const orbitR = R * 1.02;
  for (let i = 0; i < 4; i++) {
    const d = docs[i];
    const ang = d.baseAngle + A * .55;
    const dx = Math.cos(ang) * orbitR;
    const dz = Math.sin(ang) * orbitR * .75;
    const dy = Math.sin(ang * 2 + i) * R * .10;
    const pr = proj3(dx, dy, dz, 0, rotX, cx, cy);
    docScreen[i] = pr;
    if (docAlpha <= .01) continue;
    const yaw = (REDUCED ? 0 : Math.sin(time/1900 + d.yawSeed) * .45) + Math.sin(ang) * .35;
    const wS = Math.max(.25, Math.abs(Math.cos(yaw)));
    const shade = .72 + .28 * wS;
    const w = 72 * DPR * pr.s * wS * (isMobile ? .8 : 1);
    const h = 92 * DPR * pr.s * (isMobile ? .8 : 1);
    ctx.save();
    ctx.translate(pr.x, pr.y);
    ctx.globalAlpha = docAlpha * clamp(pr.s*1.2 - .2, .3, 1) * (C.dark ? 1 : 1.15);
    ctx.fillStyle = C.dark ? C.surface2 : C.bg;
    ctx.strokeStyle = C[d.color];
    ctx.lineWidth = 1.7 * DPR * pr.s;
    roundRect(ctx, -w/2, -h/2, w, h, 6*DPR*pr.s);
    ctx.fill();
    if (C.dark) {
      const g = ctx.createLinearGradient(-w/2, 0, w/2, 0);
      g.addColorStop(0, `rgba(255,255,255,${.04*shade})`);
      g.addColorStop(1, `rgba(255,255,255,${.09*shade})`);
      ctx.fillStyle = g;
      roundRect(ctx, -w/2, -h/2, w, h, 6*DPR*pr.s);
      ctx.fill();
    }
    ctx.stroke();
    if (wS > .45) {
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5 * DPR * pr.s;
      ctx.globalAlpha *= .85;
      for (let l = 0; l < 4; l++) {
        ctx.beginPath();
        ctx.moveTo(-w*.30, -h*.28 + l*h*.17);
        ctx.lineTo(w*.30, -h*.28 + l*h*.17);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /* ---- unified particles: doc-local → burst → scatter → cell ---- */
  const drawList = [];
  for (let i = 0; i < TOTAL; i++) {
    const pt = parts[i];
    let x, y, z, rectMix, alpha;
    if (pt.hero) {
      const d = docs[pt.docIdx];
      const ang = d.baseAngle + A * .55;
      const hx = Math.cos(ang) * orbitR / R + pt.loX;
      const hy = Math.sin(ang * 2 + pt.docIdx) * .10 + pt.loY;
      const hz = Math.sin(ang) * orbitR * .75 / R;
      const bx = hx + Math.cos(pt.burstA) * pt.burstD * burst * 3;
      const by = hy + Math.sin(pt.burstA) * pt.burstD * burst * 3;
      const bz = hz + (Math.random === null ? 0 : Math.sin(pt.burstA*2) * pt.burstD * burst * 2);
      let px = lerp(bx, pt.scat.x, embed);
      let py = lerp(by, pt.scat.y, embed);
      let pz = lerp(bz, pt.scat.z, embed);
      const wob = pt.cell.nucleus ? 1 : 1 + (REDUCED ? 0 : Math.sin(time/620 + pt.wob) * .045);
      x = lerp(px, pt.cell.x * wob * breathe, form);
      y = lerp(py, pt.cell.y * wob * breathe, form);
      z = lerp(pz, pt.cell.z * wob * breathe, form);
      rectMix = 1 - embed;
      alpha = burst < .02 ? 0 : Math.min(1, burst * 3);
    } else {
      const wob = pt.cell.nucleus ? 1 : 1 + (REDUCED ? 0 : Math.sin(time/620 + pt.wob) * .045);
      x = lerp(pt.scat.x, pt.cell.x * wob * breathe, form);
      y = lerp(pt.scat.y, pt.cell.y * wob * breathe, form);
      z = lerp(pt.scat.z, pt.cell.z * wob * breathe, form);
      rectMix = 0;
      alpha = embed * .9;
    }
    const isLit = retr > 0 && litIdx.includes(i);
    if (isLit && conv > 0) {
      x = lerp(x, 0, conv);
      y = lerp(y, 0, conv);
      z = lerp(z, 0, conv);
    }
    const pr = proj3(x*R, y*R, z*R, A * .35 * (embed > 0 ? 1 : 0) * settle, rotX, cx, cy);
    partScreen[i] = pr;
    if (alpha <= 0.01) continue;
    drawList.push({ pr, pt, i, rectMix, alpha, isLit });
  }
  drawList.sort((a,b) => b.pr.z - a.pr.z);

  const dimOthers = retr * .55;
  for (const it of drawList) {
    const { pr, pt, rectMix, isLit } = it;
    const depth = clamp((pr.s - .7)*2.2, .18, 1);
    let a = it.alpha * depth * (form > 0 ? (pt.cell.nucleus ? .85 : .5) * lerp(1.6, 1, form) : .9);
    if (!isLit) a *= (1 - dimOthers);
    if (isLit) a = Math.min(1, a + retr);
    if (conv > 0 && !isLit) a *= (1 - conv * .5);
    if (ansT > 0) a *= (1 - ansT * .55);
    if (!C.dark) a = Math.min(1, a * 1.55);
    const litScale = isLit ? 1.9 + (REDUCED ? 0 : Math.sin(time/180)*.3) : 1;
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.fillStyle = C[pt.color];
    if (rectMix > .25) {
      const sz = lerp(4, 9, rectMix) * DPR * pr.s;
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.rotate(pt.tumble + burstRotation(it));
      roundRect(ctx, -sz, -sz*.62, sz*2, sz*1.24, 2*DPR);
      ctx.fill();
      ctx.restore();
    } else {
      const sz = (pt.cell && pt.cell.nucleus ? 2.7 : 2.1) * DPR * pr.s * litScale;
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, Math.max(.5, sz), 0, Math.PI*2);
      ctx.fill();
      if (isLit) {
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, sz + 4*DPR, 0, Math.PI*2);
        ctx.strokeStyle = C.text;
        ctx.lineWidth = 1*DPR;
        ctx.globalAlpha = .6 * retr * (1 - conv);
        ctx.stroke();
      }
    }
  }
  function burstRotation(it) {
    return it.pt.hero ? it.pt.tumble * smooth(local(p, .13, .30)) * 2 : 0;
  }

  /* ---- query ---- */
  queryScreen = null;
  if (queryT > 0 && ansT < .55) {
    const e = queryT;
    const t0 = { x: 1.9, y: -.9, z: .6 };
    const t1 = { x: 1.35, y: -.45, z: .45 };
    const t2 = queryTarget;
    const qx = lerp(lerp(t0.x, t1.x, e), lerp(t1.x, t2.x, e), e);
    const qy = lerp(lerp(t0.y, t1.y, e), lerp(t1.y, t2.y, e), e);
    const qz = lerp(lerp(t0.z, t1.z, e), lerp(t1.z, t2.z, e), e);
    const cvx = lerp(qx, 0, conv), cvy = lerp(qy, 0, conv), cvz = lerp(qz, 0, conv);
    const qp = proj3(cvx*R, cvy*R, cvz*R, A * .35 * settle, rotX, cx, cy);
    queryScreen = qp;
    const fade = 1 - local(ansT, .3, .55);

    if (retr > .15 && conv < .95) {
      for (const i of litIdx) {
        const tp = partScreen[i];
        if (!tp) continue;
        const lt = clamp(retr * 1.6, 0, 1);
        ctx.beginPath();
        ctx.moveTo(qp.x, qp.y);
        ctx.lineTo(lerp(qp.x, tp.x, lt), lerp(qp.y, tp.y, lt));
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 1.2*DPR;
        ctx.globalAlpha = .75 * lt * fade * (1 - conv*.7);
        ctx.stroke();
      }
    }
    ctx.save();
    ctx.globalAlpha = Math.min(1, queryT*3) * fade;
    ctx.shadowColor = C.blue;
    ctx.shadowBlur = 14 * DPR;
    ctx.beginPath();
    ctx.arc(qp.x, qp.y, 5.5*DPR*(1 + conv*1.4), 0, Math.PI*2);
    ctx.fillStyle = C.blue;
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = .32 * Math.min(1, queryT*3) * fade;
    ctx.beginPath(); ctx.arc(qp.x - 1.3*DPR, qp.y, 6*DPR, 0, Math.PI*2); ctx.strokeStyle = C.red; ctx.lineWidth = .8*DPR; ctx.stroke();
    ctx.beginPath(); ctx.arc(qp.x + 1.3*DPR, qp.y, 6*DPR, 0, Math.PI*2); ctx.strokeStyle = C.green; ctx.stroke();
  }

  /* ---- connector lines for visible labels ---- */
  drawStore(store, retr, C, cx, cy, R);
  drawLLM(llmT, genT, ansT, C, cx, cy, R);
  drawQueryBubble(qIntro, qCollapse, C, cx, cy, R);
  drawAnswerBubble(genT, ansT, C, cx, cy, R);

  ctx.globalAlpha = 1;
  updateLabels(C, { burst, embed, form, queryT, retr, conv, ansT, cx, cy, R }, smoothProg);

  requestAnimationFrame(draw);
}

/* ============ LABELS ============ */
const LBL_DEFS = [
  { get: () => docScreen[0], off: [ .9, -.7], vis: p => (1 - smooth(local(p,.13,.28))) },
  { get: () => docScreen[1], off: [-.9, -.7], vis: p => (1 - smooth(local(p,.13,.28))) },
  { get: () => docScreen[2], off: [-.9,  .7], vis: p => (1 - smooth(local(p,.13,.28))) },
  { get: () => docScreen[3], off: [ .9,  .7], vis: p => (1 - smooth(local(p,.13,.28))) },
  { get: () => docScreen[0], off: [ .8,  .9], vis: p => local(p,.02,.05) * (1 - local(p,.11,.15)) },
  { get: () => partScreen[7],  off: [ .9, -.6], vis: p => local(p,.17,.21) * (1 - local(p,.30,.35)) },
  { get: () => partScreen[14], off: [-.9, -.5], vis: p => local(p,.33,.37) * (1 - local(p,.48,.53)) },
  { get: () => partScreen[HERO_N + 40], off: [ .95, .5], vis: p => local(p,.37,.41) * (1 - local(p,.52,.57)) },
  { get: () => partScreen[HERO_N + 12], off: [-.95, .55], vis: p => local(p,.51,.55) * (1 - local(p,.66,.71)) },
  { get: () => partScreen[3], off: [ .85, -.75], vis: p => local(p,.53,.57) * (1 - local(p,.68,.73)) },
  { get: () => queryScreen, off: [ .75, -.85], vis: p => local(p,.64,.68) * (1 - local(p,.86,.90)) },
  { get: () => partScreen[litIdx[0]], off: [-.95, -.6], vis: p => local(p,.76,.80) * (1 - local(p,.87,.91)) },
  { get: () => partScreen[litIdx[1]], off: [ .95, .6],  vis: p => local(p,.78,.82) * (1 - local(p,.87,.91)) },
];

function updateLabels(C, st, progress) {
  const offBase = minWH * .12 / DPR;
  for (let i = 0; i < labels.length; i++) {
    const def = LBL_DEFS[i];
    const target = def.get();
    const v = def.vis(progress);
    const el = labels[i];
    if (!target || v <= .02) { el.style.opacity = 0; continue; }
    const tx = target.x / DPR, ty = target.y / DPR;
    const lx = tx + def.off[0] * offBase;
    const ly = ty + def.off[1] * offBase;
    el.style.opacity = v;
    el.style.left = lx + 'px';
    el.style.top = ly + 'px';
    ctx.beginPath();
    ctx.moveTo(target.x, target.y);
    ctx.lineTo(lx * DPR, ly * DPR);
    ctx.strokeStyle = C.muted;
    ctx.lineWidth = 1 * DPR;
    ctx.globalAlpha = .45 * v;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(target.x, target.y, 2.2*DPR, 0, Math.PI*2);
    ctx.fillStyle = C.muted;
    ctx.globalAlpha = .7 * v;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function wrapLines(text, maxW) {
  // Greedy word-wrap using the ctx.font already set by the caller.
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w2 of words) {
    const test = line ? line + ' ' + w2 : w2;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w2;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawQueryBubble(intro, collapse, C, cx, cy, R) {
  if (intro <= 0 && collapse >= 1) return;
  const alpha = intro * (1 - collapse);
  if (alpha <= .02) return;

  const pad = 22 * DPR;
  // Narrower side-margin on small screens so the bubble can use the
  // available width instead of forcing extra wraps.
  const w = Math.min(W - (isMobile ? 48*DPR : 80*DPR), 440 * DPR);
  const fontSize = isMobile ? 14 * DPR : 16 * DPR;
  const font = `500 ${fontSize}px Inter`;
  const q = 'What are common symptoms of lung cancer?';

  // Wrap the full question against the bubble's inner width so the text
  // never spills past the bubble edge, then size the bubble to fit it.
  ctx.font = font;
  const lines = wrapLines(q, w - pad * 2);
  const lineH = fontSize * 1.4;
  const h = 60 * DPR + (lines.length - 1) * lineH + 34 * DPR;

  const bubY = Math.max(H * .16, 120 * DPR);
  const scale = lerp(1, .28, collapse);
  const dy = lerp(0, cy - bubY, collapse);
  const bx = cx - w/2, by = bubY - h/2 + dy;

  ctx.save();
  ctx.globalAlpha = alpha;
  const shadowY = by + h + 8*DPR;
  const shGrad = ctx.createRadialGradient(cx, shadowY, 0, cx, shadowY, w*.42);
  shGrad.addColorStop(0, `rgba(0,0,0,${C.dark ? .38 : .18})`);
  shGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shGrad;
  ctx.beginPath(); ctx.ellipse(cx, shadowY, w*.42, 12*DPR, 0, 0, Math.PI*2); ctx.fill();

  ctx.translate(cx, by + h/2);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -(by + h/2));

  const rr = 16 * DPR;
  ctx.fillStyle = C.surface2;
  ctx.strokeStyle = C.dark ? 'rgba(255,255,255,.12)' : C.border;
  ctx.lineWidth = 1.2 * DPR;
  roundR(ctx, bx, by, w, h, rr); ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(bx + 32*DPR, by + h);
  ctx.lineTo(bx + 42*DPR, by + h + 12*DPR);
  ctx.lineTo(bx + 54*DPR, by + h);
  ctx.closePath();
  ctx.fillStyle = C.surface2;
  ctx.fill();

  ctx.fillStyle = C.primary;
  ctx.font = `500 ${10*DPR}px Inter`;
  ctx.textAlign = 'left';
  ctx.fillText('USER · YOU', bx + pad, by + 26*DPR);

  ctx.fillStyle = C.text;
  ctx.font = font;
  const shown = Math.floor(q.length * clamp(intro * 1.25, 0, 1));

  let pos = 0, caretX = null, caretY = null;
  for (let li = 0; li < lines.length; li++) {
    const lineText = lines[li];
    const lineStart = pos;
    const lineEnd = pos + lineText.length;
    const shownInLine = clamp(shown - lineStart, 0, lineText.length);
    const y = by + 60*DPR + li * lineH;
    const partial = lineText.slice(0, shownInLine);
    if (shownInLine > 0) ctx.fillText(partial, bx + pad, y);
    if (caretX === null && shown <= lineEnd) {
      caretX = bx + pad + ctx.measureText(partial).width + 2*DPR;
      caretY = y;
    }
    pos = lineEnd + 1; // +1 for the space consumed at the wrap point
  }
  if (shown < q.length && caretX !== null && (time / 500 | 0) % 2 === 0) {
    ctx.fillRect(caretX, caretY - 15*DPR, 2*DPR, 18*DPR);
  }
  ctx.restore();
}

function drawStore(store, retr, C, cx, cy, R) {
  const alpha = store * (1 - Math.max(retr - .2, 0) * 1.3);
  if (alpha <= .02) return;
  const iconR = R * .28 * (1 + store * .12);
  const iy = cy + R * 1.15;
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  const t = REDUCED ? 0 : time * .0004;
  for (let layer = 0; layer < 3; layer++) {
    const yOff = (layer - 1) * 8 * DPR;
    const rot = t + layer * .35;
    ctx.beginPath();
    for (let s = 0; s <= 6; s++) {
      const a = (s / 6) * Math.PI * 2 + rot;
      const x = cx + Math.cos(a) * iconR;
      const y = iy + yOff + Math.sin(a) * iconR * .3;
      if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = layer === 1
      ? (C.dark ? 'rgba(138,180,248,.13)' : 'rgba(26,115,232,.10)')
      : (C.dark ? 'rgba(138,180,248,.08)' : 'rgba(26,115,232,.06)');
    ctx.strokeStyle = C.primary;
    ctx.lineWidth = 1.4 * DPR;
    ctx.fill(); ctx.stroke();
  }
  ctx.fillStyle = C.primary;
  ctx.font = `650 ${11*DPR}px Inter`;
  ctx.textAlign = 'center';
  ctx.fillText('Chroma', cx, iy + 4*DPR);
  ctx.fillStyle = C.muted;
  ctx.font = `500 ${8*DPR}px Inter`;
  ctx.fillText('VECTOR STORE', cx, iy + iconR * .35 + 20*DPR);
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawLLM(llmT, genT, ansT, C, cx, cy, R) {
  const alpha = llmT * (1 - ansT * .8);
  if (alpha <= .02) return;
  const nodeX = cx + R * 1.05;
  const nodeY = cy - R * .1;
  const rr = R * .20 * (1 + llmT * .1);
  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);

  const glow = ctx.createRadialGradient(nodeX, nodeY, 0, nodeX, nodeY, rr * 2.2);
  glow.addColorStop(0, C.dark ? 'rgba(138,180,248,.28)' : 'rgba(26,115,232,.18)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(nodeX - rr*2.2, nodeY - rr*2.2, rr*4.4, rr*4.4);

  const rot = REDUCED ? 0 : time * .0006;
  for (let ring = 0; ring < 3; ring++) {
    const rr2 = rr * (0.5 + ring * 0.3);
    const rotSpeed = (ring % 2 === 0 ? 1 : -1);
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI * 2 + rot * rotSpeed + ring;
      const wob = 1 + Math.sin(a * 3 + rot * 4) * .06;
      const x = nodeX + Math.cos(a) * rr2 * wob;
      const y = nodeY + Math.sin(a) * rr2 * wob;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = ring === 1 ? C.primary : (C.dark ? C.blueSoft : C.blue);
    ctx.lineWidth = (ring === 1 ? 1.6 : 1) * DPR;
    ctx.globalAlpha = clamp(alpha, 0, 1) * (ring === 1 ? 1 : .6);
    ctx.stroke();
  }

  const dots = 8;
  for (let d = 0; d < dots; d++) {
    const a = (d / dots) * Math.PI * 2 + rot * 2;
    const dr = rr * .8;
    ctx.beginPath();
    ctx.arc(nodeX + Math.cos(a) * dr, nodeY + Math.sin(a) * dr, 2.2 * DPR, 0, Math.PI * 2);
    ctx.fillStyle = C.primary;
    ctx.globalAlpha = clamp(alpha, 0, 1) * (0.5 + 0.5 * Math.abs(Math.sin(time/240 + d)));
    ctx.fill();
  }

  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.fillStyle = C.text;
  ctx.font = `650 ${11*DPR}px Inter`;
  ctx.textAlign = 'center';
  ctx.fillText('LLM', nodeX, nodeY + 4*DPR);
  ctx.fillStyle = C.muted;
  ctx.font = `500 ${8*DPR}px Inter`;
  ctx.fillText('GPT OSS · 120B', nodeX, nodeY + rr + 16*DPR);

  if (llmT > .3 && genT < .9) {
    const flowT = clamp((llmT - .3) / .5, 0, 1);
    for (let i = 0; i < 5; i++) {
      if (!litIdx[i]) continue;
      const src = partScreen[litIdx[i]];
      if (!src) continue;
      const off = ((time / 400) + i * .2) % 1;
      const tx = lerp(src.x, nodeX, off);
      const ty = lerp(src.y, nodeY, off);
      ctx.beginPath();
      ctx.arc(tx, ty, 2.5 * DPR, 0, Math.PI * 2);
      ctx.fillStyle = C.primary;
      ctx.globalAlpha = flowT * (1 - off) * .9;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = C.primary;
      ctx.lineWidth = .8 * DPR;
      ctx.globalAlpha = flowT * .18;
      ctx.stroke();
    }
  }

  if (genT > .3) {
    const tokAlpha = clamp((genT - .3) / .5, 0, 1) * (1 - ansT * .7);
    for (let i = 0; i < 12; i++) {
      const seed = i * 1.7;
      const a = (time / 800 + seed) % (Math.PI * 2);
      const rad = rr * (1.2 + Math.sin(time / 600 + seed) * .3);
      const tx = nodeX + Math.cos(a) * rad;
      const ty = nodeY + Math.sin(a) * rad;
      const w = 14 * DPR, hh = 3 * DPR;
      ctx.fillStyle = C.primary;
      ctx.globalAlpha = tokAlpha * (0.4 + 0.6 * Math.abs(Math.sin(time/300 + seed)));
      roundR(ctx, tx - w/2, ty - hh/2, w, hh, hh/2);
      ctx.fill();
    }
  }

  ctx.textAlign = 'left';
  ctx.restore();
}

function drawAnswerBubble(genT, ansT, C, cx, cy, R) {
  const alpha = ansT;
  if (alpha <= .02) return;
  const bubW = Math.min(W - 60*DPR, 560 * DPR);
  const bubH = 140 * DPR * (isMobile ? .9 : 1);
  const bubX = cx - bubW/2;
  const bubY = cy - bubH/2 + R * .4;
  const scale = lerp(.4, 1, smooth(alpha));

  ctx.save();
  ctx.globalAlpha = clamp(alpha, 0, 1);
  ctx.translate(cx, bubY + bubH/2);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -(bubY + bubH/2));

  const shadowY = bubY + bubH + 8*DPR;
  const shGrad = ctx.createRadialGradient(cx, shadowY, 0, cx, shadowY, bubW*.4);
  shGrad.addColorStop(0, `rgba(0,0,0,${C.dark ? .35 : .18})`);
  shGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shGrad;
  ctx.beginPath(); ctx.ellipse(cx, shadowY, bubW*.4, 10*DPR, 0, 0, Math.PI*2); ctx.fill();

  const rr = 16 * DPR;
  ctx.fillStyle = C.surface;
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1 * DPR;
  roundR(ctx, bubX, bubY, bubW, bubH, rr); ctx.fill(); ctx.stroke();

  ctx.fillStyle = C.primary;
  ctx.font = `500 ${9*DPR}px Inter`;
  ctx.textAlign = 'left';
  ctx.fillText('CANCERATLAS', bubX + 20*DPR, bubY + 22*DPR);

  const ans = 'Common symptoms can include a persistent cough, chest pain, shortness of breath, and unexplained weight loss.';
  const t = clamp((ansT - .1) / .7, 0, 1);
  const shown = Math.floor(ans.length * t);
  ctx.fillStyle = C.text;
  ctx.font = `500 ${13*DPR}px Inter`;
  wrapAnswer(ans.slice(0, shown), bubX + 20*DPR, bubY + 44*DPR, bubW - 40*DPR, 20*DPR);

  if (t > .7) {
    const chipY = bubY + bubH - 30*DPR;
    ctx.fillStyle = C.surface2;
    roundR(ctx, bubX + 20*DPR, chipY, 130*DPR, 20*DPR, 10*DPR); ctx.fill();
    ctx.fillStyle = C.blue;
    ctx.beginPath(); ctx.arc(bubX + 30*DPR, chipY + 10*DPR, 3*DPR, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = C.muted;
    ctx.font = `500 ${10*DPR}px Inter`;
    ctx.fillText('NCI · Lung Cancer', bubX + 40*DPR, chipY + 14*DPR);
  }

  ctx.textAlign = 'left';
  ctx.restore();
}

function wrapAnswer(text, x, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '', yy = y;
  for (const w2 of words) {
    const test = line + w2 + ' ';
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy); line = w2 + ' '; yy += lineH;
    } else line = test;
  }
  ctx.fillText(line, x, yy);
}

function roundR(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x+r, y);
  c.arcTo(x+w, y, x+w, y+h, r);
  c.arcTo(x+w, y+h, x, y+h, r);
  c.arcTo(x, y+h, x, y, r);
  c.arcTo(x, y, x+w, y, r);
  c.closePath();
}

/* ============ SCROLL ============ */
function onScroll() {
  const rect = journey.getBoundingClientRect();
  const total = rect.height - window.innerHeight;
  progress = clamp(-rect.top / total, 0, 1);
  const idx =
    progress < .12 ? 0 :
    progress < .28 ? 1 :
    progress < .40 ? 2 :
    progress < .52 ? 3 :
    progress < .60 ? 4 :
    progress < .70 ? 5 :
    progress < .82 ? 6 :
    progress < .92 ? 7 : 8;
  capBlocks.forEach((b,i) => b.classList.toggle('active', i === idx));
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
requestAnimationFrame(draw);

/* ============ AUTOPLAY ============ */
const playBtn = document.getElementById('playBtn');
let playing = false, rafId = null;
function stopPlay() {
  playing = false;
  playBtn.textContent = '▶';
  playBtn.title = 'Play the journey';
  playBtn.setAttribute('aria-label', 'Play the journey');
  if (rafId) cancelAnimationFrame(rafId);
}
playBtn.addEventListener('click', () => {
  if (playing) { stopPlay(); return; }
  playing = true;
  playBtn.textContent = '⏸';
  playBtn.title = 'Pause the journey';
  playBtn.setAttribute('aria-label', 'Pause the journey');
  const speed = REDUCED ? 6 : 5.5;
  (function step() {
    if (!playing) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (window.scrollY >= max - 2) { stopPlay(); return; }
    window.scrollBy(0, speed);
    rafId = requestAnimationFrame(step);
  })();
});
// Auto-stop on manual scroll/keyboard interaction — but ignore events that
// originate on the button itself. Tapping it fires `touchstart` on window
// before the `click`; without this check that touchstart immediately
// stopped playback and the very next click then started it right back up,
// so the button *looked* like it could only ever play, never pause.
['wheel','touchstart','keydown'].forEach(ev =>
  window.addEventListener(ev, (e) => {
    if (playing && !playBtn.contains(e.target)) stopPlay();
  }, { passive: true })
);

const finaleEl = document.getElementById('finale');
if (finaleEl) {
  const finaleObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      finaleEl.classList.add('in');
      finaleEnterTime = performance.now();
      const nums = [...document.querySelectorAll('#finale .ann-num')];
      nums.forEach((el) => {
        const stat = el.closest('.viz-stat');
        const target = +stat.dataset.target;
        const idx = +stat.dataset.i;
        const startAt = 2000 + idx * 150 + 200;
        const dur = target < 100 ? 900 : 1600;
        const t0 = performance.now() + startAt;
        (function tick(now) {
          if (now < t0) { requestAnimationFrame(tick); return; }
          const p = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.floor(target * eased).toLocaleString();
          if (p < 1) requestAnimationFrame(tick);
        })(performance.now());
      });
      finaleObs.unobserve(finaleEl);
    });
  }, { threshold: 0.18 });
  finaleObs.observe(finaleEl);
}

/* ============ FINALE PARTICLE FIELD ============
   A living, interactive data atmosphere behind the finale visualization.
   Canvas-rendered (no per-particle DOM nodes). Autonomous organic drift +
   a smoothed pointer/touch disturbance field, layered by depth, colored
   by loose source identity (NCI blue / WHO red / IARC yellow / ACS green). */
let finaleEnterTime = 0;
(function initFinaleParticles() {
  const wrap = document.querySelector('.finale-viz-wrap');
  const pCanvas = document.getElementById('finaleParticles');
  if (!wrap || !pCanvas) return;
  const pctx = pCanvas.getContext('2d');

  const SVG_W = 900, SVG_H = 580;
  const CXC = 450, CYC = 420;
  const SOURCES = [
    { key: 'blue',   x: 180, y: 130 },
    { key: 'red',    x: 380, y: 100 },
    { key: 'yellow', x: 520, y: 100 },
    { key: 'green',  x: 720, y: 130 },
  ];

  let pScale = 1;
  function fitCanvas() {
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (pCanvas.width !== w) pCanvas.width = w;
    if (pCanvas.height !== h) pCanvas.height = h;
    pCanvas.style.width = rect.width + 'px';
    pCanvas.style.height = rect.height + 'px';
    pScale = pCanvas.width / SVG_W;
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);
  new ResizeObserver(fitCanvas).observe(wrap);

  /* ---- particle set ---- */
  const N = isMobile ? 130 : 220;
  const particles = [];
  for (let i = 0; i < N; i++) {
    const r = 30 + Math.sqrt(Math.random()) * 268;
    const a = Math.random() * Math.PI * 2;
    const bx = CXC + Math.cos(a) * r;
    const by = CYC + Math.sin(a) * r * 0.55;

    let bestKey = null, bestW = 0;
    for (const s of SOURCES) {
      const d = Math.hypot(bx - s.x, by - s.y);
      const w = Math.max(0, 1 - d / 300);
      if (w > bestW) { bestW = w; bestKey = s.key; }
    }
    const colorKey = (bestW > 0.14 && Math.random() < 0.4 + bestW * 0.45) ? bestKey : 'neutral';

    const depth = Math.random();
    const rNorm = clamp((r - 30) / 268, 0, 1);
    particles.push({
      bx, by, depth,
      size: lerp(0.55, 2.1, depth) * (0.7 + Math.random() * 0.55),
      speed: lerp(0.5, 1.25, depth),
      phase: Math.random() * Math.PI * 2,
      phase2: Math.random() * Math.PI * 2,
      orbitR: lerp(3, 11, depth) * (0.55 + Math.random() * 0.85),
      colorKey,
      fadeBase: 1 - smooth(clamp((rNorm - 0.5) / 0.5, 0, 1)),
      enterDelay: 250 + i * (700 / N),
      dispX: 0, dispY: 0,
    });
  }

  /* ---- pointer field ---- */
  let ptrTargetX = CXC, ptrTargetY = CYC;
  let ptrSmoothX = CXC, ptrSmoothY = CYC;
  let ptrLastMove = -Infinity;
  let ptrStrength = 0;

  function setPointerFromClient(clientX, clientY) {
    const rect = pCanvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    ptrTargetX = (clientX - rect.left) / (rect.width / SVG_W);
    ptrTargetY = (clientY - rect.top) / (rect.height / SVG_H);
    ptrLastMove = performance.now();
  }
  if (!REDUCED) {
    window.addEventListener('mousemove', e => setPointerFromClient(e.clientX, e.clientY), { passive: true });
    window.addEventListener('touchmove', e => {
      if (e.touches && e.touches[0]) setPointerFromClient(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchstart', e => {
      if (e.touches && e.touches[0]) setPointerFromClient(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchend', () => { ptrLastMove = -Infinity; }, { passive: true });
    document.addEventListener('mouseleave', () => { ptrLastMove = -Infinity; });
  }

  /* ---- color helpers ---- */
  function hexToRgb(hex) {
    hex = hex.trim();
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return { r: 128, g: 128, b: 128 };
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
  }
  function mix(rgb, target, t) {
    return {
      r: rgb.r + (target - rgb.r) * t,
      g: rgb.g + (target - rgb.g) * t,
      b: rgb.b + (target - rgb.b) * t,
    };
  }

  let colorCache = null, colorCacheDark = null;
  function buildColors() {
    const P = pal();
    colorCacheDark = P.dark;
    const raw = {
      blue: hexToRgb(P.blue), red: hexToRgb(P.red),
      yellow: hexToRgb(P.yellow), green: hexToRgb(P.green),
      neutral: hexToRgb(P.muted || '#5f6368'),
    };
    const out = {};
    for (const k in raw) {
      out[k] = P.dark ? mix(raw[k], 255, 0.16) : mix(raw[k], 0, 0.34);
    }
    colorCache = out;
    return out;
  }
  buildColors();
  const themeObserver = new MutationObserver(buildColors);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  /* ---- render loop ---- */
  function frame(now) {
    requestAnimationFrame(frame);
    const rect = wrap.getBoundingClientRect();
    if (rect.bottom < -200 || rect.top > innerHeight + 200) return; // offscreen: skip work
    if (!pCanvas.width || !pCanvas.height) return;

    const elapsedSinceMove = now - ptrLastMove;
    const wantActive = elapsedSinceMove < 140;
    ptrStrength += ((wantActive ? 1 : 0) - ptrStrength) * (wantActive ? 0.16 : 0.045);
    ptrSmoothX += (ptrTargetX - ptrSmoothX) * 0.14;
    ptrSmoothY += (ptrTargetY - ptrSmoothY) * 0.14;

    pctx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    const colors = colorCache;
    const t = REDUCED ? 0 : now;
    const finaleIn = finaleEl && finaleEl.classList.contains('in');

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      let ox = 0, oy = 0;
      if (!REDUCED) {
        ox = Math.cos(t * 0.00033 * p.speed + p.phase) * p.orbitR;
        oy = Math.sin(t * 0.00026 * p.speed + p.phase2) * p.orbitR * 0.8;
      }
      const tx = p.bx + ox, ty = p.by + oy;

      let boost = 0;
      if (!REDUCED && ptrStrength > 0.002) {
        const dx = tx - ptrSmoothX, dy = ty - ptrSmoothY;
        const dist = Math.hypot(dx, dy) || 0.0001;
        const infl = 150;
        let falloff = clamp(1 - dist / infl, 0, 1);
        falloff = falloff * falloff * (3 - 2 * falloff);
        const depthResp = lerp(0.4, 1.15, p.depth);
        const mag = falloff * 30 * depthResp * ptrStrength;
        const nx = dx / dist, ny = dy / dist;
        const tanx = -ny, tany = nx;
        const targetDX = (nx * 0.82 + tanx * 0.32) * mag;
        const targetDY = (ny * 0.82 + tany * 0.32) * mag;
        p.dispX += (targetDX - p.dispX) * 0.09;
        p.dispY += (targetDY - p.dispY) * 0.09;
        boost = falloff * ptrStrength * 0.4;
      } else {
        p.dispX *= 0.94; p.dispY *= 0.94;
      }

      const px = (tx + p.dispX) * pScale;
      const py = (ty + p.dispY) * pScale;

      let enter = 1;
      if (finaleIn) {
        enter = smooth(clamp((now - finaleEnterTime - p.enterDelay) / 650, 0, 1));
      } else {
        enter = 0;
      }
      if (enter <= 0.001) continue;

      const baseAlpha = REDUCED ? 0.17 : (colorCacheDark ? 0.5 : 0.58);
      const alpha = clamp(p.fadeBase * enter * (baseAlpha + boost), 0, 0.92);
      if (alpha <= 0.005) continue;

      const c = colors[p.colorKey] || colors.neutral;
      const r = p.size * pScale * (colorCacheDark ? 1.05 : 1);
      pctx.beginPath();
      pctx.arc(px, py, Math.max(0.4, r), 0, Math.PI * 2);
      pctx.fillStyle = `rgba(${c.r | 0},${c.g | 0},${c.b | 0},${alpha.toFixed(3)})`;
      pctx.fill();
    }
  }
  requestAnimationFrame(frame);
})();

(function tubesCursorInit() {
  const tubesWrap = document.getElementById('tubes-cursor-wrap');
  const tubesCanvas = document.getElementById('tubes-cursor-canvas');
  if (!tubesWrap || !tubesCanvas) return;

  // Respect the same reduced-motion signal the rest of the page uses.
  const tubesReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (tubesReduced) {
    tubesWrap.style.display = 'none';
    return;
  }

  // Local copy of the real threejs-components tubes1 module — no CDN,
  // no network dependency at runtime. Resolved relative to this HTML file.
  const TUBES_MODULE_URL = '/tubes1.min.js';

  let tubesApp = null;
  let tubesReady = false;
  let tubesDestroyed = false;
  let tubesInitTimer = null;

  // ---- palette: reuse the page's CSS variables / dark-mode state ----
  function hexToRgbTC(hex) {
    hex = (hex || '').trim();
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return { r: 128, g: 128, b: 128 };
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
  }
  function mixTC(rgb, target, t) {
    return {
      r: Math.round(rgb.r + (target - rgb.r) * t),
      g: Math.round(rgb.g + (target - rgb.g) * t),
      b: Math.round(rgb.b + (target - rgb.b) * t),
    };
  }
  function rgbToHexTC(rgb) {
    const h = n => Math.max(0, Math.min(255, n | 0)).toString(16).padStart(2, '0');
    return '#' + h(rgb.r) + h(rgb.g) + h(rgb.b);
  }

  function currentIsDark() {
    return document.documentElement.classList.contains('dark');
  }

  // Reads the site's existing CancerAtlas CSS custom properties so the
  // Tubes Cursor stays within the established blue/red/yellow/green
  // visual language rather than introducing a new palette.
  function readSitePalette() {
    const s = getComputedStyle(document.documentElement);
    const get = name => s.getPropertyValue(name).trim();
    return {
      dark: currentIsDark(),
      blue: get('--blue') || '#4285F4',
      red: get('--red') || '#EA4335',
      yellow: get('--yellow') || '#FBBC05',
      green: get('--green') || '#34A853',
      primary: get('--primary') || '#1a73e8',
      blueSoft: get('--blue-soft') || '#8ab4f8',
    };
  }

  // Pushes a color toward full saturation/vividness by scaling each
  // channel's distance from the channel average — used ONLY for light
  // mode, to make hues cut clearly against white under screen blending.
  // Dark mode never calls this, so its look is completely unchanged.
  function vivifyTC(rgb, amount) {
    const avg = (rgb.r + rgb.g + rgb.b) / 3;
    const push = c => Math.round(avg + (c - avg) * (1 + amount));
    return {
      r: Math.max(0, Math.min(255, push(rgb.r))),
      g: Math.max(0, Math.min(255, push(rgb.g))),
      b: Math.max(0, Math.min(255, push(rgb.b))),
    };
  }

  function buildTubeConfig() {
    const P = readSitePalette();
    const dark = P.dark;

    // The canvas composites with `mix-blend-mode: screen`, which treats
    // black as "contributes nothing" and pure white as "fully overrides."
    // That means colors need to stay reasonably bright/saturated in BOTH
    // themes to register at all — darkening them toward black (as you
    // would for a normal alpha-blended layer) would make them disappear
    // instead of looking restrained. Use `opacity` for how strong the
    // effect reads, not color darkening.

    // Tube body colors: the site's blue / red / green triad. Dark mode
    // gets a touch of white mixed in for a soft luminous look (UNCHANGED
    // from before). Light mode pushes the same base hues toward higher
    // saturation so they read sharp/vivid against white instead of the
    // softer, more muted look the raw site colors give under screen
    // blending.
    const base = [hexToRgbTC(P.blue), hexToRgbTC(P.red), hexToRgbTC(P.green)];
    const tubeColors = base.map(c =>
      rgbToHexTC(dark ? mixTC(c, 255, 0.22) : vivifyTC(c, 0.55))
    );

    // Light colors: primary + yellow + blue-soft accents, echoing the
    // existing glow/shadow treatment used on .cta / .nav-chat hovers.
    // Same treatment: dark mode unchanged, light mode gets a saturation
    // boost for a crisper look.
    const lightBase = [hexToRgbTC(P.primary), hexToRgbTC(P.yellow), hexToRgbTC(P.blueSoft), hexToRgbTC(P.blue)];
    const lightColors = lightBase.map(c =>
      rgbToHexTC(dark ? mixTC(c, 255, 0.3) : vivifyTC(c, 0.5))
    );

    return {
      tubeColors,
      lightColors,
      // Dark mode value UNCHANGED. Light mode intensity raised so the
      // glow itself is brighter/sharper against white.
      intensity: dark ? 220 : 210,
      // Dark mode value UNCHANGED. Light mode opacity raised close to
      // full strength — screen blending means this can go high without
      // ever tinting the white background itself.
      opacity: dark ? 0.85 : 0.9,
    };
  }

  function applyThemeToTubes() {
    if (!tubesReady || !tubesApp || !tubesApp.tubes) return;
    const cfg = buildTubeConfig();
    try {
      tubesApp.tubes.setColors(cfg.tubeColors);
      tubesApp.tubes.setLightsColors(cfg.lightColors);
    } catch (e) { /* library may not be ready yet; ignore */ }
    tubesWrap.style.setProperty('--tubes-cursor-opacity', String(cfg.opacity));
  }

  // ---- device-pixel-ratio / mobile-aware sizing ----
  function tubesDPR() {
    const mobile = window.innerWidth <= 720;
    const cap = mobile ? 1.5 : 2;
    return Math.min(window.devicePixelRatio || 1, cap);
  }

  // ---- init (delayed one tick so layout/canvas size is settled,
  //      avoiding the NaN-radius race noted in the source component) ----
  function startTubes() {
    if (tubesDestroyed) return;
    tubesInitTimer = setTimeout(() => {
      if (tubesDestroyed) return;
      import(TUBES_MODULE_URL)
        .then((mod) => {
          if (tubesDestroyed) return;
          const TubesCursorInit = mod.default;
          if (!tubesCanvas) return;
          const cfg = buildTubeConfig();
          const app = TubesCursorInit(tubesCanvas, {
            tubes: {
              colors: cfg.tubeColors,
              lights: { intensity: cfg.intensity, colors: cfg.lightColors },
            },
          });
          tubesApp = app;
          tubesReady = true;
          tubesWrap.style.setProperty('--tubes-cursor-opacity', String(cfg.opacity));
          tubesWrap.classList.add('tubes-cursor-ready');
        })
        .catch((err) => {
          // Fail silently/gracefully — the existing CancerAtlas page must
          // remain fully functional even if the local module can't load
          // (e.g. page opened via file:// instead of a local server).
          console.warn('Tubes Cursor: failed to load background layer', err);
        });
    }, 120);
  }

  // ---- resize handling (namespaced; does not touch the page's own
  //      `resize` handler for the journey/scene canvas) ----
  let tubesResizeRAF = null;
  function onTubesResize() {
    if (tubesResizeRAF) cancelAnimationFrame(tubesResizeRAF);
    tubesResizeRAF = requestAnimationFrame(() => {
      // The underlying threejs-components module listens to window resize
      // internally; we just keep DPR-aware sizing sane on orientation
      // changes / browser zoom for lower-end mobile devices.
      tubesDPR();
    });
  }
  window.addEventListener('resize', onTubesResize, { passive: true });
  window.addEventListener('orientationchange', onTubesResize, { passive: true });

  // ---- react to the existing theme toggle (.dark class on <html>) ----
  const tubesThemeObserver = new MutationObserver(applyThemeToTubes);
  tubesThemeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  // ---- pause work when the tab is hidden ----
  document.addEventListener('visibilitychange', () => {
    if (!tubesApp) return;
    // threejs-components' tubes cursor drives its own internal RAF loop;
    // toggling canvas visibility is the safe, version-agnostic way to cut
    // paint cost without reaching into its internals.
    tubesWrap.style.visibility = document.hidden ? 'hidden' : 'visible';
  });

  // ---- cleanup on unload (best-effort; avoids leaking the GL context) ----
  window.addEventListener('beforeunload', () => {
    tubesDestroyed = true;
    if (tubesInitTimer) clearTimeout(tubesInitTimer);
    if (tubesApp && typeof tubesApp.dispose === 'function') {
      try { tubesApp.dispose(); } catch (e) { /* ignore */ }
    }
  });

  startTubes();
})();