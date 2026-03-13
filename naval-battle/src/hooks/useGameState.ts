import { useEffect, useRef, useState } from "react";
import { DIFFICULTIES, SCREENS, STATUS_TEXT } from "../app/constants";
import type {
  AppGameState,
  AttackFeedback,
  DifficultyKey,
  DragState,
  PreviewPlacement,
} from "../app/gameState";
import AudioManager from "../audio/AudioManager";
import { createBoard } from "../core/BoardModel";
import { attackCell, resolveRobotTurn } from "../core/BattleManager";
import { placeShip, rotateShip } from "../core/DeployManager";
import { createRandomFleet } from "../core/RobotPlayer";
import { createFleet } from "../core/ShipModel";
import { areAllShipsPlaced } from "../core/RuleChecker";
import useLocalStats from "./useLocalStats";

function createInitialState(): AppGameState {
  return {
    screen: SCREENS.MAIN_MENU,
    difficulty: "easy",
    playerBoard: createBoard(),
    robotBoard: createBoard(),
    playerShips: createFleet(),
    robotShips: createFleet(),
    currentTurn: "player",
    statusText: STATUS_TEXT.playerTurn,
    dragState: null,
    previewPlacement: null,
    settings: { open: false },
    result: { open: false, won: false },
    difficultyInfo: { open: false, difficulty: "easy" },
    feedback: null,
  };
}

function createDeployState(difficulty: DifficultyKey): AppGameState {
  return {
    ...createInitialState(),
    screen: SCREENS.DEPLOY,
    difficulty,
    statusText: STATUS_TEXT.deployHint,
  };
}

export default function useGameState() {
  const [game, setGame] = useState<AppGameState>(createInitialState);
  const audioRef = useRef(new AudioManager());
  const resultRecordedRef = useRef(false);
  const playStartedAtRef = useRef<number | null>(null);
  const statsState = useLocalStats();

  useEffect(() => {
    audioRef.current.setVolume(statsState.stats.volume);
  }, [statsState.stats.volume]);

  useEffect(() => {
    if (game.screen !== SCREENS.BATTLE || game.currentTurn !== "robot") {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      const result = resolveRobotTurn(game.playerBoard, game.playerShips, game.difficulty);
      result.feedbackLog.forEach((feedback) => {
        playFeedbackSound(feedback);
      });

      if (result.gameOver) {
        finishGame(false, game.difficulty, {
          playerBoard: result.board,
          playerShips: result.ships,
          feedback: result.feedback,
          statusText: STATUS_TEXT.robotWin,
        });
        return;
      }

      setGame((current) => ({
        ...current,
        playerBoard: result.board,
        playerShips: result.ships,
        currentTurn: "player",
        statusText: STATUS_TEXT.playerTurn,
        feedback: result.feedback,
      }));
    }, 260);

    return () => window.clearTimeout(timer);
  }, [game.currentTurn, game.difficulty, game.playerBoard, game.playerShips, game.screen]);

  function playFeedbackSound(feedback: AttackFeedback | null) {
    if (!feedback) {
      return;
    }

    if (feedback.type === "sunk") {
      audioRef.current.playSunk(statsState.stats.volume);
      return;
    }

    if (feedback.type === "hit") {
      audioRef.current.playHit(statsState.stats.volume);
    }
  }

  async function unlockAudio() {
    await audioRef.current.unlock();
    audioRef.current.setVolume(statsState.stats.volume);
  }

  function finishGame(won: boolean, difficulty: DifficultyKey, patch: Partial<AppGameState>) {
    if (!resultRecordedRef.current) {
      const playSeconds = playStartedAtRef.current
        ? Math.max(1, Math.round((Date.now() - playStartedAtRef.current) / 1000))
        : 0;

      statsState.recordResult(won, difficulty, playSeconds);
      resultRecordedRef.current = true;
    }

    setGame((current) => ({
      ...current,
      ...patch,
      screen: SCREENS.RESULT,
      result: {
        open: true,
        won,
      },
      currentTurn: "player",
      dragState: null,
      previewPlacement: null,
    }));
  }

  function resetForBattle(difficulty: DifficultyKey) {
    resultRecordedRef.current = false;
    playStartedAtRef.current = null;
    setGame(createDeployState(difficulty));
  }

  function openSettings() {
    setGame((current) => ({
      ...current,
      settings: {
        open: true,
      },
    }));
  }

  function closeSettings() {
    setGame((current) => ({
      ...current,
      settings: {
        open: false,
      },
    }));
  }

  function openDifficultyInfo(difficulty: DifficultyKey) {
    setGame((current) => ({
      ...current,
      difficultyInfo: {
        open: true,
        difficulty,
      },
    }));
  }

  function closeDifficultyInfo() {
    setGame((current) => ({
      ...current,
      difficultyInfo: {
        ...current.difficultyInfo,
        open: false,
      },
    }));
  }

  function goToDifficultySelect() {
    setGame((current) => ({
      ...current,
      screen: SCREENS.DIFFICULTY_SELECT,
    }));
  }

  function pickDifficulty(difficulty: DifficultyKey) {
    resetForBattle(difficulty);
  }

  function returnToMenu() {
    resultRecordedRef.current = false;
    playStartedAtRef.current = null;
    setGame((current) => ({
      ...createInitialState(),
      difficulty: current.difficulty,
    }));
  }

  function backFromDifficulty() {
    setGame((current) => ({
      ...current,
      screen: SCREENS.MAIN_MENU,
    }));
  }

  function backFromDeploy() {
    setGame((current) => ({
      ...current,
      screen: SCREENS.DIFFICULTY_SELECT,
      dragState: null,
      previewPlacement: null,
    }));
  }

  function randomDeployPlayer() {
    const result = createRandomFleet();
    setGame((current) => ({
      ...current,
      playerBoard: result.board,
      playerShips: result.ships,
      previewPlacement: null,
      statusText: STATUS_TEXT.deployHint,
    }));
  }

  function rotateDeployShip(shipId: string) {
    setGame((current) => {
      const result = rotateShip(current.playerBoard, current.playerShips, shipId);
      if (!result) {
        return current;
      }

      return {
        ...current,
        playerBoard: result.board,
        playerShips: result.ships,
      };
    });
  }

  function startDragShip(shipId: string, pointerId: number, clientX: number, clientY: number) {
    const dragState: DragState = {
      shipId,
      pointerId,
      offsetX: 0,
      offsetY: 0,
      startedAtX: clientX,
      startedAtY: clientY,
      active: true,
    };

    setGame((current) => ({
      ...current,
      dragState,
      previewPlacement: null,
    }));
  }

  function updateDrag(cell: { x: number; y: number } | null) {
    setGame((current) => {
      if (!current.dragState) {
        return current;
      }

      if (!cell) {
        return {
          ...current,
          previewPlacement: null,
        };
      }

      const ship = current.playerShips.find((entry) => entry.id === current.dragState?.shipId);
      if (!ship) {
        return current;
      }

      const valid = Boolean(
        placeShip(
          current.playerBoard,
          current.playerShips,
          ship.id,
          cell.x,
          cell.y,
          ship.horizontal,
        ),
      );

      const previewPlacement: PreviewPlacement = {
        shipId: ship.id,
        x: cell.x,
        y: cell.y,
        horizontal: ship.horizontal,
        valid,
      };

      return {
        ...current,
        previewPlacement,
      };
    });
  }

  function endDrag() {
    setGame((current) => {
      if (!current.previewPlacement) {
        return {
          ...current,
          dragState: null,
          previewPlacement: null,
        };
      }

      const result = placeShip(
        current.playerBoard,
        current.playerShips,
        current.previewPlacement.shipId,
        current.previewPlacement.x,
        current.previewPlacement.y,
        current.previewPlacement.horizontal,
      );

      if (!result) {
        return {
          ...current,
          dragState: null,
          previewPlacement: null,
        };
      }

      return {
        ...current,
        playerBoard: result.board,
        playerShips: result.ships,
        dragState: null,
        previewPlacement: null,
        statusText: STATUS_TEXT.deployHint,
      };
    });
  }

  function beginBattle() {
    if (!areAllShipsPlaced(game.playerShips)) {
      setGame((current) => ({
        ...current,
        statusText: STATUS_TEXT.invalidDeploy,
      }));
      return;
    }

    const robotFleet = createRandomFleet();
    resultRecordedRef.current = false;
    playStartedAtRef.current = Date.now();

    setGame((current) => ({
      ...current,
      screen: SCREENS.BATTLE,
      robotBoard: robotFleet.board,
      robotShips: robotFleet.ships,
      currentTurn: "player",
      statusText: STATUS_TEXT.playerTurn,
      feedback: null,
    }));
  }

  function attackRobotCell(x: number, y: number) {
    if (game.screen !== SCREENS.BATTLE || game.currentTurn !== "player") {
      return;
    }

    const result = attackCell(game.robotBoard, game.robotShips, x, y, "player");

    if (result.repeated) {
      setGame((current) => ({
        ...current,
        statusText: STATUS_TEXT.attacked,
      }));
      return;
    }

    playFeedbackSound(result.feedback);

    if (result.gameOver) {
      finishGame(true, game.difficulty, {
        robotBoard: result.board,
        robotShips: result.ships,
        feedback: result.feedback,
        statusText: STATUS_TEXT.playerWin,
      });
      return;
    }

    setGame((current) => ({
      ...current,
      robotBoard: result.board,
      robotShips: result.ships,
      currentTurn: result.continueTurn ? "player" : "robot",
      statusText: result.continueTurn ? STATUS_TEXT.playerKeep : STATUS_TEXT.robotTurn,
      feedback: result.feedback,
    }));
  }

  return {
    game,
    stats: statsState.stats,
    difficultyMeta: DIFFICULTIES[game.difficulty],
    unlockAudio,
    openSettings,
    closeSettings,
    setVolume: statsState.setVolume,
    clearStats: statsState.clearAll,
    goToDifficultySelect,
    backFromDifficulty,
    pickDifficulty,
    openDifficultyInfo,
    closeDifficultyInfo,
    returnToMenu,
    backFromDeploy,
    randomDeployPlayer,
    rotateDeployShip,
    startDragShip,
    updateDrag,
    endDrag,
    beginBattle,
    attackRobotCell,
    restartCurrentDifficulty: () => resetForBattle(game.difficulty),
  };
}
