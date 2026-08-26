/* ============================================
   LIGHTNING HORN UNICORN – INTERACTIVE SCRIPTS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ========== THEME TOGGLE ========== */
  const THEMES = ['light', 'dark', 'mono-gray', 'mono-green', 'crt'];
  const THEME_ICONS = {
    'light': '\u2600',
    'dark': '\u263e',
    'mono-gray': '\u2591',
    'mono-green': '\u2593',
    'crt': '\u25a4'
  };
  const themeBtn = document.getElementById('themeToggle');

  function safeGetTheme() {
    try { return localStorage.getItem('lhu-theme'); } catch (e) { return null; }
  }

  function safeSetTheme(value) {
    try { localStorage.setItem('lhu-theme', value); } catch (e) {}
  }

  function getInitialTheme() {
    const saved = safeGetTheme();
    if (saved && THEMES.includes(saved)) return saved;
    return 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    safeSetTheme(theme);
    if (themeBtn) {
      themeBtn.textContent = THEME_ICONS[theme] || '\u2600';
      themeBtn.title = 'Modus: ' + theme + ' (klicken zum Wechseln)';
    }
  }

  let currentTheme = getInitialTheme();
  applyTheme(currentTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const idx = THEMES.indexOf(currentTheme);
      currentTheme = THEMES[(idx + 1) % THEMES.length];
      applyTheme(currentTheme);
    });
  }

  /* ========== DOOR TRANSITION ========== */
  let _doorBusy = false;
  const doorPanel = document.querySelector('#door-overlay .door-panel');

  function switchSection(sectionId) {
    const door = document.getElementById('door-overlay');
    door.classList.remove('open');
    door.classList.add('closed');
    setTimeout(() => {
      door.classList.remove('closed');
      door.classList.add('open');
      _doorBusy = false;
    }, 1420);
  }

  /* ========== CATEGORY STRIP (endless loop) ========== */
  const CATS = ['ABOUT', 'VHS MULTIVERSE', 'HUMANART', 'PROJECTS', 'STORYTIME', 'MUSIC', 'CONTACT', 'DONATE'];
  const CAT_LINKS = {
    'ABOUT': '../LightningHornUnicorn.html',
    'VHS MULTIVERSE': '../vhs/vhs.html',
    'HUMANART': '../humanart/humanart.html',
    'PROJECTS': '../projects/projects.html',
    'STORYTIME': null,
    'MUSIC': '../music/music.html',
    'CONTACT': '../contact/contact.html',
    'DONATE': '../donate/donate.html'
  };
  const LASER_SPEEDS = [0.5, 0.65, 0.8, 0.95, 1.1, 1.25, 1.4, 1.55];
  const strip = document.getElementById('catStrip');
  const track = document.getElementById('catTrack');

  if (strip && track) {
    const REPEAT = 6;
    const allItems = [];
    for (let r = 0; r < REPEAT; r++) {
      CATS.forEach((cat) => {
        const el = document.createElement('div');
        el.className = 'cat-item';
        el.dataset.cat = cat;
        el.textContent = cat;
        el.addEventListener('click', () => selectCat(cat, el));
        track.appendChild(el);
        allItems.push({ cat, el });
      });
    }

    let setW = 0;
    function measure() { setW = track.scrollWidth / REPEAT; }

    let pos = 0;
    const SPEED = 0.3;

    function wrap() {
      if (setW > 0) {
        while (pos <= -setW) pos += setW;
        while (pos > 0) pos -= setW;
      }
    }

    function setX(px) { track.style.transform = 'translateX(' + px + 'px)'; }

    function loop() {
      const r = strip.getBoundingClientRect();
      const visible = r.bottom > 0 && r.top < window.innerHeight;
      if (visible && !dragging) {
        pos -= SPEED;
        wrap();
        setX(pos);
      }
      requestAnimationFrame(loop);
    }

    function selectCat(cat, el) {
      const link = CAT_LINKS[cat];
      if (link !== null) {
        window.location.href = link;
        return;
      }
      allItems.forEach(i => i.el.classList.remove('active'));
      allItems.forEach(i => { if (i.cat === cat) i.el.classList.add('active'); });
      const idx = CATS.indexOf(cat);
      if (idx >= 0) {
        const s = LASER_SPEEDS[idx] + 's';
        const d2 = LASER_SPEEDS[idx] + 's';
        const d3 = (LASER_SPEEDS[idx] * 2) + 's';
        const l1 = document.querySelector('.laser-1');
        const l2 = document.querySelector('.laser-2');
        const l3 = document.querySelector('.laser-3');
        if (l1) { l1.style.animationDuration = s; }
        if (l2) { l2.style.animationDuration = s; l2.style.animationDelay = d2; }
        if (l3) { l3.style.animationDuration = s; l3.style.animationDelay = d3; }
      }
      switchSection(cat);
    }

    let dragging = false, startX = 0, startPos = 0;

    function down(e) {
      if (e.target && (e.target.id === 'themeToggle' || e.target.closest('#themeToggle'))) return;
      dragging = true;
      startX = (e.touches ? e.touches[0].clientX : e.clientX);
      startPos = pos;
    }

    function move(e) {
      if (!dragging) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      const dx = x - startX;
      pos = startPos + dx;
      wrap();
      setX(pos);
      e.preventDefault();
    }

    function up() { dragging = false; }

    strip.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    strip.addEventListener('touchstart', down, { passive: false });
    strip.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    window.addEventListener('resize', () => { measure(); wrap(); setX(pos); });
    window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { measure(); wrap(); setX(pos); });
    }

    measure();
    allItems.forEach(i => { if (i.cat === 'STORYTIME') i.el.classList.add('active'); });
    loop();
  }

  /* ========== LANGUAGE SWITCH ========== */
  const lang = (navigator.language || 'en').startsWith('de') ? 'de' : 'en';
  document.querySelectorAll('[data-lang-en]').forEach(el => {
    const text = el.getAttribute('data-lang-' + lang);
    if (text) el.innerHTML = text;
  });

  /* ========== INITIAL DOOR STATE ========== */
  if (doorPanel) {
    doorPanel.style.backgroundImage = "url('../pixelart_storytimepic.png')";
    doorPanel.style.backgroundSize = 'calc(100vw / 4) auto';
  }

  setTimeout(() => {
    const door = document.getElementById('door-overlay');
    if (door) {
      door.classList.remove('closed');
      door.classList.add('open');
    }
    _doorBusy = false;
  }, 400);

  // --- Static high-res noise texture for content areas ---
  (function generateNoise() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 256;
    const imageData = ctx.createImageData(256, 256);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = 30 + Math.random() * 60;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 80;
    }
    ctx.putImageData(imageData, 0, 0);
    const url = canvas.toDataURL();
    document.querySelectorAll('#chapter-header, .chapter-section').forEach(el => {
      el.style.backgroundImage = `url(${url})`;
      el.style.backgroundRepeat = 'repeat';
    });
  })();

  // --- Sound toggle ---
  const muteBtn = document.createElement('button');
  muteBtn.className = 'mute-btn muted';
  muteBtn.textContent = '\u266B';
  muteBtn.title = 'Toggle ambient sound';
  const headerEl = document.getElementById('chapter-header');
  if (headerEl) { headerEl.prepend(muteBtn); } else { document.body.prepend(muteBtn); }

  let audioCtx = null;
  let soundOn = false;

  // --- Dub Drum Pattern: meditative, low-frequency ---
  const BPM = 68;
  const STEP = 60000 / BPM / 2; // 8th note = ~441ms

  function makeKick(ctx, time) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.9, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(time); osc.stop(time + 0.4);
  }

  function makeTom(ctx, time, freq) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, time + 0.3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.7, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(time); osc.stop(time + 0.35);
  }

  function makeRim(ctx, time) {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(time); osc.stop(time + 0.06);
  }

  function makeShaker(ctx, time) {
    const len = Math.floor(ctx.sampleRate * 0.08);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 300;
    const g = ctx.createGain();
    g.gain.value = 0.15;
    src.connect(lp); lp.connect(g); g.connect(ctx.destination);
    src.start(time);
  }

  function makeClave(ctx, time) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 450;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.25, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(time); osc.stop(time + 0.1);
  }

  const pattern = [
    'K', '', 'S', '',  'K', '', 'S', '',  '', 'T', 'S', '',  '', '', 'S', '',
    'K', '', 'S', '',  '', '', 'S', '',  '', 'T', 'S', '',  'K', '', 'S', '',
    'K', '', 'S', '',  'K', '', 'S', '',  '', '', 'S', '',  '', 'T', 'S', '',
    'K', '', 'S', '',  '', '', 'S', '',  'T', '', 'S', '',  '', '', 'S', '',
    'K', '', 'S', '',  'K', '', 'S', '',  '', 'T', 'S', '',  '', '', 'S', '',
    'K', '', 'S', '',  '', '', 'S', '',  '', '', 'S', '',  'K', 'T', 'S', '',
    'K', '', 'S', '',  'K', '', 'S', '',  '', 'T', 'S', '',  '', '', 'S', '',
    '', '', 'S', '',  '', '', 'S', '',  'T', '', 'S', '',  'K', '', '', '',
  ];

  let drumCtx = null;
  let drumPlaying = false;
  let drumTimeout = null;

  function scheduleDrumLoop() {
    if (!drumPlaying) return;
    const now = drumCtx.currentTime;
    pattern.forEach((hit, i) => {
      const t = now + i * (STEP / 1000);
      if (hit === 'K') makeKick(drumCtx, t);
      else if (hit === 'T') makeTom(drumCtx, t, 80 + Math.random() * 20);
      else if (hit === 'R') makeRim(drumCtx, t);
      else if (hit === 'S') makeShaker(drumCtx, t);
      else if (hit === 'C') makeClave(drumCtx, t);
    });
    drumTimeout = setTimeout(scheduleDrumLoop, pattern.length * STEP - 50);
  }

  function startDrums() {
    if (drumPlaying) return;
    drumCtx = new (window.AudioContext || window.webkitAudioContext)();
    drumPlaying = true;
    scheduleDrumLoop();
  }

  function stopDrums() {
    drumPlaying = false;
    if (drumTimeout) clearTimeout(drumTimeout);
    if (drumCtx) { try { drumCtx.close(); } catch(e) {} drumCtx = null; }
  }

  muteBtn.onclick = () => { drumPlaying ? stopDrums() : startDrums(); };

  // --- Page-turn sound ---
  function playPageTurn() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const bufSize = ctx.sampleRate * 0.15;
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 3);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 2000;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    } catch(e) {}
  }

  // Attach page-turn to all nav links
  document.querySelectorAll('.chapter-topnav a, .chapter-nav a, .nav-btn').forEach(el => {
    el.addEventListener('click', () => playPageTurn());
  });

  // --- Chapter card stagger animation ---
  document.querySelectorAll('.chapter-card').forEach((card, i) => {
    card.style.animationDelay = `${i * 0.08}s`;
  });

  // --- Language toggle (for chapter pages) ---
  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      const en = document.getElementById('english-version');
      const de = document.getElementById('german-version');
      if (en && de) {
        const isEnglish = en.style.display !== 'none';
        en.style.display = isEnglish ? 'none' : 'block';
        de.style.display = isEnglish ? 'block' : 'none';
        langToggle.textContent = isEnglish ? 'ENGLISH' : 'DEUTSCH';
      }
    });
  }

  // --- Typing effect for hero subtitle ---
  const subtitle = document.querySelector('.landing-subtitle');
  if (subtitle) {
    const text = subtitle.textContent;
    subtitle.textContent = '';
    subtitle.style.borderRight = '2px solid var(--neon-cyan)';
    let i = 0;
    function typeChar() {
      if (i < text.length) {
        subtitle.textContent += text[i];
        i++;
        setTimeout(typeChar, 50 + Math.random() * 50);
      } else {
        // Blink cursor
        setInterval(() => {
          subtitle.style.borderRight = subtitle.style.borderRight === 'none'
            ? '2px solid var(--neon-cyan)' : 'none';
        }, 500);
      }
    }
    setTimeout(typeChar, 800);
  }

  // --- Easter egg: Konami code ---
  const konamiCode = [38,38,40,40,37,39,37,39,66,65];
  let konamiIndex = 0;
  document.addEventListener('keydown', (e) => {
    if (e.keyCode === konamiCode[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiCode.length) {
        document.body.style.animation = 'rgbShift 0.5s infinite';
        setTimeout(() => { document.body.style.animation = ''; }, 3000);
        konamiIndex = 0;
      }
    } else {
      konamiIndex = 0;
    }
  });

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});
