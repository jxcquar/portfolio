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
      heroImg.style.filter = `blur(${6 * (1 - eased)}px)`;
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
      tx = clamp(window.innerWidth / 2 - world.offsetWidth * 0.51, b.minX, 0);
      ty = clamp(window.innerHeight / 2 - world.offsetHeight * 0.4, b.minY, 0);
      x = tx; y = ty;
    };
    centreOnBio();

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

    // pointer drag (mouse + touch)
    let dragging = false, lx = 0, ly = 0;
    world.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".poi, .bubble")) return;
      dragging = true;
      lx = e.clientX; ly = e.clientY;
      world.classList.add("dragging");
      world.setPointerCapture(e.pointerId);
    });
    world.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      nudge(e.clientX - lx, e.clientY - ly);
      lx = e.clientX; ly = e.clientY;
    });
    const endDrag = () => { dragging = false; world.classList.remove("dragging"); };
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

    // points of interest → bubbles
    const pairs = [
      [document.getElementById("poiBio"), document.getElementById("bioCard")],
      [document.getElementById("poiBottle"), document.getElementById("bottleBubble")],
    ];

    const closeBubble = (poi, bubble) => {
      if (bubble.hidden) return;
      poi.setAttribute("aria-expanded", "false");
      bubble.classList.remove("pop-in");
      bubble.classList.add("pop-out");
      setTimeout(() => {
        bubble.hidden = true;
        bubble.classList.remove("pop-out");
      }, 260);
    };
    const openBubble = (poi, bubble) => {
      pairs.forEach(([p, b]) => closeBubble(p, b));
      poi.setAttribute("aria-expanded", "true");
      bubble.hidden = false;
      bubble.classList.add("pop-in");
      hint.classList.add("gone");
    };

    pairs.forEach(([poi, bubble]) => {
      poi.addEventListener("click", () => {
        bubble.hidden ? openBubble(poi, bubble) : closeBubble(poi, bubble);
      });
      bubble.querySelector("[data-close]").addEventListener("click", () => closeBubble(poi, bubble));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") pairs.forEach(([p, b]) => closeBubble(p, b));
    });
  }

  /* ---------- Case study: Apple Books-style pager ---------- */
  if (document.body.dataset.page === "case") {
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

    function go(i, instant) {
      i = Math.min(slides.length - 1, Math.max(0, i));
      if (i === current) return;
      current = i;

      slides.forEach((s, k) => {
        s.classList.toggle("is-active", k === i);
        s.classList.toggle("is-before", k < i);
      });
      caseLinks.forEach((a, k) => a.classList.toggle("active", k === i));
      dots.forEach((d, k) => d.classList.toggle("active", k === i));
      prevBtn.disabled = i === 0;
      nextBtn.disabled = i === slides.length - 1;
      history.replaceState(null, "", "#" + slides[i].id);

      if (!instant) {
        locked = true;
        setTimeout(() => (locked = false), 750);
      }
    }

    prevBtn.addEventListener("click", () => go(current - 1));
    nextBtn.addEventListener("click", () => go(current + 1));

    caseLinks.forEach((a, i) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        go(i);
      })
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") go(current + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") go(current - 1);
    });

    // Flip pages with the wheel / trackpad, one section at a time
    window.addEventListener(
      "wheel",
      (e) => {
        if (locked || Math.abs(e.deltaY) < 12) return;
        go(current + (e.deltaY > 0 ? 1 : -1));
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
    const startIndex = Math.max(0, slides.findIndex((s) => s.id === startId));
    go(startIndex, true);
  }
})();
