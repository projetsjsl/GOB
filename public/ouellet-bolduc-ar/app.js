// Basic config for the AR experience and QR sharing
const AR_USDZ_URL = "https://modelviewer.dev/shared-assets/models/Astronaut.usdz";
// URL finale servie en prod (utilisée pour le QR quand on est en file://)
const SHARE_FALLBACK_URL = "https://jslai.app/ouellet-bolduc-ar/";

function resolveShareUrl() {
  const { protocol, href } = window.location;
  if (protocol === "http:" || protocol === "https:") {
    return href.split("#")[0];
  }
  return SHARE_FALLBACK_URL;
}

function buildQrUrl(url) {
  const encoded = encodeURIComponent(url);
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encoded}&margin=10`;
}

function smoothScrollTo(selector) {
  const el = document.querySelector(selector);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const input = document.createElement("input");
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
  return Promise.resolve();
}

function initArButtons(arUrl) {
  const arLaunch = document.getElementById("ar-launch");
  const floating = document.getElementById("floating-demo");

  if (arLaunch) {
    arLaunch.href = arUrl;
  }
  if (floating) {
    floating.addEventListener("click", () => {
      if (/iP(hone|od|ad)/.test(navigator.userAgent)) {
        window.location.href = arUrl;
      } else {
        smoothScrollTo("#ar-demo");
      }
    });
  }
}

function initQr(shareUrl) {
  const qrImage = document.getElementById("qr-image");
  const shareText = document.getElementById("share-url");
  const floatingQr = document.getElementById("floating-qr");

  if (qrImage) {
    qrImage.src = buildQrUrl(shareUrl);
    qrImage.alt = `QR code pour ${shareUrl}`;
    qrImage.onerror = () => {
      qrImage.alt = "QR code indisponible, utilisez le lien ci-dessous.";
      qrImage.style.opacity = "0.5";
    };
  }
  if (shareText) {
    shareText.textContent = shareUrl;
  }
  if (floatingQr) {
    floatingQr.addEventListener("click", () => smoothScrollTo("#partage"));
  }
}

function initNav() {
  document.querySelectorAll("[data-scroll]").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        smoothScrollTo(href);
      }
    });
  });
}

function initShare(shareUrl) {
  const copyBtn = document.getElementById("copy-link");
  const nativeShare = document.getElementById("share-native");

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      await copyToClipboard(shareUrl);
      copyBtn.textContent = "Lien copié";
      setTimeout(() => (copyBtn.textContent = "Copier le lien"), 1800);
    });
  }

  if (nativeShare) {
    nativeShare.addEventListener("click", async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Démo AR Ouellet-Bolduc",
            text: "Ouvrez la démo AR et le viewer 3D.",
            url: shareUrl,
          });
        } catch {
          /* user cancelled */
        }
      } else {
        copyBtn?.click();
      }
    });
  }
}

function initIosNote() {
  const note = document.getElementById("ios-note");
  const isIos = /iP(hone|od|ad)/.test(navigator.userAgent);
  if (note) {
    note.style.display = isIos ? "block" : "none";
  }
}

function init() {
  const shareUrl = resolveShareUrl();

  initNav();
  initArButtons(AR_USDZ_URL);
  initQr(shareUrl);
  initShare(shareUrl);
  initIosNote();
}

document.addEventListener("DOMContentLoaded", init);
