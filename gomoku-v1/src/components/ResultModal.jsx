export default function ResultModal({ resultText, onRestart, onBackMenu }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="result-modal" role="dialog" aria-modal="true" aria-label="对局结果">
        <span className="panel-tag">对局结束</span>
        <h2>{resultText}</h2>
        <p>可以继续再来一局，也可以返回菜单切换模式、难度或声音设置。</p>
        <div className="modal-actions">
          <button className="primary-button" type="button" onClick={onRestart}>
            再来一局
          </button>
          <button className="secondary-button" type="button" onClick={onBackMenu}>
            返回菜单
          </button>
        </div>
      </section>
    </div>
  );
}
