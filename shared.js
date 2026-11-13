
        /* ============================================================
           MENU SCRIPT v2.0
           ============================================================ */
        document.addEventListener('DOMContentLoaded', () => {

            /* HYPNO ASCII OVERLAY: self-contained Canvas renderer.
               The character grid stays fixed; only the SVG pixels rotate underneath it. */
            (() => {
                const loaderImages = Array.from(document.querySelectorAll(
                    '#index-loading .hypnoload-intro'
                ));
                if (!loaderImages.length) return;

                const COLS = 67;
                const ROWS = 40;
                const CHARS = ' .,:;irsXA253hMHGS#9B&@';
                const FRAME_INTERVAL = 1000 / 30;
                const ROTATION_MS = 650;

                const active = img => {
                    const root = img.closest('#index-loading');
                    return !!root && root.classList.contains('show') &&
                        getComputedStyle(root).display !== 'none' &&
                        document.visibilityState !== 'hidden';
                };

                const items = loaderImages.map(img => {
                    const stage = document.createElement('span');
                    stage.className = 'hypnoload-stage';
                    img.parentNode.insertBefore(stage, img);
                    stage.appendChild(img);
                    const sample = document.createElement('canvas');
                    sample.width = COLS;
                    sample.height = ROWS;
                    const ctx = sample.getContext('2d', { willReadFrequently: true });
                    const pre = document.createElement('pre');
                    pre.className = 'hypnoload-ascii-surface';
                    pre.setAttribute('aria-hidden', 'true');
                    pre.setAttribute('role', 'presentation');
                    stage.appendChild(pre);

                    const item = {
                        img, stage, sample, ctx, pre,
                        raf: 0, started: false, starting: false, ready: false,
                        startedAt: 0, lastDraw: 0,
                        setLayout() {
                            const rect = stage.getBoundingClientRect();
                            const fontSize = Math.max(4, rect.height / ROWS);
                            pre.style.fontSize = `${fontSize}px`;
                            pre.style.lineHeight = `${fontSize}px`;
                        }
                    };
                    return item;
                });

                function drawAscii(item, angle) {
                    const { ctx, img, pre } = item;
                    ctx.clearRect(0, 0, COLS, ROWS);
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    // Work in a square logical coordinate system, then compensate for
                    // the narrow width of monospace glyphs. This keeps the spiral round.
                    ctx.save();
                    ctx.translate(COLS / 2, ROWS / 2);
                    ctx.scale(COLS / ROWS, 1);
                    ctx.rotate(angle);
                    ctx.drawImage(img, -ROWS / 2, -ROWS / 2, ROWS, ROWS);
                    ctx.restore();

                    let pixels;
                    try {
                        pixels = ctx.getImageData(0, 0, COLS, ROWS).data;
                    } catch (err) {
                        throw new Error(`ASCII pixel sampling failed: ${err.message}`);
                    }

                    const lines = new Array(ROWS);
                    let p = 0;
                    for (let y = 0; y < ROWS; y++) {
                        let line = '';
                        for (let x = 0; x < COLS; x++, p += 4) {
                            const alpha = pixels[p + 3];
                            if (alpha < 28) {
                                line += ' ';
                                continue;
                            }
                            const luminance = (pixels[p] * 0.2126 + pixels[p + 1] * 0.7152 + pixels[p + 2] * 0.0722) / 255;
                            if (luminance < 0.09) {
                                line += ' ';
                            } else {
                                const index = Math.min(CHARS.length - 1, Math.max(0, Math.round(luminance * (CHARS.length - 1))));
                                line += CHARS[index];
                            }
                        }
                        lines[y] = line;
                    }
                    pre.textContent = lines.join('\n');
                }

                async function prepare(item) {
                    if (typeof item.img.decode === 'function') {
                        try { await item.img.decode(); } catch (_) { /* naturalWidth below decides */ }
                    }
                    if (!item.img.complete || !item.img.naturalWidth) {
                        if (item.img.complete && !item.img.naturalWidth) {
                            throw new Error(`Could not load ${item.img.currentSrc || item.img.src}`);
                        }
                        await new Promise((resolve, reject) => {
                            item.img.addEventListener('load', resolve, { once: true });
                            item.img.addEventListener('error', () => reject(new Error('hypnoload.svg failed to load')), { once: true });
                        });
                    }
                    if (!item.ctx) throw new Error('Canvas 2D is not available');

                    item.setLayout();
                    drawAscii(item, 0);
                    item.stage.classList.add('ascii-ready');
                    item.ready = true;
                }

                function stop(item) {
                    if (item.raf) cancelAnimationFrame(item.raf);
                    item.raf = 0;
                    item.started = false;
                    item.lastDraw = 0;
                }

                function frame(item, now) {
                    if (!active(item.img)) {
                        stop(item);
                        return;
                    }
                    if (!item.lastDraw || now - item.lastDraw >= FRAME_INTERVAL) {
                        const elapsed = now - item.startedAt;
                        const angle = (elapsed / ROTATION_MS) * Math.PI * 2;
                        drawAscii(item, angle);
                        item.lastDraw = now;
                    }
                    item.raf = requestAnimationFrame(t => frame(item, t));
                }

                async function start(item) {
                    if (item.started || item.starting || !active(item.img)) return;
                    item.starting = true;
                    try {
                        if (!item.ready) await prepare(item);
                        if (!active(item.img)) return;
                        item.startedAt = performance.now();
                        item.lastDraw = 0;
                        item.started = true;
                        item.raf = requestAnimationFrame(t => frame(item, t));
                    } catch (err) {
                        item.stage.classList.remove('ascii-ready');
                        item.ready = false;
                        console.warn('LHU ASCII renderer unavailable; rotating SVG fallback remains active.', err);
                    } finally {
                        item.starting = false;
                    }
                }

                const update = () => items.forEach(item => {
                    if (active(item.img)) start(item);
                    else stop(item);
                });

                const observer = new MutationObserver(update);
                document.querySelectorAll('#index-loading').forEach(el => {
                    observer.observe(el, { attributes: true, attributeFilter: ['class', 'style'] });
                });
                document.addEventListener('visibilitychange', update);
                window.addEventListener('resize', () => items.forEach(item => item.setLayout()));
                update();
            })();


            /* --------------------------------------------------------
               0. CLEANUP-INFRASTRUKTUR
               Content-Seiten können sich registrieren.
               Wird vor jedem innerHTML-Swap ausgeführt.
               -------------------------------------------------------- */
            window.__lhuCleanups = [];
            window.__lhuRegisterCleanup = (fn) => {
                if (typeof fn === 'function') window.__lhuCleanups.push(fn);
            };
            function runCleanups() {
                window.__lhuCleanups.forEach(fn => {
                    try { fn(); } catch (e) { console.warn('LHU cleanup error:', e); }
                });
                window.__lhuCleanups = [];
                // Observer vom VHS-Kategorie-Rest aufräumen
                if (vhsImageObserver) { vhsImageObserver.disconnect(); vhsImageObserver = null; }
            }

            /* 1. Türen (Tiles) initialisieren */
            const doorPanel = document.querySelector('.door-panel');
            if (doorPanel) {
                const fragment = document.createDocumentFragment();
                for (let i = 0; i < 32; i++) {
                    const tile = document.createElement('div');
                    tile.className = 'door-tile';
                    fragment.appendChild(tile);
                }
                doorPanel.appendChild(fragment);
            }

            /* --------------------------------------------------------
               2. THEME MANAGEMENT
               -------------------------------------------------------- */
            const THEMES = ['light', 'dark', 'mono-gray', 'mono-green', 'crt'];
            const THEME_ICONS = { light: '☀', dark: '☾', 'mono-gray': '░', 'mono-green': '▓', crt: '▤' };
            const themeBtn = document.getElementById('themeToggle');

            function applyTheme(theme) {
                document.documentElement.setAttribute('data-theme', theme);
                try { localStorage.setItem('lhu-theme', theme); } catch(e) {}
                if (themeBtn) themeBtn.textContent = THEME_ICONS[theme] || '☀';
            }
            let currentTheme = 'light';
            try {
                currentTheme = localStorage.getItem('lhu-theme')
                    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            } catch(e) {}
            if (!THEMES.includes(currentTheme)) currentTheme = 'light';
            applyTheme(currentTheme);

            if (themeBtn) {
                themeBtn.addEventListener('click', () => {
                    const idx = THEMES.indexOf(currentTheme);
                    currentTheme = THEMES[(idx + 1) % THEMES.length];
                    applyTheme(currentTheme);
                });
            }

            /* --------------------------------------------------------
               3. GLOBAL AUDIO MUTE
               -------------------------------------------------------- */
            const audioBtn = document.getElementById('audioToggle');
            const quackAudio = document.getElementById('quackAudio');
            let isMuted = false;
            try { isMuted = localStorage.getItem('lhu-muted') === 'true'; } catch(e) {}

            if (isMuted) audioBtn.classList.add('muted');

            function applyGlobalMute() {
                if (quackAudio) quackAudio.muted = isMuted;
                document.querySelectorAll('audio, video').forEach(m => { m.muted = isMuted; });
            }
            applyGlobalMute();

            audioBtn.addEventListener('click', () => {
                isMuted = !isMuted;
                try { localStorage.setItem('lhu-muted', isMuted); } catch(e) {}
                audioBtn.classList.toggle('muted', isMuted);
                audioBtn.setAttribute('title', isMuted ? 'Global Audio ist AUS' : 'Global Audio ist AN');
                applyGlobalMute();
            });

            /* --------------------------------------------------------
               4. COLLAPSE + QUACK
               -------------------------------------------------------- */
            const collapseBtn = document.getElementById('collapseToggle');
            const stripWrapper = document.getElementById('stripWrapper');
            const sliderWrap = document.getElementById('sliderWrap');
            const headerEl = document.getElementById('headerEl');
            let isCollapsed = false;

            const quackFiles = ['quack/quack01.mp3', 'quack/quack02.mp3', 'quack/quack03.mp3', 'quack/quack04.mp3'];
            let quackQueue = [];
            function getNextQuack() {
                if (quackQueue.length === 0) {
                    quackQueue = [...quackFiles].sort(() => Math.random() - 0.5);
                }
                return quackQueue.shift();
            }
            collapseBtn.addEventListener('click', () => {
                if (quackAudio && !isMuted) {
                    quackAudio.src = getNextQuack();
                    quackAudio.currentTime = 0;
                    quackAudio.play().catch(() => {});
                }
                isCollapsed = !isCollapsed;
                headerEl.classList.toggle('collapsed', isCollapsed);
                stripWrapper.classList.toggle('collapsed', isCollapsed);
                sliderWrap.classList.toggle('collapsed', isCollapsed);
            });

            /* --------------------------------------------------------
               5. KATEGORIE-LADEN
               -------------------------------------------------------- */
            const categoryPages = {
                'ABOUT':          '01_about.html',
                'VHS MULTIVERSE': '02_vhsmultiverse.html',
                'HUMANART':       '03_humanart.html',
                'PROJECTS':       '04_projects.html',
                'STORYTIME':      '05_storytime.html',
                'MUSIC':          '06_music.html',
                'CONTACT':        '07_contact.html',
                'DONATE':         '08_donate.html'
            };
            // GitHub Pages: flache Dateistruktur mit echten, lesbaren Kategoriepfaden.
            // 404.html leitet unbekannte Pfade kurz über /?__lhu_route=... um;
            // diese Funktion stellt danach die gewünschte saubere URL wieder her.
            const categoryPaths = {
                'ABOUT': '/about',
                'VHS MULTIVERSE': '/vhsmultiverse',
                'HUMANART': '/humanart',
                'PROJECTS': '/projects',
                'STORYTIME': '/storytime',
                'MUSIC': '/music',
                'CONTACT': '/contact',
                'DONATE': '/donate'
            };
            const routeCategories = Object.fromEntries(
                Object.entries(categoryPaths).map(([category, route]) => [route, category])
            );
            const normalizePath = (path) => (path || '/').toLowerCase().replace(/\/+$/, '') || '/';

            function restoreGithubPagesRoute() {
                const encodedRoute = new URLSearchParams(window.location.search).get('__lhu_route');
                if (!encodedRoute) return null;
                try {
                    const requested = new URL(encodedRoute, window.location.origin);
                    if (requested.origin !== window.location.origin) return null;
                    const category = routeCategories[normalizePath(requested.pathname)];
                    if (!category) return null;
                    const cleanUrl = categoryPaths[category] + requested.search + requested.hash;
                    window.history.replaceState({ lhuCategory: category }, '', cleanUrl);
                    return category;
                } catch (error) {
                    console.warn('[LHU] Ungültige Route aus GitHub-Pages-Fallback:', error);
                    return null;
                }
            }

            function categoryFromHash(hash = window.location.hash) {
                const normalized = hash ? (hash.startsWith('#/') ? hash : '#/' + hash.slice(1).replace(/^\//, '')) : '';
                const legacyHashRoutes = Object.fromEntries(
                    Object.entries(categoryPaths).map(([category, route]) => [route.replace(/^\//, '#/'), category])
                );
                return legacyHashRoutes[normalized.replace(/\/+$/, '')] || null;
            }

            function categoryFromLocation() {
                const restored = restoreGithubPagesRoute();
                if (restored) return restored;
                return routeCategories[normalizePath(window.location.pathname)] || categoryFromHash();
            }

            function writeCategoryRoute(category, replace = false) {
                const route = categoryPaths[category];
                if (!route) return;
                const currentPath = normalizePath(window.location.pathname);
                if (currentPath === route) {
                    if (window.location.pathname !== route) {
                        window.history.replaceState({ lhuCategory: category }, '', route + window.location.search + window.location.hash);
                    }
                    return;
                }
                const method = replace ? 'replaceState' : 'pushState';
                window.history[method]({ lhuCategory: category }, '', route);
            }
            const CAT_COLORS = {
                'ABOUT':         'var(--accent)',
                'VHS MULTIVERSE':'var(--accent-red)',
                'HUMANART':      'var(--accent-yellow)',
                'PROJECTS':      'var(--accent-blue)',
                'STORYTIME':     'var(--accent-yellow)',
                'MUSIC':         'var(--accent-red)',
                'CONTACT':       'var(--accent-blue)',
                'DONATE':        'var(--accent)'
            };

            // One shared, responsive image viewer for ABOUT, VHS MULTIVERSE and PROJECTS.
            // 0% = fit to the current viewer area; 100% = natural image size; 700% = 7x natural size.
            let imageLightbox = null;
            let lightboxPreviousFocus = null;
            const LHU_ZOOM_MAX_PERCENT = 700;

            function ensureImageLightbox() {
                if (imageLightbox) return imageLightbox;

                const overlay = document.createElement('div');
                overlay.className = 'lhu-lightbox';
                overlay.hidden = true;
                overlay.setAttribute('role', 'dialog');
                overlay.setAttribute('aria-modal', 'true');
                overlay.setAttribute('aria-label', 'Bildansicht');

                const close = document.createElement('button');
                close.type = 'button';
                close.className = 'lhu-lightbox__close';
                close.setAttribute('aria-label', 'Bildansicht schließen');
                close.title = 'Schließen';
                close.textContent = '×';

                const stage = document.createElement('div');
                stage.className = 'lhu-lightbox__stage';
                stage.tabIndex = 0;
                stage.setAttribute('aria-label', 'Bildbereich. Mausrad zum Zoomen, ziehen zum Verschieben. Auf Touchgeräten mit zwei Fingern zoomen.');

                const image = document.createElement('img');
                image.className = 'lhu-lightbox__image';
                image.alt = '';
                image.draggable = false;
                image.decoding = 'async';
                stage.appendChild(image);

                const controls = document.createElement('div');
                controls.className = 'lhu-lightbox__controls';

                const minus = document.createElement('button');
                minus.type = 'button';
                minus.className = 'lhu-lightbox__zoom-button';
                minus.textContent = '−';
                minus.setAttribute('aria-label', 'Zoom um 25 Prozentpunkte verringern');
                minus.title = '−25 Prozentpunkte';

                const percentInput = document.createElement('input');
                percentInput.type = 'number';
                percentInput.className = 'lhu-lightbox__zoom-input';
                percentInput.min = '0';
                percentInput.max = String(LHU_ZOOM_MAX_PERCENT);
                percentInput.step = '1';
                percentInput.inputMode = 'numeric';
                percentInput.value = '0';
                percentInput.setAttribute('aria-label', 'Zoom-Prozentwert von 0 bis 700 eingeben');
                percentInput.title = 'Zoom von 0 bis 700 Prozent';

                const percentSuffix = document.createElement('span');
                percentSuffix.className = 'lhu-lightbox__zoom-suffix';
                percentSuffix.textContent = '%';

                const plus = document.createElement('button');
                plus.type = 'button';
                plus.className = 'lhu-lightbox__zoom-button';
                plus.textContent = '+';
                plus.setAttribute('aria-label', 'Zoom um 25 Prozentpunkte erhöhen');
                plus.title = '+25 Prozentpunkte';

                const fit = document.createElement('button');
                fit.type = 'button';
                fit.className = 'lhu-lightbox__zoom-button lhu-lightbox__fit';
                fit.textContent = '↺';
                fit.setAttribute('aria-label', 'Bild an Fenster anpassen');
                fit.title = 'An Fenster anpassen (0%)';

                controls.append(minus, percentInput, percentSuffix, plus, fit);
                const hint = document.createElement('p');
                hint.className = 'lhu-lightbox__hint';
                hint.textContent = '0% = Fenstergröße · 100% = Originalgröße · 700% = 7× · Mausrad / Ziehen / Touch';

                overlay.append(close, stage, controls, hint);
                document.body.appendChild(overlay);

                let zoomPercent = 0;
                let zoomScale = 1;
                let fitScale = 1;
                let panX = 0;
                let panY = 0;
                const pointers = new Map();
                let dragStart = null;
                let pinchStart = null;
                let resizeObserver = null;

                const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
                const stageCenter = () => ({ x: stage.clientWidth / 2, y: stage.clientHeight / 2 });

                function measureFitScale() {
                    if (!image.naturalWidth || !image.naturalHeight || !stage.clientWidth || !stage.clientHeight) return 1;
                    // Fit to the current Chrome/browser viewport, never upscale beyond the image's natural size.
                    return Math.min(
                        stage.clientWidth / image.naturalWidth,
                        stage.clientHeight / image.naturalHeight,
                        1
                    );
                }

                function scaleFromPercent(value) {
                    const p = clamp(Number(value) || 0, 0, LHU_ZOOM_MAX_PERCENT);
                    if (p <= 100) return fitScale + (1 - fitScale) * (p / 100);
                    return p / 100;
                }

                function percentFromScale(scale) {
                    if (scale <= 1) {
                        if (fitScale >= 0.9999) return scale >= 0.9999 ? 100 : 0;
                        return clamp(((scale - fitScale) / (1 - fitScale)) * 100, 0, 100);
                    }
                    return clamp(scale * 100, 100, LHU_ZOOM_MAX_PERCENT);
                }

                function clampPan() {
                    if (!image.naturalWidth || !image.naturalHeight) {
                        panX = 0;
                        panY = 0;
                        return;
                    }
                    const renderedWidth = image.naturalWidth * zoomScale;
                    const renderedHeight = image.naturalHeight * zoomScale;
                    const maxX = Math.max(0, (renderedWidth - stage.clientWidth) / 2);
                    const maxY = Math.max(0, (renderedHeight - stage.clientHeight) / 2);
                    panX = clamp(panX, -maxX, maxX);
                    panY = clamp(panY, -maxY, maxY);
                }

                function render() {
                    clampPan();
                    image.style.width = image.naturalWidth ? `${image.naturalWidth}px` : 'auto';
                    image.style.height = image.naturalHeight ? `${image.naturalHeight}px` : 'auto';
                    image.style.transform = `translate3d(${panX}px, ${panY}px, 0) translate(-50%, -50%) scale(${zoomScale})`;
                    image.classList.toggle('is-zoomed', zoomPercent > 0);
                    percentInput.value = String(Math.round(zoomPercent));
                    minus.disabled = zoomPercent <= 0;
                    plus.disabled = zoomPercent >= LHU_ZOOM_MAX_PERCENT;
                    stage.classList.toggle('is-pannable', zoomPercent > 0 && (image.naturalWidth * zoomScale > stage.clientWidth + 1 || image.naturalHeight * zoomScale > stage.clientHeight + 1));
                }

                function applyScale(nextScale, anchorClientX, anchorClientY) {
                    const minScale = fitScale;
                    const maxScale = LHU_ZOOM_MAX_PERCENT / 100;
                    const newScale = clamp(nextScale, minScale, maxScale);
                    if (!image.naturalWidth || !image.naturalHeight) return;
                    if (Math.abs(newScale - zoomScale) < 0.0001) return;

                    const rect = stage.getBoundingClientRect();
                    const center = stageCenter();
                    const anchorX = (anchorClientX == null ? rect.left + center.x : anchorClientX) - rect.left - center.x;
                    const anchorY = (anchorClientY == null ? rect.top + center.y : anchorClientY) - rect.top - center.y;
                    const ratio = newScale / zoomScale;
                    panX = anchorX - (anchorX - panX) * ratio;
                    panY = anchorY - (anchorY - panY) * ratio;
                    zoomScale = newScale;
                    zoomPercent = percentFromScale(newScale);
                    render();
                }

                function setZoomPercent(value, anchorClientX, anchorClientY) {
                    const parsed = Number(value);
                    if (!Number.isFinite(parsed)) return;
                    zoomPercent = clamp(parsed, 0, LHU_ZOOM_MAX_PERCENT);
                    const targetScale = scaleFromPercent(zoomPercent);
                    // Preserve the cursor/touch anchor while changing the scale.
                    const rect = stage.getBoundingClientRect();
                    const center = stageCenter();
                    const anchorX = (anchorClientX == null ? rect.left + center.x : anchorClientX) - rect.left - center.x;
                    const anchorY = (anchorClientY == null ? rect.top + center.y : anchorClientY) - rect.top - center.y;
                    const ratio = targetScale / Math.max(0.0001, zoomScale);
                    panX = anchorX - (anchorX - panX) * ratio;
                    panY = anchorY - (anchorY - panY) * ratio;
                    zoomScale = targetScale;
                    if (zoomPercent === 0) {
                        panX = 0;
                        panY = 0;
                    }
                    render();
                }

                function fitToWindow() {
                    fitScale = measureFitScale();
                    zoomPercent = 0;
                    zoomScale = fitScale;
                    panX = 0;
                    panY = 0;
                    render();
                }

                function pointerMidpoint(a, b) {
                    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
                }
                function pointerDistance(a, b) {
                    return Math.hypot(a.x - b.x, a.y - b.y);
                }
                function beginPinch() {
                    const points = [...pointers.values()];
                    if (points.length < 2) return;
                    const mid = pointerMidpoint(points[0], points[1]);
                    const rect = stage.getBoundingClientRect();
                    pinchStart = {
                        distance: Math.max(1, pointerDistance(points[0], points[1])),
                        scale: zoomScale,
                        panX,
                        panY,
                        midX: mid.x,
                        midY: mid.y,
                        localX: mid.x - rect.left - stage.clientWidth / 2,
                        localY: mid.y - rect.top - stage.clientHeight / 2
                    };
                    dragStart = null;
                }

                close.addEventListener('click', closeLightbox);
                minus.addEventListener('click', () => setZoomPercent(zoomPercent - 25));
                plus.addEventListener('click', () => setZoomPercent(zoomPercent + 25));
                fit.addEventListener('click', fitToWindow);

                // Apply typed percentages when editing is committed, not on every keystroke.
                // Otherwise render() rewrites the field while a multi-digit value is being entered.
                percentInput.addEventListener('change', () => {
                    const value = percentInput.value === '' ? zoomPercent : Number(percentInput.value);
                    setZoomPercent(Number.isFinite(value) ? value : zoomPercent);
                });
                percentInput.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        percentInput.blur();
                    }
                });

                overlay.addEventListener('click', (event) => {
                    if (event.target === overlay) closeLightbox();
                });

                stage.addEventListener('wheel', (event) => {
                    if (overlay.hidden || !image.naturalWidth) return;
                    event.preventDefault();
                    const next = zoomScale * (event.deltaY < 0 ? 1.12 : 1 / 1.12);
                    applyScale(next, event.clientX, event.clientY);
                }, { passive: false });

                stage.addEventListener('pointerdown', (event) => {
                    if (overlay.hidden || event.target.closest('button')) return;
                    if (event.pointerType === 'mouse' && event.button !== 0) return;
                    stage.setPointerCapture?.(event.pointerId);
                    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
                    if (pointers.size === 2) {
                        beginPinch();
                    } else if (pointers.size === 1 && stage.classList.contains('is-pannable')) {
                        dragStart = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, panX, panY };
                    }
                });

                stage.addEventListener('pointermove', (event) => {
                    if (!pointers.has(event.pointerId)) return;
                    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

                    if (pointers.size >= 2) {
                        if (!pinchStart) beginPinch();
                        const points = [...pointers.values()];
                        const mid = pointerMidpoint(points[0], points[1]);
                        const nextScale = clamp(
                            pinchStart.scale * pointerDistance(points[0], points[1]) / pinchStart.distance,
                            fitScale,
                            LHU_ZOOM_MAX_PERCENT / 100
                        );
                        const ratio = nextScale / pinchStart.scale;
                        panX = pinchStart.localX - (pinchStart.localX - pinchStart.panX) * ratio + (mid.x - pinchStart.midX);
                        panY = pinchStart.localY - (pinchStart.localY - pinchStart.panY) * ratio + (mid.y - pinchStart.midY);
                        zoomScale = nextScale;
                        zoomPercent = percentFromScale(nextScale);
                        render();
                    } else if (dragStart && dragStart.pointerId === event.pointerId && stage.classList.contains('is-pannable')) {
                        panX = dragStart.panX + event.clientX - dragStart.x;
                        panY = dragStart.panY + event.clientY - dragStart.y;
                        render();
                    }
                });

                function finishPointer(event) {
                    if (!pointers.has(event.pointerId)) return;
                    pointers.delete(event.pointerId);
                    if (pointers.size < 2) pinchStart = null;
                    if (pointers.size === 1 && stage.classList.contains('is-pannable')) {
                        const [id, point] = [...pointers.entries()][0];
                        dragStart = { pointerId: id, x: point.x, y: point.y, panX, panY };
                    } else {
                        dragStart = null;
                    }
                }
                stage.addEventListener('pointerup', finishPointer);
                stage.addEventListener('pointercancel', finishPointer);
                stage.addEventListener('lostpointercapture', finishPointer);

                stage.addEventListener('keydown', (event) => {
                    const step = 48;
                    if (event.key === '+' || event.key === '=') { event.preventDefault(); setZoomPercent(zoomPercent + 25); }
                    else if (event.key === '-') { event.preventDefault(); setZoomPercent(zoomPercent - 25); }
                    else if (event.key === '0') { event.preventDefault(); fitToWindow(); }
                    else if (stage.classList.contains('is-pannable') && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                        event.preventDefault();
                        if (event.key === 'ArrowLeft') panX += step;
                        if (event.key === 'ArrowRight') panX -= step;
                        if (event.key === 'ArrowUp') panY += step;
                        if (event.key === 'ArrowDown') panY -= step;
                        render();
                    }
                });

                function onKeyDown(event) {
                    if (overlay.hidden) return;
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        closeLightbox();
                    }
                }
                document.addEventListener('keydown', onKeyDown);

                function closeLightbox() {
                    overlay.hidden = true;
                    image.removeAttribute('src');
                    image.style.width = '';
                    image.style.height = '';
                    pointers.clear();
                    dragStart = null;
                    pinchStart = null;
                    if (resizeObserver) resizeObserver.disconnect();
                    fitToWindow();
                    if (lightboxPreviousFocus && lightboxPreviousFocus.isConnected) lightboxPreviousFocus.focus();
                    lightboxPreviousFocus = null;
                }

                image.addEventListener('load', () => {
                    fitScale = measureFitScale();
                    zoomPercent = 0;
                    zoomScale = fitScale;
                    panX = 0;
                    panY = 0;
                    render();
                    stage.focus({ preventScroll: true });
                });

                resizeObserver = new ResizeObserver(() => {
                    if (overlay.hidden || !image.naturalWidth) return;
                    fitScale = measureFitScale();
                    zoomScale = scaleFromPercent(zoomPercent);
                    render();
                });
                resizeObserver.observe(stage);

                imageLightbox = { overlay, stage, image, close, closeLightbox, setZoomPercent };
                return imageLightbox;
            }

            window.__lhuOpenImageLightbox = (src, alt = 'Vergrößerte Ansicht') => {
                if (!src) return;
                const box = ensureImageLightbox();
                lightboxPreviousFocus = document.activeElement;
                box.image.alt = alt;
                box.overlay.hidden = false;
                box.image.src = src;
                box.close.focus({ preventScroll: true });
            };

            window.__lhuAttachImageZoom = (frame, img, label = 'Bild vergrößern', extraClass = '') => {
                if (!frame || !img) return null;
                let button = frame.querySelector(':scope > .lhu-image-zoom');
                if (button) return button;
                button = document.createElement('button');
                button.type = 'button';
                button.className = `lhu-image-zoom ${extraClass}`.trim();
                button.textContent = '🔍';
                button.setAttribute('aria-label', label);
                button.title = label;
                const syncButton = () => {
                    const loaded = Boolean(img.currentSrc || img.src) && img.complete && img.naturalWidth > 0 && img.getAttribute('aria-disabled') !== 'true';
                    button.disabled = !loaded;
                };
                img.addEventListener('load', syncButton);
                img.addEventListener('error', syncButton);
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    syncButton();
                    if (button.disabled) return;
                    window.__lhuOpenImageLightbox(img.currentSrc || img.src, img.alt || label);
                });
                frame.appendChild(button);
                syncButton();
                return button;
            };
            window.__lhuCloseImageLightbox = () => {
                if (imageLightbox && !imageLightbox.overlay.hidden) imageLightbox.closeLightbox();
            };

            const mainContent = document.getElementById('mainContent');
            const a11yStatus = document.getElementById('a11yStatus');
            let currentCategory = '';
            let vhsImageObserver = null;

            function announceCategory(cat) {
                if (a11yStatus) a11yStatus.textContent = `Kategorie ${cat} geladen`;
            }
            function showError(cat, targetPage) {
                mainContent.innerHTML = `
                    <div class="error-card">
                        <h3>Verbindung unterbrochen</h3>
                        <p>Konnte <strong>${cat}</strong> nicht laden (${targetPage}).<br>Netzwerk oder CORS-Blockade möglich.</p>
                        <button type="button" id="retry-btn">Erneut versuchen</button>
                    </div>
                `;
                const retry = document.getElementById('retry-btn');
                if (retry) retry.addEventListener('click', () => {
                    const prev = currentCategory;
                    currentCategory = '';
                    triggerCategoryChange(prev || cat);
                });
            }

            let categoryLoadToken = 0;
            let categoryTransitionTimer = null;
            let categoryFetchController = null;

            async function triggerCategoryChange(cat, options = {}) {
                if (!categoryPages[cat]) return;
                if (options.updateHistory !== false) writeCategoryRoute(cat, false);
                if (cat === currentCategory) return;

                const loadToken = ++categoryLoadToken;
                if (categoryTransitionTimer !== null) {
                    clearTimeout(categoryTransitionTimer);
                    categoryTransitionTimer = null;
                }
                if (categoryFetchController) {
                    categoryFetchController.abort();
                    categoryFetchController = null;
                }
                if (vhsImageObserver) {
                    vhsImageObserver.disconnect();
                    vhsImageObserver = null;
                }

                currentCategory = cat;
                window.__lhuCloseImageLightbox?.();
                runCleanups();

                const door = document.getElementById('door-overlay');
                if (!door) return;

                door.setAttribute('data-category', cat);
                door.classList.remove('open');
                door.classList.add('closed');

                document.querySelectorAll('.cat-item').forEach(item => {
                    const isActive = item.getAttribute('data-cat') === cat;
                    item.classList.toggle('active', isActive);
                    item.setAttribute('aria-current', isActive ? 'page' : 'false');
                });

                categoryTransitionTimer = window.setTimeout(async () => {
                    if (loadToken !== categoryLoadToken) return;
                    const targetPage = categoryPages[cat];
                    if (!targetPage) {
                        return;
                    }

                    // Die Tür bleibt während des Seitenladens geschlossen und übernimmt
                    // allein die Übergangsanimation. Der Hypno-Loader gehört nur zum Index.
                    const controller = new AbortController();
                    categoryFetchController = controller;

                    try {
                        const response = await fetch(targetPage, { signal: controller.signal });
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        const htmlText = await response.text();
                        if (loadToken !== categoryLoadToken) return;

                        const doc = new DOMParser().parseFromString(htmlText, 'text/html');
                        const fetchedMain = doc.querySelector('main') || doc.body;
                        if (!fetchedMain) throw new Error('Kein <main> gefunden');

                        mainContent.innerHTML = fetchedMain.innerHTML;

                        const lang = (navigator.language || 'en').startsWith('de') ? 'de' : 'en';
                        mainContent.querySelectorAll('[data-lang-en]').forEach(el => {
                            const text = el.getAttribute(`data-lang-${lang}`);
                            if (text) el.innerHTML = text;
                        });

                        Array.from(mainContent.querySelectorAll('script')).forEach(oldScript => {
                            const newScript = document.createElement('script');
                            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                            newScript.text = oldScript.text;
                            oldScript.parentNode.replaceChild(newScript, oldScript);
                        });

                        applyGlobalMute();

                        // ABOUT keeps all profile/story layouts, but uses the shared image viewer.
                        if (cat === 'ABOUT') {
                            mainContent.querySelectorAll('img:not(.transparent-sticker)').forEach(img => {
                                img.loading = 'lazy';
                                img.decoding = 'async';
                                let frame = img.closest('.lhu-image-frame');
                                if (!frame) {
                                    if (img.parentElement?.classList.contains('carousel-slide')) {
                                        frame = img.parentElement;
                                        frame.classList.add('lhu-image-frame', 'lhu-image-frame--carousel');
                                    } else if (img.parentElement?.tagName === 'A') {
                                        frame = img.parentElement;
                                        frame.classList.add('lhu-image-frame');
                                    } else {
                                        frame = document.createElement('div');
                                        frame.className = 'lhu-image-frame';
                                        img.parentNode.insertBefore(frame, img);
                                        frame.appendChild(img);
                                    }
                                }
                                window.__lhuAttachImageZoom(frame, img, `Bild vergrößern: ${img.alt || 'ABOUT'}`);
                            });
                        }

                        if (cat === 'VHS MULTIVERSE') {
                            const imgEl = mainContent.querySelector('#vhs-preview-img');
                            if (imgEl) {
                                const wrapper = imgEl.parentElement;
                                if (wrapper) {
                                    wrapper.classList.add('vhs-zoom-wrapper');
                                    window.__lhuAttachImageZoom(wrapper, imgEl, 'VHS-Cover vergrößern');
                                    imgEl.classList.add('vhs-wobble-img');
                                    const crtOverlay = document.createElement('div');
                                    crtOverlay.className = 'vhs-crt-overlay';
                                    wrapper.appendChild(crtOverlay);

                                    let isGlitching = false;
                                    let glitchTimeout = null;
                                    const vhsTrigger = () => {
                                        if (isGlitching) return;
                                        isGlitching = true;
                                        crtOverlay.classList.remove('active');
                                        void crtOverlay.offsetWidth;
                                        crtOverlay.classList.add('active');
                                        wrapper.classList.remove('glitching');
                                        void wrapper.offsetWidth;
                                        wrapper.classList.add('glitching');
                                        clearTimeout(glitchTimeout);
                                        glitchTimeout = setTimeout(() => {
                                            isGlitching = false;
                                            wrapper.classList.remove('glitching');
                                        }, 850);
                                    };

                                    vhsImageObserver = new MutationObserver((mutations) => {
                                        const sourceChanged = mutations.some(m =>
                                            (m.type === 'attributes' && m.attributeName === 'src') ||
                                            (m.type === 'childList' && [...m.addedNodes].some(n =>
                                                n.nodeType === 1 && (n.tagName === 'IMG' || n.querySelector?.('img'))
                                            ))
                                        );
                                        if (sourceChanged) vhsTrigger();
                                    });
                                    vhsImageObserver.observe(wrapper, {
                                        attributes: true,
                                        attributeFilter: ['src'],
                                        childList: true,
                                        subtree: true
                                    });
                                    window.__lhuRegisterCleanup(() => {
                                        if (vhsImageObserver) vhsImageObserver.disconnect();
                                        vhsImageObserver = null;
                                        clearTimeout(glitchTimeout);
                                    });
                                    setTimeout(vhsTrigger, 250);
                                }
                            }
                        }

                        if (loadToken !== categoryLoadToken) return;
                        announceCategory(cat);

                    } catch (err) {
                        if (err?.name !== 'AbortError' && loadToken === categoryLoadToken) {
                            console.warn('[LHU] load error', err);
                            showError(cat, targetPage);
                        }
                    } finally {
                        if (loadToken === categoryLoadToken) {
                            categoryFetchController = null;
                            categoryTransitionTimer = null;
                                        window.scrollTo(0, 0);
                            setTimeout(() => {
                                if (loadToken !== categoryLoadToken) return;
                                measure();
                                door.classList.remove('closed');
                                door.classList.add('open');
                            }, 150);
                        }
                    }
                }, 1200);
            }

            /* --------------------------------------------------------
               6. KATEGORIE STRIP AUFBAUEN
               -------------------------------------------------------- */
            const CATS = ['ABOUT', 'VHS MULTIVERSE', 'HUMANART', 'PROJECTS', 'STORYTIME', 'MUSIC', 'CONTACT', 'DONATE'];
            const strip = document.getElementById('catStrip');
            const track = document.getElementById('catTrack');

            const trackFragment = document.createDocumentFragment();
            for (let r = 0; r < 6; r++) {
                CATS.forEach(cat => {
                    const el = document.createElement('div');
                    el.className = 'cat-item';
                    el.setAttribute('data-cat', cat);
                    el.setAttribute('role', 'button');
                    el.setAttribute('tabindex', '0');
                    el.setAttribute('aria-label', `Kategorie ${cat} öffnen`);
                    el.innerHTML = `<span>${cat}</span>`;
                    el.addEventListener('click', () => triggerCategoryChange(cat));
                    el.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            triggerCategoryChange(cat);
                        }
                    });
                    trackFragment.appendChild(el);
                });
            }
            track.appendChild(trackFragment);

            /* --------------------------------------------------------
               7. PHYSIK & SLIDER
               -------------------------------------------------------- */
            let setW = 0, pos = 0;
            const sliderTrackEl = document.getElementById('sliderTrack');
            const sliderThumbEl = document.getElementById('sliderThumb');
            let sliderW = 0, thumbW = 0;

            function measure() {
                setW = track.scrollWidth / 6;
                if (sliderTrackEl) {
                    sliderW = sliderTrackEl.clientWidth;
                    thumbW = sliderThumbEl.clientWidth;
                }
            }
            function wrap() {
                if (setW > 0) { pos = pos % setW; if (pos > 0) pos -= setW; }
                else pos = 0;
            }

            const rgbColors = [
                { r: 255, g: 0, b: 0 }, { r: 255, g: 255, b: 0 }, { r: 0, g: 255, b: 0 },
                { r: 0, g: 255, b: 255 }, { r: 0, g: 0, b: 255 }, { r: 255, g: 0, b: 255 }
            ];
            let rgbProgress = 0;
            function updateRgbLamp(dt) {
                if (dt <= 0) return;
                rgbProgress = (rgbProgress + dt * 0.0004) % rgbColors.length;
                const index = Math.floor(rgbProgress);
                const nextIndex = (index + 1) % rgbColors.length;
                const factor = rgbProgress - index;
                const c1 = rgbColors[index], c2 = rgbColors[nextIndex];
                if (c1 && c2) {
                    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
                    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
                    const b = Math.round(c1.b + (c2.b - c1.b) * factor);
                    if (sliderThumbEl) sliderThumbEl.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
                }
                document.documentElement.style.setProperty('--dynamic-hue', `${rgbProgress * 60}deg`);
            }

            /* --------------------------------------------------------
               8. DOOR PHYSIK
               -------------------------------------------------------- */
            let wobbleTime = 0;
            function updateTilesSmooth(dt) {
                const door = document.getElementById('door-overlay');
                if (!door || door.classList.contains('open')) return;

                wobbleTime += dt * 0.001;
                let tx = 0, ty = 0, rot = 0, rotY = 0, sx = 1, sy = 1, skx = 0, filter = 'none';
                let t = 0;
                switch (currentCategory) {
                    case 'VHS MULTIVERSE':
                        t = wobbleTime * Math.PI * 2 / 0.6;
                        skx = Math.sin(t) * -8;
                        sx = 1 + Math.sin(t * 2) * 0.03;
                        sy = 1 + Math.cos(t * 2) * 0.03;
                        filter = `hue-rotate(${Math.sin(t) * 90}deg)`;
                        break;
                    case 'HUMANART':
                        t = wobbleTime * Math.PI * 2 / 1.2;
                        rot = Math.sin(t) * 5;
                        skx = Math.sin(t) * 3;
                        sx = 1 + Math.sin(t) * 0.05;
                        sy = 1 + Math.sin(t) * 0.05;
                        filter = `saturate(${1 + Math.max(0, Math.sin(t)) * 0.5})`;
                        break;
                    case 'PROJECTS':
                        t = wobbleTime * Math.PI * 2 / 0.8;
                        tx = Math.sin(t * 3) * 3;
                        ty = Math.cos(t * 4) * 2;
                        rot = Math.sin(t * 5) * 2;
                        sx = 1 + Math.max(0, Math.sin(t * 4)) * 0.03;
                        break;
                    case 'STORYTIME':
                        t = wobbleTime * Math.PI * 2 / 1.5;
                        ty = Math.sin(t) * -4;
                        rot = Math.sin(t) * -3;
                        skx = Math.sin(t) * 4;
                        break;
                    case 'MUSIC':
                        t = wobbleTime * Math.PI * 2 / 1.2;
                        rotY = Math.sin(t) * -18;
                        tx = Math.sin(t) * -3;
                        break;
                    case 'CONTACT':
                        t = wobbleTime * Math.PI * 2 / 0.5;
                        tx = Math.sin(t) * -2;
                        ty = Math.cos(t) * 2;
                        rot = Math.sin(t * 2) * -3;
                        break;
                    case 'DONATE':
                        t = wobbleTime * Math.PI * 2 / 0.8;
                        ty = -Math.abs(Math.sin(t)) * 8;
                        sx = 1 + Math.cos(t * 2) * 0.05;
                        sy = 1 - Math.cos(t * 2) * 0.05;
                        break;
                }
                door.style.setProperty('--t-tx', tx.toFixed(2) + 'px');
                door.style.setProperty('--t-ty', ty.toFixed(2) + 'px');
                door.style.setProperty('--t-rot', rot.toFixed(2) + 'deg');
                door.style.setProperty('--t-rotY', rotY.toFixed(2) + 'deg');
                door.style.setProperty('--t-sx', sx.toFixed(3));
                door.style.setProperty('--t-sy', sy.toFixed(3));
                door.style.setProperty('--t-skx', skx.toFixed(2) + 'deg');
                door.style.setProperty('--t-fil', filter);
            }

            /* --------------------------------------------------------
               9. DRAG INTERACTIONS
               -------------------------------------------------------- */
            let stripDragging = false, stripStartX = 0, stripLastX = 0, stripVelocity = 0, stripTimeDrag = 0;

            strip.addEventListener('mousedown', (e) => {
                if (e.target.closest('button')) return;
                stripDragging = true; stripVelocity = 0;
                stripStartX = e.clientX; stripLastX = stripStartX;
                stripTimeDrag = performance.now();
            });
            window.addEventListener('mousemove', (e) => {
                if (!stripDragging) return;
                const now = performance.now();
                const dt = now - stripTimeDrag;
                const delta = e.clientX - stripLastX;
                if (dt > 0) stripVelocity = delta / dt;
                pos += delta; wrap(); stripLastX = e.clientX; stripTimeDrag = now;
            }, { passive: true });
            window.addEventListener('mouseup', () => {
                if (stripDragging) {
                    stripDragging = false;
                    stripVelocity = Math.max(-2.5, Math.min(2.5, stripVelocity));
                }
            });

            strip.addEventListener('touchstart', (e) => {
                if (e.target.closest('button')) return;
                stripDragging = true; stripVelocity = 0;
                stripStartX = e.touches[0].clientX; stripLastX = stripStartX;
                stripTimeDrag = performance.now();
            }, { passive: true });
            window.addEventListener('touchmove', (e) => {
                if (!stripDragging) return;
                const now = performance.now();
                const dt = now - stripTimeDrag;
                const delta = e.touches[0].clientX - stripLastX;
                if (dt > 0) stripVelocity = delta / dt;
                pos += delta; wrap(); stripLastX = e.touches[0].clientX; stripTimeDrag = now;
            }, { passive: true });
            window.addEventListener('touchend', () => { stripDragging = false; });

            strip.addEventListener('keydown', (e) => {
                if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
                e.preventDefault();
                const dir = e.key === 'ArrowRight' ? 1 : -1;
                const idx = CATS.indexOf(currentCategory);
                const next = (idx + dir + CATS.length) % CATS.length;
                triggerCategoryChange(CATS[next]);
            });

            let sliderDragging = false;
            function updateSliderPos(clientX) {
                if (sliderW <= 0 || setW <= 0) return;
                const rect = sliderTrackEl.getBoundingClientRect();
                let offsetX = clientX - rect.left - (thumbW / 2);
                const maxThumbX = sliderW - thumbW;
                offsetX = Math.max(0, Math.min(maxThumbX, offsetX));
                const progress = maxThumbX > 0 ? (offsetX / maxThumbX) : 0;
                pos = -progress * setW; wrap();
            }
            sliderTrackEl.addEventListener('mousedown', (e) => { sliderDragging = true; updateSliderPos(e.clientX); });
            window.addEventListener('mousemove', (e) => { if (sliderDragging) updateSliderPos(e.clientX); });
            window.addEventListener('mouseup', () => { sliderDragging = false; });
            sliderTrackEl.addEventListener('touchstart', (e) => { sliderDragging = true; updateSliderPos(e.touches[0].clientX); }, { passive: true });
            window.addEventListener('touchmove', (e) => { if (sliderDragging) updateSliderPos(e.touches[0].clientX); }, { passive: true });
            window.addEventListener('touchend', () => { sliderDragging = false; });

            /* --------------------------------------------------------
               10. MAIN LOOP (mit Idle-Throttle)
               -------------------------------------------------------- */
            let lastTime = performance.now();
            let isTabVisible = true;
            let animationFrame = null;
            let idleSince = performance.now();
            let lastInteract = performance.now();

            ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(evt =>
                window.addEventListener(evt, () => { lastInteract = performance.now(); }, { passive: true })
            );

            function loop(time) {
                animationFrame = null;
                if (!time) time = performance.now();
                if (!isTabVisible || !document.body.classList.contains('site-mode')) return;

                let dt = time - lastTime;
                lastTime = time;
                if (dt > 100) dt = 16;
                if (dt < 0) dt = 0;

                // Idle-Throttle: wenn >3s keine Interaktion und Tür offen, auf 20fps reduzieren
                const idle = (time - lastInteract) > 3000;
                const doorOpen = document.getElementById('door-overlay')?.classList.contains('open');
                if (idle && doorOpen) {
                    if (idleSince === 0) idleSince = time;
                    if (time - idleSince < 50) { // 20fps
                        animationFrame = requestAnimationFrame(loop);
                        return;
                    }
                } else {
                    idleSince = 0;
                }

                updateRgbLamp(dt);
                updateTilesSmooth(dt);

                if (!stripDragging && !sliderDragging) {
                    if (Math.abs(stripVelocity) > 0.03) {
                        pos += stripVelocity * dt * 0.6;
                        stripVelocity *= 0.92;
                    } else {
                        stripVelocity = 0;
                        pos -= 0.015 * dt;
                    }
                }
                wrap();
                track.style.transform = `translateX(${pos}px)`;

                if (setW > 0 && sliderW > 0 && !sliderDragging) {
                    const progress = Math.abs(pos) / setW;
                    const maxThumbX = sliderW - thumbW;
                    sliderThumbEl.style.transform = `translateX(${progress * maxThumbX}px)`;
                }

                animationFrame = requestAnimationFrame(loop);
            }

            function startLoop() {
                if (animationFrame === null) animationFrame = requestAnimationFrame(loop);
            }
            function stopLoop() {
                if (animationFrame !== null) {
                    cancelAnimationFrame(animationFrame);
                    animationFrame = null;
                }
            }

            document.addEventListener('visibilitychange', () => {
                isTabVisible = !document.hidden;
                if (isTabVisible) {
                    lastTime = performance.now();
                    if (document.body.classList.contains('site-mode')) startLoop();
                } else {
                    stopLoop();
                }
            });

            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(measure, 150);
            });

            if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
            else measure();

            /* --------------------------------------------------------
               SINGLE-PAGE APP ENTRY
               index.html is now the shell host; ABOUT is the first view.
               -------------------------------------------------------- */
            let appEntered = false;
            window.__lhuEnterMainSite = function(options = {}) {
                if (appEntered) return;
                appEntered = true;
                const entryCategory = options.category || categoryFromLocation() || 'ABOUT';
                // The root URL is the visual intro. Once the user enters, normalize it to /about.
                writeCategoryRoute(entryCategory, true);

                if (typeof window.__lhuStopIntro === 'function') window.__lhuStopIntro(true);
                if (typeof window.__lhuPauseIndexExperience === 'function') window.__lhuPauseIndexExperience();
                if (typeof window.__lhuPauseMatrixBackground === 'function') window.__lhuPauseMatrixBackground();

                const indexExperience = document.getElementById('lhu-index-experience');
                if (indexExperience) indexExperience.hidden = true;

                const intro = document.getElementById('lhu-intro');
                if (intro) intro.remove();

                const indexMusic = document.getElementById('background-music');
                if (indexMusic) indexMusic.pause();

                document.body.classList.remove('intro-mode');
                document.body.classList.add('site-mode');

                const shell = document.getElementById('site-shell');
                if (shell) shell.hidden = false;

                applyGlobalMute();
                startLoop();
                triggerCategoryChange(entryCategory, { updateHistory: false });
            };

            // Direct links such as /projects load the requested content without requiring a menu page.
            const directCategory = categoryFromLocation();
            if (directCategory) window.__lhuEnterMainSite({ category: directCategory });

            function restoreCategoryFromLocation() {
                const targetCategory = categoryFromLocation();
                if (!targetCategory) return;
                if (!appEntered) {
                    window.__lhuEnterMainSite({ category: targetCategory });
                } else {
                    triggerCategoryChange(targetCategory, { updateHistory: false });
                }
            }
            window.addEventListener('popstate', restoreCategoryFromLocation);
            window.addEventListener('hashchange', restoreCategoryFromLocation);
        });
    