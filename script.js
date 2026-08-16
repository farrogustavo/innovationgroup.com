const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const navLinks = document.querySelector("[data-nav-links]");

const syncHeader = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 20);
};
syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

/* ─── Reveal on scroll ──────────────────────────────────────── */
const revealObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        revealObs.unobserve(e.target);
      }
    });
  },
  { threshold: 0.16 }
);
document.querySelectorAll(".reveal").forEach((el) => revealObs.observe(el));

/* ─── Booking form ──────────────────────────────────────────── */
const bookingForm   = document.querySelector("[data-booking-form]");
const timeSelect    = document.querySelector("[data-time-select]");
const bookingStatus = document.querySelector("[data-booking-status]");

const companyCalendarEmail = "info@innovationgroupproject.co";
const businessLocation     = "Innovation Group Projects LLC, Smyrna, TN 37167";
const availableTimes = ["08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00"];
const blockedWeeklySlots = { 2: ["10:00"], 4: ["14:00"] };
const blockedDateSlots   = new Set(["2026-05-18T09:00","2026-05-20T13:00"]);

const formatTimeLabel = (t) => {
  const [h, m] = t.split(":").map(Number);
  return new Date(2000,0,1,h,m).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});
};

const parseLocalDate = (d, t = "00:00") => {
  const [Y,M,D] = d.split("-").map(Number);
  const [h,m]   = t.split(":").map(Number);
  return new Date(Y, M-1, D, h, m);
};

const toGoogleDate = (date) => {
  const p = (n) => String(n).padStart(2,"0");
  return `${date.getFullYear()}${p(date.getMonth()+1)}${p(date.getDate())}T${p(date.getHours())}${p(date.getMinutes())}00`;
};

const setBookingStatus = (msg, type="") => {
  bookingStatus.className = `booking-status${type ? ` is-${type}` : ""}`;
  bookingStatus.textContent = msg;
};

const getAvailabilityIssue = (dateVal, timeVal) => {
  if (!dateVal || !timeVal) return "Please select both a date and a time.";
  const sel     = parseLocalDate(dateVal, timeVal);
  const weekday = sel.getDay();
  const slotKey = `${dateVal}T${timeVal}`;
  if (sel < new Date()) return "We are sorry, that date or time is no longer available. Please enter a new date.";
  if (weekday === 0 || weekday === 6) return "We are sorry, weekend appointments are not available. Please enter a new weekday date.";
  if (blockedDateSlots.has(slotKey) || blockedWeeklySlots[weekday]?.includes(timeVal))
    return "We are sorry, that day and time are not available. Please enter a new date or choose another time.";
  return "";
};

if (timeSelect) {
  availableTimes.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = formatTimeLabel(t);
    timeSelect.append(opt);
  });
}

if (bookingForm) {
  const dateInput = bookingForm.querySelector('input[name="date"]');
  const today     = new Date();
  dateInput.min   = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  setBookingStatus("Appointments are available Monday through Friday during business hours.");

  bookingForm.addEventListener("submit", (ev) => {
    const fd    = new FormData(bookingForm);
    const issue = getAvailabilityIssue(fd.get("date"), fd.get("time"));
    if (issue) { ev.preventDefault(); setBookingStatus(issue,"error"); return; }
    setBookingStatus("Sending your request...", "success");
  });
}

const mapCard  = document.querySelector("[data-map-card]");
const mapFrame = document.querySelector("[data-map-frame]");
if (mapCard && mapFrame) mapFrame.addEventListener("load", () => mapCard.classList.add("is-loaded"));

/* ─── Home carousel ─────────────────────────────────────────── */
const homeCarousel = document.querySelector("[data-home-carousel]");
if (homeCarousel) {
  const track    = homeCarousel.querySelector(".home-carousel-track");
  const slides   = Array.from(homeCarousel.querySelectorAll(".home-carousel-slide"));
  const prev     = homeCarousel.querySelector(".home-carousel-prev");
  const next     = homeCarousel.querySelector(".home-carousel-next");
  const dotsWrap = homeCarousel.querySelector(".home-carousel-dots");
  let cur = 0, homeTimer = null;

  slides.forEach((_, i) => {
    const d = document.createElement("button");
    d.type = "button";
    d.className = "home-carousel-dot" + (i===0?" is-active":"");
    d.setAttribute("aria-label","Go to project "+(i+1));
    d.addEventListener("click",()=>{ goHome(i); restartHome(); });
    dotsWrap.append(d);
  });

  const syncHome = () => {
    track.style.transform = `translateX(-${cur*100}%)`;
    dotsWrap.querySelectorAll(".home-carousel-dot").forEach((d,i) => d.classList.toggle("is-active",i===cur));
  };
  const goHome = (i) => { cur = (i+slides.length)%slides.length; syncHome(); };
  const startHome  = () => { homeTimer = setInterval(()=>goHome(cur+1),5000); };
  const restartHome = () => { clearInterval(homeTimer); startHome(); };

  prev.addEventListener("click",()=>{ goHome(cur-1); restartHome(); });
  next.addEventListener("click",()=>{ goHome(cur+1); restartHome(); });
  homeCarousel.addEventListener("mouseenter",()=>clearInterval(homeTimer));
  homeCarousel.addEventListener("mouseleave",startHome);
  startHome();
}

/* ─── Cinematic carousels ───────────────────────────────────── */
document.querySelectorAll("[data-cinematic-carousel]").forEach((carousel) => {
  const track    = carousel.querySelector(".cinematic-track");
  const slides   = Array.from(carousel.querySelectorAll(".cinematic-slide"));
  const prev     = carousel.querySelector(".cinematic-prev");
  const next     = carousel.querySelector(".cinematic-next");
  const dotsWrap = carousel.querySelector(".cinematic-dots");
  const curLabel = carousel.querySelector("[data-current]");
  let cur = 0, timer = null;

  slides.forEach((_,i) => {
    const d = document.createElement("button");
    d.type = "button";
    d.className = "cinematic-dot"+(i===0?" is-active":"");
    d.setAttribute("aria-label","Go to slide "+(i+1));
    d.addEventListener("click",()=>{ goTo(i); restart(); });
    dotsWrap.append(d);
  });

  const sync = () => {
    track.style.transform = `translateX(-${cur*100}%)`;
    dotsWrap.querySelectorAll(".cinematic-dot").forEach((d,i)=>d.classList.toggle("is-active",i===cur));
    if (curLabel) curLabel.textContent = String(cur+1).padStart(2,"0");
  };
  const goTo    = (i) => { cur=(i+slides.length)%slides.length; sync(); };
  const start   = ()  => { timer=setInterval(()=>goTo(cur+1),5200); };
  const restart = ()  => { clearInterval(timer); start(); };

  prev.addEventListener("click",()=>{ goTo(cur-1); restart(); });
  next.addEventListener("click",()=>{ goTo(cur+1); restart(); });
  carousel.addEventListener("mouseenter",()=>clearInterval(timer));
  carousel.addEventListener("mouseleave",start);
  start();
});

/* ─── Hero image carousel (fallback) ───────────────────────── */
const heroCarousel = document.querySelector("[data-hero-carousel]");
if (heroCarousel) {
  const heroSlides = Array.from(heroCarousel.querySelectorAll(".hero-bg-slide"));
  let heroIndex = 0;
  setInterval(()=>{
    heroSlides[heroIndex].classList.remove("is-active");
    heroIndex=(heroIndex+1)%heroSlides.length;
    heroSlides[heroIndex].classList.add("is-active");
  },5200);
}


/* ════════════════════════════════════════════════════════════
   SCROLL-SCRUBBED VIDEO  (rewritten — robust version)
   ─────────────────────────────────────────────────────────
   Handles non-faststart MP4s (WhatsApp, phone recordings).
   Uses multiple unlock strategies and a continuous RAF loop.
   ════════════════════════════════════════════════════════════ */
(function initScrollVideos() {

  const scenes = document.querySelectorAll("[data-scroll-video-scene]");
  if (!scenes.length) return;

  const entries = [];

  scenes.forEach((scene) => {
    const id          = scene.dataset.scrollVideoScene;
    const video       = scene.querySelector(`[data-scroll-video="${id}"]`);
    const progressBar = scene.querySelector(".scroll-video-progress-bar");
    const hint        = scene.querySelector(`[data-scroll-hint="${id}"]`);

    if (!video) return;

    video.muted       = true;
    video.playsInline = true;
    video.preload     = "auto";

    const entry = {
      scene, video, progressBar, hint,
      targetTime : 0,
      unlocked   : false,
    };
    entries.push(entry);

    /* ── Multi-strategy unlock ───────────────────────────
       WhatsApp / phone-recorded MP4s have the moov atom at
       the END of the file (not faststart), so `canplay` may
       never fire until the full file downloads.
       We try several events + a timeout fallback.           */
    const tryUnlock = () => {
      if (entry.unlocked) return;
      const p = video.play();
      const done = () => {
        video.pause();
        video.currentTime = 0;
        entry.unlocked = true;
      };
      if (p && p.then) {
        p.then(done).catch(() => {
          // play() blocked (autoplay policy) — still mark ready
          // so direct seeking can be attempted
          entry.unlocked = true;
        });
      } else {
        done();
      }
    };

    // Fire on whichever event comes first
    ["loadedmetadata", "loadeddata", "canplay", "canplaythrough"].forEach((ev) => {
      video.addEventListener(ev, tryUnlock, { once: true });
    });

    // If already has metadata, unlock immediately
    if (video.readyState >= 1) tryUnlock();

    // Timeout fallback: after 2.5 s force-unlock (handles slow connections)
    setTimeout(() => { if (!entry.unlocked) entry.unlocked = true; }, 2500);
  });

  /* ── Calculate scrub position for one entry ───────────── */
  function calcProgress(entry) {
    const { scene } = entry;
    const rect       = scene.getBoundingClientRect();
    const sceneTop   = window.scrollY + rect.top;
    const scrollRange = scene.offsetHeight - window.innerHeight;
    if (scrollRange <= 0) return 0;
    const scrolled = Math.max(0, Math.min(scrollRange, window.scrollY - sceneTop));
    return scrolled / scrollRange;                            // 0 → 1
  }

  /* ── Continuous RAF loop ───────────────────────────────── */
  const LERP = 0.18;   // 0.18 = snappy but smooth; 1.0 = instant

  function tick() {
    entries.forEach((entry) => {
      const { video, progressBar, hint } = entry;
      if (!entry.unlocked) return;

      // Resolve effective duration
      const dur = video.hasAttribute("data-duration")
        ? parseFloat(video.dataset.duration)
        : (isFinite(video.duration) && video.duration > 0 ? video.duration : 0);
      if (dur <= 0) return;

      const progress = calcProgress(entry);
      entry.targetTime = progress * dur;

      // Progress bar
      if (progressBar) {
        progressBar.style.width = (progress * 100).toFixed(1) + "%";
      }

      // Hint fade
      if (hint) {
        hint.style.opacity = progress > 0.03 ? "0" : "1";
      }

      // Lerp currentTime → targetTime
      const diff = entry.targetTime - video.currentTime;
      if (Math.abs(diff) > 0.04) {
        try { video.currentTime += diff * LERP; } catch (_) {/* ignore */}
      } else if (Math.abs(diff) > 0.005) {
        try { video.currentTime = entry.targetTime; } catch (_) {/* ignore */}
      }
    });

    requestAnimationFrame(tick);   // always keep running
  }

  requestAnimationFrame(tick);

})();

(function slowDownVideos() {
  // Only slow down videos that are NOT scroll-scrubbed (autoplay decorative ones)
  const videos = document.querySelectorAll('.scroll-video-el:not([data-scroll-video])');
  videos.forEach(v => { v.playbackRate = 0.4; });
})();
