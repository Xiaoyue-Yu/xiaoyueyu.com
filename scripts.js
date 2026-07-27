const views = Array.from(document.querySelectorAll("[data-view]"));
const viewLinks = Array.from(document.querySelectorAll("[data-view-link]"));
const overlayLayer = document.querySelector("[data-overlay-layer]");
const overlays = Array.from(document.querySelectorAll("[data-overlay]"));
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("#mobile-menu");
const MODAL_CLOSE_MS = 360;
let closeOverlayTimer = null;

function getTargetView(target) {
  return views.find((view) => view.dataset.view === target) ? target : "overview";
}

function setActiveView(target, shouldPush = true) {
  const nextView = getTargetView(target);

  views.forEach((view) => {
    view.classList.toggle("active", view.dataset.view === nextView);
  });

  viewLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.viewLink === nextView);
  });

  if (shouldPush) {
    history.pushState({ view: nextView }, "", `#${nextView}`);
  }

  closeOverlay();
  closeMenu();
  window.scrollTo(0, 0);
}

function openOverlay(name) {
  const overlay = overlays.find((item) => item.dataset.overlay === name);
  if (!overlay || !overlayLayer) return;

  if (closeOverlayTimer) {
    window.clearTimeout(closeOverlayTimer);
    closeOverlayTimer = null;
  }

  overlays.forEach((item) => {
    item.classList.remove("is-closing");
    item.hidden = item !== overlay;
  });

  overlayLayer.hidden = false;
  closeMenu();

  const closeButton = overlay.querySelector("[data-close-overlay]");
  if (closeButton) closeButton.focus();
}

function closeOverlay() {
  if (!overlayLayer) return;
  if (overlayLayer.hidden || closeOverlayTimer) return;

  const activeOverlay = overlays.find((item) => !item.hidden);
  if (!activeOverlay) {
    overlayLayer.hidden = true;
    return;
  }

  activeOverlay.classList.add("is-closing");

  let didFinishClose = false;
  const finishClose = () => {
    if (didFinishClose) return;
    didFinishClose = true;

    activeOverlay.removeEventListener("animationend", finishClose);
    if (closeOverlayTimer) {
      window.clearTimeout(closeOverlayTimer);
      closeOverlayTimer = null;
    }

    overlayLayer.hidden = true;
    overlays.forEach((item) => {
      item.classList.remove("is-closing");
      item.hidden = true;
    });
  };

  activeOverlay.addEventListener("animationend", finishClose);
  closeOverlayTimer = window.setTimeout(finishClose, MODAL_CLOSE_MS);
}

function closeMenu() {
  if (!mobileMenu || !menuToggle) return;

  mobileMenu.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
}

function toggleMenu() {
  if (!mobileMenu || !menuToggle) return;

  const isOpen = !mobileMenu.hidden;
  mobileMenu.hidden = isOpen;
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
}

viewLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = link.dataset.viewLink;
    if (!target) return;

    event.preventDefault();
    setActiveView(target);
  });
});

document.querySelectorAll("[data-open-overlay]").forEach((button) => {
  button.addEventListener("click", () => {
    openOverlay(button.dataset.openOverlay);
  });
});

document.querySelectorAll("[data-close-overlay]").forEach((button) => {
  button.addEventListener("click", closeOverlay);
});

if (overlayLayer) {
  overlayLayer.addEventListener("click", (event) => {
    if (event.target === overlayLayer) closeOverlay();
  });
}

if (menuToggle) {
  menuToggle.addEventListener("click", toggleMenu);
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeOverlay();
    closeMenu();
  }
});

window.addEventListener("popstate", () => {
  setActiveView(window.location.hash.replace("#", ""), false);
});

setActiveView(window.location.hash.replace("#", ""), false);
