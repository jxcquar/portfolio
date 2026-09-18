// Scroll reveals, home hero crossfade, and the case-study pager

(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Autoplay insurance ---------- */
  // iOS Low Power Mode (and some in-app browsers) block video autoplay,
  // leaving the hero loop frozen — nudge playback on the first touch/click.
  const heroVids = document.querySelectorAll("video[autoplay]");
  if (heroVids.length) {
    const kick = () => heroVids.forEach((v) => { if (v.paused) v.play().catch(() => {}); });
    window.addEventListener("touchstart", kick, { once: true, passive: true });
    window.addEventListener("click", kick, { once: true });
  }

  /* ---------- Case figures: hover magnify (desktop) + tap-to-zoom lightbox ---------- */
  const zoomables = document.querySelectorAll(".zoomable");
  if (zoomables.length) {
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.hidden = true;
    lb.innerHTML = '<button class="lightbox-close" aria-label="Close image">×</button><img alt="" />';
    document.body.appendChild(lb);
    const lbImg = lb.querySelector("img");
    // iOS in-app browsers chain the 2x-image pan to the document (overscroll-
    // behavior is ignored there), leaving the whole page shoved sideways after
    // closing — lock the page while open, restore the exact spot on close.
    let lbScrollY = 0;
    const closeLb = () => {
      lb.hidden = true;
      document.documentElement.classList.remove("lb-open");
      window.scrollTo(0, lbScrollY);
    };
    // phone: the 2x view pans via transforms. A native scroller inside the
    // overlay made iOS widen the layout viewport (the page came back shoved
    // sideways with the left cropped), so no element scrolls natively at all.
    let panW = 0, panH = 0, px = 0, py = 0;
    let panPid = null, sx = 0, sy = 0, spx = 0, spy = 0, panMoved = false;
    const applyPan = () => { lbImg.style.transform = "translate(" + px + "px," + py + "px)"; };
    const setupPan = () => {
      if (!window.matchMedia("(max-width: 900px)").matches) return;
      const vw = window.innerWidth, vh = window.innerHeight;
      const ratio = lbImg.naturalHeight / (lbImg.naturalWidth || 1);
      const w = vw * 2, h = w * ratio;
      lbImg.style.width = w + "px";
      lbImg.style.height = h + "px";
      panW = Math.max(0, w - vw);
      panH = Math.max(0, h - vh);
      px = -panW / 2;
      py = -panH / 2 + Math.max(0, (vh - h) / 2); // centred when shorter than the screen
      applyPan();
    };
    lb.addEventListener("pointerdown", (e) => {
      if (!panW && !panH) return;
      panPid = e.pointerId; sx = e.clientX; sy = e.clientY; spx = px; spy = py;
      panMoved = false;
    });
    lb.addEventListener("pointermove", (e) => {
      if (panPid !== e.pointerId) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 8) panMoved = true;
      px = Math.min(0, Math.max(-panW, spx + dx));
      if (panH > 0) py = Math.min(0, Math.max(-panH, spy + dy));
      applyPan();
    });
    const endPan = (e) => { if (panPid === e.pointerId) panPid = null; };
    lb.addEventListener("pointerup", endPan);
    lb.addEventListener("pointercancel", endPan);
    lb.addEventListener("click", () => {
      if (panMoved) { panMoved = false; return; } // a pan is not a tap-to-close
      closeLb();
    });
    // keep zoom gestures from reaching the page-flip machinery underneath
    lb.addEventListener("wheel", (e) => e.stopPropagation(), { passive: true });
    lb.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
    lb.addEventListener("touchmove", (e) => { e.stopPropagation(); e.preventDefault(); }, { passive: false });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLb(); });

    zoomables.forEach((fig) => {
      const img = fig.querySelector("img");
      if (!img) return;
      fig.addEventListener("click", () => {
        lbImg.src = img.currentSrc || img.src;
        lbImg.alt = img.alt || "";
        lbScrollY = window.scrollY;
        document.documentElement.classList.add("lb-open");
        lb.hidden = false;
        panW = panH = 0;
        lbImg.style.width = lbImg.style.height = lbImg.style.transform = "";
        if (lbImg.complete && lbImg.naturalWidth) setupPan();
        else lbImg.onload = setupPan;
      });
    });
  }

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
      document.body.classList.add("leave", "leave-sky");
      setTimeout(() => {
        location.href = navAbout.href;
      }, 620);
    });

    // Leaving for Showcase: same outward move, but the veil is the deck's
    // navy night sky, so the two pages read as one continuous scene.
    const navShowcase = document.getElementById("navShowcase");
    navShowcase.addEventListener("click", (e) => {
      if (reduceMotion) return;
      e.preventDefault();
      document.body.classList.add("leave", "leave-night");
      setTimeout(() => {
        location.href = navShowcase.href;
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
  const readerMq = window.matchMedia("(max-width: 900px)");
  const isReader = document.body.dataset.page === "case" && readerMq.matches;

  // In-app browsers (Messenger etc.) can settle the viewport after scripts
  // run, leaving the reader CSS paired with the desktop pager or vice versa.
  // Crossing the mode boundary always reloads into the right experience.
  if (document.body.dataset.page === "case") {
    const remode = () => location.reload();
    if (readerMq.addEventListener) readerMq.addEventListener("change", remode);
    else if (readerMq.addListener) readerMq.addListener(remode);
  }

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
    // Repaginate like a real book: one continuous flow. Content that
    // overflows a page moves to the next page; a new chapter starts on the
    // next fresh page — including the facing page of a half-empty spread.
    const paginateBook = () => {
      const stage = document.querySelector(".book--stage");
      const allSlides = [...stage.querySelectorAll(".case-slide")];
      if (allSlides.length < 2) return {};
      // bespoke spreads (overview, details page, ...) stay untouched; the
      // continuous flow starts after the last of them
      const keep = allSlides.filter((s, i) => i === 0 || s.classList.contains("case-slide--static"));
      const sectionSlides = allSlides.filter((s) => !keep.includes(s));
      const overview = keep[keep.length - 1];

      // collect each section's ordered blocks (paragraphs leave .body wrappers)
      const secs = sectionSlides.map((slide) => {
        const blocks = [];
        slide.querySelectorAll(".book-page").forEach((pg) => {
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
        const eyebrow = slide.querySelector(".eyebrow");
        return { id: slide.id, label: eyebrow ? eyebrow.textContent : "", blocks };
      });
      sectionSlides.forEach((s) => s.remove());

      let lastSlide = overview;
      let currentInner = null;
      let pagesInSpread = 2; // forces a fresh spread for the first page
      let curPage = null;
      let pendingEyebrow = null;
      const sectionMap = {};

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

      secs.forEach((sec) => {
        // chapters begin on a fresh page (left or right, whichever is next)
        pendingEyebrow = null;
        if (!curPage || curPage.children.length > 0) curPage = newPage();
        curPage.dataset.section = sec.id;
        sectionMap[sec.id] = curPage.closest(".case-slide");

        sec.blocks.forEach((b) => {
          curPage.appendChild(b);
          if (curPage.scrollHeight > curPage.clientHeight + 2 && curPage.children.length > 1) {
            curPage.removeChild(b);
            // continuation pages carry no repeated header \u2014 each chapter
            // title appears once, where the chapter starts
            curPage = newPage();
            curPage.appendChild(b);
          }
        });
      });
      if (pagesInSpread === 1) newPage(); // blank facing page at the very end

      return sectionMap;
    };
    const sectionMap = paginateBook();

    const slides = [...document.querySelectorAll(".case-slide")];
    const caseLinks = [...document.querySelectorAll(".case-nav a")];
    // a spread can hold two short chapters side by side (their .book-page
    // elements carry different dataset.section) — collect every id present,
    // not just the last one, so the nav highlights every chapter shown
    const slideSection = slides.map((s) => {
      const ids = s.id ? [s.id] : [];
      s.querySelectorAll(".book-page").forEach((p) => {
        if (p.dataset.section && !ids.includes(p.dataset.section)) ids.push(p.dataset.section);
      });
      return ids.length ? ids : null;
    });
    for (let k = 1; k < slideSection.length; k++) {
      if (!slideSection[k]) slideSection[k] = slideSection[k - 1];
    }
    const slideForId = (id) => {
      if (sectionMap[id]) return slides.indexOf(sectionMap[id]);
      const el = document.getElementById(id);
      return el ? slides.indexOf(el) : -1;
    };
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
      const ownIds = slideSection[i] || [];
      caseLinks.forEach((a) => a.classList.toggle("active", ownIds.includes(a.getAttribute("href").slice(1))));
      dots.forEach((d, k) => d.classList.toggle("active", k === i));
      prevBtn.disabled = i === 0;
      nextBtn.disabled = i === slides.length - 1;
      if (ownIds[0]) history.replaceState(null, "", "#" + ownIds[0]);

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
        const idx = slideForId(a.getAttribute("href").slice(1));
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
    const startIndex = startId ? Math.max(0, slideForId(startId)) : 0;
    go(startIndex, true);
    };

    // show the opening spread immediately while fonts load
    const firstSlide = document.querySelector(".case-slide");
    if (firstSlide) firstSlide.classList.add("is-active");

    // paginate with the REAL fonts. fonts.ready can resolve before the
    // faces even start loading (they load lazily on first paint), so we
    // force-load every face the book uses, then measure.
    const startPager = () => {
      if (document.fonts && document.fonts.load) {
        Promise.all([
          document.fonts.load('16px Inter'),
          document.fonts.load('600 14px Inter'),
          document.fonts.load('500 14px Inter'),
          document.fonts.load('400 28px "Playfair Display"'),
          document.fonts.load('italic 500 22px "Playfair Display"'),
          document.fonts.load('italic 19px "Crimson Text"'),
        ])
          .then(() => document.fonts.ready)
          .then(initPager)
          .catch(initPager);
      } else {
        initPager();
      }
    };
    if (document.readyState === "complete") {
      startPager();
    } else {
      window.addEventListener("load", startPager);
    }

    // page sizes are fixed to the book, so a big viewport change needs a
    // fresh pagination pass — reload into the same section
    let rw = window.innerWidth, rh = window.innerHeight, rTimer;
    window.addEventListener("resize", () => {
      clearTimeout(rTimer);
      rTimer = setTimeout(() => {
        if (Math.abs(window.innerWidth - rw) > 140 || Math.abs(window.innerHeight - rh) > 140) {
          location.reload();
        }
      }, 500);
    });
  }

  /* ---------- Showcase: fanned page deck ---------- */
  if (document.body.dataset.page === "showcase") {
    const stage = document.getElementById("deckStage");
    const cards = Array.from(document.querySelectorAll(".deck-card"));
    const counter = document.getElementById("deckCounter");
    const countEl = document.getElementById("deckCount");
    const hint = document.getElementById("deckHint");
    const capEl = document.getElementById("deckCaption");
    const captions = [];
    const n = cards.length;
    if (countEl) countEl.textContent = n + " pages";

    let cur = 0;
    // layout width, NOT getBoundingClientRect: the bbox shrinks with each
    // card's 3D transform, which would make scroll/drag sensitivity drift
    const cardW = () => cards[0].offsetWidth || 600;

    // pos may be fractional mid-drag; every term is continuous in o
    function render(pos) {
      const cw = cardW();
      cards.forEach((card, i) => {
        const o = i - pos;
        const ao = Math.abs(o);
        const dir = Math.sign(o);
        const e = Math.min(ao, 1); // 0 at centre → 1 once fully a side page
        const x = dir * cw * (0.46 * e + 0.15 * Math.min(Math.max(ao - 1, 0), 3.5) + 0.035 * Math.max(ao - 4.5, 0));
        const ry = dir * -16 * e;
        const s = 1 - 0.16 * e - 0.014 * Math.max(ao - 1, 0);
        card.style.transform =
          "translate(-50%, -50%) translate3d(" + x + "px,0," + (-90 * e - 26 * Math.max(ao - 1, 0)) + "px)" +
          " rotateY(" + ry + "deg) scale(" + Math.max(s, 0.55) + ")";
        card.style.zIndex = String(200 - Math.round(ao * 2));
        card.style.opacity = ao > 6.5 ? "0" : "1";
        card.classList.toggle("is-current", Math.round(pos) === i);
      });
      if (capEl) {
        const idx = Math.round(Math.min(Math.max(pos, 0), n - 1));
        capEl.textContent = captions[idx] || "";
      }
      if (counter) counter.textContent = (Math.round(Math.min(Math.max(pos, 0), n - 1)) + 1) + " / " + n;
    }

    function go(idx) {
      cur = Math.min(Math.max(idx, 0), n - 1);
      render(cur);
      if (hint) hint.classList.add("fade");
    }

    render(0);

    document.getElementById("deckPrev").addEventListener("click", () => go(cur - 1));
    document.getElementById("deckNext").addEventListener("click", () => go(cur + 1));
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") go(cur - 1);
      if (e.key === "ArrowRight") go(cur + 1);
    });

    // trackpad / wheel: the fan follows the scroll live (no per-notch jumps),
    // then snaps to the nearest page once the gesture settles
    let wheelPos = null, wheelTimer;
    stage.addEventListener("wheel", (e) => {
      e.preventDefault();
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (wheelPos === null) wheelPos = cur;
      wheelPos = Math.min(Math.max(wheelPos + d / (cardW() * 0.55), -0.3), n - 0.7);
      stage.classList.add("dragging"); // live follow: no transitions mid-gesture
      render(wheelPos);
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        stage.classList.remove("dragging");
        go(Math.round(wheelPos));
        wheelPos = null;
      }, 120);
    }, { passive: false });

    // drag / swipe with live fractional follow
    let dragging = false, moved = false, startX = 0;
    stage.addEventListener("pointerdown", (e) => {
      dragging = true; moved = false; startX = e.clientX;
      stage.classList.add("dragging");
      try { stage.setPointerCapture(e.pointerId); } catch (_) {}
    });
    stage.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6) moved = true;
      render(cur - dx / (cardW() * 0.5));
    });
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove("dragging");
      const dx = e.clientX - startX;
      let step = Math.round(dx / (cardW() * 0.5));
      if (step === 0 && Math.abs(dx) > 40) step = Math.sign(dx);
      go(cur - step);
    };
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    // tap a side page to bring it to the front (ignore drag-release clicks)
    cards.forEach((card, i) => {
      const cap = card.querySelector("figcaption");
      captions[i] = cap ? cap.textContent : "";
      card.addEventListener("click", () => { if (!moved && i !== cur) go(i); });
    });
    render(cur); // captions were collected after the first paint — sync the line

    window.addEventListener("resize", () => render(cur));
  }
})();
