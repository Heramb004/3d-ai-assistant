/* ===== NEXUS AI — Scroll Pinned Frame Animation & Downside Content Flow ===== */

(() => {
    'use strict';

    // ============================================================
    // CONFIG
    // ============================================================
    const TOTAL_FRAMES = 300;
    const FRAME_PATH = 'frames/ezgif-frame-';
    const FRAME_EXT = '.jpg';

    // ============================================================
    // DOM REFS
    // ============================================================
    const preloader = document.getElementById('preloader');
    const preloadBar = document.getElementById('preloadBar');
    const preloadPercent = document.getElementById('preloadPercent');
    const robotCanvas = document.getElementById('robotCanvas');
    const ctx = robotCanvas.getContext('2d');
    const particleCanvas = document.getElementById('particleCanvas');
    const pCtx = particleCanvas.getContext('2d');
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const mainNav = document.getElementById('mainNav');
    const scrollIndicator = document.getElementById('scrollIndicator');
    const hudFrameCounter = document.getElementById('hudFrameCounter');
    const heroOverlay = document.getElementById('heroOverlay');

    // ============================================================
    // FRAME PRELOADING
    // ============================================================
    const images = [];
    let loadedCount = 0;
    let currentFrame = 0;
    let isAutoPlaying = true;
    let autoPlayRAF = null;

    function padNumber(num) {
        return String(num).padStart(3, '0');
    }

    function loadFrames() {
        return new Promise((resolve) => {
            for (let i = 1; i <= TOTAL_FRAMES; i++) {
                const img = new Image();
                img.src = `${FRAME_PATH}${padNumber(i)}${FRAME_EXT}`;
                img.onload = () => {
                    loadedCount++;
                    const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
                    preloadBar.style.width = pct + '%';
                    preloadPercent.textContent = pct + '%';
                    if (loadedCount === TOTAL_FRAMES) {
                        resolve();
                    }
                };
                img.onerror = () => {
                    loadedCount++;
                    const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
                    preloadBar.style.width = pct + '%';
                    preloadPercent.textContent = pct + '%';
                    if (loadedCount === TOTAL_FRAMES) {
                        resolve();
                    }
                };
                images[i - 1] = img;
            }
        });
    }

    // Proportional Cover Rendering
    function drawImageProp(ctx, img, x, y, w, h, cx, cy) {
        if (arguments.length === 2) {
            x = y = 0;
            w = ctx.canvas.width;
            h = ctx.canvas.height;
        }
        cx = typeof cx === 'number' ? cx : 0.5;
        cy = typeof cy === 'number' ? cy : 0.5;

        let r = Math.min(w / img.width, h / img.height);
        let nw = img.width * r;
        let nh = img.height * r;
        let ar = 1;

        if (nw < w) ar = w / nw;
        if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;
        nw *= ar;
        nh *= ar;

        let cw = img.width / (nw / w);
        let ch = img.height / (nh / h);

        let cx_src = (img.width - cw) * cx;
        let cy_src = (img.height - ch) * cy;

        if (cx_src < 0) cx_src = 0;
        if (cy_src < 0) cy_src = 0;
        if (cw > img.width) cw = img.width;
        if (ch > img.height) ch = img.height;

        ctx.drawImage(img, cx_src, cy_src, cw, ch, x, y, w, h);
    }

    function drawFrame(index) {
        const img = images[index];
        if (!img || !img.complete) return;

        if (hudFrameCounter) {
            hudFrameCounter.textContent = `FRAME // ${String(index + 1).padStart(3, '0')}`;
        }

        drawImageProp(ctx, img);
    }

    function resizeCanvas() {
        robotCanvas.width = window.innerWidth;
        robotCanvas.height = window.innerHeight;
        drawFrame(currentFrame);
    }

    // ============================================================
    // AUTO-PLAY ENGINE (Plays until user scrolls)
    // ============================================================
    let autoPlayFrame = 0;
    const AUTO_PLAY_FPS = 30;
    let lastAutoPlayTime = 0;

    function autoPlay(timestamp) {
        if (!isAutoPlaying) return;

        if (!lastAutoPlayTime) lastAutoPlayTime = timestamp;
        const elapsed = timestamp - lastAutoPlayTime;

        if (elapsed >= 1000 / AUTO_PLAY_FPS) {
            lastAutoPlayTime = timestamp;
            drawFrame(autoPlayFrame);
            currentFrame = autoPlayFrame;
            autoPlayFrame++;

            if (autoPlayFrame >= TOTAL_FRAMES) {
                autoPlayFrame = 0;
            }
        }

        autoPlayRAF = requestAnimationFrame(autoPlay);
    }

    function startAutoPlay() {
        isAutoPlaying = true;
        autoPlayFrame = 0;
        lastAutoPlayTime = 0;
        autoPlayRAF = requestAnimationFrame(autoPlay);
    }

    function stopAutoPlay() {
        isAutoPlaying = false;
        if (autoPlayRAF) {
            cancelAnimationFrame(autoPlayRAF);
            autoPlayRAF = null;
        }
    }

    // ============================================================
    // STICKY SCROLL CONTROLLER
    // ============================================================
    function initScrollAnimation() {
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const scrollRange = window.innerHeight * 2.5;

            // Calculate progress (0.0 to 1.0) within the sticky trigger wrapper
            let progress = scrollTop / scrollRange;
            progress = Math.max(0, Math.min(1, progress));

            // Frame mapping
            const frameIndex = Math.floor(progress * (TOTAL_FRAMES - 1));

            if (frameIndex !== currentFrame) {
                currentFrame = frameIndex;
                drawFrame(currentFrame);
            }

            // Hero Overlay visibility: ONLY visible at EXACTLY 0px scroll (0% scroll)
            if (heroOverlay) {
                if (scrollTop === 0) {
                    heroOverlay.style.opacity = '1';
                    heroOverlay.style.transform = 'translate(-50%, -50%)';
                    heroOverlay.style.pointerEvents = 'auto';
                } else {
                    heroOverlay.style.opacity = '0';
                    heroOverlay.style.transform = 'translate(-50%, -55%)';
                    heroOverlay.style.pointerEvents = 'none';
                }
            }

            // Navbar visibility:
            // Visible at scrollTop === 0.
            // Blind (hidden) during frame animation (0 < scrollTop < scrollRange).
            // Visible again after frames complete (scrollTop >= scrollRange).
            if (mainNav) {
                if (scrollTop === 0) {
                    mainNav.style.opacity = '1';
                    mainNav.style.pointerEvents = 'auto';
                    mainNav.classList.remove('scrolled');
                } else if (scrollTop > 0 && scrollTop < scrollRange) {
                    mainNav.style.opacity = '0';
                    mainNav.style.pointerEvents = 'none';
                } else {
                    mainNav.style.opacity = '1';
                    mainNav.style.pointerEvents = 'auto';
                    mainNav.classList.add('scrolled');
                }
            }
        }, { passive: true });
    }

    // ============================================================
    // PARTICLE SYSTEM
    // ============================================================
    const particles = [];
    const PARTICLE_COUNT = 50;

    function initParticles() {
        particleCanvas.width = window.innerWidth;
        particleCanvas.height = window.innerHeight;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * particleCanvas.width,
                y: Math.random() * particleCanvas.height,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.35 + 0.1,
                hue: Math.random() > 0.5 ? 190 : 270
            });
        }
    }

    function animateParticles() {
        pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = particleCanvas.width;
            if (p.x > particleCanvas.width) p.x = 0;
            if (p.y < 0) p.y = particleCanvas.height;
            if (p.y > particleCanvas.height) p.y = 0;

            pCtx.beginPath();
            pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            pCtx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.opacity})`;
            pCtx.fill();

            for (let j = i + 1; j < particles.length; j++) {
                const dx = p.x - particles[j].x;
                const dy = p.y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 130) {
                    const lineOpacity = (1 - dist / 130) * 0.1;
                    pCtx.beginPath();
                    pCtx.moveTo(p.x, p.y);
                    pCtx.lineTo(particles[j].x, particles[j].y);
                    pCtx.strokeStyle = `hsla(200, 100%, 70%, ${lineOpacity})`;
                    pCtx.lineWidth = 0.5;
                    pCtx.stroke();
                }
            }
        });

        requestAnimationFrame(animateParticles);
    }

    // ============================================================
    // NAVIGATION & SMOOTH SCROLLING
    // ============================================================
    function initNavigation() {
        // Mobile Hamburger menu toggle
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Smooth scroll to targets
        const links = document.querySelectorAll('.nav-link, .mobile-link');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });

                    // Close mobile menu
                    hamburger.classList.remove('active');
                    mobileMenu.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });

        // Highlight active navbar link
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link[data-section]');

        window.addEventListener('scroll', () => {
            let current = 'hero';
            sections.forEach(section => {
                const top = section.offsetTop - 300;
                if (window.scrollY >= top) {
                    current = section.getAttribute('id');
                }
            });
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-section') === current) {
                    link.classList.add('active');
                }
            });
        }, { passive: true });
    }

    // ============================================================
    // SCROLL INTERSECTIONS FOR DOWNSIDE SECTIONS
    // ============================================================
    function initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.getAttribute('data-delay') || 0;
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, parseInt(delay));
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });

        document.querySelectorAll('[data-animate]').forEach(el => {
            observer.observe(el);
        });

        // Progress bar triggers
        const barObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const fill = entry.target.querySelector('.cap-fill');
                    if (fill) {
                        const width = fill.getAttribute('data-width');
                        setTimeout(() => {
                            fill.style.width = width + '%';
                        }, 200);
                    }
                    barObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        document.querySelectorAll('.capability-card').forEach(card => {
            barObserver.observe(card);
        });
    }

    // ============================================================
    // INTERACTIONS & FORMS
    // ============================================================
    function initForm() {
        const form = document.getElementById('contactForm');
        const submitBtn = document.getElementById('submitBtn');

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const originalContent = submitBtn.innerHTML;
            submitBtn.innerHTML = `
                <span style="display:flex;align-items:center;justify-content:center;gap:8px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Application Registered
                </span>
            `;
            submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            submitBtn.disabled = true;

            setTimeout(() => {
                submitBtn.innerHTML = originalContent;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
                form.reset();
            }, 3000);
        });
    }

    function initButtons() {
        document.getElementById('navCtaBtn')?.addEventListener('click', () => {
            document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // ============================================================
    // EVENT LISTENERS
    // ============================================================
    function initEvents() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                resizeCanvas();
                particleCanvas.width = window.innerWidth;
                particleCanvas.height = window.innerHeight;
            }, 150);
        });
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================
    async function init() {
        initParticles();
        animateParticles();

        // Preload frames
        await loadFrames();

        // Setup initial dimensions
        resizeCanvas();

        // Remove preloader
        preloader.classList.add('loaded');

        // Start auto-play initially
        startAutoPlay();

        // Setup scroll mappings
        initScrollAnimation();
        initScrollAnimations();

        // Disable auto-play on first scroll
        let hasScrolled = false;
        window.addEventListener('scroll', () => {
            if (!hasScrolled && window.scrollY > 5) {
                hasScrolled = true;
                stopAutoPlay();
            }
        }, { passive: true });

        // Component setups
        initNavigation();
        initForm();
        initButtons();
        initEvents();
    }

    // Run
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
