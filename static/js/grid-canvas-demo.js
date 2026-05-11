(function () {
  const GRID = 20;
  const TICK_MS = 150;
  const TOTAL_OBJETIVOS = 15;

  const canvas = document.getElementById("grid-canvas");
  const startOverlay = document.getElementById("game-start-overlay");
  const playBtn = document.getElementById("game-play-btn");
  const winOverlay = document.getElementById("game-win-overlay");
  const winBtn = document.getElementById("game-win-btn");
  const loseOverlay = document.getElementById("game-lose-overlay");
  const loseBtn = document.getElementById("game-lose-btn");

  if (!canvas?.getContext || !startOverlay || !playBtn) return;

  const ctx = canvas.getContext("2d");

  let cellW = 20;
  let cellH = 20;

  const mid = Math.floor(GRID / 2);
  /** @type {{ col: number, row: number }[]} */
  let snake = [{ col: mid, row: mid }];
  /** Dirección en celdas por tick: x = columnas, y = filas */
  let direction = { x: 1, y: 0 };

  let gameInterval = null;
  let playing = false;

  let piezasComidas = 0;
  /** @type {{ col: number, row: number }} */
  let objetivoActual = { col: 0, row: 0 };
  /** @type {{ col: number, row: number }[]} */
  let listaObjetivos = [];
  let indiceObjetivo = 0;

  let estadoVictoria = false;
  let winBlinkVisible = true;
  /** @type {ReturnType<typeof setInterval> | null} */
  let winBlinkIntervalId = null;

  function clearWinBlink() {
    if (winBlinkIntervalId !== null) {
      clearInterval(winBlinkIntervalId);
      winBlinkIntervalId = null;
    }
    winBlinkVisible = true;
  }

  function resetSnake() {
    const c = Math.floor(GRID / 2);
    snake = [{ col: c, row: c }];
    direction = { x: 1, y: 0 };
  }

  function celdaEnSnake(col, row) {
    return snake.some((s) => s.col === col && s.row === row);
  }

  function celdaAleatoria() {
    return {
      col: Math.floor(Math.random() * GRID),
      row: Math.floor(Math.random() * GRID),
    };
  }

  /**
   * 15 coordenadas únicas que no solapan la serpiente actual al generar la lista.
   */
  function generarListaObjetivos() {
    const list = [];
    const used = new Set();
    while (list.length < TOTAL_OBJETIVOS) {
      const p = celdaAleatoria();
      const key = `${p.col},${p.row}`;
      if (used.has(key) || celdaEnSnake(p.col, p.row)) continue;
      used.add(key);
      list.push(p);
    }
    return list;
  }

  /**
   * Si la coordenada de la lista cae sobre el cuerpo, busca una celda vacía al azar.
   */
  function posicionObjetivoSegura(candidato) {
    let p = { col: candidato.col, row: candidato.row };
    let intentos = 0;
    while (celdaEnSnake(p.col, p.row) && intentos < 400) {
      p = celdaAleatoria();
      if (!celdaEnSnake(p.col, p.row)) break;
      intentos++;
    }
    while (celdaEnSnake(p.col, p.row)) {
      p = celdaAleatoria();
    }
    return p;
  }

  function iniciarObjetivosPartida() {
    piezasComidas = 0;
    indiceObjetivo = 0;
    listaObjetivos = generarListaObjetivos();
    objetivoActual = posicionObjetivoSegura(listaObjetivos[0]);
  }

  function stopLoop() {
    if (gameInterval !== null) {
      clearInterval(gameInterval);
      gameInterval = null;
    }
  }

  function startLoop() {
    stopLoop();
    gameInterval = setInterval(update, TICK_MS);
  }

  function ganarJuego() {
    playing = false;
    estadoVictoria = true;
    stopLoop();
    clearWinBlink();
    winBlinkIntervalId = setInterval(() => {
      winBlinkVisible = !winBlinkVisible;
      draw();
    }, 380);
    if (winOverlay) {
      winOverlay.hidden = false;
      winOverlay.setAttribute("aria-hidden", "false");
    }
    draw();
  }

  function startGame() {
    if (playing) return;
    estadoVictoria = false;
    clearWinBlink();
    if (winOverlay) {
      winOverlay.hidden = true;
      winOverlay.setAttribute("aria-hidden", "true");
    }
    if (loseOverlay) {
      loseOverlay.hidden = true;
      loseOverlay.setAttribute("aria-hidden", "true");
    }
    playing = true;
    startOverlay.hidden = true;
    startOverlay.setAttribute("aria-hidden", "true");
    resetSnake();
    iniciarObjetivosPartida();
    draw();
    startLoop();
  }

  /**
   * @param {"pared" | "cuerpo"} motivo — overlay de aliento solo en choque consigo misma (`cuerpo`).
   */
  function endGame(motivo) {
    playing = false;
    estadoVictoria = false;
    clearWinBlink();
    stopLoop();
    resetSnake();
    piezasComidas = 0;
    listaObjetivos = [];
    if (winOverlay) {
      winOverlay.hidden = true;
      winOverlay.setAttribute("aria-hidden", "true");
    }

    if (motivo === "cuerpo" && loseOverlay) {
      loseOverlay.hidden = false;
      loseOverlay.setAttribute("aria-hidden", "false");
      startOverlay.hidden = true;
      startOverlay.setAttribute("aria-hidden", "true");
    } else {
      if (loseOverlay) {
        loseOverlay.hidden = true;
        loseOverlay.setAttribute("aria-hidden", "true");
      }
      startOverlay.hidden = false;
      startOverlay.setAttribute("aria-hidden", "false");
    }

    draw();
  }

  function onPlay(ev) {
    ev.stopPropagation();
    startGame();
  }

  playBtn.addEventListener("click", onPlay);
  playBtn.addEventListener("pointerdown", onPlay);

  winBtn?.addEventListener("click", onPlay);
  winBtn?.addEventListener("pointerdown", onPlay);

  loseBtn?.addEventListener("click", onPlay);
  loseBtn?.addEventListener("pointerdown", onPlay);

  /**
   * Alto máximo del canvas (en coordenadas de diseño): lo más restrictivo entre
   * ancho del contenedor y 70 % de la ventana.
   */
  function maxCanvasHeight(parentWidth) {
    return Math.min(parentWidth, window.innerHeight * 0.7);
  }

  /**
   * Encaja un rectángulo 4:3 (ancho / alto) dentro de maxW × maxH.
   */
  function fit43(maxW, maxH) {
    let w = maxW;
    let h = (w * 3) / 4;
    if (h > maxH) {
      h = maxH;
      w = (h * 4) / 3;
    }
    return {
      w: Math.max(1, Math.floor(w)),
      h: Math.max(1, Math.floor(h)),
    };
  }

  function resizeCanvas() {
    const layoutRoot =
      canvas.closest(".game-placeholder") || canvas.parentElement;
    if (!layoutRoot) return;

    const parentWidth = layoutRoot.clientWidth;
    if (parentWidth <= 0) return;

    const maxH = maxCanvasHeight(parentWidth);
    const maxW = parentWidth;

    const boxRatio = maxW / maxH;
    let cw;
    let ch;

    if (boxRatio >= 4 / 3) {
      const r = fit43(maxW, maxH);
      cw = r.w;
      ch = r.h;
    } else {
      const side = Math.floor(Math.min(maxW, maxH));
      cw = side;
      ch = side;
    }

    canvas.width = cw;
    canvas.height = ch;

    cellW = canvas.width / GRID;
    cellH = canvas.height / GRID;

    if (!estadoVictoria) {
      resetSnake();
    }
    draw();
  }

  function pixelToGrid(localX, localY) {
    const col = Math.floor(localX / cellW);
    const row = Math.floor(localY / cellH);
    return {
      col: Math.max(0, Math.min(GRID - 1, col)),
      row: Math.max(0, Math.min(GRID - 1, row)),
    };
  }

  /**
   * clientX/clientY son relativos al viewport (como getBoundingClientRect):
   * el scroll ya está compensado al restar rect.left / rect.top.
   */
  function clientPointToGrid(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return null;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x = (clientX - rect.left) * scaleX;
    let y = (clientY - rect.top) * scaleY;

    x = Math.max(0, Math.min(canvas.width - Number.EPSILON, x));
    y = Math.max(0, Math.min(canvas.height - Number.EPSILON, y));

    return pixelToGrid(x, y);
  }

  /**
   * Compara diferencia de columnas vs filas con la cabeza; giro de 90°.
   * Bloqueo 180°: no invertir la marcha (choque consigo misma).
   */
  function applyDirectionTowardsClick(clickCol, clickRow) {
    const head = snake[0];
    const deltaCol = clickCol - head.col;
    const deltaRow = clickRow - head.row;

    if (deltaCol === 0 && deltaRow === 0) return;

    const diffHorizontal = Math.abs(deltaCol);
    const diffVertical = Math.abs(deltaRow);

    let next;
    if (diffHorizontal > diffVertical) {
      next = deltaCol > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
    } else if (diffVertical > diffHorizontal) {
      next = deltaRow > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
    } else {
      if (deltaCol !== 0) {
        next = deltaCol > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
      } else {
        next = deltaRow > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
      }
    }

    if (next.x === -direction.x && next.y === -direction.y) return;

    direction = next;
  }

  function steerFromClient(clientX, clientY) {
    if (!playing) return;
    const gridPos = clientPointToGrid(clientX, clientY);
    if (!gridPos) return;
    applyDirectionTowardsClick(gridPos.col, gridPos.row);
  }

  canvas.addEventListener("mousemove", (ev) => {
    steerFromClient(ev.clientX, ev.clientY);
  });

  canvas.addEventListener(
    "touchstart",
    (ev) => {
      if (!playing) return;
      ev.preventDefault();
      const t = ev.touches[0];
      if (!t) return;
      steerFromClient(t.clientX, t.clientY);
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchmove",
    (ev) => {
      if (!playing) return;
      ev.preventDefault();
      const t = ev.touches[0];
      if (!t) return;
      steerFromClient(t.clientX, t.clientY);
    },
    { passive: false }
  );

  /** Atraviesa los bordes: izquierda ↔ derecha, arriba ↔ abajo (toroidal). */
  function wrapCoord(v) {
    return ((v % GRID) + GRID) % GRID;
  }

  function update() {
    if (!playing) return;

    const head = snake[0];
    const nuevaCabeza = {
      col: wrapCoord(head.col + direction.x),
      row: wrapCoord(head.row + direction.y),
    };

    const come =
      nuevaCabeza.col === objetivoActual.col &&
      nuevaCabeza.row === objetivoActual.row;

    const limiteChoque = come ? snake.length : snake.length - 1;
    for (let i = 0; i < limiteChoque; i++) {
      if (snake[i].col === nuevaCabeza.col && snake[i].row === nuevaCabeza.row) {
        endGame("cuerpo");
        return;
      }
    }

    snake.unshift(nuevaCabeza);

    if (come) {
      piezasComidas++;
      if (piezasComidas >= TOTAL_OBJETIVOS) {
        ganarJuego();
        return;
      }
      indiceObjetivo++;
      objetivoActual = posicionObjetivoSegura(listaObjetivos[indiceObjetivo]);
    } else {
      snake.pop();
    }

    draw();
  }

  function dibujarObjetivo() {
    if (!playing || estadoVictoria || listaObjetivos.length === 0) return;

    ctx.fillStyle = "#ECCAF5";
    ctx.fillRect(
      objetivoActual.col * cellW,
      objetivoActual.row * cellH,
      cellW,
      cellH
    );
  }

  function draw() {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!estadoVictoria || winBlinkVisible) {
      ctx.fillStyle = "#ECCAF5";
      for (let s = 0; s < snake.length; s++) {
        const seg = snake[s];
        ctx.fillRect(seg.col * cellW, seg.row * cellH, cellW, cellH);
      }
    }

    dibujarObjetivo();
  }

  window.addEventListener("resize", resizeCanvas);

  resizeCanvas();
})();
