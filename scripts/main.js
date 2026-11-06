const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const hero = document.querySelector(".hero");
const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
const formStatus = document.querySelector("[data-form-status]");
const hoverNavigationQuery = window.matchMedia("(min-width: 961px) and (hover: hover) and (pointer: fine)");
const mobileNavigationQuery = window.matchMedia("(max-width: 960px)");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const closeNavigation = () => {
  if (!nav || !navToggle) {
    return;
  }

  nav.classList.remove("is-open");
  navToggle.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open navigation");
  document.body.classList.remove("nav-open");

  nav.querySelectorAll("details[open]").forEach((dropdown) => {
    dropdown.removeAttribute("open");
  });
};

const setHeaderState = () => {
  if (!header) {
    return;
  }

  header.classList.toggle("is-scrolled", window.scrollY > 8);

  if (hero) {
    const headerBottom = header.getBoundingClientRect().bottom;
    const heroBottom = hero.getBoundingClientRect().bottom;
    header.classList.toggle("is-past-hero", heroBottom <= headerBottom);
  }
};

if (nav && navToggle) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    document.body.classList.toggle("nav-open", isOpen);
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      closeNavigation();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const wasOpen = nav.classList.contains("is-open");
      closeNavigation();
      if (wasOpen) navToggle.focus();
    }

    if (event.key === "Tab" && mobileNavigationQuery.matches && nav.classList.contains("is-open")) {
      const focusable = [navToggle, ...nav.querySelectorAll("a, summary")]
        .filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (nav.classList.contains("is-open") && !header.contains(event.target)) closeNavigation();
  });

  mobileNavigationQuery.addEventListener("change", closeNavigation);

  window.addEventListener("resize", () => {
    setHeaderState();

    if (!mobileNavigationQuery.matches) {
      closeNavigation();
    }
  });
}

document.querySelectorAll(".nav-dropdown").forEach((dropdown) => {
  const summary = dropdown.querySelector("summary");

  if (!summary) {
    return;
  }

  dropdown.addEventListener("mouseenter", () => {
    if (hoverNavigationQuery.matches) {
      dropdown.setAttribute("open", "");
    }
  });

  summary.addEventListener("click", (event) => {
    if (hoverNavigationQuery.matches && event.detail > 0) {
      event.preventDefault();
      dropdown.removeAttribute("open");
      summary.blur();
    }
  });

  dropdown.addEventListener("mouseleave", () => {
    if (!hoverNavigationQuery.matches) {
      return;
    }

    dropdown.removeAttribute("open");

    if (document.activeElement instanceof HTMLElement && dropdown.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  });

  dropdown.addEventListener("focusout", (event) => {
    if (!dropdown.contains(event.relatedTarget) && hoverNavigationQuery.matches) {
      dropdown.removeAttribute("open");
    }
  });
});

// Repeat a complete logo set until it is wider than its viewport, then clone
// that set once. The measured distance prevents gaps on wide screens.
document.querySelectorAll(".logo-marquee").forEach((marquee) => {
  const track = marquee.querySelector(".logo-track");
  if (!track) return;
  const originals = [...track.children].filter((tile) => !tile.hasAttribute("aria-hidden"));
  if (!originals.length) return;
  marquee.setAttribute("tabindex", "0");
  marquee.setAttribute("role", "region");
  let frame;

  const rebuild = () => {
    const tileWidth = originals[0].getBoundingClientRect().width;
    if (!tileWidth) return;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const baseWidth = originals.length * (tileWidth + gap);
    const repeats = Math.max(1, Math.ceil((marquee.clientWidth + tileWidth) / baseWidth));
    const fragment = document.createDocumentFragment();
    originals.forEach((tile) => fragment.append(tile));

    const cloneSet = () => originals.forEach((tile) => {
      const copy = tile.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      copy.querySelectorAll("img").forEach((img) => { img.alt = ""; });
      fragment.append(copy);
    });

    if (!reducedMotionQuery.matches) {
      for (let i = 1; i < repeats * 2; i += 1) cloneSet();
    }
    track.replaceChildren(fragment);
    track.style.setProperty("--marquee-distance", `${baseWidth * repeats}px`);
    track.style.setProperty("--marquee-duration", `${baseWidth * repeats / 42}s`);
  };

  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(rebuild);
  };
  if ("ResizeObserver" in window) new ResizeObserver(schedule).observe(marquee);
  else window.addEventListener("resize", schedule);
  reducedMotionQuery.addEventListener("change", schedule);
  schedule();
});

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

if (revealItems.length > 0) {
  document.documentElement.classList.add("reveal-ready");

  revealItems.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${Math.min(index % 3, 2) * 70}ms`);
  });

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }
}

if (formStatus && new URLSearchParams(window.location.search).get("message") === "sent") {
  formStatus.hidden = false;
  const cleanUrl = `${window.location.pathname}${window.location.hash}`;
  window.history.replaceState({}, "", cleanUrl);
}
