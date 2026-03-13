interface ResultModalProps {
  open: boolean;
  won: boolean;
  onReplay: () => void;
  onMenu: () => void;
}

export default function ResultModal({ open, won, onReplay, onMenu }: ResultModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop strong" role="presentation">
      <div className="modal-card result-modal" role="dialog" aria-modal="true" aria-label="对局结果">
        <div className={`result-badge${won ? " success" : " fail"}`}>{won ? "胜利" : "失败"}</div>
        <h2>{won ? "敌方舰队已清空" : "你的舰队沉没了"}</h2>
        <p>{won ? "继续开一局，试试更快击沉对手。" : "调整布阵和节奏，再来一次。"}</p>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onMenu}>
            返回菜单
          </button>
          <button type="button" className="primary-button" onClick={onReplay}>
            再来一局
          </button>
        </div>
      </div>
    </div>
  );
}
