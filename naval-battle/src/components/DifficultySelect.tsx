import { DIFFICULTIES } from "../app/constants";
import type { DifficultyKey } from "../app/gameState";

interface DifficultySelectProps {
  selectedDifficulty: DifficultyKey;
  onBack: () => void;
  onChoose: (difficulty: DifficultyKey) => void;
  onOpenInfo: (difficulty: DifficultyKey) => void;
}

export default function DifficultySelect({
  selectedDifficulty,
  onBack,
  onChoose,
  onOpenInfo,
}: DifficultySelectProps) {
  const entries = Object.values(DIFFICULTIES);

  return (
    <section className="screen">
      <div className="top-actions spread">
        <button type="button" className="icon-button" onClick={onBack} aria-label="返回主菜单">
          ←
        </button>
        <div className="title-stack compact">
          <span>选择对手</span>
          <strong>机器人难度</strong>
        </div>
      </div>

      <div className="stack-list">
        {entries.map((entry) => (
          <article
            key={entry.key}
            className={`difficulty-card${selectedDifficulty === entry.key ? " is-selected" : ""}`}
          >
            <button
              type="button"
              className="primary-button difficulty-button"
              onClick={() => onChoose(entry.key)}
            >
              {entry.label}
            </button>
            <div className="difficulty-meta">
              <p>{entry.description}</p>
              <button
                type="button"
                className="info-button"
                onClick={() => onOpenInfo(entry.key)}
                aria-label={`查看${entry.label}说明`}
              >
                i
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
