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

const COLORS_NEON = [
  null,
  '#00e5ff', // I - cian neón
  '#fff700', // O - amarillo neón
  '#e040fb', // T - magenta neón
  '#00ff7f', // S - verde neón
  '#ff1744', // Z - rojo neón
  '#2979ff', // J - azul neón
  '#ff9100', // L - naranja neón
  '#b0bec5', // Nut - gris neón
];

const COLORS_PASTEL = [
  null,
  '#a8e6e6', // I
  '#fff2b2', // O
  '#dcb8e6', // T
  '#c2e8c2', // S
  '#f4b6b6', // Z
  '#b8d4f0', // J
  '#ffd9ae', // L
  '#d6dde2', // Nut
];

const LINE_SCORES = [0, 100, 300, 500, 800];

const SKIN_KEY = 'tetris-skin';
let activeSkin = 'retro';

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
const startScreen = document.getElementById('start-screen');
const playBtn = document.getElementById('play-btn');
const resetRecordsBtn = document.getElementById('reset-records-btn');
const startHighscoreListEl = document.getElementById('start-highscore-list');
const startStatsComboEl = document.getElementById('start-stats-combo');
const startStatsLinesEl = document.getElementById('start-stats-lines');
const overlayRecords = document.getElementById('overlay-records');
const highscoreListEl = document.getElementById('highscore-list');
const statsComboEl = document.getElementById('stats-combo');
const statsLinesEl = document.getElementById('stats-lines');
const saveScoreBox = document.getElementById('save-score');
const nameInput = document.getElementById('name-input');
const saveScoreBtn = document.getElementById('save-score-btn');
const pauseMenu = document.getElementById('pause-menu');
const resumeBtn = document.getElementById('resume-btn');
const pauseRestartBtn = document.getElementById('pause-restart-btn');
const toggleControlsBtn = document.getElementById('toggle-controls-btn');
const pauseControls = document.getElementById('pause-controls');
const startLevelSelect = document.getElementById('start-level-select');

const THEME_KEY = 'tetris-theme';
const HIGHSCORES_KEY = 'tetris-highscores';
const BEST_COMBO_KEY = 'tetris-best-combo';
const MAX_LINES_KEY = 'tetris-max-lines';
const START_LEVEL_KEY = 'tetris-start-level';
const MIN_START_LEVEL = 1;
const MAX_START_LEVEL = 15;

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId, startLevel;
let highscores, bestCombo, maxLines, comboCount;

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

function applySkin(skin) {
  if (!SKINS[skin]) skin = 'retro';
  activeSkin = skin;
  skinSelect.value = skin;
  localStorage.setItem(SKIN_KEY, skin);
  if (board) {
    draw();
    drawNext();
  }
}

function initSkin() {
  const saved = localStorage.getItem(SKIN_KEY);
  applySkin(saved && SKINS[saved] ? saved : 'retro');
}

skinSelect.addEventListener('change', () => {
  applySkin(skinSelect.value);
});

function loadHighscores() {
  try {
    const saved = JSON.parse(localStorage.getItem(HIGHSCORES_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function initRecords() {
  highscores = loadHighscores();
  bestCombo = Number(localStorage.getItem(BEST_COMBO_KEY)) || 0;
  maxLines = Number(localStorage.getItem(MAX_LINES_KEY)) || 0;
}

function qualifiesForHighscore(candidateScore) {
  if (candidateScore <= 0) return false;
  return highscores.length < 5 || candidateScore > highscores[highscores.length - 1].score;
}

function saveHighscore(name, finalScore) {
  highscores.push({ name, score: finalScore });
  highscores.sort((a, b) => b.score - a.score);
  highscores = highscores.slice(0, 5);
  localStorage.setItem(HIGHSCORES_KEY, JSON.stringify(highscores));
  return highscores.findIndex(e => e.name === name && e.score === finalScore);
}

function resetRecords() {
  localStorage.removeItem(HIGHSCORES_KEY);
  localStorage.removeItem(BEST_COMBO_KEY);
  localStorage.removeItem(MAX_LINES_KEY);
  highscores = [];
  bestCombo = 0;
  maxLines = 0;
  renderAllRecords();
}

function renderHighscoreTable(listEl, highlightIndex) {
  listEl.innerHTML = '';
  if (!highscores.length) {
    const li = document.createElement('li');
    li.textContent = 'Sin registros';
    li.className = 'empty';
    listEl.appendChild(li);
    return;
  }
  highscores.forEach((entry, i) => {
    const li = document.createElement('li');
    li.textContent = `${i + 1}. ${entry.name} — ${entry.score.toLocaleString()}`;
    if (i === highlightIndex) li.classList.add('highlight');
    listEl.appendChild(li);
  });
}

function renderStats(comboEl, linesEl) {
  comboEl.textContent = `Mejor combo: ${bestCombo}`;
  linesEl.textContent = `Líneas máx.: ${maxLines}`;
}

function renderAllRecords(highlightIndex) {
  renderHighscoreTable(startHighscoreListEl);
  renderStats(startStatsComboEl, startStatsLinesEl);
  renderHighscoreTable(highscoreListEl, highlightIndex);
  renderStats(statsComboEl, statsLinesEl);
}

playBtn.addEventListener('click', () => {
  startScreen.classList.add('hidden');
  init();
});

resetRecordsBtn.addEventListener('click', resetRecords);

saveScoreBtn.addEventListener('click', () => {
  const name = (nameInput.value.trim() || 'JUGADOR').slice(0, 12);
  const idx = saveHighscore(name, score);
  renderAllRecords(idx);
  saveScoreBox.classList.add('hidden');
});

function applyStartLevel(value) {
  startLevel = Math.min(MAX_START_LEVEL, Math.max(MIN_START_LEVEL, value));
  startLevelSelect.value = String(startLevel);
  localStorage.setItem(START_LEVEL_KEY, String(startLevel));
}

function initStartLevel() {
  for (let n = MIN_START_LEVEL; n <= MAX_START_LEVEL; n++) {
    const opt = document.createElement('option');
    opt.value = String(n);
    opt.textContent = String(n);
    startLevelSelect.appendChild(opt);
  }
  const saved = parseInt(localStorage.getItem(START_LEVEL_KEY), 10);
  applyStartLevel(Number.isInteger(saved) ? saved : MIN_START_LEVEL);
}

startLevelSelect.addEventListener('change', () => {
  applyStartLevel(parseInt(startLevelSelect.value, 10));
});

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
    dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    updateHUD();
  }
  return cleared;
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
  const cleared = clearLines();
  if (cleared) {
    comboCount++;
    if (comboCount > bestCombo) {
      bestCombo = comboCount;
      localStorage.setItem(BEST_COMBO_KEY, String(bestCombo));
    }
  } else {
    comboCount = 0;
  }
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

function drawBlockRetro(context, x, y, colorIndex, size, alpha, colors) {
  const color = colors[colorIndex];
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  // highlight
  context.fillStyle = 'rgba(255,255,255,0.12)';
  context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  context.globalAlpha = 1;
}

function drawBlockNeon(context, x, y, colorIndex, size, alpha, colors) {
  const color = colors[colorIndex];
  context.globalAlpha = alpha ?? 1;
  context.shadowBlur = 14;
  context.shadowColor = color;
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  context.shadowBlur = 0;
  // highlight sutil
  context.fillStyle = 'rgba(255,255,255,0.18)';
  context.fillRect(x * size + 1, y * size + 1, size - 2, 3);
  context.globalAlpha = 1;
}

function drawBlockPastel(context, x, y, colorIndex, size, alpha, colors) {
  const color = colors[colorIndex];
  const px = x * size + 1;
  const py = y * size + 1;
  const w = size - 2;
  const h = size - 2;
  const radius = Math.min(6, w / 3, h / 3);
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  context.beginPath();
  if (context.roundRect) {
    context.roundRect(px, py, w, h, radius);
  } else {
    // fallback manual con quadraticCurveTo
    context.moveTo(px + radius, py);
    context.lineTo(px + w - radius, py);
    context.quadraticCurveTo(px + w, py, px + w, py + radius);
    context.lineTo(px + w, py + h - radius);
    context.quadraticCurveTo(px + w, py + h, px + w - radius, py + h);
    context.lineTo(px + radius, py + h);
    context.quadraticCurveTo(px, py + h, px, py + h - radius);
    context.lineTo(px, py + radius);
    context.quadraticCurveTo(px, py, px + radius, py);
    context.closePath();
  }
  context.fill();
  // highlight
  context.fillStyle = 'rgba(255,255,255,0.25)';
  context.fillRect(px, py, w, 4);
  context.globalAlpha = 1;
}

function drawBlockPixel(context, x, y, colorIndex, size, alpha, colors) {
  const color = colors[colorIndex];
  const px = x * size + 1;
  const py = y * size + 1;
  const w = size - 2;
  const h = size - 2;
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  context.fillRect(px, py, w, h);
  // highlight
  context.fillStyle = 'rgba(255,255,255,0.12)';
  context.fillRect(px, py, w, 4);
  // textura tipo pixel-art: rejilla 4x4 de puntos más oscuros
  context.fillStyle = 'rgba(0,0,0,0.18)';
  const cells = 4;
  const cw = w / cells;
  const ch = h / cells;
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if ((r + c) % 2 === 0) {
        context.fillRect(px + c * cw, py + r * ch, cw, ch);
      }
    }
  }
  context.globalAlpha = 1;
}

const SKINS = {
  retro: { colors: COLORS, draw: drawBlockRetro },
  neon: { colors: COLORS_NEON, draw: drawBlockNeon },
  pastel: { colors: COLORS_PASTEL, draw: drawBlockPastel },
  pixel: { colors: COLORS, draw: drawBlockPixel },
};

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  const skin = SKINS[activeSkin] || SKINS.retro;
  skin.draw(context, x, y, colorIndex, size, alpha, skin.colors);
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
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
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const shape = next.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);
  if (lines > maxLines) {
    maxLines = lines;
    localStorage.setItem(MAX_LINES_KEY, String(maxLines));
  }
  overlayTitle.textContent = 'GAME OVER';
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()}`;
  overlayRecords.classList.remove('hidden');
  renderAllRecords();
  if (qualifiesForHighscore(score)) {
    saveScoreBox.classList.remove('hidden');
    nameInput.value = '';
    nameInput.focus();
  } else {
    saveScoreBox.classList.add('hidden');
  }
  overlay.classList.remove('hidden');
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  if (!paused) {
    pauseMenu.classList.add('hidden');
    lastTime = performance.now();
    loop(lastTime);
  } else {
    cancelAnimationFrame(animId);
    pauseControls.classList.add('hidden');
    toggleControlsBtn.setAttribute('aria-expanded', 'false');
    pauseMenu.classList.remove('hidden');
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
  comboCount = 0;
  dropInterval = Math.max(100, 1000 - (level - 1) * 90);
  dropAccum = 0;
  lastTime = performance.now();
  next = randomPiece();
  spawn();
  updateHUD();
  overlay.classList.add('hidden');
  saveScoreBox.classList.add('hidden');
  overlayRecords.classList.add('hidden');
  pauseMenu.classList.add('hidden');
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
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

resumeBtn.addEventListener('click', togglePause);
pauseRestartBtn.addEventListener('click', init);
toggleControlsBtn.addEventListener('click', () => {
  const hidden = pauseControls.classList.toggle('hidden');
  toggleControlsBtn.setAttribute('aria-expanded', String(!hidden));
});

initTheme();
initSkin();
initRecords();
initStartLevel();
renderAllRecords();
