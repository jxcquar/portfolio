// Scroll reveals, home hero crossfade, and the case-study pager

(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Reveal elements as they enter the viewport ---------- */
  const revealables = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealables.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Home: hero → work parallax crossfade ---------- */
  if (document.body.dataset.page === "home") {
    // Arriving straight at #work (nav from another page): land there with no intro
    if (location.hash === "#work") {
      document.body.classList.add("no-intro");
      document.documentElement.style.scrollBehavior = "auto";
      const land = () => {
        const work = document.getElementById("work");
        if (work) window.scrollTo(0, work.offsetTop);
      };
      land();
      window.addEventListener("load", () => {
        land();
        requestAnimationFrame(() => {
          document.documentElement.style.scrollBehavior = "";
        });
      });
    }
    const bgHero = document.getElementById("bgHero");
    const bgMoss = document.getElementById("bgMoss");
    const heroCopy = document.getElementById("heroCopy");
    const nav = document.getElementById("mainNav");
    const navHome = document.getElementById("navHome");
    const navWork = document.getElementById("navWork");
    const heroImg = bgHero.querySelector("img");
    const mossImg = bgMoss.querySelector("img");

    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      // 0 at the top of the hero, 1 once the work section has fully arrived
      const p = clamp(window.scrollY / (vh * 0.85), 0, 1);
      const eased = p * p * (3 - 2 * p); // smoothstep

      // hero image sharpens and fades away; moss scene parallaxes in
      heroImg.style.filter = `blur(${9 * (1 - eased)}px) brightness(${0.94 + 0.06 * eased})`;
      bgHero.style.opacity = String(1 - eased);
      bgMoss.style.opacity = String(eased);
      mossImg.style.transform = `scale(${1.08 - 0.08 * eased}) translateY(${(1 - eased) * 4}%)`;

      // hero copy drifts up a little slower than the page (parallax) and fades
      if (!reduceMotion) {
        heroCopy.style.transform = `translateY(${eased * -12}vh)`;
      }
      heroCopy.style.opacity = String(clamp(1 - p * 1.35, 0, 1));

      // the nav pill glides from the bottom of the hero to the top of the page
      const startTop = vh - 130;
      const endTop = 32;
      nav.style.top = `${startTop + (endTop - startTop) * eased}px`;

      // underline: nothing at the hero, "Work" once the work section owns the view
      if (p > 0.65) {
        navWork.setAttribute("aria-current", "page");
        navHome.removeAttribute("aria-current");
      } else {
        navWork.removeAttribute("aria-current");
        navHome.removeAttribute("aria-current");
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();

    // Leaving for About: replay the scroll transition outward — sky crossfades
    // in with the same depth as the moss, content parallaxes up, nav glides top.
    const navAbout = document.getElementById("navAbout");
    navAbout.addEventListener("click", (e) => {
      if (reduceMotion) return; // plain navigation
      e.preventDefault();
      document.body.classList.add("leave");
      setTimeout(() => {
        location.href = navAbout.href;
      }, 620);
    });
  }

  /* ---------- About: pannable canvas with pop-in bubbles ---------- */
  if (document.body.dataset.page === "about") {
    const world = document.getElementById("world");
    const hint = document.getElementById("panHint");
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

    let x = 0, y = 0, tx = 0, ty = 0;
    let moved = false;

    const bounds = () => ({
      minX: window.innerWidth - world.offsetWidth,
      minY: window.innerHeight - world.offsetHeight,
    });

    // start centred on Jacqueline (the bio point of interest)
    const centreOnBio = () => {
      const b = bounds();
      tx = clamp(window.innerWidth / 2 - world.offsetWidth * 0.5, b.minX, 0);
      ty = clamp(window.innerHeight / 2 - world.offsetHeight * 0.5, b.minY, 0);
      x = tx; y = ty;
    };
    centreOnBio();
    // paint the centred position immediately — don't wait for the first
    // animation frame (can be delayed on mobile during load)
    world.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    const tick = () => {
      x += (tx - x) * 0.09;
      y += (ty - y) * 0.09;
      world.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const nudge = (dx, dy) => {
      const b = bounds();
      tx = clamp(tx + dx, b.minX, 0);
      ty = clamp(ty + dy, b.minY, 0);
      if (!moved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
        moved = true;
        hint.classList.add("gone");
      }
    };

    window.addEventListener("wheel", (e) => nudge(-e.deltaX, -e.deltaY), { passive: true });

    // pointer drag (mouse + touch) with a little momentum on release
    let dragging = false, lx = 0, ly = 0, vx = 0, vy = 0;
    world.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".poi, .bubble")) return;
      dragging = true;
      lx = e.clientX; ly = e.clientY;
      vx = 0; vy = 0;
      world.classList.add("dragging");
      world.setPointerCapture(e.pointerId);
    });
    world.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      vx = dx; vy = dy;
      nudge(dx, dy);
      lx = e.clientX; ly = e.clientY;
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      world.classList.remove("dragging");
      // fling: carry the last drag velocity a little further
      nudge(vx * 9, vy * 9);
    };
    world.addEventListener("pointerup", endDrag);
    world.addEventListener("pointercancel", endDrag);

    document.addEventListener("keydown", (e) => {
      const step = 90;
      if (e.key === "ArrowLeft") nudge(step, 0);
      if (e.key === "ArrowRight") nudge(-step, 0);
      if (e.key === "ArrowUp") nudge(0, step);
      if (e.key === "ArrowDown") nudge(0, -step);
    });
    window.addEventListener("resize", () => nudge(0, 0));

    // points of interest → bubbles (every .poi controls the bubble named in aria-controls)
    const pairs = [...document.querySelectorAll(".poi")].map((p) => [
      p,
      document.getElementById(p.getAttribute("aria-controls")),
    ]);

    // On small screens bubbles become Apple-style popovers pinned to the
    // viewport. position:fixed is defeated by the world's transform, so the
    // bubble is re-parented to <body> while open.
    const popoverMode = window.matchMedia("(max-width: 900px)");

    const closeBubble = (poi, bubble) => {
      if (bubble.hidden) return;
      poi.setAttribute("aria-expanded", "false");
      bubble.classList.remove("pop-in");
      bubble.classList.add("pop-out");
      world.classList.remove("bubble-open");
      setTimeout(() => {
        bubble.hidden = true;
        bubble.classList.remove("pop-out");
        if (bubble.classList.contains("bubble--popover")) {
          bubble.classList.remove("bubble--popover");
          world.appendChild(bubble);
        }
      }, 260);
    };
    const openBubble = (poi, bubble) => {
      pairs.forEach(([p, b]) => closeBubble(p, b));
      poi.setAttribute("aria-expanded", "true");
      if (popoverMode.matches) {
        bubble.classList.add("bubble--popover");
        document.body.appendChild(bubble);
      }
      bubble.hidden = false;
      bubble.classList.add("pop-in");
      world.classList.add("bubble-open");
      hint.classList.add("gone");
    };

    // tap anywhere outside to dismiss, like an Apple popover
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".bubble, .poi")) pairs.forEach(([p, b]) => closeBubble(p, b));
    });

    pairs.forEach(([poi, bubble]) => {
      let lastTap = 0;
      poi.addEventListener("click", (e) => {
        e.stopPropagation();
        const now = Date.now();
        if (now - lastTap < 400) return; // ghost/duplicate tap on touch devices
        lastTap = now;
        bubble.hidden ? openBubble(poi, bubble) : closeBubble(poi, bubble);
      });
      bubble.querySelector("[data-close]").addEventListener("click", (e) => {
        e.stopPropagation();
        closeBubble(poi, bubble);
      });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") pairs.forEach(([p, b]) => closeBubble(p, b));
    });
  }

  /* ---------- Case study, mobile: Apple Books reading mode ---------- */
  const isReader =
    document.body.dataset.page === "case" &&
    window.matchMedia("(max-width: 900px)").matches;

  if (isReader) {
    const progress = document.getElementById("readerProgress");
    const contentsBtn = document.getElementById("readerContents");
    const sheet = document.getElementById("tocSheet");
    const tocLinks = [...sheet.querySelectorAll("a")];
    const sections = tocLinks
      .map((a) => document.querySelector(a.getAttribute("href")))
      .filter(Boolean);

    let ticking = false;
    const updateProgress = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
      progress.textContent = `Contents · ${Math.min(100, Math.max(0, pct))}%`;
      let currentId = sections[0] && sections[0].id;
      sections.forEach((s) => {
        if (s.getBoundingClientRect().top <= window.innerHeight * 0.4) currentId = s.id;
      });
      tocLinks.forEach((a) =>
        a.classList.toggle("active", a.getAttribute("href") === "#" + currentId)
      );
    };
    const readerHint = document.getElementById("readerHint");
    window.addEventListener(
      "scroll",
      () => {
        if (window.scrollY > 80) readerHint.classList.add("gone");
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(updateProgress);
        }
      },
      { passive: true }
    );
    updateProgress();

    const closeSheet = () => {
      sheet.hidden = true;
      contentsBtn.setAttribute("aria-expanded", "false");
    };
    contentsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      sheet.hidden = !sheet.hidden;
      contentsBtn.setAttribute("aria-expanded", String(!sheet.hidden));
    });
    tocLinks.forEach((a) => a.addEventListener("click", closeSheet));
    document.addEventListener("click", (e) => {
      if (!sheet.hidden && !e.target.closest(".toc-sheet, .reader-contents")) closeSheet();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSheet();
    });
  }

  /* ---------- Case study: Apple Books-style pager ---------- */
  if (document.body.dataset.page === "case" && !isReader) {
    const initPager = () => {
    // Repaginate like a real book: any content that overflows its page
    // flows onto new pages, and every two pages become a new spread.
    const paginateBook = () => {
      const stage = document.querySelector(".book--stage");
      [...stage.querySelectorAll(".case-slide")].forEach((slide) => {
        const pages = [...slide.querySelectorAll(".book-page")];
        if (!pages.length) return;
        if (!pages.some((p) => p.scrollHeight > p.clientHeight + 4)) return; // fits already

        // flatten the section into ordered blocks; paragraphs leave their
        // .body wrappers so they can break across pages individually
        const blocks = [];
        pages.forEach((pg) => {
          [...pg.children].forEach((el) => {
            if (el.classList.contains("body")) {
              [...el.children].forEach((ch) => {
                ch.classList.add("flow");
                blocks.push(ch);
              });
            } else {
              blocks.push(el);
            }
          });
        });

        const eyebrowEl = slide.querySelector(".eyebrow");
        const contLabel = eyebrowEl ? eyebrowEl.textContent + " · continued" : "";

        let lastSlide = slide;
        let currentInner = slide.querySelector(".book-inner");
        currentInner.textContent = "";
        let pagesInSpread = 0;
        let pendingEyebrow = null;

        const newPage = () => {
          if (pagesInSpread === 2) {
            const sec = document.createElement("section");
            sec.className = "case-slide";
            const ni = document.createElement("div");
            ni.className = "book-inner";
            sec.appendChild(ni);
            lastSlide.after(sec);
            lastSlide = sec;
            currentInner = ni;
            pagesInSpread = 0;
            if (contLabel) {
              pendingEyebrow = document.createElement("p");
              pendingEyebrow.className = "eyebrow";
              pendingEyebrow.textContent = contLabel;
            }
          }
          const p = document.createElement("div");
          p.className = "book-page book-page--flow";
          currentInner.appendChild(p);
          pagesInSpread++;
          if (pendingEyebrow) {
            p.appendChild(pendingEyebrow);
            pendingEyebrow = null;
          }
          return p;
        };

        let pg = newPage();
        blocks.forEach((b) => {
          pg.appendChild(b);
          if (pg.scrollHeight > pg.clientHeight + 2 && pg.children.length > 1) {
            pg.removeChild(b);
            pg = newPage();
            pg.appendChild(b);
          }
        });
        // a lone page on the last spread gets a blank facing page
        if (pagesInSpread === 1) newPage();
      });
    };
    paginateBook();

    const slides = [...document.querySelectorAll(".case-slide")];
    const caseLinks = [...document.querySelectorAll(".case-nav a")];
    const prevBtn = document.getElementById("pagerPrev");
    const nextBtn = document.getElementById("pagerNext");
    const dotsWrap = document.getElementById("pagerDots");

    slides.forEach((s, i) => {
      const dot = document.createElement("button");
      dot.setAttribute("aria-label", `Go to ${s.id}`);
      dot.addEventListener("click", () => go(i));
      dotsWrap.appendChild(dot);
    });
    const dots = [...dotsWrap.children];

    let current = -1;
    let locked = false;
    const leaf = document.getElementById("pageLeaf");
    if (leaf) {
      // vanish the instant the turn lands (its faces match the real pages)
      leaf.addEventListener("animationend", () => leaf.classList.remove("turn-next", "turn-prev"));
    }

    function go(i, instant) {
      i = Math.min(slides.length - 1, Math.max(0, i));
      if (i === current) return;
      const dir = i > current ? "next" : "prev";
      const firstRender = current === -1;
      const from = current;
      current = i;

      // page-turn leaf sweeps around the spine, carrying a preview of the
      // page being turned: forward shows the outgoing right page, backward
      // settles the incoming one
      if (!firstRender && !instant && !reduceMotion && leaf) {
        // front face: the right page visible when the leaf lies to the right;
        // back face: the left page revealed when it lies to the left
        const rightOwner = dir === "next" ? slides[from] : slides[i];
        const leftOwner = dir === "next" ? slides[i] : slides[from];
        const rightPages = rightOwner.querySelectorAll(".book-page");
        const leftPages = leftOwner.querySelectorAll(".book-page");
        const front = document.createElement("div");
        front.className = "leaf-face";
        front.appendChild(rightPages[rightPages.length - 1].cloneNode(true));
        const back = document.createElement("div");
        back.className = "leaf-face leaf-back";
        back.appendChild(leftPages[0].cloneNode(true));
        leaf.replaceChildren(front, back);
        leaf.classList.remove("turn-next", "turn-prev");
        void leaf.offsetWidth; // restart the animation
        leaf.classList.add("turn-" + dir);
      }

      slides.forEach((s, k) => {
        s.classList.toggle("is-active", k === i);
        s.classList.toggle("is-before", k < i);
      });
      let ownId = "";
      for (let k = i; k >= 0; k--) {
        if (slides[k].id) { ownId = slides[k].id; break; }
      }
      caseLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + ownId));
      dots.forEach((d, k) => d.classList.toggle("active", k === i));
      prevBtn.disabled = i === 0;
      nextBtn.disabled = i === slides.length - 1;
      if (ownId) history.replaceState(null, "", "#" + ownId);

      if (!instant) {
        locked = true;
        setTimeout(() => (locked = false), 600);
      }
    }

    // pin the arrow tabs to the book's measured edges at any viewport size
    const stage = document.querySelector(".book--stage");
    const placeArrows = () => {
      const r = stage.getBoundingClientRect();
      // straddle the page edges, but never leave the screen on small windows
      prevBtn.style.left = Math.max(r.left - prevBtn.offsetWidth / 2, 6) + "px";
      nextBtn.style.right = Math.max(window.innerWidth - r.right - nextBtn.offsetWidth / 2, 6) + "px";
    };
    placeArrows();
    window.addEventListener("resize", placeArrows);
    window.addEventListener("load", placeArrows);
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(placeArrows);
      ro.observe(stage);
      ro.observe(document.documentElement);
    }

    prevBtn.addEventListener("click", () => go(current - 1));
    nextBtn.addEventListener("click", () => go(current + 1));

    caseLinks.forEach((a) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const idx = slides.findIndex((s) => s.id === a.getAttribute("href").slice(1));
        if (idx >= 0) go(idx);
      })
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") go(current + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") go(current - 1);
    });

    // Flip pages with the wheel / trackpad — horizontal or vertical. One
    // gesture turns exactly one page: after a flip, trackpad momentum is
    // swallowed until the deltas go quiet for a beat.
    let acc = 0;
    let accReset;
    let needQuiet = false;
    let quietTimer;
    window.addEventListener(
      "wheel",
      (e) => {
        if (locked) {
          acc = 0;
          needQuiet = true;
          return;
        }
        if (needQuiet) {
          clearTimeout(quietTimer);
          quietTimer = setTimeout(() => (needQuiet = false), 180);
          return;
        }

        const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
        const delta = horizontal ? e.deltaX : e.deltaY;

        // let a vertically-overflowing page scroll its own text first
        if (!horizontal) {
          const inner = e.target.closest && e.target.closest(".book-inner");
          if (inner && inner.scrollHeight > inner.clientHeight + 1) {
            const atTop = inner.scrollTop <= 0 && delta < 0;
            const atBottom = inner.scrollTop + inner.clientHeight >= inner.scrollHeight - 1 && delta > 0;
            if (!atTop && !atBottom) return;
          }
        }

        acc += delta;
        clearTimeout(accReset);
        accReset = setTimeout(() => (acc = 0), 200);
        if (Math.abs(acc) > 60) {
          go(current + (acc > 0 ? 1 : -1));
          acc = 0;
        }
      },
      { passive: true }
    );

    // Touch swipe
    let touchX = null;
    window.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
    window.addEventListener(
      "touchend",
      (e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 60) go(current + (dx < 0 ? 1 : -1));
        touchX = null;
      },
      { passive: true }
    );

    const startId = location.hash.slice(1);
    const startIndex = startId ? Math.max(0, slides.findIndex((s) => s.id === startId)) : 0;
    go(startIndex, true);
    };

    // paginate with the real fonts: fallback-font metrics under-measure
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(initPager);
    } else {
      initPager();
    }
  }
})();
