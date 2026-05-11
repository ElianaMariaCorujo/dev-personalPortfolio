(function () {
  document.querySelectorAll("[data-dropdown]").forEach((root) => {
    const trigger = root.querySelector("[data-dropdown-trigger]");
    const panel = root.querySelector("[data-dropdown-panel]");
    if (!trigger || !panel) return;

    function open() {
      root.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
      panel.removeAttribute("hidden");
    }

    function close() {
      root.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
      panel.setAttribute("hidden", "");
    }

    function toggle() {
      if (root.classList.contains("is-open")) close();
      else open();
    }

    trigger.addEventListener("click", (ev) => {
      ev.stopPropagation();
      toggle();
    });

    panel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => close());
    });

    document.addEventListener("click", () => close());
    root.addEventListener("click", (ev) => ev.stopPropagation());

    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") close();
    });
  });
})();
