function ResultModal({ open, result, onRestart, onBackToMenu }) {
  if (!open || !result) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <div className="result-modal">
        <span className="label">对局结束</span>
        <h2>{result.text}</h2>
        <p>
          {result.winner === 0
            ? "棋盘已满，无人连成五子。"
            : `${result.text}，可立即再来一局或返回主菜单切换模式。`}
        </p>
        <div className="modal-actions">
          <button type="button" onClick={onRestart}>
            再来一局
          </button>
          <button type="button" onClick={onBackToMenu}>
            返回菜单
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultModal;
