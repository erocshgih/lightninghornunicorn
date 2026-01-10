// MATRIX BACKGROUND EFFECT
const canvas = document.getElementById('matrix-bg');
const ctx = canvas.getContext('2d');
const BASE_FONT_SIZE = 26, NUM_SEVENS = 140;
let sevens = [], centerX, centerY;

function makeSeven() {
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  if (edge === 0) x = Math.random() * canvas.width, y = -20;
  else if (edge === 1) x = canvas.width + 20, y = Math.random() * canvas.height;
  else if (edge === 2) x = Math.random() * canvas.width, y = canvas.height + 20;
  else x = -20, y = Math.random() * canvas.height;
  return { x, y, life: 0, speed: 0.008 + Math.random() * 0.015 };
}

function resizeMatrix() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  centerX = canvas.width / 2;
  centerY = canvas.height / 2;
  sevens = Array.from({ length: NUM_SEVENS }, makeSeven);
}

function drawMatrix() {
  ctx.fillStyle = 'rgba(0, 10, 40, 0.3)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let s of sevens) {
    s.life += s.speed;
    if (s.life >= 1) Object.assign(s, makeSeven());
    const dx = centerX - s.x, dy = centerY - s.y;
    s.x += dx * s.speed * 2;
    s.y += dy * s.speed * 2;
    const fontSize = BASE_FONT_SIZE * (1 - s.life * 0.7);
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = `rgba(0,120,255,${0.2 + (1 - s.life) * 0.8})`;
    ctx.fillText('7', s.x, s.y);
  }
  requestAnimationFrame(drawMatrix);
}

window.addEventListener('resize', resizeMatrix);
resizeMatrix();
drawMatrix();
