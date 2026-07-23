'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const COLORS = [
  null,
  '#4dd0e1', // I - cyan
  '#ffd54f', // O - yellow
  '#ba68c8', // T - purple
  '#81c784', // S - green
  '#e57373', // Z - red
  '#64b5f6', // J - pale blue
  '#ffb74d', // L - orange
  '#90a4ae', // Nut - gris metálico
];

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
  [[8,8,8],[8,0,8],[8,8,8]],                  // Nut - tuerca
];

const LINE_SCORES = [0, 100, 300, 500, 800];

// ---- Skins visuales ----
const SKIN_KEY = 'tetris-skin';

const NEON_COLORS = [
  null,
  '#00fff9', // I - cian neón
  '#faff00', // O - amarillo neón
  '#ff00ea', // T - magenta neón
  '#00ff6a', // S - verde neón
  '#ff2d55', // Z - rojo neón
  '#2d8bff', // J - azul neón
  '#ff9500', // L - naranja neón
  '#d0d0ff', // Nut - plata neón
];

const PASTEL_COLORS = [
  null,
  '#a8dee3', // I
  '#fff3b0', // O
  '#dcb8e0', // T
  '#bfe3c1', // S
  '#f2b8b5', // Z
  '#b8d4f0', // J
  '#f5cba7', // L
  '#d6d9dd', // Nut
];

function drawBlockRetro(context, x, y, colorIndex, size, alpha, palette) {
  const color = palette[colorIndex];
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  // highlight
  context.fillStyle = 'rgba(255,255,255,0.12)';
  context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  context.globalAlpha = 1;
}

function drawBlockNeon(context, x, y, colorIndex, size, alpha, palette) {
  const color = palette[colorIndex];
  const px = x * size + 2;
  const py = y * size + 2;
  const s = size - 4;
  context.globalAlpha = alpha ?? 1;

  // fondo oscuro del bloque para que el glow resalte
  context.shadowBlur = 0;
  context.fillStyle = '#050505';
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);

  // primera pasada: resplandor amplio
  context.shadowBlur = 18;
  context.shadowColor = color;
  context.fillStyle = color;
  context.fillRect(px, py, s, s);

  // segunda pasada: núcleo más nítido, resplandor menor
  context.shadowBlur = 8;
  context.fillRect(px + 1, py + 1, Math.max(0, s - 2), Math.max(0, s - 2));

  // reset para no "sangrar" sobre lo siguiente
  context.shadowBlur = 0;
  context.shadowColor = 'transparent';
  context.globalAlpha = 1;
}

function roundedRectPath(context, x, y, w, h, r) {
  if (typeof context.roundRect === 'function') {
    context.beginPath();
    context.roundRect(x, y, w, h, r);
    return;
  }
  // polyfill manual
  const rr = Math.min(r, w / 2, h / 2);
  context.beginPath();
  context.moveTo(x + rr, y);
  context.arcTo(x + w, y, x + w, y + h, rr);
  context.arcTo(x + w, y + h, x, y + h, rr);
  context.arcTo(x, y + h, x, y, rr);
  context.arcTo(x, y, x + w, y, rr);
  context.closePath();
}

function drawBlockPastel(context, x, y, colorIndex, size, alpha, palette) {
  const color = palette[colorIndex];
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  roundedRectPath(context, x * size + 2, y * size + 2, size - 4, size - 4, 6);
  context.fill();
  // highlight suave superior
  context.fillStyle = 'rgba(255,255,255,0.35)';
  roundedRectPath(context, x * size + 4, y * size + 4, size - 8, Math.max(0, size / 3), 4);
  context.fill();
  context.globalAlpha = 1;
}

function drawBlockPixel(context, x, y, colorIndex, size, alpha, palette) {
  const color = palette[colorIndex];
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);

  // textura de sub-píxeles 3x3 con variación de tono
  const n = 3;
  const cell = (size - 2) / n;
  const baseX = x * size + 1;
  const baseY = y * size + 1;
  for (let ry = 0; ry < n; ry++) {
    for (let rx = 0; rx < n; rx++) {
      // patrón determinista tipo sprite 8-bit: alterna claro/oscuro
      const shade = (rx + ry) % 2 === 0 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)';
      context.fillStyle = shade;
      context.fillRect(baseX + rx * cell, baseY + ry * cell, cell, cell);
    }
  }
  // borde de contraste tipo sprite
  context.strokeStyle = 'rgba(0,0,0,0.35)';
  context.lineWidth = 1;
  context.strokeRect(x * size + 1.5, y * size + 1.5, size - 3, size - 3);
  context.globalAlpha = 1;
}

const SKINS = {
  retro: { palette: COLORS, boardBg: null, drawBlock: drawBlockRetro },
  neon: { palette: NEON_COLORS, boardBg: '#000000', drawBlock: drawBlockNeon },
  pastel: { palette: PASTEL_COLORS, boardBg: null, drawBlock: drawBlockPastel },
  pixel: { palette: COLORS, boardBg: null, drawBlock: drawBlockPixel },
};

let currentSkin = 'retro';

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const restartBtn = document.getElementById('restart-btn');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeText = document.getElementById('theme-text');
const skinSelect = document.getElementById('skin-select');
const pauseOverlay = document.getElementById('pause-overlay');
const resumeBtn = document.getElementById('resume-btn');
const pauseRestartBtn = document.getElementById('pause-restart-btn');
const toggleControlsBtn = document.getElementById('toggle-controls-btn');
const pauseControlsList = document.getElementById('pause-controls-list');
const startLevelSelect = document.getElementById('start-level-select');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const resetRecordsBtn = document.getElementById('reset-records-btn');
const gameoverExtra = document.getElementById('gameover-extra');
const nameEntry = document.getElementById('name-entry');
const nameInput = document.getElementById('name-input');
const saveScoreBtn = document.getElementById('save-score-btn');
const startHsList = document.getElementById('start-highscores-list');
const startHsStats = document.getElementById('start-highscores-stats');
const overlayHsList = document.getElementById('overlay-highscores-list');
const overlayHsStats = document.getElementById('overlay-highscores-stats');

const THEME_KEY = 'tetris-theme';
const START_LEVEL_KEY = 'tetris-start-level';
const HS_KEY = 'tetris-highscores';
const MAX_SCORES = 5;

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId, startLevel, maxCombo;

function getThemeVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  themeIcon.textContent = theme === 'light' ? '☀️' : '🌙';
  themeText.textContent = theme === 'light' ? 'Light' : 'Dark';
  themeToggle.setAttribute('aria-pressed', theme === 'light');
  localStorage.setItem(THEME_KEY, theme);
  if (board) {
    draw();
    drawNext();
  }
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  applyTheme(saved === 'light' ? 'light' : 'dark');
}

themeToggle.addEventListener('click', () => {
  applyTheme(document.body.dataset.theme === 'light' ? 'dark' : 'light');
});

function applySkin(name) {
  if (!SKINS[name]) name = 'retro';
  currentSkin = name;
  document.body.dataset.skin = name;
  if (skinSelect) skinSelect.value = name;
  localStorage.setItem(SKIN_KEY, name);
  if (board) {
    draw();
    drawNext();
  }
}

function initSkin() {
  const saved = localStorage.getItem(SKIN_KEY);
  applySkin(SKINS[saved] ? saved : 'retro');
}

if (skinSelect) {
  skinSelect.addEventListener('change', () => {
    applySkin(skinSelect.value);
  });
}

function dropIntervalForLevel(lvl) {
  return Math.max(100, 1000 - (lvl - 1) * 90);
}

function initStartLevel() {
  const saved = parseInt(localStorage.getItem(START_LEVEL_KEY), 10);
  startLevel = saved >= 1 && saved <= 10 ? saved : 1;
  startLevelSelect.value = String(startLevel);
}

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece() {
  const type = Math.floor(Math.random() * 8) + 1;
  const shape = PIECES[type].map(row => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

function collide(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      return;
    }
  }
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    level = Math.floor(lines / 10) + 1;
    dropInterval = dropIntervalForLevel(level);
    if (cleared > maxCombo) maxCombo = cleared;
    updateHUD();
  }
}

function ghostY() {
  let gy = current.y;
  while (!collide(current.shape, current.x, gy + 1)) gy++;
  return gy;
}

function hardDrop() {
  const gy = ghostY();
  score += (gy - current.y) * 2;
  current.y = gy;
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    score += 1;
    updateHUD();
  } else {
    lockPiece();
  }
}

function lockPiece() {
  merge();
  clearLines();
  spawn();
}

function spawn() {
  current = next;
  next = randomPiece();
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
  drawNext();
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  const skin = SKINS[currentSkin] || SKINS.retro;
  skin.drawBlock(context, x, y, colorIndex, size, alpha, skin.palette);
}

function drawGrid() {
  ctx.strokeStyle = getThemeVar('--grid-line');
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function draw() {
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const skin = SKINS[currentSkin] || SKINS.retro;
  if (skin.boardBg) {
    ctx.fillStyle = skin.boardBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  drawGrid();

  // board
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, c, r, board[r][c], BLOCK);

  // ghost
  const gy = ghostY();
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);

  // current piece
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK);
}

function drawNext() {
  const NB = 30;
  nextCtx.shadowBlur = 0;
  nextCtx.shadowColor = 'transparent';
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const skin = SKINS[currentSkin] || SKINS.retro;
  if (skin.boardBg) {
    nextCtx.fillStyle = skin.boardBg;
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  }
  const shape = next.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
}

function loadHighscores() {
  try {
    const raw = localStorage.getItem(HS_KEY);
    if (!raw) return { scores: [], bestCombo: 0, maxLines: 0 };
    const data = JSON.parse(raw);
    return {
      scores: Array.isArray(data.scores) ? data.scores : [],
      bestCombo: data.bestCombo || 0,
      maxLines: data.maxLines || 0,
    };
  } catch (e) {
    return { scores: [], bestCombo: 0, maxLines: 0 };
  }
}

function saveHighscores(data) {
  localStorage.setItem(HS_KEY, JSON.stringify(data));
}

function qualifies(s, scores) {
  return s > 0 && (scores.length < MAX_SCORES || s > scores[scores.length - 1].score);
}

function renderHighscores(listEl, statsEl, highlightIndex) {
  const data = loadHighscores();
  listEl.innerHTML = '';
  if (data.scores.length === 0) {
    const li = document.createElement('li');
    li.className = 'hs-empty';
    li.textContent = 'Sin records todavía';
    listEl.appendChild(li);
  } else {
    data.scores.forEach((entry, i) => {
      const li = document.createElement('li');
      if (i === highlightIndex) li.classList.add('hs-highlight');
      const rank = document.createElement('span');
      rank.textContent = `${i + 1}. ${entry.name}`;
      const sc = document.createElement('span');
      sc.textContent = entry.score.toLocaleString();
      li.appendChild(rank);
      li.appendChild(sc);
      listEl.appendChild(li);
    });
  }
  statsEl.textContent = `Mejor combo: ${data.bestCombo} · Líneas máx: ${data.maxLines}`;
}

function resetRecords() {
  if (!window.confirm('¿Resetear todos los records?')) return;
  localStorage.removeItem(HS_KEY);
  renderHighscores(startHsList, startHsStats, -1);
  renderHighscores(overlayHsList, overlayHsStats, -1);
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);
  overlayTitle.textContent = 'GAME OVER';
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()}`;

  const data = loadHighscores();
  data.bestCombo = Math.max(data.bestCombo, maxCombo);
  data.maxLines = Math.max(data.maxLines, lines);
  saveHighscores(data);

  gameoverExtra.classList.remove('hidden');

  if (qualifies(score, data.scores)) {
    nameEntry.classList.remove('hidden');
    nameInput.value = '';
    renderHighscores(overlayHsList, overlayHsStats, -1);
    overlay.classList.remove('hidden');
    nameInput.focus();
  } else {
    nameEntry.classList.add('hidden');
    renderHighscores(overlayHsList, overlayHsStats, -1);
  }

  overlay.classList.remove('hidden');
}

function saveScore() {
  const data = loadHighscores();
  let name = nameInput.value.trim().slice(0, 8);
  if (!name) name = '---';
  data.scores.push({ name, score, lines });
  data.scores.sort((a, b) => b.score - a.score);
  data.scores = data.scores.slice(0, MAX_SCORES);
  saveHighscores(data);
  const idx = data.scores.findIndex(e => e.name === name && e.score === score && e.lines === lines);
  renderHighscores(overlayHsList, overlayHsStats, idx);
  nameEntry.classList.add('hidden');
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  if (!paused) {
    pauseOverlay.classList.add('hidden');
    dropAccum = 0;
    lastTime = performance.now();
    loop(lastTime);
  } else {
    cancelAnimationFrame(animId);
    pauseOverlay.classList.remove('hidden');
  }
}

function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;
  dropAccum += dt;
  if (dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
    }
  }
  draw();
  if (gameOver) return;
  animId = requestAnimationFrame(loop);
}

function init() {
  board = createBoard();
  score = 0;
  lines = 0;
  level = startLevel;
  paused = false;
  gameOver = false;
  dropInterval = dropIntervalForLevel(level);
  dropAccum = 0;
  maxCombo = 0;
  lastTime = performance.now();
  next = randomPiece();
  spawn();
  updateHUD();
  overlay.classList.add('hidden');
  pauseOverlay.classList.add('hidden');
  startScreen.classList.add('hidden');
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

function showStartScreen() {
  renderHighscores(startHsList, startHsStats, -1);
  startScreen.classList.remove('hidden');
}

document.addEventListener('keydown', e => {
  if (!board) return;
  if (e.code === 'KeyP' || e.code === 'Escape') { togglePause(); return; }
  if (paused || gameOver) return;
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) current.x--;
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) current.x++;
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      tryRotate();
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
  }
  updateHUD();
});

restartBtn.addEventListener('click', init);
startBtn.addEventListener('click', () => {
  startScreen.classList.add('hidden');
  init();
});
resetRecordsBtn.addEventListener('click', resetRecords);
saveScoreBtn.addEventListener('click', saveScore);
nameInput.addEventListener('keydown', e => {
  if (e.code === 'Enter') saveScore();
});

resumeBtn.addEventListener('click', () => {
  if (paused) togglePause();
});

pauseRestartBtn.addEventListener('click', () => {
  pauseOverlay.classList.add('hidden');
  init();
});

toggleControlsBtn.addEventListener('click', () => {
  const willShow = pauseControlsList.classList.contains('hidden');
  pauseControlsList.classList.toggle('hidden', !willShow);
  toggleControlsBtn.setAttribute('aria-expanded', String(willShow));
  toggleControlsBtn.textContent = willShow ? 'Ocultar controles' : 'Ver controles';
});

startLevelSelect.addEventListener('change', () => {
  startLevel = parseInt(startLevelSelect.value, 10) || 1;
  localStorage.setItem(START_LEVEL_KEY, String(startLevel));
});

initTheme();
initStartLevel();
initSkin();
showStartScreen();
