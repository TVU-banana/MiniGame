import { useEffect, useRef, useState } from "react";
import { BLACK, BOARD_SIZE, EMPTY, WHITE } from "../constants/game.js";

function getBoardMetrics(size) {
  const padding = Math.max(18, size * 0.06);
  const step = (size - padding * 2) / (BOARD_SIZE - 1);
  const stoneRadius = step * 0.42;
  return { padding, step, stoneRadius };
}

function drawStone(ctx, x, y, radius, player, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const gradient = ctx.createRadialGradient(
    x - radius * 0.35,
    y - radius * 0.35,
    radius * 0.2,
    x,
    y,
    radius,
  );

  if (player === BLACK) {
    gradient.addColorStop(0, "#777f96");
    gradient.addColorStop(0.28, "#27324c");
    gradient.addColorStop(1, "#0a0f1c");
  } else {
    gradient.addColorStop(0, "#fff7d8");
    gradient.addColorStop(0.32, "#fff0b3");
    gradient.addColorStop(1, "#cdbb75");
  }

  ctx.beginPath();
  ctx.fillStyle = gradient;
  ctx.shadowColor = "rgba(0, 0, 0, 0.36)";
  ctx.shadowBlur = radius * 0.55;
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function getLinePoint(metrics, point) {
  return {
    x: metrics.padding + point.x * metrics.step,
    y: metrics.padding + point.y * metrics.step,
  };
}

export default function GameBoard({ board, currentPlayer, isLocked, winningLine, lastMove, onPlaceStone }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const [size, setSize] = useState(0);
  const [hoverCell, setHoverCell] = useState(null);

  useEffect(() => {
    const element = frameRef.current;
    if (!element) {
      return undefined;
    }

    const updateSize = () => {
      const width = element.clientWidth;
      const nextSize = Math.max(280, Math.min(width, 760));
      setSize(nextSize);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const context = canvas.getContext("2d");
    const metrics = getBoardMetrics(size);

    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, size, size);

    const backgroundGradient = context.createLinearGradient(0, 0, size, size);
    backgroundGradient.addColorStop(0, "#f0c96b");
    backgroundGradient.addColorStop(1, "#cf8f2d");
    context.fillStyle = backgroundGradient;
    context.fillRect(0, 0, size, size);

    context.fillStyle = "rgba(255, 255, 255, 0.12)";
    context.fillRect(8, 8, size - 16, size - 16);

    context.strokeStyle = "rgba(71, 36, 4, 0.88)";
    context.lineWidth = 1;

    for (let index = 0; index < BOARD_SIZE; index += 1) {
      const offset = metrics.padding + index * metrics.step;

      context.beginPath();
      context.moveTo(metrics.padding, offset);
      context.lineTo(size - metrics.padding, offset);
      context.stroke();

      context.beginPath();
      context.moveTo(offset, metrics.padding);
      context.lineTo(offset, size - metrics.padding);
      context.stroke();
    }

    if (winningLine.length >= 2) {
      const start = getLinePoint(metrics, winningLine[0]);
      const end = getLinePoint(metrics, winningLine.at(-1));
      context.save();
      context.strokeStyle = "rgba(255, 70, 33, 0.95)";
      context.lineWidth = metrics.step * 0.32;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
      context.restore();
    }

    for (let y = 0; y < BOARD_SIZE; y += 1) {
      for (let x = 0; x < BOARD_SIZE; x += 1) {
        const player = board.grid[y][x];
        if (player === EMPTY) {
          continue;
        }

        const point = getLinePoint(metrics, { x, y });
        drawStone(context, point.x, point.y, metrics.stoneRadius, player);
      }
    }

    if (lastMove) {
      const point = getLinePoint(metrics, lastMove);
      context.save();
      context.beginPath();
      context.strokeStyle = lastMove.player === BLACK ? "#fef3c7" : "#111827";
      context.lineWidth = 2;
      context.arc(point.x, point.y, metrics.stoneRadius * 0.4, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }

    if (hoverCell && !isLocked && board.isEmpty(hoverCell.x, hoverCell.y)) {
      const point = getLinePoint(metrics, hoverCell);
      drawStone(context, point.x, point.y, metrics.stoneRadius, currentPlayer, 0.34);
    }
  }, [board, currentPlayer, hoverCell, isLocked, lastMove, size, winningLine]);

  function resolveCell(clientX, clientY) {
    const canvas = canvasRef.current;
    if (!canvas || !size) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    const metrics = getBoardMetrics(size);
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const x = Math.round((localX - metrics.padding) / metrics.step);
    const y = Math.round((localY - metrics.padding) / metrics.step);

    if (!board.isInside(x, y)) {
      return null;
    }

    const center = getLinePoint(metrics, { x, y });
    const distance = Math.hypot(localX - center.x, localY - center.y);

    if (distance > metrics.step * 0.48) {
      return null;
    }

    return { x, y };
  }

  function handlePointerMove(event) {
    const cell = resolveCell(event.clientX, event.clientY);
    setHoverCell(cell);
  }

  function handlePointerLeave() {
    setHoverCell(null);
  }

  function handlePointerDown(event) {
    event.preventDefault();
    const cell = resolveCell(event.clientX, event.clientY);
    if (!cell || isLocked) {
      return;
    }
    onPlaceStone(cell.x, cell.y);
  }

  return (
    <section className="board-shell">
      <div className="board-frame" ref={frameRef}>
        <canvas
          ref={canvasRef}
          className="board-canvas"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onPointerDown={handlePointerDown}
        />
      </div>
      <p className="board-tip">支持鼠标与触摸落子，移动端会自动缩放以完整展示 20×20 棋盘。</p>
    </section>
  );
}
