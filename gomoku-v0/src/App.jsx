import Menu from "./components/Menu";
import GameBoard from "./components/GameBoard";
import ResultModal from "./components/ResultModal";
import StatusBar from "./components/StatusBar";
import { useGameState } from "./hooks/useGameState";

function App() {
  const {
    snapshot,
    placeStone,
    startGame,
    restartGame,
    returnToMenu,
    toggleAudio,
    audioEnabled
  } = useGameState();

  return (
    <main className="app-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="grain" />
      <section className="app-frame">
        {snapshot.phase === "MENU" ? (
          <Menu
            onSelectMode={startGame}
            audioEnabled={audioEnabled}
            onToggleAudio={toggleAudio}
          />
        ) : (
          <>
            <StatusBar
              snapshot={snapshot}
              onRestart={restartGame}
              onBackToMenu={returnToMenu}
              audioEnabled={audioEnabled}
              onToggleAudio={toggleAudio}
            />
            <GameBoard snapshot={snapshot} onPlaceStone={placeStone} />
          </>
        )}

        <ResultModal
          open={snapshot.phase === "GAME_OVER"}
          result={snapshot.result}
          onRestart={restartGame}
          onBackToMenu={returnToMenu}
        />
      </section>
    </main>
  );
}

export default App;
