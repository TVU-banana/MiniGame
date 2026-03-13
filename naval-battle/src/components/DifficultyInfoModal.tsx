import { DIFFICULTIES } from "../app/constants";
import type { DifficultyKey } from "../app/gameState";

interface DifficultyInfoModalProps {
  open: boolean;
  difficulty: DifficultyKey;
  onClose: () => void;
}

export default function DifficultyInfoModal({
  open,
  difficulty,
  onClose,
}: DifficultyInfoModalProps) {
  if (!open) {
    return null;
  }

  const meta = DIFFICULTIES[difficulty];

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={`${meta.label}说明`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">难度说明</span>
            <h2>{meta.label}</h2>
          </div>
          <button type="button" className="icon-button small" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <div className="modal-body">
          <p>{meta.description}</p>
        </div>

        <button type="button" className="primary-button" onClick={onClose}>
          关闭
        </button>
      </div>
    </div>
  );
}
