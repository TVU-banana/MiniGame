import Menu from "./components/Menu.jsx";
import GameBoard from "./components/GameBoard.jsx";
import ResultModal from "./components/ResultModal.jsx";
import StatusBar from "./components/StatusBar.jsx";
import { DIFFICULTIES } from "./constants/difficulty.js";
import { GAME_MODES, GAME_STATES, MODE_LABELS, SCENE_LABELS } from "./constants/game.js";
import useGameState from "./hooks/useGameState.js";

export default function App() {
  const {
    game,
    soundEnabled,
    resultText,
    currentPlayerLabel,
    handleGlobalInteraction,
    setDifficulty,
    startPvp,
    startPve,
    restartGame,
    returnToMenu,
    toggleSound,
    placeStone,
  } = useGameState();

  const currentScene = game.phase === GAME_STATES.MENU ? "menu" : "game";

  return (
    <div className={`app-shell scene-${currentScene.toLowerCase()}`} onPointerDown={handleGlobalInteraction}>
      <div className="screen-noise" />
      <div className="app-frame">
        <header className="app-header">
          <div>
            <p className="eyebrow">20×20 复古棋局</p>
            <h1>五子棋</h1>
          </div>
          <div className="header-status">
            <span>{soundEnabled ? "声音已开启" : "声音已关闭"}</span>
            <span>{soundEnabled ? SCENE_LABELS[currentScene] : "静音"}</span>
          </div>
        </header>

        {game.phase === GAME_STATES.MENU ? (
          <Menu
            selectedDifficulty={game.difficulty}
            onDifficultyChange={setDifficulty}
            onStartPvp={startPvp}
            onStartPve={startPve}
            onToggleSound={toggleSound}
            soundEnabled={soundEnabled}
            sceneLabel={soundEnabled ? SCENE_LABELS[currentScene] : "静音"}
          />
        ) : (
          <main className="game-screen">
            <StatusBar
              currentPlayerLabel={currentPlayerLabel}
              modeLabel={MODE_LABELS[game.mode]}
              difficultyLabel={game.mode === GAME_MODES.PVE ? DIFFICULTIES[game.difficulty].label : "本地双人"}
              onRestart={restartGame}
              onBackMenu={returnToMenu}
              onToggleSound={toggleSound}
              soundEnabled={soundEnabled}
              sceneLabel={soundEnabled ? SCENE_LABELS[currentScene] : "静音"}
              isThinking={game.isThinking}
            />

            <GameBoard
              board={game.board}
              currentPlayer={game.currentPlayer}
              isLocked={game.phase !== GAME_STATES.PLAYING || game.isThinking}
              winningLine={game.winningLine}
              lastMove={game.lastMove}
              onPlaceStone={placeStone}
            />
          </main>
        )}

        {game.phase === GAME_STATES.GAME_OVER ? (
          <ResultModal resultText={resultText} onRestart={restartGame} onBackMenu={returnToMenu} />
        ) : null}
      </div>
    </div>
  );
}
