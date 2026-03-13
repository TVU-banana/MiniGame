function StatusBar({
  snapshot,
  onRestart,
  onBackToMenu,
  audioEnabled,
  onToggleAudio
}) {
  return (
    <header className="status-shell">
      <div className="status-panel primary">
        <span className="label">当前回合</span>
        <strong>{snapshot.currentPlayerLabel}</strong>
        <span className={`stone-dot stone-${snapshot.currentPlayer}`} />
      </div>

      <div className="status-panel secondary">
        <span className="label">状态</span>
        <strong>{snapshot.statusText}</strong>
        <small>
          {snapshot.mode === "PVE"
            ? `当前难度：${snapshot.difficultyLabel}`
            : "本地双人轮流落子"}
        </small>
      </div>

      <div className="status-actions">
        <button type="button" onClick={onRestart}>
          重新开始
        </button>
        <button type="button" onClick={onBackToMenu}>
          返回菜单
        </button>
        <button type="button" onClick={onToggleAudio}>
          {audioEnabled ? "关闭声音" : "开启声音"}
        </button>
      </div>
    </header>
  );
}

export default StatusBar;
