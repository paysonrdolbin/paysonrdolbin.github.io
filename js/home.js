// Home page: project tiles open a near-full-screen overlay with a gallery.
// Project content lives in PROJECTS below; the tiles in index.html point at it by index.

(function () {
  const S = "assets/stills/", V = "assets/video/", IC = "assets/icons/";
  const vimeo = (id) => `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0&dnt=1`;
  const ICONS = {
    "Houdini/Solaris": "houdini.png", RenderMan: "renderman.svg", Nuke: "nuke.png",
    "Unreal Engine 5": "unreal.png", "Unreal Engine": "unreal.png", Maya: "maya.png",
    "Substance Painter": "substance.png", Karma: "karma.svg", Arnold: "arnold.png",
  };

  // media types: img (still), loop (muted looping clip), film (video with controls), vimeo (embed)
  const PROJECTS = [
    { title: "Honey Business", group: "g", roles: ["Lighting Artist", "Render Artist"], sw: ["Houdini/Solaris", "RenderMan", "Nuke"],
      bullets: ["Tuned RenderMan path tracer settings to make dailies render 6–10x faster.",
        "Set up render layers and LPEs so compositors could control lights, objects and scattering types separately.",
        "Managed the production's render farm to keep shots moving."],
      media: [
        { t: "img", src: S + "honey-business/c250.jpg", alt: "Bear close-up in the forest" },
        { t: "img", src: S + "honey-business/d040.jpg", alt: "Bear behind the garden gate" },
        { t: "img", src: S + "honey-business/f210.jpg", alt: "Honey pour" },
        { t: "vimeo", src: vimeo(1187515149), thumb: S + "honey-business/film-thumb.jpg", alt: "Honey Business full film", caption: "Full film · Password: watchBobo" },
      ] },
    { title: "Sandwich Kwon Do", group: "g", roles: ["Lighting Artist", "Lighting TD"], sw: ["Houdini/Solaris", "RenderMan", "Nuke"],
      bullets: ["Led a team of lighters through lighting test shots and film sequences.",
        "Built stylized lighting tools for painterly volumetrics, depth of field and shadows.",
        "Optimized rendering tools for easier use and quicker iterations."],
      media: [
        { t: "img", src: S + "sandwich-kwon-do/z020.jpg", alt: "Open sign in the shop window" },
        { t: "img", src: S + "sandwich-kwon-do/z030a.jpg", alt: "Lit window at night" },
        { t: "img", src: S + "sandwich-kwon-do/z030b.jpg", alt: "Storefront" },
      ] },
    { title: "Scuttle", group: "g", stage: 2.39, roles: ["Lighting Lead"], sw: ["Unreal Engine 5"],
      bullets: ["Led lighting in Unreal Engine 5, turning 2D concept art into 3D environments.",
        "Managed a team of lighters to keep the film consistent and cinematic on a tight schedule."],
      media: [
        { t: "img", src: S + "scuttle/scuttle-04.jpg", alt: "Crabs meeting on the beach" },
        { t: "img", src: S + "scuttle/scuttle-01.jpg", alt: "Hermit crab under a leaf" },
        { t: "film", src: V + "scuttle.mp4", poster: V + "scuttle-poster.jpg", alt: "Scuttle full film", caption: "Full film" },
      ] },
    { title: "Coral Reef", group: "p", roles: ["Lighting"], sw: ["Houdini/Solaris", "RenderMan", "Nuke"], bullets: [],
      media: [{ t: "loop", src: V + "coral-reef.mp4", poster: V + "coral-reef-poster.jpg", alt: "Coral Reef clip" }] },
    { title: "Coffee Shop", group: "p", roles: ["Lighting"], sw: ["Unreal Engine"], bullets: [],
      media: [{ t: "loop", src: V + "coffee-shop.mp4", poster: V + "coffee-shop-poster.jpg", alt: "Coffee Shop clip" }] },
    { title: "Retro NES Composite", group: "p", roles: ["Lighting", "Compositing"], sw: ["Substance Painter", "Karma", "Nuke"], bullets: [],
      media: [
        { t: "img", src: S + "retro-nes/nes-comp.jpg", alt: "Final composite", caption: "Composite" },
        { t: "img", src: S + "retro-nes/nes-without.jpg", alt: "Original render", caption: "Original Image" },
      ] },
    { title: "Downtown West", group: "p", roles: ["Lighting"], sw: ["Unreal Engine"], bullets: [],
      media: [{ t: "loop", src: V + "downtown.mp4", poster: V + "downtown-poster.jpg", alt: "Downtown West clip" }] },
    { title: "Ramen Bowl", group: "p", roles: ["All Aspects"], sw: ["Maya", "Substance Painter", "Arnold"], bullets: [],
      media: [{ t: "img", src: S + "ramen/ramen-01.jpg", alt: "Ramen bowl still life" }] },
  ];

  // ---------- Icons (Lucide, stroke 2.75) ----------
  const svg = (inner, fill) =>
    `<svg viewBox="0 0 24 24" fill="${fill ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  const I = {
    x: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
    left: svg('<path d="m15 18-6-6 6-6"/>'),
    right: svg('<path d="m9 18 6-6-6-6"/>'),
    arrow: svg('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'),
    play: svg('<polygon points="6 3 20 12 6 21 6 3"/>', true),
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg>',
    max: svg('<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>'),
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");

  // ---------- Overlay markup ----------
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="ov-panel" role="dialog" aria-modal="true" aria-labelledby="ov-title">
      <div class="ov-info">
        <div class="ov-head">
          <div class="ov-heading">
            <div class="ov-kicker label"></div>
            <h1 class="ov-title" id="ov-title"></h1>
          </div>
          <button class="icon-btn icon-btn--outline ov-close" type="button" aria-label="Close">${I.x}</button>
        </div>
        <div class="tags ov-roles"></div>
        <div class="sw-row ov-sw"></div>
        <ul class="ov-bullets"></ul>
        <div class="ov-next"><button class="btn ov-next-btn" type="button"></button></div>
      </div>
      <div class="ov-gallery">
        <div class="ov-stage-area"><div class="ov-stage"></div></div>
        <div class="ov-caption-row"><span class="ov-caption"></span><span class="ov-counter label"></span></div>
        <div class="ov-thumbs"></div>
      </div>
    </div>
    <div class="ov-zoom" hidden>
      <img alt="">
      <button class="icon-btn icon-btn--cream ov-zoom__close" type="button" aria-label="Back to project">${I.x}</button>
    </div>`;
  document.body.appendChild(overlay);

  const $ = (sel) => overlay.querySelector(sel);
  const panel = $(".ov-panel"), info = $(".ov-info"), stage = $(".ov-stage");
  const zoomEl = $(".ov-zoom"), zoomImg = zoomEl.querySelector("img");

  const state = { open: null, g: 0, zoom: false };
  const ratios = {};
  let lastFocus = null;

  const arrows = () =>
    `<button class="icon-btn icon-btn--cream stage-arrow stage-arrow--prev" type="button" data-step="-1" aria-label="Previous">${I.left}</button>` +
    `<button class="icon-btn icon-btn--cream stage-arrow stage-arrow--next" type="button" data-step="1" aria-label="Next">${I.right}</button>`;

  function setRatio(m) {
    const p = PROJECTS[state.open];
    const r = ratios[m.src] || (m.t === "vimeo" ? 16 / 9 : p.stage || 16 / 9);
    stage.style.setProperty("--r", r);
  }
  function measure(m, r) {
    if (!r || ratios[m.src] === r) return;
    ratios[m.src] = r;
    if (PROJECTS[state.open] && PROJECTS[state.open].media[state.g] === m) setRatio(m);
  }

  function renderInfo() {
    const p = PROJECTS[state.open];
    $(".ov-kicker").textContent = p.group === "g" ? `${pad(state.open + 1)} · Group project` : "Personal project";
    $(".ov-title").textContent = p.title;
    $(".ov-roles").innerHTML = p.roles.map((r) => `<span class="tag">${esc(r)}</span>`).join("");
    $(".ov-sw").innerHTML = p.sw.map((n) =>
      `<span class="sw"><img src="${IC + ICONS[n]}" alt="" width="18" height="18">${esc(n)}</span>`).join("");
    $(".ov-bullets").innerHTML = p.bullets.map((b) => `<li>${esc(b)}</li>`).join("");
    const next = PROJECTS[(state.open + 1) % PROJECTS.length];
    $(".ov-next-btn").innerHTML = `Next · ${esc(next.title)} ${I.arrow}`;
    info.scrollTop = 0;
    panel.scrollTop = 0;
  }

  function renderItem() {
    const p = PROJECTS[state.open];
    const n = p.media.length, m = p.media[state.g];

    // Rebuilding the stage removes the previous video/iframe, which stops its playback.
    stage.innerHTML = "";
    setRatio(m);
    let el;
    if (m.t === "img") {
      el = new Image();
      el.alt = m.alt || "";
      el.addEventListener("load", () => measure(m, el.naturalWidth / el.naturalHeight));
      el.addEventListener("click", (e) => { e.stopPropagation(); setZoom(true); });
      el.src = m.src;
      stage.appendChild(el);
    } else if (m.t === "loop" || m.t === "film") {
      el = document.createElement("video");
      el.src = m.src;
      el.poster = m.poster || "";
      el.playsInline = true;
      el.setAttribute("aria-label", m.alt || "");
      el.addEventListener("loadedmetadata", () => measure(m, el.videoWidth / el.videoHeight));
      stage.appendChild(el);
      if (m.t === "film") {
        el.controls = true;
        el.preload = "metadata";
      } else {
        el.className = "is-loop";
        el.muted = true;
        el.loop = true;
        stage.insertAdjacentHTML("beforeend",
          `<button class="icon-btn icon-btn--primary clip-btn clip-btn--fs" type="button" aria-label="Full screen">${I.max}</button>` +
          `<button class="icon-btn icon-btn--primary clip-btn clip-btn--play" type="button"></button>`);
        const playBtn = stage.querySelector(".clip-btn--play");
        const sync = () => {
          playBtn.innerHTML = el.paused ? I.play : I.pause;
          playBtn.setAttribute("aria-label", el.paused ? "Play" : "Pause");
        };
        const toggle = (e) => { e.stopPropagation(); el.paused ? el.play().catch(() => {}) : el.pause(); };
        el.addEventListener("play", sync);
        el.addEventListener("pause", sync);
        el.addEventListener("click", toggle);
        playBtn.addEventListener("click", toggle);
        stage.querySelector(".clip-btn--fs").addEventListener("click", (e) => {
          e.stopPropagation();
          const fs = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitEnterFullscreen;
          if (fs) fs.call(el);
        });
        sync();
        el.play().catch(() => sync());
      }
    } else if (m.t === "vimeo") {
      el = document.createElement("iframe");
      el.src = m.src;
      el.title = m.alt || "";
      el.allow = "autoplay; fullscreen; picture-in-picture";
      el.allowFullscreen = true;
      stage.appendChild(el);
    }
    if (n > 1) stage.insertAdjacentHTML("beforeend", arrows());

    $(".ov-caption").textContent = m.caption || "";
    $(".ov-counter").textContent = n > 1 ? `${pad(state.g + 1)} / ${pad(n)}` : "";

    const thumbs = $(".ov-thumbs");
    thumbs.innerHTML = n > 1 ? p.media.map((x, j) =>
      `<button class="ov-thumb${j === state.g ? " ov-thumb--active" : ""}" type="button" data-pick="${j}" aria-label="${esc(x.caption || x.alt || "Item " + (j + 1))}"${j === state.g ? ' aria-current="true"' : ""}>` +
      `<img src="${x.thumb || x.poster || x.src}" alt="" loading="lazy">` +
      (x.t !== "img" ? `<span class="ov-thumb__play">${I.play}</span>` : "") +
      `</button>`).join("") : "";

    renderZoom();
  }

  function renderZoom() {
    const m = PROJECTS[state.open].media[state.g];
    const show = state.zoom && m.t === "img";
    zoomEl.hidden = !show;
    if (!show) return;
    zoomImg.src = m.src;
    zoomImg.alt = m.alt || "";
    zoomEl.querySelectorAll(".stage-arrow").forEach((b) => b.remove());
    if (PROJECTS[state.open].media.length > 1) zoomEl.insertAdjacentHTML("beforeend", arrows());
  }
  function setZoom(on) { state.zoom = on; renderZoom(); }

  function step(d) {
    const media = PROJECTS[state.open].media;
    state.g = (state.g + d + media.length) % media.length;
    state.zoom = state.zoom && media[state.g].t === "img";
    renderItem();
  }

  function open(i) {
    if (state.open == null) lastFocus = document.activeElement;
    state.open = i; state.g = 0; state.zoom = false;
    renderInfo();
    renderItem();
    overlay.hidden = false;
    document.body.classList.add("overlay-open");
    $(".ov-close").focus({ preventScroll: true });
  }
  function close() {
    state.open = null; state.zoom = false;
    stage.innerHTML = "";          // stops any playing media
    zoomEl.hidden = true;
    overlay.hidden = true;
    document.body.classList.remove("overlay-open");
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  // ---------- Events ----------
  document.querySelectorAll(".tile[data-project]").forEach((tile) =>
    tile.addEventListener("click", () => open(Number(tile.dataset.project))));

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) return close();                     // backdrop
    const stepBtn = e.target.closest("[data-step]");
    if (stepBtn) { e.stopPropagation(); return step(Number(stepBtn.dataset.step)); }
    const pick = e.target.closest("[data-pick]");
    if (pick) { state.g = Number(pick.dataset.pick); state.zoom = false; return renderItem(); }
    if (e.target.closest(".ov-close")) return close();
    if (e.target.closest(".ov-next-btn")) return open((state.open + 1) % PROJECTS.length);
    if (e.target.closest(".ov-zoom")) return setZoom(false);     // background or X
  });

  document.addEventListener("keydown", (e) => {
    if (state.open == null) return;
    if (e.key === "Escape") { e.preventDefault(); state.zoom ? setZoom(false) : close(); }
    else if (e.target.tagName === "VIDEO") return;                 // let native controls seek
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
  });
})();
