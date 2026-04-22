"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import TransitionLink from "@/components/TransitionLink";
import { useTransition } from "@/components/PageTransition";
import { films } from "@/lib/films";

const allItems = films.map((f) => ({
  title: f.title,
  slug: f.slug,
  status: f.status,
  video: f.video,
}));

// Right-side ticker data
const tickerData = [
  { tech: "GraphQL", name: "Arnulfo Bayer" },
  { tech: "Vue.js", name: "Brigitte Jast" },
  { tech: "Kubernetes", name: "Jontae Heaney" },
  { tech: "Prometheus", name: "Karelle Tromp" },
  { tech: "React.js", name: "Eli Wisoky" },
  { tech: "Ruby on Rails", name: "Doug Crona" },
  { tech: "Node.js", name: "Kenzie Lesch" },
  { tech: "Angular", name: "Ford Schmeler" },
  { tech: "Python", name: "Maverick Botsford" },
  { tech: "Vite", name: "Jaquan Grady" },
  { tech: "Elixir", name: "Jayson Crona" },
  { tech: "Ember.js", name: "Adrienne Jast" },
  { tech: "GraphQL", name: "Jayson Heaney" },
  { tech: "Vue.js", name: "Lucious Tromp" },
  { tech: "Kubernetes", name: "Shea Trantow" },
  { tech: "Prometheus", name: "Randy Wisoky" },
  { tech: "React.js", name: "Newell Crona" },
  { tech: "Ruby on Rails", name: "Kyeesha Bayer" },
  { tech: "Node.js", name: "Newell Rohan" },
  { tech: "Angular", name: "Eusebio Lesch" },
  { tech: "Python", name: "Arnulfo Jast" },
  { tech: "Vite", name: "Brigitte Crona" },
  { tech: "Elixir", name: "Breana Beier" },
  { tech: "Ember.js", name: "Jontae Rohan" },
  { tech: "GraphQL", name: "Karelle Beier" },
  { tech: "Vue.js", name: "Eli Lesch" },
  { tech: "Kubernetes", name: "Eusebio Rohan" },
  { tech: "Prometheus", name: "Doug Beier" },
  { tech: "React.js", name: "Kyeesha Lesch" },
  { tech: "Ruby on Rails", name: "Eusebio Crona" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const DEFAULTS = {
  gap: 46,
  minScale: 0.7,
  maxScale: 1.4,
  baseWidth: 720,
  scalePower: 1.2,
  scalePlateau: 0.0,
  borderRadius: 40,
};

type Params = typeof DEFAULTS;

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
      <span style={{ width: 100, flexShrink: 0 }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: "#FAFFFF" }} />
      <span style={{ width: 50, textAlign: "right", fontFamily: "monospace" }}>{value.toFixed(1)}</span>
    </label>
  );
}

// Intro animation phases
type IntroPhase =
  | "loading"        // Ghost + progress bar, loading videos
  | "bar-fade"       // Progress bar fades out
  | "text-reveal"    // Big centered text animates in line by line
  | "text-hold"      // Text holds briefly
  | "shrink"         // Text shrinks to corners, ghost moves to bottom-left
  | "carousel"       // Carousel scrolls through, UI elements appear
  | "done";          // Intro complete

export default function Home() {
  const { navigateTo, setFilmRect } = useTransition();
  // Check sessionStorage after mount to avoid hydration mismatch
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [introPhase, setIntroPhase] = useState<IntroPhase>("loading");
  const [loadProgress, setLoadProgress] = useState(0);
  const [textLines, setTextLines] = useState([false, false, false, false]);
  const [revealed, setRevealed] = useState(false);
  const [showUI, setShowUI] = useState(false);
  const [showGradient, setShowGradient] = useState(false);
  const [gridRevealed, setGridRevealed] = useState(false);
  const fullDescText = "CultRepo creates cinematic documentaries\nabout the people behind the technology\nshaping our era.";
  const [revealedChars, setRevealedChars] = useState(0);
  const [showCursor, setShowCursor] = useState(false);
  const [typing, setTyping] = useState(false);

  // Hydration-safe: check sessionStorage on mount
  useEffect(() => {
    if (sessionStorage.getItem("cultrepo-intro-seen") === "1") {
      setHasSeenIntro(true);
      setIntroPhase("done");
      setLoadProgress(100);
      setTextLines([true, true, true, true]);
      setRevealed(true);
      setShowUI(true);
      setRevealedChars(fullDescText.length);
      // Unblock carousel immediately
      const s = stateRef.current;
      s.initialized = true;
      s.carouselBlocked = false;
      s.introProgress = 1;
      s.introOffsetY = 0;
    }
  }, []);
  const [items] = useState(() => shuffle(allItems));
  const [expandingIdx, setExpandingIdx] = useState<number | null>(null);
  const [centeredSlug, setCenteredSlug] = useState<string | null>(null);
  const pendingSlugRef = useRef<string | null>(null);
  const ytPreloadRef = useRef<HTMLIFrameElement>(null);
  const expandingIdxRef = useRef<number | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [params, setParams] = useState<Params>(DEFAULTS);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const cursorLabelRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    target: 0,
    current: 0,
    isDragging: false,
    hasDragged: false,
    startY: 0,
    dragStart: 0,
    initialized: false,
    initStart: Date.now(),
    introReady: false,
    introStart: 0,
    introEnd: 0,
    carouselBlocked: true,
    introProgress: 0,
    introOffsetY: 0,
    lastInputTime: 0,
    snapping: false,
    loopCount: 0,
    carouselDone: false,
    gridNotified: false,
  });

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // ============ VIDEO LOADING + INTRO PHASE ORCHESTRATION ============
  useEffect(() => {
    if (introPhase !== "loading") return;

    const videos = videoRefs.current.filter(Boolean) as HTMLVideoElement[];
    if (videos.length === 0) {
      const t = setTimeout(() => setLoadProgress(p => p === 0 ? 0.1 : 0), 100);
      return () => clearTimeout(t);
    }

    // Track progress across: videos (90% weight) + fonts (10% weight)
    let fontsReady = false;
    let done = false;

    // Font loading
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { fontsReady = true; });
    } else {
      fontsReady = true;
    }

    const checkProgress = () => {
      if (done) return;

      // Video progress: count videos that can play through
      const videoReady = videos.filter(v => v.readyState >= 3).length;
      const videoPct = videoReady / videos.length;

      // Also check buffered progress for partial loading indication
      let bufferPct = 0;
      videos.forEach(v => {
        if (v.readyState >= 3) {
          bufferPct += 1;
        } else if (v.buffered.length > 0 && v.duration > 0) {
          bufferPct += v.buffered.end(v.buffered.length - 1) / v.duration;
        } else if (v.readyState >= 1) {
          bufferPct += 0.1; // metadata loaded
        }
      });
      bufferPct /= videos.length;

      // Use the smoother of the two metrics
      const smoothVideoPct = Math.max(videoPct, bufferPct);

      const fontPct = fontsReady ? 1 : 0;
      const totalPct = Math.round((smoothVideoPct * 0.9 + fontPct * 0.1) * 100);

      setLoadProgress(totalPct);

      if (videoReady >= videos.length && fontsReady) {
        done = true;
        setTimeout(() => setIntroPhase("bar-fade"), 400);
      }
    };

    const interval = setInterval(checkProgress, 150);
    videos.forEach(v => {
      v.addEventListener("canplaythrough", checkProgress);
      v.addEventListener("progress", checkProgress);
    });

    // Fallback: after 8s, proceed anyway
    const fallback = setTimeout(() => {
      if (done) return;
      done = true;
      setLoadProgress(100);
      setTimeout(() => setIntroPhase("bar-fade"), 400);
    }, 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(fallback);
      videos.forEach(v => {
        v.removeEventListener("canplaythrough", checkProgress);
        v.removeEventListener("progress", checkProgress);
      });
    };
  }, [introPhase, loadProgress]);

  // Phase: bar-fade → text-reveal
  useEffect(() => {
    if (introPhase !== "bar-fade") return;
    const t = setTimeout(() => setIntroPhase("text-reveal"), 600);
    return () => clearTimeout(t);
  }, [introPhase]);

  // Phase: text-reveal — stagger lines
  useEffect(() => {
    if (introPhase !== "text-reveal") return;
    const delays = [100, 300, 500, 700];
    const timers = delays.map((d, i) =>
      setTimeout(() => setTextLines(prev => {
        const next = [...prev];
        next[i] = true;
        return next;
      }), d)
    );
    // After all lines revealed, hold briefly
    const holdTimer = setTimeout(() => setIntroPhase("text-hold"), 1400);
    return () => { timers.forEach(clearTimeout); clearTimeout(holdTimer); };
  }, [introPhase]);

  // Phase: text-hold → shrink
  useEffect(() => {
    if (introPhase !== "text-hold") return;
    const t = setTimeout(() => setIntroPhase("shrink"), 500);
    return () => clearTimeout(t);
  }, [introPhase]);

  // Phase: shrink — start carousel immediately, transition to carousel phase after animation
  useEffect(() => {
    if (introPhase !== "shrink") return;
    // Reset intro state so the scroll-through animation runs fresh
    const s = stateRef.current;
    s.initialized = false;
    s.introReady = false;
    s.introProgress = 0;
    s.carouselBlocked = false;
    // Transition to carousel phase after shrink animation completes
    const t = setTimeout(() => {
      setIntroPhase("carousel");
    }, 1000);
    return () => clearTimeout(t);
  }, [introPhase]);

  // Phase: carousel — show UI elements progressively
  useEffect(() => {
    if (introPhase !== "carousel") return;
    // Show hamburger + wordmark after carousel starts
    const t1 = setTimeout(() => setShowUI(true), 800);
    // Start typewriter for bottom-left description
    const t2 = setTimeout(() => setShowCursor(true), 1200);

    let charIndex = 0;
    const t3 = setTimeout(() => {
      setTyping(true);
      const typeInterval = setInterval(() => {
        charIndex++;
        if (charIndex <= fullDescText.length) {
          setRevealedChars(charIndex);
        } else {
          clearInterval(typeInterval);
          setTyping(false);
          // Blink briefly then hide cursor
          setTimeout(() => {
            setShowCursor(false);
            setIntroPhase("done");
            sessionStorage.setItem("cultrepo-intro-seen", "1");
          }, 800);
        }
      }, 30);
      return () => clearInterval(typeInterval);
    }, 1500);

    // Show bottom-left area (ghost is already there from shrink)
    const t4 = setTimeout(() => setRevealed(true), 600);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [introPhase]);

  // Track centered carousel item for YouTube preloading
  useEffect(() => {
    const interval = setInterval(() => {
      const centered = itemRefs.current.findIndex(
        (el) => el?.dataset.centered === "true"
      );
      if (centered >= 0 && items[centered]) {
        const slug = items[centered].slug;
        if (slug !== centeredSlug) {
          setCenteredSlug(slug);
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [items, centeredSlug]);

  // Get YouTube ID for preloading
  const preloadFilm = centeredSlug ? films.find((f) => f.slug === centeredSlug) : null;
  const preloadYtId = preloadFilm?.youtubeId;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "d" || e.key === "D") setShowDebug((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Header gradient visibility on scroll
  useEffect(() => {
    const onScroll = () => {
      setShowGradient(window.scrollY > 100);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const state = stateRef.current;
    const initDuration = 1800;

    // Don't re-block the carousel if it's already initialized (returning from another page)
    if (!state.initialized) {
      state.initStart = Date.now();
      state.introReady = false;
      state.introStart = 0;
      state.introEnd = 0;
      state.target = 0;
      state.current = 0;
      state.carouselBlocked = true;
    }

    function scaleAt(norm: number, p: Params) {
      const plateauEnd = p.scalePlateau;
      const remapped = norm <= plateauEnd ? 0 : (norm - plateauEnd) / (1 - plateauEnd);
      const curve = Math.pow(remapped, p.scalePower);
      return p.maxScale - curve * (p.maxScale - p.minScale);
    }

    function visualOffset(signedDist: number, maxDist: number, itemH: number, slotH: number, p: Params) {
      const absDist = Math.abs(signedDist);
      const sign = signedDist >= 0 ? 1 : -1;
      const steps = 50;
      const stepSize = absDist / steps;
      let offset = 0;
      for (let s = 0; s < steps; s++) {
        const d = (s + 0.5) * stepSize;
        const norm = Math.min(d / maxDist, 1);
        const scale = scaleAt(norm, p);
        offset += (scale - 1) * itemH * (stepSize / slotH);
      }
      return sign * offset;
    }

    function render() {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const p = paramsRef.current;
      const wrapperH = wrapper.getBoundingClientRect().height;
      const wrapperW = wrapper.getBoundingClientRect().width;
      const centerY = wrapperH / 2;

      const effectiveBaseWidth = Math.min(p.baseWidth, wrapperW * 0.6);
      const itemH = effectiveBaseWidth / (16 / 9);
      const slotH = itemH + p.gap;
      const totalH = slotH * items.length;
      const maxDist = wrapperH / 2 + itemH;

      if (!state.carouselDone) {
        if (state.current > totalH) {
          state.current -= totalH;
          state.target -= totalH;
          if (state.isDragging) state.dragStart -= totalH;
          if (state.initialized) state.loopCount++;
        } else if (state.current < 0) {
          state.current += totalH;
          state.target += totalH;
          if (state.isDragging) state.dragStart += totalH;
          if (state.initialized) state.loopCount++;
        }
        if (state.loopCount >= 10) {
          state.carouselDone = true;
          const centerOffset = wrapperH / 2 - itemH / 2;
          const nearestIdx = Math.round((state.current + centerOffset) / slotH);
          state.target = nearestIdx * slotH - centerOffset;
          if (!state.gridNotified) {
            state.gridNotified = true;
            setGridRevealed(true);
          }
        }
      }

      const expIdx = expandingIdxRef.current;

      itemRefs.current.forEach((el, idx) => {
        if (!el) return;

        const rawY = idx * slotH - state.current;
        const candidates = [rawY, rawY - totalH, rawY + totalH];
        let bestY = candidates[0];
        let bestDist = Math.abs(bestY + itemH / 2 - centerY);
        for (const cy of candidates) {
          const d = Math.abs(cy + itemH / 2 - centerY);
          if (d < bestDist) { bestY = cy; bestDist = d; }
        }

        const logicalCenter = bestY + itemH / 2;
        const signedDist = logicalCenter - centerY;
        const absDist = Math.abs(signedDist);
        const norm = Math.min(absDist / maxDist, 1);
        const scale = scaleAt(norm, p);

        const offset = visualOffset(signedDist, maxDist, itemH, slotH, p);
        const scaledH = (effectiveBaseWidth * scale) / (16 / 9);
        const scaledW = effectiveBaseWidth * scale;
        const visualCenter = logicalCenter + offset;
        const top = visualCenter - scaledH / 2;

        const finalW = effectiveBaseWidth * scale;
        const finalH = finalW / (16 / 9);
        const finalLeft = (wrapperW - finalW) / 2;

        // If this item is expanding, skip — CSS transition handles it
        if (expIdx === idx) {
          return;
        }

        // If another item is expanding, fade this one out
        if (expIdx !== null) {
          el.style.opacity = "0";
          return;
        }

        let opacity = 1;
        if (norm > 0.85) {
          opacity *= 1 - (norm - 0.85) / 0.15;
        }

        const yWithOffset = top + state.introOffsetY;
        el.style.transform = `translate(${finalLeft}px, ${yWithOffset}px)`;
        el.style.width = `${finalW}px`;
        el.style.height = `${finalH}px`;
        el.style.opacity = String(Math.max(0, opacity));
        el.style.zIndex = String(Math.round((1 - norm) * 5));
        el.style.borderRadius = `${p.borderRadius}px`;
        el.style.pointerEvents = scale < 0.3 ? "none" : "auto";

        // Track centered item for YouTube preloading
        if (norm < 0.1 && state.initialized) {
          el.dataset.centered = "true";
        } else {
          delete el.dataset.centered;
        }

        // Fade videos in during last 25% of intro animation
        const videoEl = el.querySelector("video") as HTMLVideoElement | null;
        if (videoEl) {
          if (!state.initialized && state.introProgress < 1) {
            const fadeStart = 0.75;
            const videoOpacity = state.introProgress < fadeStart
              ? 0
              : (state.introProgress - fadeStart) / (1 - fadeStart);
            videoEl.style.opacity = String(Math.min(1, videoOpacity));
          } else {
            videoEl.style.opacity = "1";
          }
        }
      });
    }

    let rafId: number;
    function loop() {
      const wrapper = wrapperRef.current;
      if (!wrapper) { rafId = requestAnimationFrame(loop); return; }
      const p = paramsRef.current;
      const wW = wrapper.getBoundingClientRect().width;
      const effectiveBW = Math.min(p.baseWidth, wW * 0.6);

      // While carousel is blocked, hide all items and skip positioning
      if (state.carouselBlocked) {
        itemRefs.current.forEach(el => {
          if (el) el.style.opacity = "0";
        });
        rafId = requestAnimationFrame(loop);
        return;
      }

      if (state.initialized) {
        // Snap to nearest item center after input settles
        const itemH = effectiveBW / (16 / 9);
        const slotH = itemH + p.gap;
        const totalH = slotH * items.length;
        const wrapperH = wrapper.getBoundingClientRect().height;
        const timeSinceInput = Date.now() - state.lastInputTime;
        const velocity = Math.abs(state.target - state.current);


        if (!state.isDragging && timeSinceInput > 300 && velocity < 20 && !state.snapping) {
          // Snap target to nearest slot that centers an item
          // Item i is centered when: i * slotH - current = wrapperH/2 - itemH/2
          // So current = i * slotH - (wrapperH/2 - itemH/2)
          const centerOffset = wrapperH / 2 - itemH / 2;
          const nearestIdx = Math.round((state.target + centerOffset) / slotH);
          state.target = nearestIdx * slotH - centerOffset;
          state.snapping = true;
        }

        const factor = state.isDragging ? 0.12 : (state.snapping ? 0.08 : 0.07);
        state.current = lerp(state.current, state.target, factor);
      } else {
        // Compute intro endpoints on first frame
        if (!state.introReady) {
          const wrapperH = wrapper.getBoundingClientRect().height;
          const itemH = effectiveBW / (16 / 9);
          const slotH = itemH + p.gap;
          const totalH = slotH * items.length;
          // Landing position: centers item 0 on screen
          const landingPos = -(wrapperH / 2 - itemH / 2);
          state.introEnd = landingPos;
          // Scroll through one full cycle of all items
          state.introStart = landingPos - totalH;
          state.current = state.introStart;
          // Push entire carousel below viewport initially
          state.introOffsetY = wrapperH + itemH;
          state.introReady = true;
          state.initStart = Date.now();
        }

        const elapsed = Date.now() - state.initStart;
        const progress = Math.min(elapsed / initDuration, 1);
        // easeInOutCubic — slow start, fast middle, slow landing
        const ease = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        state.current = state.introStart + (state.introEnd - state.introStart) * ease;
        state.target = state.current;
        state.introProgress = progress;

        // Slide carousel up from below during first 40% of animation
        const slideProgress = Math.min(progress / 0.4, 1);
        const slideEase = 1 - Math.pow(1 - slideProgress, 3); // easeOutCubic
        const initialOffset = wrapper.getBoundingClientRect().height + effectiveBW / (16 / 9);
        state.introOffsetY = initialOffset * (1 - slideEase);

        if (progress >= 1) {
          state.initialized = true;
          state.current = state.introEnd;
          state.target = state.introEnd;
          state.introProgress = 1;
          state.introOffsetY = 0;
        }
      }
      render();
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    const onWheel = (e: WheelEvent) => {
      if (state.carouselBlocked || state.carouselDone) return;
      e.preventDefault();
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      state.target += delta * 0.8;
      state.lastInputTime = Date.now();
      state.snapping = false;
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    const onMouseDown = (e: MouseEvent) => {
      if (state.carouselBlocked || state.carouselDone) return;
      if (!state.initialized) { state.initialized = true; state.current = state.target; }
      state.isDragging = true;
      state.hasDragged = false;
      state.startY = e.pageY;
      state.dragStart = state.current;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!state.isDragging) return;
      const delta = state.startY - e.pageY;
      if (Math.abs(delta) > 5) { state.hasDragged = true; e.preventDefault(); }
      state.target = state.dragStart + delta;
    };
    const onMouseUp = () => {
      state.isDragging = false;
      state.lastInputTime = Date.now();
      state.snapping = false;
    };

    let touchPrevY = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (state.carouselBlocked || state.carouselDone) return;
      touchPrevY = e.touches[0].clientY;
      if (!state.initialized) { state.initialized = true; state.current = state.target; }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (state.carouselBlocked || state.carouselDone) return;
      e.preventDefault();
      const y = e.touches[0].clientY;
      state.target += (touchPrevY - y) * 1.2;
      touchPrevY = y;
      state.lastInputTime = Date.now();
      state.snapping = false;
    };

    const wrapper = wrapperRef.current;
    wrapper?.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    const onResize = () => {};
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("wheel", onWheel);
      wrapper?.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", onResize);
    };
  }, [items]);

  const updateParam = useCallback((key: keyof Params, val: number) => {
    setParams((prev) => ({ ...prev, [key]: val }));
  }, []);

  // Triple the ticker for seamless loop
  const tickerItems = [...tickerData, ...tickerData, ...tickerData];

  const isShrinkOrLater = introPhase === "shrink" || introPhase === "carousel" || introPhase === "done";
  const showIntroOverlay = introPhase === "loading" || introPhase === "bar-fade";
  const showIntroText = introPhase === "text-reveal" || introPhase === "text-hold" || introPhase === "shrink";

  return (
    <>
      {/* ============ HEADER GRADIENT ============ */}
      <div className={`header-gradient ${showGradient ? "visible" : ""}`} />

      {/* ============ INTRO OVERLAY — black bg + progress bar ============ */}
      {showIntroOverlay && (
        <div className={`intro-overlay ${introPhase === "bar-fade" ? "fade-out" : ""}`}>
          <div className={`intro-progress-wrap ${introPhase === "bar-fade" ? "hide" : ""}`}>
            <div className="intro-progress-bar" style={{ width: `${loadProgress}%` }} />
          </div>
        </div>
      )}

      {/* ============ CENTERED GHOST — visible during loading through text-reveal, fades on shrink ============ */}
      {(showIntroOverlay || showIntroText) && (
        <img
          src="/ghost.png"
          alt=""
          className={`intro-ghost visible center ${introPhase === "shrink" ? "fade-out" : ""}`}
          style={{ position: "fixed", zIndex: showIntroOverlay ? 202 : 0 }}
        />
      )}

      {/* ============ INTRO TEXT — in corners, starts large, shrinks ============ */}
      {showIntroText && (
        <div className={`intro-text ${introPhase === "shrink" ? "shrunk" : ""}`}>
          <div className="intro-text-group-top">
            <span className="intro-text-line">
              <span className={`intro-text-line-inner ${textLines[0] ? "revealed" : ""}`}>Documenting</span>
            </span>
            <span className="intro-text-line">
              <span className={`intro-text-line-inner ${textLines[1] ? "revealed" : ""}`}>the <span className="green">Humans</span></span>
            </span>
          </div>
          <div className="intro-text-group-bottom">
            <span className="intro-text-line">
              <span className={`intro-text-line-inner ${textLines[2] ? "revealed" : ""}`}>Behind World</span>
            </span>
            <span className="intro-text-line">
              <span className={`intro-text-line-inner ${textLines[3] ? "revealed" : ""}`}>Shaping Tech</span>
            </span>
          </div>
        </div>
      )}

      {/* Nav visibility trigger — tells layout nav to show */}
      {showUI && <style>{`.top-wordmark { opacity: 1 !important; pointer-events: auto !important; }`}</style>}

      {/* Camera ruler lines — left and right edges */}
      <div className="camera-ruler camera-ruler-left" />
      <div className="camera-ruler camera-ruler-right" />

      {showDebug && (
        <div style={{
          position: "fixed", top: 60, right: 16, zIndex: 999,
          background: "rgba(0,0,0,0.9)", border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 8, padding: "16px 20px", width: 340,
          color: "#FAFFFF", fontFamily: "var(--font-interphases), sans-serif",
          pointerEvents: "auto",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
            Tuning Panel <span style={{ opacity: 0.4 }}>(D to toggle)</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Slider label="Gap" value={params.gap} min={0} max={60} step={2} onChange={(v) => updateParam("gap", v)} />
            <Slider label="Min Scale" value={params.minScale} min={0.2} max={1.0} step={0.05} onChange={(v) => updateParam("minScale", v)} />
            <Slider label="Max Scale" value={params.maxScale} min={0.5} max={2.0} step={0.05} onChange={(v) => updateParam("maxScale", v)} />
            <Slider label="Base Width" value={params.baseWidth} min={200} max={900} step={10} onChange={(v) => updateParam("baseWidth", v)} />
            <Slider label="Scale Power" value={params.scalePower} min={0.5} max={4.0} step={0.1} onChange={(v) => updateParam("scalePower", v)} />
            <Slider label="Plateau" value={params.scalePlateau} min={0} max={0.4} step={0.01} onChange={(v) => updateParam("scalePlateau", v)} />
            <Slider label="Corners" value={params.borderRadius} min={0} max={40} step={1} onChange={(v) => updateParam("borderRadius", v)} />
          </div>
          <div style={{ marginTop: 12, fontSize: 10, opacity: 0.4 }}>
            {JSON.stringify(params)}
          </div>
        </div>
      )}

      <div className={`main ${expandingIdx !== null ? "film-exiting" : ""}`}>
        {/* Hero heading — top left (visible after shrink completes) */}
        {isShrinkOrLater && introPhase !== "shrink" && (
          <div className={`hero ${showUI ? "with-wordmark" : ""}`}>
            <h1 className="hero-title">
              <span className="line">
                <span className="line-inner revealed">Documenting</span>
              </span>
              <span className="line">
                <span className="line-inner revealed">the <span className="green">Humans</span></span>
              </span>
            </h1>
          </div>
        )}

        {/* Bottom left — logo + description (visible after carousel phase) */}
        {isShrinkOrLater && introPhase !== "shrink" && (
          <div className={`bottom-left ${revealed ? "revealed" : ""}`}>
            <img src="/ghost.png" alt="" className="bottom-ghost" />
            <p className="bottom-desc">
              {(() => {
                const fullText = fullDescText;
                const visible = fullText.slice(0, revealedChars);
                const hidden = fullText.slice(revealedChars);
                return (
                  <>
                    <span style={{ color: "rgba(250, 255, 255, 0.5)" }}>{visible}</span>
                    {showCursor && <span className={`typewriter-cursor ${!typing ? "blink" : ""}`} />}
                    <span style={{ color: "transparent" }}>{hidden}</span>
                  </>
                );
              })()}
            </p>
            <TransitionLink href="/about" className="home-cta">
              Partner with Us
            </TransitionLink>
          </div>
        )}

        {/* Bottom right — big text (visible after shrink completes) */}
        {isShrinkOrLater && introPhase !== "shrink" && (
          <div className="bottom-right revealed">
            <span className="bottom-right-line"><span className="bottom-right-line-inner">Behind World</span></span>
            <span className="bottom-right-line"><span className="bottom-right-line-inner">Shaping Tech</span></span>
          </div>
        )}

        {/* Right-side scrolling ticker */}
        <div className={`ticker ${revealed ? "revealed" : ""}`}>
          <div className="ticker-track">
            {tickerItems.map((item, i) => (
              <div key={i} className="ticker-row">
                <span className="ticker-tech">{item.tech}</span>
                <span className="ticker-name">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Video carousel */}
        <div className="carousel-wrapper" ref={wrapperRef}>
          <div className="carousel-items">
            {items.map((item, idx) => (
              <div
                key={item.title + idx}
                className="carousel-item"
                ref={(el) => { itemRefs.current[idx] = el; }}
                onMouseEnter={() => {
                  if (cursorLabelRef.current && !stateRef.current.isDragging && stateRef.current.initialized) {
                    cursorLabelRef.current.style.opacity = "1";
                  }
                }}
                onMouseMove={(e) => {
                  if (cursorLabelRef.current) {
                    const w = cursorLabelRef.current.offsetWidth;
                    cursorLabelRef.current.style.transform = `translate(${e.clientX - w / 2}px, ${e.clientY + 20}px)`;
                    cursorLabelRef.current.style.opacity = (stateRef.current.hasDragged || !stateRef.current.initialized) ? "0" : "1";
                  }
                }}
                onMouseLeave={() => {
                  if (cursorLabelRef.current) {
                    cursorLabelRef.current.style.opacity = "0";
                  }
                }}
              >
                <div
                  className="carousel-item-link"
                  onClick={() => {
                    if (!stateRef.current.hasDragged && stateRef.current.initialized && expandingIdx === null) {
                      pendingSlugRef.current = item.slug;

                      // Mark this item as expanding
                      expandingIdxRef.current = idx;
                      setExpandingIdx(idx);

                      // Calculate the target position: where the video sits on the film page
                      const padLeft = 40;
                      const padRight = 40;
                      const sidebarW = 370;
                      const gap = 16;
                      const targetLeft = padLeft;
                      const targetTop = 32;
                      const targetW = window.innerWidth - padLeft - gap - sidebarW - padRight;
                      const targetH = targetW * 9 / 16;

                      const el = itemRefs.current[idx];
                      if (el) {
                        // Reset hover scale immediately
                        el.style.scale = "1";
                        el.style.pointerEvents = "none";
                        el.style.transition = "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
                        el.style.transform = `translate(${targetLeft}px, ${targetTop}px)`;
                        el.style.width = `${targetW}px`;
                        el.style.height = `${targetH}px`;
                        el.style.borderRadius = "12px";
                        el.style.zIndex = "999";
                        el.style.opacity = "1";
                        el.style.border = "none";
                      }

                      // Navigate after animation — capture final rect for seamless handoff
                      setTimeout(() => {
                        const el2 = itemRefs.current[idx];
                        if (el2) {
                          const r = el2.getBoundingClientRect();
                          setFilmRect({ left: r.left, top: r.top, width: r.width, height: r.height });
                        }
                        if (pendingSlugRef.current) {
                          navigateTo(`/films/${pendingSlugRef.current}`, { skipOverlay: true });
                        }
                      }, 620);
                    }
                  }}
                >
                  <video
                    ref={(el) => { videoRefs.current[idx] = el; }}
                    src={item.video}
                    muted loop playsInline autoPlay preload="auto"
                    className="carousel-video"
                  />
                </div>
                <div className="carousel-overlay">
                  <div className="carousel-overlay-left">
                    <span className="carousel-overlay-title">{item.title}</span>
                    <span className="carousel-overlay-status">{item.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ FILM GRID SECTION ============ */}
      {gridRevealed && (
        <section className="home-grid-section">
          <div className="home-grid">
            {films.map((film) => (
              <div
                key={film.slug}
                className="home-grid-card"
                onClick={() => navigateTo(`/films/${film.slug}`)}
              >
                <video
                  src={film.video}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="home-grid-video"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ FOOTER ============ */}
      {gridRevealed && (
        <footer className="home-footer">
          <span className="home-footer-brand">CultRepo</span>
          <nav className="home-footer-nav">
            <TransitionLink href="/about">About</TransitionLink>
            <TransitionLink href="/films">Films</TransitionLink>
            <TransitionLink href="/about">Sponsor</TransitionLink>
          </nav>
          <span className="home-footer-credit">Site by LayerTwo</span>
        </footer>
      )}

      {/* Preloaded YouTube iframe — hidden, loads centered film */}
      {preloadYtId && (
        <iframe
          ref={ytPreloadRef}
          className="yt-preload"
          src={`https://www.youtube.com/embed/${preloadYtId}?autoplay=0&enablejsapi=1&rel=0&modestbranding=1&color=white&iv_load_policy=3&origin=${typeof window !== "undefined" ? window.location.origin : ""}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          title="Preload"
        />
      )}

      {/* Cursor-following VIEW FILM label */}
      <div ref={cursorLabelRef} className="cursor-label">View Film</div>
    </>
  );
}
