// "Coming soon" placeholder for the TD reel: a tiny path-traced scene in which a spotlight
// projects "WORK IN PROGRESS" through a gobo onto a wall. It renders bucket by bucket,
// refines over several passes, then gets stuck at 99%.

(async function () {
  const canvas = document.getElementById("rv-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const BUCKET = 32;
  const PASSES = [1, 2, 4, 8, 16]; // samples per pixel added each pass
  const el = (id) => document.getElementById(id);
  const ui = { bar: el("rv-bar"), pct: el("rv-pct"), spp: el("rv-spp"), time: el("rv-time"), eta: el("rv-eta"), name: document.querySelector(".render-view__bar span") };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Gobo (the cut-out the spotlight shines through) ----------
  try { await document.fonts.load('700 100px "Manrope"'); } catch (e) { /* fall back to system font */ }
  const MW = 1024, MH = 512;
  const goboCanvas = document.createElement("canvas");
  goboCanvas.width = MW; goboCanvas.height = MH;
  const g = goboCanvas.getContext("2d");
  // Soft pool of spill light so the spot itself reads, then the bright lettering.
  const pool = g.createRadialGradient(MW / 2, MH / 2, 20, MW / 2, MH / 2, MW / 2);
  pool.addColorStop(0, "rgb(52,52,52)");
  pool.addColorStop(0.75, "rgb(30,30,30)");
  pool.addColorStop(1, "rgb(0,0,0)");
  g.fillStyle = "#000"; g.fillRect(0, 0, MW, MH);
  g.save(); g.scale(1, 0.62); g.translate(0, MH * 0.31);
  g.fillStyle = pool; g.beginPath(); g.arc(MW / 2, MH / 2, MW / 2, 0, Math.PI * 2); g.fill();
  g.restore();
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = '700 132px "Manrope", "Helvetica Neue", Arial, sans-serif';
  g.fillText("WORK IN", MW / 2, MH * 0.33);
  g.fillText("PROGRESS", MW / 2, MH * 0.6);
  g.font = '500 34px "IBM Plex Mono", ui-monospace, Menlo, monospace';
  g.fillText("TD REEL  ·  COMING SOON", MW / 2, MH * 0.82);
  const gobo = g.getImageData(0, 0, MW, MH).data;
  const goboAt = (u, v) => { // u, v in [0, 1)
    const x = Math.floor(u * MW), y = Math.floor(v * MH);
    if (x < 0 || y < 0 || x >= MW || y >= MH) return 0;
    return gobo[(y * MW + x) * 4] / 255;
  };

  // ---------- Scene: floor (y = 0) and back wall (z = WALL_Z) ----------
  const WALL_Z = 7;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };

  const spot = { p: [-0.6, 3.4, 1.2], target: [0, 2.15, WALL_Z], radius: 0.025, color: [1.0, 0.82, 0.6], intensity: 2.6, gw: 0.42, gh: 0.21 };
  spot.f = norm(sub(spot.target, spot.p));
  spot.r = norm(cross([0, 1, 0], spot.f));
  spot.u = cross(spot.f, spot.r);
  const fill = [0.05, 0.055, 0.07];

  function hit(o, d, maxT) {
    let t = maxT, n = null, kind = null;
    if (d[1] < 0) { const tt = -o[1] / d[1]; if (tt > 1e-3 && tt < t) { t = tt; n = [0, 1, 0]; kind = "floor"; } }
    if (d[2] > 0) { const tt = (WALL_Z - o[2]) / d[2]; if (tt > 1e-3 && tt < t) { t = tt; n = [0, 0, -1]; kind = "wall"; } }
    return kind ? { t, n, kind } : null;
  }

  function spotLight(p, n) {
    // Jitter the light position slightly for soft gobo edges.
    const lp = [spot.p[0] + (Math.random() - 0.5) * spot.radius * 2, spot.p[1] + (Math.random() - 0.5) * spot.radius * 2, spot.p[2]];
    const v = sub(p, lp);
    const fz = dot(v, spot.f);
    if (fz <= 0) return 0;
    const x = dot(v, spot.r) / fz, y = dot(v, spot.u) / fz;
    const mask = goboAt((x / spot.gw + 1) / 2, 1 - (y / spot.gh + 1) / 2);
    if (!mask) return 0;
    const dist = Math.hypot(v[0], v[1], v[2]);
    const l = [-v[0] / dist, -v[1] / dist, -v[2] / dist];
    const ndl = Math.max(0, dot(n, l));
    return mask * ndl * spot.intensity * 36 / (dist * dist);
  }

  function shade(px, py) {
    const fx = ((px + Math.random()) / W - 0.5) * 1.6;
    const fy = -((py + Math.random()) / H - 0.5) * 0.9 + 0.04;
    const o = [0, 1.7, 0];
    const d = norm([fx, fy, 1]);
    const h = hit(o, d, 1e9);
    if (!h) return [0, 0, 0];
    const p = [o[0] + d[0] * h.t, o[1] + d[1] * h.t, o[2] + d[2] * h.t];
    const albedo = h.kind === "wall" ? [0.72, 0.71, 0.7] : [0.3, 0.3, 0.31];
    const s = spotLight(p, h.n);
    // One-sample ambient occlusion: darkens the corner where wall meets floor, and adds early-pass noise.
    let dir = norm([Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1]);
    if (dot(dir, h.n) < 0) dir = [-dir[0], -dir[1], -dir[2]];
    const amb = hit(p, dir, 1.5) ? 0.15 : 1;
    return [0, 1, 2].map((i) => albedo[i] * (spot.color[i] * s + fill[i] * amb * 2));
  }

  // ---------- Bucket render loop ----------
  const accum = new Float32Array(W * H * 3);
  const image = ctx.createImageData(W, H);
  const tone = (v) => Math.round(255 * Math.pow(1 - Math.exp(-v * 1.8), 1 / 2.2)); // filmic-ish + gamma

  // Buckets ordered outward from the center, like a spiral render.
  const buckets = [];
  for (let y = 0; y < H; y += BUCKET) for (let x = 0; x < W; x += BUCKET) buckets.push([x, y]);
  const centerDist = (b) => Math.hypot(b[0] + BUCKET / 2 - W / 2, (b[1] + BUCKET / 2 - H / 2) * 1.4);
  buckets.sort((a, b) => centerDist(a) - centerDist(b));
  const totalWork = buckets.length * PASSES.length;

  let pass, bi, spp, done, version = 1, start, stuckSince;
  function reset() {
    accum.fill(0);
    pass = 0; bi = 0; spp = 0; done = 0; stuckSince = 0;
    start = performance.now();
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, W, H);
    for (let i = 3; i < image.data.length; i += 4) image.data[i] = 255;
    ui.name.textContent = `td_reel_v${String(version).padStart(3, "0")}.exr`;
    ui.eta.textContent = "soon™";
  }

  function renderBucket([bx, by], samples) {
    const total = PASSES.slice(0, pass + 1).reduce((a, b) => a + b, 0);
    for (let y = by; y < Math.min(by + BUCKET, H); y++) {
      for (let x = bx; x < Math.min(bx + BUCKET, W); x++) {
        const i = (y * W + x) * 3;
        for (let s = 0; s < samples; s++) {
          const c = shade(x, y);
          accum[i] += c[0]; accum[i + 1] += c[1]; accum[i + 2] += c[2];
        }
        const j = (y * W + x) * 4;
        image.data[j] = tone(accum[i] / total);
        image.data[j + 1] = tone(accum[i + 1] / total);
        image.data[j + 2] = tone(accum[i + 2] / total);
      }
    }
    ctx.putImageData(image, 0, 0, bx, by, BUCKET, BUCKET);
  }

  function drawBucketOutline([bx, by]) {
    const s = BUCKET - 1, c = 7;
    ctx.strokeStyle = "rgba(255,255,255,.9)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    [[bx, by, 1, 1], [bx + s, by, -1, 1], [bx, by + s, 1, -1], [bx + s, by + s, -1, -1]].forEach(([x, y, dx, dy]) => {
      ctx.moveTo(x + 0.5 + dx * c, y + 0.5); ctx.lineTo(x + 0.5, y + 0.5); ctx.lineTo(x + 0.5, y + 0.5 + dy * c);
    });
    ctx.stroke();
  }

  const fmtTime = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const stuckLines = ["any minute now", "99% (classic)", "compiling shaders…", "waiting on the farm"];

  function step() {
    renderBucket(buckets[bi], PASSES[pass]);
    done++; bi++;
    if (bi === buckets.length) { spp += PASSES[pass]; bi = 0; pass++; }
  }

  function updateUI(now) {
    const pct = Math.min(99, Math.floor((done / totalWork) * 100));
    ui.bar.style.width = pct + "%";
    ui.pct.textContent = pct + "%";
    ui.spp.textContent = spp;
    ui.time.textContent = fmtTime(now - start);
  }

  function frame(now) {
    if (pass < PASSES.length) {
      const budgetEnd = now + 10;
      while (performance.now() < budgetEnd && pass < PASSES.length) step();
      if (pass < PASSES.length) drawBucketOutline(buckets[bi]);
      else ctx.putImageData(image, 0, 0);
      updateUI(performance.now());
    } else {
      // Finished rendering, but the progress bar is stuck at 99%.
      if (!stuckSince) stuckSince = now;
      const stuck = now - stuckSince;
      ui.time.textContent = fmtTime(now - start);
      ui.eta.textContent = stuckLines[Math.floor(stuck / 1500) % stuckLines.length];
      if (stuck > 6000) { version++; reset(); }
    }
    requestAnimationFrame(frame);
  }

  reset();
  if (reduceMotion) {
    // Render a finished frame once, no animation.
    while (pass < PASSES.length) step();
    updateUI(performance.now());
    ui.eta.textContent = "soon™";
    return;
  }

  // Start animating once the canvas is on screen.
  let running = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; requestAnimationFrame(frame); }
  }).observe(canvas);
})();
