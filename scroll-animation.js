/* ====================================================================
   SCROLL-DRIVEN CINEMATIC ANIMATION ENGINE  —  scroll-animation.js
   Implements:
   - Hero video zoom (0.88 -> 1.06) + vertical parallax
   - Headline gradual fade + translateY exit
   - Secondary text progressive blur-fade
   - Smooth overlay darkening between sections
   - Depth-scale entry for all content sections (80% -> 100%)
   - Parallax on gallery/feature images
   - Service cards depth-stagger entry
   - Global scroll progress indicator
   - Film grain + vignette injection
   - All animation uses smooth lerp() interpolation via rAF
   ==================================================================== */

(function cinematicScrollEngine() {
  'use strict';

  /* ----------------------------------------------------------------
     Utility: linear interpolation + easing
  ---------------------------------------------------------------- */
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const map = (v, inMin, inMax, outMin, outMax) => {
    const t = clamp((v - inMin) / (inMax - inMin), 0, 1);
    return lerp(outMin, outMax, t);
  };

  // Ease: smoothstep for cinematic feel
  const ease = (t) => t * t * (3 - 2 * t);

  /* ----------------------------------------------------------------
     DOM setup: inject global UI elements
  ---------------------------------------------------------------- */
  function setupDOM() {
    // Global scroll progress bar
    const progressEl = document.createElement('div');
    progressEl.className = 'hero-scroll-progress';
    progressEl.innerHTML = '<div class="hero-scroll-progress-fill"></div>';
    document.body.appendChild(progressEl);

    // Film grain + vignette on each hero sticky panel
    const heroSticky = document.querySelector('.scroll-video-scene:first-of-type .scroll-video-sticky');
    if (heroSticky) {
      const grain = document.createElement('div');
      grain.className = 'cinematic-grain';
      heroSticky.appendChild(grain);

      const vignette = document.createElement('div');
      vignette.className = 'cinematic-vignette';
      heroSticky.appendChild(vignette);
    }

    // Hero card entrance trigger
    setTimeout(() => {
      document.querySelectorAll('.scroll-video-sticky .hero-card').forEach(card => {
        card.classList.add('is-loaded');
      });
    }, 800);
  }

  /* ----------------------------------------------------------------
     Hero section references
  ---------------------------------------------------------------- */
  const heroScene   = document.querySelector('.scroll-video-scene:first-of-type');
  const heroVideo   = heroScene ? heroScene.querySelector('.scroll-video-el') : null;
  const heroContent = heroScene ? heroScene.querySelector('.scroll-video-content') : null;
  const heroH1      = heroContent ? heroContent.querySelector('h1') : null;
  const heroEyebrow = heroContent ? heroContent.querySelector('.eyebrow') : null;
  const heroCopy    = heroContent ? heroContent.querySelector('.hero-copy') : null;
  const heroActions = heroContent ? heroContent.querySelector('.hero-actions') : null;
  const heroOverlay = heroScene ? heroScene.querySelector('.scroll-video-overlay') : null;
  const heroCard    = heroScene ? heroScene.querySelector('.hero-card') : null;

  // Progress bar references
  const progressBar     = document.querySelector('.hero-scroll-progress');
  const progressBarFill = document.querySelector('.hero-scroll-progress-fill');

  /* ----------------------------------------------------------------
     Section 2: featured-projects scene
  ---------------------------------------------------------------- */
  const scene2       = document.getElementById('featured-projects');
  const scene2Video  = scene2 ? scene2.querySelector('.scroll-video-el') : null;
  const scene2Content = scene2 ? scene2.querySelector('.scroll-video-content') : null;

  /* ----------------------------------------------------------------
     Parallax targets: gallery + feature band images
  ---------------------------------------------------------------- */
  const parallaxImgs = [
    ...document.querySelectorAll('.gallery-item img'),
    ...document.querySelectorAll('.image-stack img'),
    ...document.querySelectorAll('[data-parallax-img] img'),
    ...document.querySelectorAll('[data-parallax-img] video'),
  ];

  /* ----------------------------------------------------------------
     Depth-entry sections: service cards, about cards, stats
  ---------------------------------------------------------------- */
  function setupDepthEntries() {
    // Service cards get staggered depth entry
    document.querySelectorAll('.service-card').forEach((card, i) => {
      card.setAttribute('data-depth-enter', '');
      card.style.transitionDelay = (i * 0.12) + 's';
    });

    // Cinematic enter wraps for section headings
    document.querySelectorAll('.section-heading, .about-index-grid, .service-grid').forEach(el => {
      el.classList.add('cinematic-enter-wrap');
    });

    // Parallax attribute on gallery and feature images
    document.querySelectorAll('.gallery-item, .image-stack, .field-video-frame').forEach(el => {
      el.setAttribute('data-parallax-img', '');
    });
  }

  /* ----------------------------------------------------------------
     Intersection observer for non-hero depth entries
  ---------------------------------------------------------------- */
  function setupIntersectionObserver() {
    const depthObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-entered');
          depthObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('[data-depth-enter]').forEach(el => depthObs.observe(el));

    const textObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          textObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.18 });

    document.querySelectorAll('[data-scroll-text], [data-scroll-secondary]').forEach(el => textObs.observe(el));

    const wrapObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-triggered');
          wrapObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.14 });

    document.querySelectorAll('.cinematic-enter-wrap').forEach(el => wrapObs.observe(el));
  }

  /* ----------------------------------------------------------------
     Hero scroll: maps hero scene scroll progress to visual effects
  ---------------------------------------------------------------- */
  /* Lee el progreso desde el controlador de wheel (script.js)
     en vez de calcularlo desde scroll position */
  function getHeroProgress() {
    return window.__heroProgress || 0;
  }

  /* Estado lerpeado para las capas de texto del hero */
  const hs = {
    overlayOp:  0,
    eyebrowOp:  1, eyebrowY: 0,
    h1Op:       1, h1Y: 0, h1Blur: 0,
    copyOp:     1, copyY: 0, copyBlur: 0,
    actionsOp:  1, actionsY: 0,
    cardOp:     1, cardY: 0,
  };
  const LS = 0.10; // LERP speed para el hero

  function updateHero(rawProgress) {
    if (!heroScene) return;
    const p = ease(rawProgress);

    /* Overlay: oscurece mientras sale el hero */
    const tOv = map(p, 0.35, 0.85, 0, 0.55);
    hs.overlayOp = lerp(hs.overlayOp, tOv, LS * 0.7);
    if (heroOverlay) heroOverlay.style.opacity = (1 + hs.overlayOp).toFixed(3);

    /* Eyebrow */
    hs.eyebrowOp = lerp(hs.eyebrowOp, map(p, 0.05, 0.22, 1, 0), LS);
    hs.eyebrowY  = lerp(hs.eyebrowY,  map(p, 0.05, 0.22, 0, -28), LS);
    if (heroEyebrow) {
      heroEyebrow.style.opacity   = Math.max(0, hs.eyebrowOp).toFixed(3);
      heroEyebrow.style.transform = `translateY(${hs.eyebrowY.toFixed(2)}px)`;
    }

    /* H1: sube + blur */
    hs.h1Op   = lerp(hs.h1Op,   map(p, 0.08, 0.38, 1, 0),  LS);
    hs.h1Y    = lerp(hs.h1Y,    map(p, 0.08, 0.38, 0, -52), LS);
    hs.h1Blur = lerp(hs.h1Blur, map(p, 0.12, 0.38, 0, 8),   LS);
    if (heroH1) {
      heroH1.style.opacity   = Math.max(0, hs.h1Op).toFixed(3);
      heroH1.style.transform = `translateY(${hs.h1Y.toFixed(2)}px)`;
      heroH1.style.filter    = hs.h1Blur > 0.1 ? `blur(${hs.h1Blur.toFixed(2)}px)` : '';
    }

    /* Copy: blur-fade */
    hs.copyOp   = lerp(hs.copyOp,   map(p, 0.15, 0.45, 1, 0),  LS);
    hs.copyY    = lerp(hs.copyY,    map(p, 0.15, 0.45, 0, -40), LS);
    hs.copyBlur = lerp(hs.copyBlur, map(p, 0.2,  0.45, 0, 10),  LS);
    if (heroCopy) {
      heroCopy.style.opacity   = Math.max(0, hs.copyOp).toFixed(3);
      heroCopy.style.transform = `translateY(${hs.copyY.toFixed(2)}px)`;
      heroCopy.style.filter    = hs.copyBlur > 0.1 ? `blur(${hs.copyBlur.toFixed(2)}px)` : '';
    }

    /* Botones */
    hs.actionsOp = lerp(hs.actionsOp, map(p, 0.22, 0.5, 1, 0),  LS);
    hs.actionsY  = lerp(hs.actionsY,  map(p, 0.22, 0.5, 0, -32), LS);
    if (heroActions) {
      heroActions.style.opacity   = Math.max(0, hs.actionsOp).toFixed(3);
      heroActions.style.transform = `translateY(${hs.actionsY.toFixed(2)}px)`;
    }

    /* Card */
    hs.cardOp = lerp(hs.cardOp, map(p, 0.3, 0.55, 1, 0),  LS);
    hs.cardY  = lerp(hs.cardY,  map(p, 0.3, 0.55, 0, 36),  LS);
    if (heroCard) {
      heroCard.style.opacity   = Math.max(0, hs.cardOp).toFixed(3);
      heroCard.style.transform = `translateY(${hs.cardY.toFixed(2)}px)`;
    }
  }


  /* ----------------------------------------------------------------
     Parallax on gallery images
  ---------------------------------------------------------------- */
  function updateParallax() {
    parallaxImgs.forEach(img => {
      const rect = img.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2 - window.innerHeight / 2;
      const depth = centerY / window.innerHeight;
      const shift = depth * 30; // max 30px parallax
      img.style.transform = `translateY(${shift.toFixed(2)}px)`;
    });
  }

  /* ----------------------------------------------------------------
     Section 2 scroll effect: zoom-in from below + fade
  ---------------------------------------------------------------- */
  let s2Scale   = 0.92;
  let s2Opacity = 0;
  let s2ContentOp = 0;
  let s2ContentY  = 40;

  function updateScene2() {
    if (!scene2) return;
    const rect = scene2.getBoundingClientRect();
    const enterP = clamp(map(rect.top, window.innerHeight * 0.8, window.innerHeight * 0.1, 0, 1), 0, 1);
    const exitP  = clamp(map(rect.bottom, window.innerHeight * 0.4, 0, 1, 0), 0, 1);
    const p      = Math.min(enterP, exitP);

    s2Scale   = lerp(s2Scale,   map(p, 0, 0.6, 0.92, 1.0), 0.09);
    s2Opacity = lerp(s2Opacity, map(p, 0, 0.4, 0, 1),      0.09);

    if (scene2Video) {
      scene2Video.style.opacity   = s2Opacity.toFixed(3);
      scene2Video.style.transform = `scale(${s2Scale.toFixed(4)})`;
    }

    s2ContentOp = lerp(s2ContentOp, map(p, 0.25, 0.7, 0, 1),  0.09);
    s2ContentY  = lerp(s2ContentY,  map(p, 0.25, 0.7, 40, 0), 0.09);
    if (scene2Content) {
      scene2Content.style.opacity   = Math.max(0, s2ContentOp).toFixed(3);
      scene2Content.style.transform = `translateY(${s2ContentY.toFixed(2)}px)`;
    }
  }


  /* ----------------------------------------------------------------
     Main rAF loop
  ---------------------------------------------------------------- */
  function tick() {
    const heroP = getHeroProgress();
    updateHero(heroP);
    updateParallax();
    updateScene2();
    requestAnimationFrame(tick);
  }

  /* ----------------------------------------------------------------
     Init
  ---------------------------------------------------------------- */
  function init() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    setupDOM();
    setupDepthEntries();
    setupIntersectionObserver();
    requestAnimationFrame(tick);
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
