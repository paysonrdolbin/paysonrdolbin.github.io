// Shared behavior: mobile menu, still galleries, lightbox, section scrollspy.

(function () {
  // ---------- Mobile menu ----------
  const hamburger = document.querySelector(".hamburger");
  const overlay = document.querySelector(".mobile-overlay");
  const closeMenu = () => document.body.classList.remove("menu-open");
  if (hamburger) {
    hamburger.addEventListener("click", () => document.body.classList.toggle("menu-open"));
    overlay && overlay.addEventListener("click", closeMenu);
    document.querySelectorAll(".sidebar a").forEach((a) => a.addEventListener("click", closeMenu));
  }

  // ---------- Lightbox ----------
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML = '<img alt="">';
  document.body.appendChild(lightbox);
  const lightboxImg = lightbox.querySelector("img");
  const closeLightbox = () => lightbox.classList.remove("lightbox--open");
  lightbox.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });
  const openLightbox = (img) => {
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt;
    lightbox.classList.add("lightbox--open");
  };

  // ---------- Galleries ----------
  // Markup: .gallery > .gallery__stage > img.gallery__img (one per still).
  // Optional data-caption on an image is shown under the stage.
  // Arrows, caption/counter row and thumbnails are generated here.
  const arrow = (dir) =>
    `<button class="gallery__arrow gallery__arrow--${dir < 0 ? "prev" : "next"}" data-dir="${dir}" aria-label="${dir < 0 ? "Previous" : "Next"} image">` +
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="${dir < 0 ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}"/></svg></button>`;

  document.querySelectorAll(".gallery").forEach((gallery) => {
    const stage = gallery.querySelector(".gallery__stage");
    const imgs = [...stage.querySelectorAll(".gallery__img")];
    if (imgs.length < 2) gallery.classList.add("gallery--single");
    stage.insertAdjacentHTML("beforeend", arrow(-1) + arrow(1));

    const meta = document.createElement("div");
    meta.className = "gallery__meta";
    meta.innerHTML = '<span class="gallery__caption"></span><span class="gallery__count"></span>';
    const thumbs = document.createElement("div");
    thumbs.className = "gallery__thumbs";
    imgs.forEach((img, i) => {
      const b = document.createElement("button");
      b.className = "gallery__thumb";
      b.setAttribute("aria-label", img.dataset.caption || `Show image ${i + 1}`);
      b.innerHTML = `<img src="${img.dataset.poster || img.getAttribute("poster") || img.getAttribute("src")}" alt="" loading="lazy">`;
      if (img.tagName === "VIDEO" || img.dataset.poster) b.classList.add("gallery__thumb--video");
      b.addEventListener("click", () => show(i));
      thumbs.appendChild(b);
    });
    gallery.append(meta, thumbs);

    const caption = meta.querySelector(".gallery__caption");
    const count = meta.querySelector(".gallery__count");
    let current = 0;
    function show(i) {
      current = (i + imgs.length) % imgs.length;
      imgs.forEach((img, j) => {
        if (j === current) return;
        if (img.tagName === "VIDEO") img.pause();
        // Vimeo embeds accept a postMessage "pause" command.
        const frame = img.querySelector("iframe");
        if (frame && frame.contentWindow) frame.contentWindow.postMessage('{"method":"pause"}', "*");
      });
      imgs.forEach((img, j) => img.classList.toggle("gallery__img--active", j === current));
      [...thumbs.children].forEach((t, j) => t.classList.toggle("gallery__thumb--active", j === current));
      caption.textContent = imgs[current].dataset.caption || "";
      count.textContent = `${String(current + 1).padStart(2, "0")} / ${String(imgs.length).padStart(2, "0")}`;
    }
    stage.querySelectorAll(".gallery__arrow").forEach((btn) =>
      btn.addEventListener("click", (e) => { e.stopPropagation(); show(current + Number(btn.dataset.dir)); })
    );
    stage.addEventListener("click", () => { if (imgs[current].tagName === "IMG") openLightbox(imgs[current]); });
    gallery.tabIndex = 0;
    gallery.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
    show(0);
  });

  // ---------- Scrollspy for sidebar section links ----------
  const sublinks = [...document.querySelectorAll(".nav__sublink[href^='#']")];
  const targets = sublinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  if (targets.length) {
    // The last section (in document order) whose top has passed 35% of the viewport wins,
    // so nested sections (a project inside Breakdowns) take priority over their parent.
    let ticking = false;
    const update = () => {
      ticking = false;
      const line = window.innerHeight * 0.35;
      let active = targets[0];
      targets.forEach((t) => { if (t.getBoundingClientRect().top <= line) active = t; });
      sublinks.forEach((l) =>
        l.classList.toggle("nav__sublink--active", l.getAttribute("href") === "#" + active.id)
      );
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }
})();
