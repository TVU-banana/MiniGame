const MODES = [
  {
    key: "PVP",
    title: "玩家对玩家",
    subtitle: "同屏对弈，黑子先手，适合双人轮流下棋。"
  }
];

const DIFFICULTIES = [
  {
    key: "BEGINNER",
    title: "新手",
    subtitle: "偏防守，只顾着堵你的连线。"
  },
  {
    key: "ADVANCED",
    title: "高手",
    subtitle: "会堵也会自己做势，攻守平衡。"
  },
  {
    key: "EXPERT",
    title: "专家",
    subtitle: "启用最强搜索策略，尽量不给你留下赢面。"
  }
];

function Menu({ onSelectMode, audioEnabled, onToggleAudio }) {
  return (
    <div className="menu-screen">
      <div className="menu-hero">
        <p className="eyebrow">Canvas Strategy Mini Game</p>
        <h1>五子棋</h1>
        <p className="menu-copy">
          竖屏友好的轻量对局。React 驱动界面，Canvas 绘制棋盘，规则、AI 与状态模块独立，方便后续扩展到悔棋、联网和小程序版本。
        </p>
      </div>

      <div className="menu-grid single-col">
        {MODES.map((mode) => (
          <button
            key={mode.key}
            type="button"
            className="mode-card"
            onClick={() => onSelectMode({ mode: mode.key })}
          >
            <span className="mode-tag">{mode.key}</span>
            <strong>{mode.title}</strong>
            <span>{mode.subtitle}</span>
          </button>
        ))}
      </div>

      <div className="difficulty-panel">
        <div className="difficulty-head">
          <span className="label">人机难度</span>
          <strong>玩家对机器</strong>
        </div>
        <div className="difficulty-grid">
          {DIFFICULTIES.map((item) => (
            <button
              key={item.key}
              type="button"
              className="difficulty-card"
              onClick={() => onSelectMode({ mode: "PVE", difficulty: item.key })}
            >
              <span className="mode-tag">{item.key}</span>
              <strong>{item.title}</strong>
              <span>{item.subtitle}</span>
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="audio-toggle" onClick={onToggleAudio}>
        {audioEnabled ? "声音已开启" : "声音已关闭"}
      </button>
    </div>
  );
}

export default Menu;
