
        /* ============================================================
           MENU SCRIPT v2.0
           ============================================================ */
        document.addEventListener('DOMContentLoaded', () => {

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
                'ABOUT':         '01_about.html',
                'VHS MULTIVERSE':'02_vhsmultiverse.html',
                'HUMANART':      '03_humanart.html',
                'PROJECTS':      '04_projects.html',
                'STORYTIME':     '05_storytime.html',
                'MUSIC':         '06_music.html',
                'CONTACT':       '07_contact.html',
                'DONATE':        '08_donate.html'
            };
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

            const mainContent = document.getElementById('mainContent');
            const loadingEl = document.getElementById('loading');
            const a11yStatus = document.getElementById('a11yStatus');
            let currentCategory = '';
            let vhsImageObserver = null;

            function showLoading(show) { loadingEl.classList.toggle('show', show); }
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

            async function triggerCategoryChange(cat) {
                if (cat === currentCategory) return;
                currentCategory = cat;

                // Cleanup vor Swap
                runCleanups();

                const door = document.getElementById('door-overlay');
                if (!door) return;

                door.setAttribute('data-category', cat);
                door.classList.remove('open');
                door.classList.add('closed');

                // Aktive Kategorie markieren
                document.querySelectorAll('.cat-item').forEach(item => {
                    const isActive = item.getAttribute('data-cat') === cat;
                    item.classList.toggle('active', isActive);
                    item.setAttribute('aria-current', isActive ? 'true' : 'false');
                });

                showLoading(true);

                setTimeout(async () => {
                    const targetPage = categoryPages[cat];
                    if (!targetPage) { showLoading(false); return; }

                    try {
                        const response = await fetch(targetPage);
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);

                        const htmlText = await response.text();
                        const doc = new DOMParser().parseFromString(htmlText, 'text/html');
                        const fetchedMain = doc.querySelector('main') || doc.body;

                        if (!fetchedMain) throw new Error('Kein <main> gefunden');

                        // Content SWAP
                        mainContent.innerHTML = fetchedMain.innerHTML;

                        // Sprache anwenden
                        const lang = (navigator.language || 'en').startsWith('de') ? 'de' : 'en';
                        mainContent.querySelectorAll('[data-lang-en]').forEach(el => {
                            const text = el.getAttribute(`data-lang-${lang}`);
                            if (text) el.innerHTML = text;
                        });

                        // Scripts re-executieren
                        Array.from(mainContent.querySelectorAll('script')).forEach(oldScript => {
                            const newScript = document.createElement('script');
                            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                            newScript.text = oldScript.text;
                            oldScript.parentNode.replaceChild(newScript, oldScript);
                        });

                        applyGlobalMute();

                        // Zoom-Wrapper
                        const noZoomCats = ['HUMANART', 'STORYTIME', 'MUSIC', 'CONTACT', 'DONATE'];
                        if (!noZoomCats.includes(cat)) {
                            mainContent.querySelectorAll('img:not(.transparent-sticker)').forEach(img => {
                                if (img) { img.loading = 'lazy'; img.decoding = 'async'; }
                                if (img.parentElement.tagName !== 'A') {
                                    const wrapper = document.createElement('a');
                                    wrapper.href = img.src;
                                    wrapper.target = '_blank';
                                    wrapper.rel = 'noopener noreferrer';
                                    wrapper.className = 'zoom-wrapper';
                                    img.parentNode.insertBefore(wrapper, img);
                                    wrapper.appendChild(img);
                                } else {
                                    img.parentElement.classList.add('zoom-wrapper');
                                    if (!img.parentElement.target) img.parentElement.target = '_blank';
                                }
                            });
                        }

                        // VHS-Glitch
                        if (cat === 'VHS MULTIVERSE') {
                            const imgEl = mainContent.querySelector('.zoom-wrapper img') || mainContent.querySelector('img');
                            if (imgEl) {
                                const wrapper = imgEl.closest('.zoom-wrapper') || imgEl.parentElement;
                                if (wrapper) {
                                    wrapper.classList.add('vhs-zoom-wrapper');
                                    imgEl.classList.add('vhs-wobble-img');

                                    const crtOverlay = document.createElement('div');
                                    crtOverlay.className = 'vhs-crt-overlay';
                                    wrapper.appendChild(crtOverlay);

                                    let isGlitching = false, glitchTimeout = null;
                                    const vhsTrigger = () => {
                                        const currentImg = wrapper.querySelector('img');
                                        if (currentImg && !currentImg.classList.contains('vhs-wobble-img')) {
                                            currentImg.classList.add('vhs-wobble-img');
                                        }
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
                                        let should = false;
                                        for (const m of mutations) {
                                            if (m.type === 'attributes' && m.attributeName === 'src') should = true;
                                            if (m.type === 'childList') {
                                                for (const n of m.addedNodes) {
                                                    if (n.nodeType === 1 && (n.tagName === 'IMG' || (n.querySelector && n.querySelector('img')))) should = true;
                                                }
                                            }
                                        }
                                        if (should) vhsTrigger();
                                    });
                                    vhsImageObserver.observe(wrapper, {
                                        attributes: true, attributeFilter: ['src'],
                                        childList: true, subtree: true
                                    });
                                    setTimeout(vhsTrigger, 250);
                                }
                            }
                        }

                        announceCategory(cat);

                    } catch (err) {
                        console.warn('[LHU] load error', err);
                        showError(cat, targetPage);
                    } finally {
                        showLoading(false);
                        window.scrollTo(0, 0);
                        setTimeout(() => {
                            measure();
                            door.classList.remove('closed');
                            door.classList.add('open');
                        }, 150);
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
            window.__lhuEnterMainSite = function() {
                if (appEntered) return;
                appEntered = true;

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
                triggerCategoryChange('ABOUT');
            };
        });
    