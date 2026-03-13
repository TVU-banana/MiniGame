import type { StatsData } from "../app/gameState";

interface SettingsModalProps {
  open: boolean;
  stats: StatsData;
  onClose: () => void;
  onVolumeChange: (volume: number) => void;
  onClear: () => void;
}

function formatPlayTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} 分 ${seconds} 秒`;
}

export default function SettingsModal({
  open,
  stats,
  onClose,
  onVolumeChange,
  onClear,
}: SettingsModalProps) {
  if (!open) {
    return null;
  }

  const winRate = stats.totalGames ? Math.round((stats.totalWins / stats.totalGames) * 100) : 0;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card wide"
        role="dialog"
        aria-modal="true"
        aria-label="设置与统计"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">系统设置</span>
            <h2>设置与统计</h2>
          </div>
          <button type="button" className="icon-button small" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <div className="modal-body">
          <section className="stats-panel">
            <div className="volume-row">
              <div>
                <strong>音量</strong>
                <p>0 表示静音，默认值为 70。</p>
              </div>
              <span>{stats.volume}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={stats.volume}
              onChange={(event) => onVolumeChange(Number(event.target.value))}
            />
          </section>

          <section className="stats-grid">
            <div className="stat-tile">
              <span>总场次</span>
              <strong>{stats.totalGames}</strong>
            </div>
            <div className="stat-tile">
              <span>总胜场</span>
              <strong>{stats.totalWins}</strong>
            </div>
            <div className="stat-tile">
              <span>总败场</span>
              <strong>{stats.totalLosses}</strong>
            </div>
            <div className="stat-tile">
              <span>胜率</span>
              <strong>{winRate}%</strong>
            </div>
            <div className="stat-tile">
              <span>游玩时长</span>
              <strong>{formatPlayTime(stats.totalPlaySeconds)}</strong>
            </div>
            <div className="stat-tile">
              <span>简单对局</span>
              <strong>{stats.easyGames}</strong>
            </div>
            <div className="stat-tile">
              <span>简单胜负</span>
              <strong>
                {stats.easyWins} / {stats.easyLosses}
              </strong>
            </div>
            <div className="stat-tile">
              <span>困难对局</span>
              <strong>{stats.hardGames}</strong>
            </div>
            <div className="stat-tile">
              <span>困难胜负</span>
              <strong>
                {stats.hardWins} / {stats.hardLosses}
              </strong>
            </div>
          </section>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClear}>
            清空统计
          </button>
          <button type="button" className="primary-button" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
