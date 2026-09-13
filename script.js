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


/* ════════════════════════════════════════════════════════════════
   HERO VIDEO — WHEEL HIJACK CONTROLLER
   ────────────────────────────────────────────────────────────────
   • El scroll de la página queda BLOQUEADO mientras el video corre.
   • El wheel / touch del usuario avanza el video frame a frame.
   • Cuando el video llega al 100%, se desbloquea el scroll normal.
   • window.__heroProgress (0–1) es leído por scroll-animation.js
     para animar los textos en sincronía con el video.
   ════════════════════════════════════════════════════════════════ */
(function heroWheelController() {
  'use strict';

  const scene = document.querySelector('[data-scroll-video-scene="hero"]');
  const video = document.querySelector('[data-scroll-video="hero"]');
  if (!scene || !video) return;

  /* ── Configuración ───────────────────────────────────────── */
  const DURATION      = parseFloat(video.dataset.duration) || 88;
  // Cuánto avanza el video por px de wheel delta (ajustar a gusto)
  // 2500px de delta total = video completo
  const SENSITIVITY   = 1 / 2500;
  const LERP_SPEED    = 0.12;  // suavidad del seeking

  /* ── Estado ──────────────────────────────────────────────── */
  let progress        = 0;   // 0 → 1
  let currentTime     = 0;   // tiempo lerpeado
  let targetTime      = 0;
  let videoReady      = false;
  let pageUnlocked    = false;
  let touchStartY     = 0;
  let isSeeking       = false;

  // Compartir progreso con scroll-animation.js
  window.__heroProgress = 0;

  /* ── Bloquear scroll de página ───────────────────────────── */
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow            = 'hidden';
  // Asegurar que la página esté al tope
  window.scrollTo(0, 0);

  /* ── Desbloquear scroll ──────────────────────────────────── */
  function unlockPage() {
    if (pageUnlocked) return;
    pageUnlocked = true;

    document.documentElement.style.overflow = '';
    document.body.style.overflow            = '';

    // Hacer un scroll suave al primer contenido después del hero
    const nextSection = scene.nextElementSibling;
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ── Desbloquear seeking en el video ─────────────────────── */
  function tryUnlockVideo() {
    if (videoReady) return;
    const p = video.play();
    if (p && p.then) {
      p.then(() => { video.pause(); video.currentTime = 0; videoReady = true; })
       .catch(() => { videoReady = true; });
    } else {
      video.pause(); video.currentTime = 0; videoReady = true;
    }
  }

  ['loadedmetadata', 'loadeddata', 'canplay'].forEach(ev =>
    video.addEventListener(ev, tryUnlockVideo, { once: true })
  );
  if (video.readyState >= 1) tryUnlockVideo();
  setTimeout(() => { videoReady = true; }, 3000); // fallback

  /* ── Avanzar progreso ────────────────────────────────────── */
  function advance(deltaY) {
    if (pageUnlocked) return;

    // Scroll hacia arriba permite retroceder el video también
    progress = Math.max(0, Math.min(1, progress + deltaY * SENSITIVITY));
    targetTime = progress * DURATION;
    window.__heroProgress = progress;

    // Desbloquear cuando llega al final
    if (progress >= 0.999) {
      setTimeout(unlockPage, 400);
    }
  }

  /* ── Wheel ───────────────────────────────────────────────── */
  window.addEventListener('wheel', (e) => {
    if (pageUnlocked) return;
    e.preventDefault();
    e.stopPropagation();
    advance(e.deltaY);
  }, { passive: false, capture: true });

  /* ── Touch ───────────────────────────────────────────────── */
  window.addEventListener('touchstart', (e) => {
    if (pageUnlocked) return;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (pageUnlocked) return;
    e.preventDefault();
    const deltaY = touchStartY - e.touches[0].clientY;
    touchStartY  = e.touches[0].clientY;
    advance(deltaY * 2); // touch más sensible que wheel
  }, { passive: false, capture: true });

  /* ── Teclas ──────────────────────────────────────────────── */
  window.addEventListener('keydown', (e) => {
    if (pageUnlocked) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      advance(80);
    }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      advance(-80);
    }
  });

  /* ── RAF loop: lerp currentTime hacia targetTime ─────────── */
  function tick() {
    if (videoReady && !isSeeking) {
      const diff = targetTime - currentTime;
      if (Math.abs(diff) > 0.03) {
        currentTime += diff * LERP_SPEED;
        isSeeking = true;
        try {
          video.currentTime = currentTime;
        } catch (_) {}
        const onSeeked = () => {
          isSeeking = false;
          video.removeEventListener('seeked', onSeeked);
        };
        video.addEventListener('seeked', onSeeked, { once: true });
        setTimeout(() => { isSeeking = false; }, 150);
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ── UI: barra de progreso del video ─────────────────────── */
  const progressFill = document.querySelector('.hero-scroll-progress-fill');
  const progressBar  = document.querySelector('.hero-scroll-progress');

  function updateUI() {
    if (progressFill) progressFill.style.width = (progress * 100).toFixed(2) + '%';
    if (progressBar)  progressBar.classList.toggle('is-visible', progress > 0.01);
    requestAnimationFrame(updateUI);
  }
  requestAnimationFrame(updateUI);

})();

/* ── Decorative autoplay videos (non-hero) ───────────────────── */
(function slowDownVideos() {
  const videos = document.querySelectorAll('.scroll-video-el:not([data-scroll-video])');
  videos.forEach(v => { v.playbackRate = 0.4; });
})();


