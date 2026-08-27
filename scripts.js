const views = Array.from(document.querySelectorAll("[data-view]"));
const viewLinks = Array.from(document.querySelectorAll("[data-view-link]"));
const overlayLayer = document.querySelector("[data-overlay-layer]");
const overlays = Array.from(document.querySelectorAll("[data-overlay]"));
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("#mobile-menu");
const galleryButtons = Array.from(document.querySelectorAll("[data-gallery-item]"));
const galleryOverlay = document.querySelector('[data-overlay="gallery"]');
const galleryImage = document.querySelector(".image-viewer-img");
const AUTO_ABOUT_DELAY_MS = 420;
const MODAL_CLOSE_MS = 360;
let closeOverlayTimer = null;
let activeGalleryGroup = [];
let activeGalleryIndex = 0;

function getTargetView(target) {
  return views.find((view) => view.dataset.view === target) ? target : "overview";
}

function setActiveView(target, shouldPush = true) {
  const nextView = getTargetView(target);
  const sidebarParentView = nextView.startsWith("game-jam-") ? "game-jam" : nextView;

  views.forEach((view) => {
    view.classList.toggle("active", view.dataset.view === nextView);
  });

  viewLinks.forEach((link) => {
    const isSidebarLink = Boolean(link.closest(".desktop-nav"));
    const activeView = isSidebarLink ? sidebarParentView : nextView;
    link.classList.toggle("active", link.dataset.viewLink === activeView);
  });

  if (shouldPush) {
    history.pushState({ view: nextView }, "", `#${nextView}`);
  }

  closeOverlay();
  closeMenu();
  window.scrollTo(0, 0);
}

function openOverlay(name, shouldFocusClose = true) {
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

  overlayLayer.classList.toggle("is-gallery-open", name === "gallery");
  overlayLayer.hidden = false;
  closeMenu();

  const closeButton = overlay.querySelector("[data-close-overlay]");
  if (shouldFocusClose && closeButton) closeButton.focus();
}

function setGalleryImage(index) {
  const button = activeGalleryGroup[index];
  const image = button ? button.querySelector("img") : null;
  if (!image || !galleryImage) return;

  activeGalleryIndex = index;
  galleryImage.src = image.currentSrc || image.src;
  galleryImage.alt = image.alt;
}

function openGallery(button) {
  const gallery = button.closest(".archive-gallery");
  activeGalleryGroup = gallery
    ? Array.from(gallery.querySelectorAll("[data-gallery-item]"))
    : [button];

  const index = activeGalleryGroup.indexOf(button);
  const hasSiblings = activeGalleryGroup.length > 1;

  if (galleryOverlay) {
    galleryOverlay.classList.toggle("is-single", !hasSiblings);
  }

  setGalleryImage(index === -1 ? 0 : index);
  openOverlay("gallery");
}

function moveGallery(direction) {
  if (activeGalleryGroup.length < 2) return;

  const count = activeGalleryGroup.length;
  const nextIndex = (activeGalleryIndex + direction + count) % count;
  setGalleryImage(nextIndex);
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
    overlayLayer.classList.remove("is-gallery-open");
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

galleryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openGallery(button);
  });
});

if (galleryOverlay) {
  const previousButton = galleryOverlay.querySelector("[data-gallery-prev]");
  const nextButton = galleryOverlay.querySelector("[data-gallery-next]");

  if (previousButton) {
    previousButton.addEventListener("click", (event) => {
      event.stopPropagation();
      moveGallery(-1);
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", (event) => {
      event.stopPropagation();
      moveGallery(1);
    });
  }
}

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

  if (galleryOverlay && !galleryOverlay.hidden && event.key === "ArrowLeft") {
    moveGallery(-1);
  }

  if (galleryOverlay && !galleryOverlay.hidden && event.key === "ArrowRight") {
    moveGallery(1);
  }
});

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      /* fall through to the legacy path */
    }
  }

  try {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(helper);
    return ok;
  } catch (error) {
    return false;
  }
}

document.querySelectorAll("[data-copy-email]").forEach((link) => {
  const label = link.querySelector("[data-copy-label]");
  const originalText = label ? label.textContent : "";
  let resetTimer = null;

  link.addEventListener("click", async (event) => {
    event.preventDefault();

    const copied = await copyText(link.dataset.copyEmail);
    if (!label) return;

    if (resetTimer) window.clearTimeout(resetTimer);
    label.textContent = copied ? "Copied!" : "Copy failed";
    link.classList.add("is-copied");

    resetTimer = window.setTimeout(() => {
      label.textContent = originalText;
      link.classList.remove("is-copied");
      resetTimer = null;
    }, 1600);
  });
});

window.addEventListener("popstate", () => {
  setActiveView(window.location.hash.replace("#", ""), false);
});

setActiveView(window.location.hash.replace("#", ""), false);

if (!window.location.hash) {
  window.setTimeout(() => {
    const activeView = document.querySelector("[data-view].active");
    if (activeView && activeView.dataset.view === "overview") {
      openOverlay("about", false);
    }
  }, AUTO_ABOUT_DELAY_MS);
}
