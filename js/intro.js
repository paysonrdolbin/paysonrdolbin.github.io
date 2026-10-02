// Welcome animation: the home page "renders in" bucket by bucket, like a progressive
// render, revealing the real page underneath. Plays once per browser session, can be skipped with a click or key,
// and is skipped entirely for visitors who prefer reduced motion.
// Loaded in <head> so the cover is up before the page paints.

(function () {
  const KEY = "pd-intro-seen";
  let seen = false;
  try { seen = sessionStorage.getItem(KEY) === "1"; } catch (e) { /* storage blocked: just play */ }
  if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try { sessionStorage.setItem(KEY, "1"); } catch (e) { /* ignore */ }

  // Cover the page immediately, before the body exists.
  const root = document.documentElement;
  root.classList.add("intro-cover");
  const style = document.createElement("style");
  style.textContent = `
    html.intro-cover::before { content: ""; position: fixed; inset: 0; background: #111; z-index: 9998; }
    .intro { position: fixed; inset: 0; z-index: 9999; cursor: pointer;
             transition: opacity .4s ease; }
    .intro--done { opacity: 0; pointer-events: none; }
    .intro canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
    .intro__status { position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: space-between;
                     gap: 16px; padding: 10px 16px; font: 12px "IBM Plex Mono", ui-monospace, Menlo, monospace;
                     color: #8a8a8a; border-top: 1px solid #262626; background: rgba(17,17,17,.85); }
    .intro__status b { color: #e6e6e6; font-weight: 500; }
    .intro__bar { position: absolute; left: 0; bottom: 0; height: 2px; width: 0; background: #2a9d8f; }
    .intro__skip { position: absolute; top: 14px; right: 16px; font: 12px "IBM Plex Mono", ui-monospace, Menlo, monospace;
                   color: #8a8a8a; background: none; border: 1px solid #333; border-radius: 4px; padding: 4px 10px; cursor: pointer; }
    .intro__skip:hover { color: #e6e6e6; border-color: #555; }
  `;
  document.head.appendChild(style);

  document.addEventListener("DOMContentLoaded", start);

  async function start() {
    const overlay = document.createElement("div");
    overlay.className = "intro";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML =
      '<canvas></canvas>' +
      '<button class="intro__skip" type="button">Skip</button>' +
      '<div class="intro__status"><span>home_v001.exr</span><span>Progress <b class="intro__pct">0%</b></span></div>' +
      '<div class="intro__bar"></div>';
    document.body.appendChild(overlay);
    root.classList.remove("intro-cover");

    const canvas = overlay.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const pctEl = overlay.querySelector(".intro__pct");
    const nameEl = overlay.querySelector(".intro__status span");
    const bar = overlay.querySelector(".intro__bar");

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      overlay.classList.add("intro--done");
      setTimeout(() => overlay.remove(), 700);
    };
    overlay.addEventListener("click", finish);
    document.addEventListener("keydown", finish, { once: true });

    // Render at CSS-pixel resolution (capped) to keep it fast.
    const W = Math.min(window.innerWidth, 1600);
    const H = Math.round(W * window.innerHeight / window.innerWidth);
    canvas.width = W; canvas.height = H;

    // Start fully "unrendered", then clear buckets to reveal the real page underneath:
    // first a grainy pass, then a clean one.
    ctx.fillStyle = "#111"; ctx.fillRect(0, 0, W, H);
    const B = Math.max(48, Math.round(W / 22));
    const buckets = [];
    for (let y = 0; y < H; y += B) for (let x = 0; x < W; x += B) buckets.push([x, y]);
    const d = (b) => Math.hypot(b[0] + B / 2 - W / 2, (b[1] + B / 2 - H / 2) * 1.6);
    buckets.sort((a, b) => d(a) - d(b));
    const total = buckets.length * 2;
    const DURATION = 1700; // ms for the whole render

    // A few grain tiles: dark, semi-transparent noise with the odd bright "firefly".
    const grain = Array.from({ length: 4 }, () => {
      const c = document.createElement("canvas");
      c.width = B; c.height = B;
      const gx = c.getContext("2d");
      const img = gx.createImageData(B, B);
      for (let i = 0; i < img.data.length; i += 4) {
        const firefly = Math.random() < 0.006;
        const v = firefly ? 235 : 10 + Math.random() * 30;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = firefly ? 230 : 70 + Math.random() * 110;
      }
      gx.putImageData(img, 0, 0);
      return c;
    });

    function paint([bx, by], grainy) {
      ctx.clearRect(bx, by, B, B);
      if (grainy) ctx.drawImage(grain[Math.floor(Math.random() * grain.length)], bx, by);
    }
    function outline([bx, by]) {
      const s = B - 1, c = Math.round(B * 0.22);
      ctx.strokeStyle = "rgba(255,255,255,.9)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      [[bx, by, 1, 1], [bx + s, by, -1, 1], [bx, by + s, 1, -1], [bx + s, by + s, -1, -1]].forEach(([x, y, dx, dy]) => {
        ctx.moveTo(x + 0.5 + dx * c, y + 0.5); ctx.lineTo(x + 0.5, y + 0.5); ctx.lineTo(x + 0.5, y + 0.5 + dy * c);
      });
      ctx.stroke();
    }

    let done = 0;
    const t0 = performance.now();
    function frame(now) {
      if (finished) return;
      const goal = Math.min(total, Math.floor(((now - t0) / DURATION) * total));
      while (done < goal) {
        const pass = Math.floor(done / buckets.length);
        paint(buckets[done % buckets.length], pass === 0);
        done++;
      }
      // Redraw outlines on the next few buckets in flight.
      if (done < total) {
        for (let k = 0; k < 4 && done + k < total; k++) outline(buckets[(done + k) % buckets.length]);
      }
      const pct = Math.floor((done / total) * 100);
      pctEl.textContent = pct + "%";
      bar.style.width = pct + "%";
      if (done < total) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, W, H);
        nameEl.textContent = `home_v001.exr · ${((now - t0) / 1000).toFixed(1)}s`;
        setTimeout(finish, 350);
      }
    }
    requestAnimationFrame(frame);
  }
})();
