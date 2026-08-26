/* ============================================
   LIGHTNING HORN UNICORN – INTERACTIVE SCRIPTS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

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
