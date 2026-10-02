// Renders the resume PDF to canvases with pdf.js so it can be read on the page.
// To update the resume, replace assets/docs/Payson_Dolbin_Resume.pdf.

(async function () {
  const container = document.getElementById("resume-pages");
  if (!container) return;
  const url = container.dataset.pdf;
  const fail = () => {
    container.innerHTML =
      `<p class="resume__status">The resume preview couldn't load. <a href="${url}">Open the PDF</a> instead.</p>`;
  };
  if (!window.pdfjsLib) return fail();

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  let pdf;
  try {
    pdf = await pdfjsLib.getDocument(url).promise;
  } catch (e) {
    return fail();
  }

  const canvases = [];
  container.innerHTML = "";
  for (let n = 1; n <= pdf.numPages; n++) {
    const canvas = document.createElement("canvas");
    canvas.className = "resume__page";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `Resume page ${n}`);
    container.appendChild(canvas);
    canvases.push({ canvas, page: await pdf.getPage(n) });
  }

  // Render sharp at the current width; re-render if the width changes a lot.
  let renderedWidth = 0;
  async function render() {
    const width = container.clientWidth;
    if (Math.abs(width - renderedWidth) < 40) return;
    renderedWidth = width;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    for (const { canvas, page } of canvases) {
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: (width / base.width) * dpr });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    }
  }
  await render();
  let t;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(render, 200); });
})();
