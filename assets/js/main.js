// ─── GSAP Hero Scroll-Scrub Canvas Animation (30fps optimized) ───
(function () {
  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d');
  const container = document.getElementById('heroScrollContainer');

  // Use every 8th frame → 30 frames total for smooth 30fps feel
  const frameIndices = [];
  for (let i = 1; i <= 240; i += 8) frameIndices.push(i);
  const frameCount = frameIndices.length; // ~30

  const framePad = (i) => String(i).padStart(3, '0');
  const framePath = (i) => `assets/images/hero-frames/ezgif-frame-${framePad(i)}.jpg`;

  const images = new Array(frameCount);
  let loadedCount = 0;
  let allLoaded = false;
  const currentFrame = { index: 0 };
  let lastRenderedIndex = -1;
  let rafId = null;

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio, 2); // cap DPR for performance
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    lastRenderedIndex = -1; // force re-render
    renderFrame(Math.round(currentFrame.index));
  }

  function renderFrame(idx) {
    if (idx === lastRenderedIndex) return;
    const img = images[idx];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    lastRenderedIndex = idx;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Cover fit
    const scale = Math.max(cw / iw, ch / ih);
    const sw = iw * scale;
    const sh = ih * scale;
    const sx = (cw - sw) / 2;
    const sy = (ch - sh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sw, sh);
  }

  // Preload all frames with decode API for zero-jank rendering
  function preloadFrames() {
    const promises = frameIndices.map((frameNum, i) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = framePath(frameNum);
        img.onload = () => {
          loadedCount++;
          if (loadedCount === 1) resizeCanvas(); // show first frame ASAP
          // Use decode() if available for smoother rendering
          if (img.decode) {
            img.decode().then(resolve).catch(resolve);
          } else {
            resolve();
          }
        };
        img.onerror = resolve;
        images[i] = img;
      });
    });

    Promise.all(promises).then(() => {
      allLoaded = true;
    });
  }

  preloadFrames();

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 150);
  });

  // Wait for GSAP then init
  function initScrollTrigger() {
    gsap.registerPlugin(ScrollTrigger);

    gsap.to(currentFrame, {
      index: frameCount - 1,
      snap: 'index',
      ease: 'none',
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2, // higher = smoother (less jitter)
      },
      onUpdate: () => {
        const idx = Math.round(currentFrame.index);
        renderFrame(idx);
      },
    });

    // Fade out hero content on scroll
    gsap.to('.hero-content', {
      opacity: 0,
      y: -60,
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: '20% top',
        scrub: true,
      },
    });

    gsap.to('.hero-scroll-hint', {
      opacity: 0,
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: '5% top',
        scrub: true,
      },
    });
  }

  const checkGsap = setInterval(() => {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      clearInterval(checkGsap);
      initScrollTrigger();
    }
  }, 100);
})();

// ─── Navbar bg after hero ends ───
const navbar = document.querySelector('.navbar');
const heroContainer = document.getElementById('heroScrollContainer');
window.addEventListener('scroll', () => {
  const heroEnd = heroContainer.offsetTop + heroContainer.offsetHeight;
  navbar.classList.toggle('scrolled', window.scrollY >= heroEnd - 100);
});

// ─── Scroll reveal animations ───
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
revealElements.forEach(el => revealObserver.observe(el));

// ─── Smooth scroll for anchor links ───
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});
