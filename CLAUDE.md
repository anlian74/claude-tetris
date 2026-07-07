# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Ejecución

No hay build, bundler, tests ni `package.json`. Para probar cambios:

- Directo: `open index.html` (macOS).
- Servidor estático (recomendado, evita restricciones de `file://`): `python3 -m http.server 8000` → `http://localhost:8000`.

No hay suite de tests ni linter; la verificación es manual en el navegador.

## Arquitectura

Tetris en JavaScript vanilla + Canvas 2D, sin frameworks ni dependencias.

- `index.html` — DOM: `<canvas id="board">` (300×600) y `<canvas id="next-canvas">`, panel
  (`#score`, `#lines`, `#level`) y overlay (`#overlay`, `#overlay-title`, `#overlay-score`, `#restart-btn`).
- `style.css` — estética dark/retro arcade.
- `game.js` — toda la lógica en un solo archivo, sin módulos.

### Claves de `game.js`

- **Estado** en variables de módulo (`board`, `current`, `next`, `score`, `level`, `dropInterval`…);
  `init()` las (re)inicializa y arranca el bucle.
- **Tablero**: matriz `ROWS × COLS`; cada celda es `0` (vacía) o índice 1–7 en `COLORS`/`PIECES`.
- **Piezas**: matrices cuadradas; rotación CW por transposición+reverso (`rotateCW`), con wall kicks
  ±1/±2 en `tryRotate`.
- **Bucle**: `requestAnimationFrame` en `loop()`, acumula `dt` y baja una fila al superar `dropInterval`.
- **Pipeline de bloqueo**: `lockPiece()` → `merge()` → `clearLines()` → `spawn()`; si `spawn()` colisiona al aparecer → `endGame()`.
- **Acoplamiento al DOM por ID**: `game.js` lee los elementos por `getElementById`. Cambiar un `id`
  en `index.html` rompe el juego sin error visible.

### Al modificar dimensiones

`COLS`, `ROWS`, `BLOCK` están al inicio de `game.js`. Si cambian, ajustar también `width`/`height`
del `<canvas id="board">` en `index.html` (`COLS×BLOCK` × `ROWS×BLOCK`).
