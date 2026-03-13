import type { AttackFeedback, CellData, ShipData } from "../app/gameState";
import BoardView from "./BoardView";

interface BattleScreenProps {
  enemyBoard: CellData[][];
  playerBoard: CellData[][];
  playerShips: ShipData[];
  enemyShips: ShipData[];
  difficultyLabel: string;
  currentTurn: "player" | "robot";
  statusText: string;
  feedback: AttackFeedback | null;
  onAttack: (x: number, y: number) => void;
  onBack: () => void;
  onRestart: () => void;
}

function getFeedbackText(feedback: AttackFeedback | null) {
  if (!feedback) {
    return "先手由你开始。";
  }

  const owner = feedback.owner === "player" ? "你" : "机器人";

  if (feedback.type === "miss") {
    return `${owner}的上一击未命中。`;
  }

  if (feedback.type === "hit") {
    return `${owner}命中了一格。`;
  }

  return `${owner}击沉了一艘舰船。`;
}

export default function BattleScreen({
  enemyBoard,
  playerBoard,
  playerShips,
  enemyShips,
  difficultyLabel,
  currentTurn,
  statusText,
  feedback,
  onAttack,
  onBack,
  onRestart,
}: BattleScreenProps) {
  return (
    <section className="screen battle-screen">
      <div className="top-actions spread">
        <button type="button" className="icon-button" onClick={onBack} aria-label="返回菜单">
          ←
        </button>
        <div className="battle-top-meta">
          <span className="glass-pill">{difficultyLabel}</span>
          <span className={`turn-pill${currentTurn === "player" ? " is-player" : ""}`}>
            {currentTurn === "player" ? "你的回合" : "机器人回合"}
          </span>
        </div>
        <button type="button" className="secondary-button compact" onClick={onRestart}>
          重开
        </button>
      </div>

      <div className="status-card">
        <strong>{statusText}</strong>
        <span>{getFeedbackText(feedback)}</span>
      </div>

      <div className="battle-board-stack">
        <BoardView
          board={enemyBoard}
          ships={enemyShips}
          hideShips
          active={currentTurn === "player"}
          title="敌方海域"
          subtitle="点击上方棋盘发起攻击"
          onCellClick={currentTurn === "player" ? onAttack : undefined}
        />

        <BoardView
          board={playerBoard}
          ships={playerShips}
          title="我方海域"
          subtitle="下方棋盘会显示你的舰船和受击情况"
        />
      </div>
    </section>
  );
}
