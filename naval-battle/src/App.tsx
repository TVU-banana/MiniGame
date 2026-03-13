import BattleScreen from "./components/BattleScreen";
import DeployScreen from "./components/DeployScreen";
import DifficultyInfoModal from "./components/DifficultyInfoModal";
import DifficultySelect from "./components/DifficultySelect";
import MainMenu from "./components/MainMenu";
import ResultModal from "./components/ResultModal";
import SettingsModal from "./components/SettingsModal";
import { SCREENS } from "./app/constants";
import useGameState from "./hooks/useGameState";

export default function App() {
  const game = useGameState();

  return (
    <div className="app-shell" onPointerDown={game.unlockAudio}>
      <div className="water-noise" />
      <div className="app-frame">
        {game.game.screen === SCREENS.MAIN_MENU ? (
          <MainMenu onOpenSettings={game.openSettings} onStart={game.goToDifficultySelect} />
        ) : null}

        {game.game.screen === SCREENS.DIFFICULTY_SELECT ? (
          <DifficultySelect
            selectedDifficulty={game.game.difficulty}
            onBack={game.backFromDifficulty}
            onChoose={game.pickDifficulty}
            onOpenInfo={game.openDifficultyInfo}
          />
        ) : null}

        {game.game.screen === SCREENS.DEPLOY ? (
          <DeployScreen
            board={game.game.playerBoard}
            ships={game.game.playerShips}
            difficultyLabel={game.difficultyMeta.label}
            dragState={game.game.dragState}
            previewPlacement={game.game.previewPlacement}
            statusText={game.game.statusText}
            onBack={game.backFromDeploy}
            onRandom={game.randomDeployPlayer}
            onStart={game.beginBattle}
            onRotateShip={game.rotateDeployShip}
            onStartDrag={game.startDragShip}
            onMoveDrag={game.updateDrag}
            onEndDrag={game.endDrag}
          />
        ) : null}

        {game.game.screen === SCREENS.BATTLE || game.game.screen === SCREENS.RESULT ? (
          <BattleScreen
            enemyBoard={game.game.robotBoard}
            playerBoard={game.game.playerBoard}
            playerShips={game.game.playerShips}
            enemyShips={game.game.robotShips}
            difficultyLabel={game.difficultyMeta.label}
            currentTurn={game.game.currentTurn}
            statusText={game.game.statusText}
            feedback={game.game.feedback}
            onAttack={game.attackRobotCell}
            onBack={game.returnToMenu}
            onRestart={game.restartCurrentDifficulty}
          />
        ) : null}
      </div>

      <SettingsModal
        open={game.game.settings.open}
        stats={game.stats}
        onClose={game.closeSettings}
        onVolumeChange={game.setVolume}
        onClear={game.clearStats}
      />

      <DifficultyInfoModal
        open={game.game.difficultyInfo.open}
        difficulty={game.game.difficultyInfo.difficulty}
        onClose={game.closeDifficultyInfo}
      />

      <ResultModal
        open={game.game.result.open}
        won={game.game.result.won}
        onReplay={game.restartCurrentDifficulty}
        onMenu={game.returnToMenu}
      />
    </div>
  );
}
