import { forwardRef, useMemo, type CSSProperties } from "react";
import type { CellData, PreviewPlacement, ShipData } from "../app/gameState";
import { getShipCells } from "../core/RuleChecker";

interface BoardViewProps {
  board: CellData[][];
  ships?: ShipData[];
  title: string;
  subtitle?: string;
  hideShips?: boolean;
  active?: boolean;
  previewPlacement?: PreviewPlacement | null;
  onCellClick?: (x: number, y: number) => void;
}

function getFeedbackLabel(state: CellData["state"]) {
  if (state === "miss") {
    return "未命中";
  }
  if (state === "hit") {
    return "命中";
  }
  if (state === "sunk") {
    return "击沉";
  }
  return "海域";
}

const BoardView = forwardRef<HTMLDivElement, BoardViewProps>(function BoardView(
  {
    board,
    ships = [],
    title,
    subtitle,
    hideShips = false,
    active = false,
    previewPlacement = null,
    onCellClick,
  },
  ref,
) {
  const shipAccentMap = useMemo(
    () =>
      ships.reduce<Record<string, string>>((accumulator, ship) => {
        accumulator[ship.id] = ship.accent;
        return accumulator;
      }, {}),
    [ships],
  );

  const previewCells = useMemo(() => {
    if (!previewPlacement) {
      return new Set<string>();
    }

    const ship = ships.find((entry) => entry.id === previewPlacement.shipId);
    if (!ship) {
      return new Set<string>();
    }

    return new Set(
      getShipCells({
        ...ship,
        x: previewPlacement.x,
        y: previewPlacement.y,
        horizontal: previewPlacement.horizontal,
      }).map((cell) => `${cell.x}-${cell.y}`),
    );
  }, [previewPlacement, ships]);

  return (
    <section className={`board-shell${active ? " is-active" : ""}`}>
      <div className="board-head">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {active ? <span className="board-badge">可攻击</span> : null}
      </div>

      <div ref={ref} className="board-grid" role="grid" aria-label={title}>
        {board.flatMap((row) =>
          row.map((cell) => {
            const previewKey = `${cell.x}-${cell.y}`;
            const inPreview = previewCells.has(previewKey);
            const showShip = Boolean(cell.shipId && (!hideShips || cell.state !== "ship"));
            const buttonLabel = `${title} ${cell.x + 1} 列 ${cell.y + 1} 行 ${getFeedbackLabel(cell.state)}`;

            return (
              <button
                key={previewKey}
                type="button"
                className={[
                  "board-cell",
                  showShip ? "has-ship" : "",
                  cell.state !== "empty" ? `state-${cell.state}` : "",
                  inPreview ? "is-preview" : "",
                  inPreview && previewPlacement?.valid ? "preview-valid" : "",
                  inPreview && previewPlacement && !previewPlacement.valid ? "preview-invalid" : "",
                  active ? "is-clickable" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={
                  cell.shipId && shipAccentMap[cell.shipId]
                    ? ({ "--ship-accent": shipAccentMap[cell.shipId] } as CSSProperties)
                    : undefined
                }
                onClick={() => onCellClick?.(cell.x, cell.y)}
                disabled={!onCellClick}
                aria-label={buttonLabel}
              >
                <span className="cell-water" />
                {showShip ? <span className="cell-ship" /> : null}
                {cell.state === "miss" ? <span className="cell-mark miss">×</span> : null}
                {cell.state === "hit" ? <span className="cell-mark hit">!</span> : null}
                {cell.state === "sunk" ? <span className="cell-mark sunk">X</span> : null}
                {inPreview ? <span className="cell-preview" /> : null}
              </button>
            );
          }),
        )}
      </div>
    </section>
  );
});

export default BoardView;
