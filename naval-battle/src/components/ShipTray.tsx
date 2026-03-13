import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { DragState, ShipData } from "../app/gameState";

interface ShipTrayProps {
  ships: ShipData[];
  dragState: DragState | null;
  onShipPointerDown: (shipId: string, event: ReactPointerEvent<HTMLButtonElement>) => void;
}

export default function ShipTray({ ships, dragState, onShipPointerDown }: ShipTrayProps) {
  return (
    <section className="panel-card ship-tray">
      <div className="section-copy">
        <h3>舰船库</h3>
        <p>轻触旋转方向，拖动到棋盘完成布阵。</p>
      </div>

      <div className="ship-list">
        {ships.map((ship) => (
          <button
            key={ship.id}
            type="button"
            className={`ship-card${ship.placed ? " is-placed" : ""}${
              dragState?.shipId === ship.id ? " is-dragging" : ""
            }`}
            onPointerDown={(event) => onShipPointerDown(ship.id, event)}
            style={{ "--ship-accent": ship.accent } as CSSProperties}
          >
            <div className="ship-card-top">
              <strong>{ship.name}</strong>
              <span>{ship.placed ? "已布置" : "待布置"}</span>
            </div>
            <div className={`ship-preview ${ship.horizontal ? "horizontal" : "vertical"}`}>
              {Array.from({ length: ship.length }, (_, index) => (
                <span key={`${ship.id}-${index}`} />
              ))}
            </div>
            <div className="ship-card-meta">
              <span>长度 {ship.length}</span>
              <span>{ship.horizontal ? "横向" : "纵向"}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
