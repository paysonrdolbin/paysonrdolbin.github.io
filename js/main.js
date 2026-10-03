// Shared behavior for every page: email links copy the address instead of opening mailto.

(function () {
  // mailto: opens a blank page when a visitor has no mail app set up, so clicking an
  // email link copies the address instead and shows a short confirmation.
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  document.body.appendChild(toast);
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("toast--show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("toast--show"), 2200);
  };
  const legacyCopy = (text) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    ta.remove();
    return ok;
  };
  document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = link.getAttribute("href").slice(7).split("?")[0];
      let copied = false;
      try {
        await navigator.clipboard.writeText(email);
        copied = true;
      } catch (err) {
        copied = legacyCopy(email);
      }
      // If copying is blocked entirely, at least show the address.
      showToast(copied ? `Copied ${email}` : email);
    });
  });
})();
