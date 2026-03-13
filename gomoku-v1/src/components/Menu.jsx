import { DIFFICULTY_LIST } from "../constants/difficulty.js";

export default function Menu({
  selectedDifficulty,
  onDifficultyChange,
  onStartPvp,
  onStartPve,
  onToggleSound,
  soundEnabled,
  sceneLabel,
}) {
  return (
    <main className="menu-screen">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="panel-tag">单机本地规则</span>
          <h2>轻量、清晰、即开即玩</h2>
          <p>
            支持 20×20 棋盘、本地双人和三档人机。机器策略完全基于本地候选点、棋型权重与优先级规则，不接入 AI。
          </p>
        </div>

        <div className="hero-actions">
          <button className="primary-button" type="button" onClick={onStartPvp}>
            玩家对玩家
          </button>
          <button className="secondary-button" type="button" onClick={onStartPve}>
            玩家对机器
          </button>
        </div>
      </section>

      <section className="menu-grid">
        <article className="panel">
          <div className="panel-head">
            <h3>难度选择</h3>
            <span>三档行为真实区分</span>
          </div>
          <div className="difficulty-list">
            {DIFFICULTY_LIST.map((difficulty) => (
              <button
                key={difficulty.key}
                type="button"
                className={`difficulty-card ${selectedDifficulty === difficulty.key ? "active" : ""}`}
                onClick={() => onDifficultyChange(difficulty.key)}
              >
                <strong>{difficulty.label}</strong>
                <span>{difficulty.description}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h3>声音控制</h3>
            <span>Web Audio API 合成</span>
          </div>
          <div className="sound-row">
            <button className="outline-button" type="button" onClick={onToggleSound}>
              {soundEnabled ? "关闭声音" : "开启声音"}
            </button>
            <div className="sound-meta">
              <strong>{sceneLabel}</strong>
              <span>菜单曲与对局曲分离，首次交互后自动激活。</span>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
