export default function StatusBar({
  currentPlayerLabel,
  modeLabel,
  difficultyLabel,
  onRestart,
  onBackMenu,
  onToggleSound,
  soundEnabled,
  sceneLabel,
  isThinking,
}) {
  return (
    <section className="status-bar">
      <div className="status-main">
        <div className="status-chip">
          <span>当前回合</span>
          <strong>{isThinking ? "白子思考中" : currentPlayerLabel}</strong>
        </div>
        <div className="status-chip">
          <span>当前模式</span>
          <strong>{modeLabel}</strong>
        </div>
        <div className="status-chip">
          <span>当前难度</span>
          <strong>{difficultyLabel}</strong>
        </div>
        <div className="status-chip">
          <span>背景音乐</span>
          <strong>{soundEnabled ? sceneLabel : "静音"}</strong>
        </div>
      </div>

      <div className="status-actions">
        <button className="outline-button" type="button" onClick={onRestart}>
          重新开始
        </button>
        <button className="outline-button" type="button" onClick={onBackMenu}>
          返回菜单
        </button>
        <button className="outline-button" type="button" onClick={onToggleSound}>
          {soundEnabled ? "关闭声音" : "开启声音"}
        </button>
      </div>
    </section>
  );
}
