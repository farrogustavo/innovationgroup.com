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
  let currentVideoScale   = 0.88;
  let currentVideoY       = 0;
  let currentOverlayOp    = 0;
  let currentH1Op         = 1;
  let currentH1Y          = 0;
  let currentH1Blur        = 0;
  let currentEyebrowOp    = 1;
  let currentEyebrowY     = 0;
  let currentCopyOp       = 1;
  let currentCopyY        = 0;
  let currentCopyBlur     = 0;
  let currentActionsOp    = 1;
  let currentActionsY     = 0;
  let currentCardOp       = 1;
  let currentCardY        = 0;
  let currentProgress     = 0;

  const LERP_SPEED = 0.09; // cinematic lag — slower = more cinematic

  function getHeroProgress() {
    if (!heroScene) return 0;
    const rect = heroScene.getBoundingClientRect();
    const sceneH = heroScene.offsetHeight;
    const range = sceneH - window.innerHeight;
    if (range <= 0) return 0;
    const scrolled = Math.max(0, Math.min(range, -rect.top));
    return scrolled / range;
  }

  function updateHero(rawProgress) {
    if (!heroScene) return;

    const p = ease(rawProgress);

    /* Video: zoom 0.88 -> 1.06, parallax Y: 0 -> +80px */
    const targetVideoScale = map(p, 0, 0.65, 0.88, 1.06);
    const targetVideoY     = map(p, 0, 1, 0, 80);

    currentVideoScale = lerp(currentVideoScale, targetVideoScale, LERP_SPEED);
    currentVideoY     = lerp(currentVideoY,     targetVideoY,     LERP_SPEED);

    if (heroVideo) {
      heroVideo.style.transform = `scale(${currentVideoScale.toFixed(4)}) translateY(${currentVideoY.toFixed(2)}px)`;
    }

    /* Overlay: alpha 0.0 -> 0.55 as user exits hero */
    const targetOverlayOp = map(p, 0.35, 0.85, 0, 0.55);
    currentOverlayOp = lerp(currentOverlayOp, targetOverlayOp, LERP_SPEED * 0.7);
    if (heroOverlay) {
      heroOverlay.style.opacity = (1 + currentOverlayOp).toFixed(3);
    }

    /* Eyebrow: fades out early */
    const targetEyebrowOp = map(p, 0.05, 0.22, 1, 0);
    const targetEyebrowY  = map(p, 0.05, 0.22, 0, -28);
    currentEyebrowOp = lerp(currentEyebrowOp, targetEyebrowOp, LERP_SPEED);
    currentEyebrowY  = lerp(currentEyebrowY,  targetEyebrowY,  LERP_SPEED);
    if (heroEyebrow) {
      heroEyebrow.style.opacity   = Math.max(0, currentEyebrowOp).toFixed(3);
      heroEyebrow.style.transform = `translateY(${currentEyebrowY.toFixed(2)}px)`;
    }

    /* H1: fades + moves up + slight blur */
    const targetH1Op   = map(p, 0.08, 0.38, 1, 0);
    const targetH1Y    = map(p, 0.08, 0.38, 0, -52);
    const targetH1Blur = map(p, 0.12, 0.38, 0, 8);
    currentH1Op   = lerp(currentH1Op,   targetH1Op,   LERP_SPEED);
    currentH1Y    = lerp(currentH1Y,    targetH1Y,    LERP_SPEED);
    currentH1Blur = lerp(currentH1Blur, targetH1Blur, LERP_SPEED);
    if (heroH1) {
      heroH1.style.opacity   = Math.max(0, currentH1Op).toFixed(3);
      heroH1.style.transform = `translateY(${currentH1Y.toFixed(2)}px)`;
      heroH1.style.filter    = currentH1Blur > 0.1 ? `blur(${currentH1Blur.toFixed(2)}px)` : '';
    }

    /* Body copy: slightly delayed exit */
    const targetCopyOp   = map(p, 0.15, 0.45, 1, 0);
    const targetCopyY    = map(p, 0.15, 0.45, 0, -40);
    const targetCopyBlur = map(p, 0.2,  0.45, 0, 10);
    currentCopyOp   = lerp(currentCopyOp,   targetCopyOp,   LERP_SPEED);
    currentCopyY    = lerp(currentCopyY,    targetCopyY,    LERP_SPEED);
    currentCopyBlur = lerp(currentCopyBlur, targetCopyBlur, LERP_SPEED);
    if (heroCopy) {
      heroCopy.style.opacity   = Math.max(0, currentCopyOp).toFixed(3);
      heroCopy.style.transform = `translateY(${currentCopyY.toFixed(2)}px)`;
      heroCopy.style.filter    = currentCopyBlur > 0.1 ? `blur(${currentCopyBlur.toFixed(2)}px)` : '';
    }

    /* Actions: last to exit */
    const targetActionsOp = map(p, 0.22, 0.5, 1, 0);
    const targetActionsY  = map(p, 0.22, 0.5, 0, -32);
    currentActionsOp = lerp(currentActionsOp, targetActionsOp, LERP_SPEED);
    currentActionsY  = lerp(currentActionsY,  targetActionsY,  LERP_SPEED);
    if (heroActions) {
      heroActions.style.opacity   = Math.max(0, currentActionsOp).toFixed(3);
      heroActions.style.transform = `translateY(${currentActionsY.toFixed(2)}px)`;
    }

    /* Hero info card: exits to the right */
    const targetCardOp = map(p, 0.3, 0.55, 1, 0);
    const targetCardY  = map(p, 0.3, 0.55, 0, 36);
    currentCardOp = lerp(currentCardOp, targetCardOp, LERP_SPEED);
    currentCardY  = lerp(currentCardY,  targetCardY,  LERP_SPEED);
    if (heroCard) {
      heroCard.style.opacity   = Math.max(0, currentCardOp).toFixed(3);
      heroCard.style.transform = `translateY(${currentCardY.toFixed(2)}px)`;
    }

    /* Progress bar */
    currentProgress = lerp(currentProgress, rawProgress, 0.12);
    if (progressBarFill) {
      progressBarFill.style.width = (currentProgress * 100).toFixed(2) + '%';
    }
    if (progressBar) {
      progressBar.classList.toggle('is-visible', rawProgress > 0.01);
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
    // When the section is fully in view, p = 1
    const enterP = clamp(map(rect.top, window.innerHeight * 0.8, window.innerHeight * 0.1, 0, 1), 0, 1);
    const exitP  = clamp(map(rect.bottom, window.innerHeight * 0.4, 0, 1, 0), 0, 1);
    const p      = Math.min(enterP, exitP);

    const targetS2Scale   = map(p, 0, 0.6, 0.92, 1.0);
    const targetS2Opacity = map(p, 0, 0.4, 0, 1);

    s2Scale   = lerp(s2Scale,   targetS2Scale,   LERP_SPEED);
    s2Opacity = lerp(s2Opacity, targetS2Opacity, LERP_SPEED);

    if (scene2Video) {
      scene2Video.style.opacity  = s2Opacity.toFixed(3);
      scene2Video.style.transform = `scale(${s2Scale.toFixed(4)})`;
    }

    // Content
    const targetContentOp = map(p, 0.25, 0.7, 0, 1);
    const targetContentY  = map(p, 0.25, 0.7, 40, 0);
    s2ContentOp = lerp(s2ContentOp, targetContentOp, LERP_SPEED);
    s2ContentY  = lerp(s2ContentY,  targetContentY,  LERP_SPEED);
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
