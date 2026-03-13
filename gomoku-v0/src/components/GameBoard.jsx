import { useEffect, useRef } from "react";

const PADDING = 28;

function drawBoard(ctx, size, board, winningLine, hoverCell) {
  const width = ctx.canvas.clientWidth;
  const height = ctx.canvas.clientHeight;
  const playable = Math.min(width, height) - PADDING * 2;
  const gap = playable / (size - 1);
  const start = (width - playable) / 2;
  const end = start + playable;

  ctx.clearRect(0, 0, width, height);

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#efe2b4");
  bg.addColorStop(1, "#d0a96f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(123, 82, 35, 0.08)";
  for (let i = 0; i < width; i += 12) {
    ctx.fillRect(i, 0, 1, height);
  }

  ctx.strokeStyle = "rgba(59, 34, 16, 0.82)";
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 1) {
    const offset = start + gap * i;
    ctx.beginPath();
    ctx.moveTo(start, offset);
    ctx.lineTo(end, offset);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(offset, start);
    ctx.lineTo(offset, end);
    ctx.stroke();
  }

  const stars = [
    [3, 3],
    [7, 7],
    [11, 11],
    [3, 11],
    [11, 3]
  ];
  ctx.fillStyle = "#3a2212";
  stars.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(start + x * gap, start + y * gap, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  if (hoverCell && board[hoverCell.y][hoverCell.x] === 0) {
    const cx = start + hoverCell.x * gap;
    const cy = start + hoverCell.y * gap;
    ctx.fillStyle = "rgba(20, 84, 126, 0.15)";
    ctx.beginPath();
    ctx.arc(cx, cy, gap * 0.38, 0, Math.PI * 2);
    ctx.fill();
  }

  if (winningLine?.length) {
    const first = winningLine[0];
    const last = winningLine[winningLine.length - 1];
    ctx.strokeStyle = "#f25c2a";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(start + first.x * gap, start + first.y * gap);
    ctx.lineTo(start + last.x * gap, start + last.y * gap);
    ctx.stroke();
  }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const stone = board[y][x];
      if (!stone) {
        continue;
      }

      const cx = start + x * gap;
      const cy = start + y * gap;
      const radius = gap * 0.4;
      const gradient = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.45,
        radius * 0.18,
        cx,
        cy,
        radius
      );

      if (stone === 1) {
        gradient.addColorStop(0, "#7f7f7f");
        gradient.addColorStop(1, "#0f0f0f");
      } else {
        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(1, "#c9ccd3");
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = stone === 1 ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.18)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function getCanvasMetrics(canvas, boardSize) {
  const rect = canvas.getBoundingClientRect();
  const playable = Math.min(rect.width, rect.height) - PADDING * 2;
  const gap = playable / (boardSize - 1);
  const startX = (rect.width - playable) / 2;
  const startY = (rect.height - playable) / 2;
  return { rect, startX, startY, gap };
}

function GameBoard({ snapshot, onPlaceStone }) {
  const canvasRef = useRef(null);
  const hoverCellRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawBoard(
        context,
        snapshot.boardSize,
        snapshot.board,
        snapshot.result?.winningLine,
        hoverCellRef.current
      );
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [snapshot.board, snapshot.boardSize, snapshot.result]);

  const resolveCell = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const { rect, startX, startY, gap } = getCanvasMetrics(canvas, snapshot.boardSize);
    const x = Math.round((event.clientX - rect.left - startX) / gap);
    const y = Math.round((event.clientY - rect.top - startY) / gap);
    if (x < 0 || y < 0 || x >= snapshot.boardSize || y >= snapshot.boardSize) {
      return null;
    }
    return { x, y };
  };

  const redraw = (hoverCell = null) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    hoverCellRef.current = hoverCell;
    const context = canvas.getContext("2d");
    drawBoard(
      context,
      snapshot.boardSize,
      snapshot.board,
      snapshot.result?.winningLine,
      hoverCell
    );
  };

  const handlePointerMove = (event) => {
    redraw(resolveCell(event));
  };

  const handlePointerLeave = () => {
    redraw(null);
  };

  const handleClick = (event) => {
    const cell = resolveCell(event);
    if (cell) {
      onPlaceStone(cell.x, cell.y);
    }
  };

  return (
    <div className="board-wrap">
      <div className="board-heading">
        <div>
          <span className="label">模式</span>
          <strong>{snapshot.modeLabel}</strong>
        </div>
        <div>
          <span className="label">对局进度</span>
          <strong>{snapshot.moveHistory.length} / 225</strong>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="board-canvas"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      />
    </div>
  );
}

export default GameBoard;
