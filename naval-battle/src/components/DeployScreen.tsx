import { useEffect, useMemo, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { CellData, DragState, PreviewPlacement, ShipData } from "../app/gameState";
import { snapToCell } from "../utils/grid";
import BoardView from "./BoardView";
import ShipTray from "./ShipTray";

interface DeployScreenProps {
  board: CellData[][];
  ships: ShipData[];
  difficultyLabel: string;
  dragState: DragState | null;
  previewPlacement: PreviewPlacement | null;
  statusText: string;
  onBack: () => void;
  onRandom: () => void;
  onStart: () => void;
  onRotateShip: (shipId: string) => void;
  onStartDrag: (shipId: string, pointerId: number, clientX: number, clientY: number) => void;
  onMoveDrag: (cell: { x: number; y: number } | null) => void;
  onEndDrag: () => void;
}

interface PendingShipIntent {
  shipId: string;
  pointerId: number;
  startX: number;
  startY: number;
  dragging: boolean;
}

export default function DeployScreen({
  board,
  ships,
  difficultyLabel,
  dragState,
  previewPlacement,
  statusText,
  onBack,
  onRandom,
  onStart,
  onRotateShip,
  onStartDrag,
  onMoveDrag,
  onEndDrag,
}: DeployScreenProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const intentRef = useRef<PendingShipIntent | null>(null);
  const ready = useMemo(() => ships.every((ship) => ship.placed), [ships]);

  useEffect(() => {
    const moveThreshold = 8;

    function handlePointerMove(event: PointerEvent) {
      const intent = intentRef.current;
      if (!intent || event.pointerId !== intent.pointerId) {
        return;
      }

      if (!intent.dragging) {
        const distance = Math.hypot(event.clientX - intent.startX, event.clientY - intent.startY);
        if (distance < moveThreshold) {
          return;
        }

        intent.dragging = true;
        onStartDrag(intent.shipId, intent.pointerId, intent.startX, intent.startY);
      }

      if (!boardRef.current) {
        onMoveDrag(null);
        return;
      }

      const rect = boardRef.current.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      onMoveDrag(inside ? snapToCell(event.clientX, event.clientY, rect) : null);
    }

    function finishIntent(event: PointerEvent) {
      const intent = intentRef.current;
      if (!intent || event.pointerId !== intent.pointerId) {
        return;
      }

      if (intent.dragging) {
        onEndDrag();
      } else {
        onRotateShip(intent.shipId);
      }

      intentRef.current = null;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishIntent);
    window.addEventListener("pointercancel", finishIntent);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishIntent);
      window.removeEventListener("pointercancel", finishIntent);
    };
  }, [onEndDrag, onMoveDrag, onRotateShip, onStartDrag]);

  function handleShipPointerDown(shipId: string, event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    intentRef.current = {
      shipId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
    };
  }

  return (
    <section className="screen">
      <div className="top-actions spread">
        <button type="button" className="icon-button" onClick={onBack} aria-label="返回选择难度">
          ←
        </button>
        <div className="title-stack compact">
          <span>当前难度</span>
          <strong>{difficultyLabel}</strong>
        </div>
      </div>

      <div className="section-copy center">
        <h2>布置你的舰队</h2>
        <p>{statusText}</p>
      </div>

      <BoardView
        ref={boardRef}
        board={board}
        ships={ships}
        title="我方海域"
        subtitle={dragState ? "拖动中，松手即可放置" : "允许舰船相邻，但不能重叠"}
        previewPlacement={previewPlacement}
      />

      <ShipTray ships={ships} dragState={dragState} onShipPointerDown={handleShipPointerDown} />

      <div className="bottom-actions">
        <button type="button" className="secondary-button" onClick={onRandom}>
          随机布阵
        </button>
        <button type="button" className="primary-button" onClick={onStart} disabled={!ready}>
          开始对战
        </button>
      </div>
    </section>
  );
}
