import { APP_TITLE } from "../app/constants";

interface MainMenuProps {
  onOpenSettings: () => void;
  onStart: () => void;
}

export default function MainMenu({ onOpenSettings, onStart }: MainMenuProps) {
  return (
    <section className="screen screen-menu">
      <div className="top-actions">
        <button type="button" className="icon-button" onClick={onOpenSettings} aria-label="打开设置">
          ⚙
        </button>
      </div>

      <div className="hero-card">
        <div className="hero-badge">单机竖屏 H5</div>
        <h1>{APP_TITLE}</h1>
        <p>在清爽海域里摆好三艘舰船，先一步击沉对手舰队。</p>
      </div>

      <div className="panel-card menu-entry">
        <button type="button" className="primary-button big-button" onClick={onStart}>
          单人对战
        </button>
        <div className="menu-note">
          <span>10 x 10 棋盘</span>
          <span>3 艘舰船</span>
          <span>简单 / 困难</span>
        </div>
      </div>
    </section>
  );
}
