import { useEffect, useRef, useState } from "react";
import { AudioManager } from "../audio/AudioManager";
import { GameManager } from "../core/GameManager";

const MODE_LABELS = {
  PVP: "玩家 vs 玩家",
  PVE: "玩家 vs 机器"
};

const DIFFICULTY_LABELS = {
  BEGINNER: "新手",
  ADVANCED: "高手",
  EXPERT: "专家"
};

function buildSnapshot(raw) {
  const currentPlayerLabel = raw.currentPlayer === 1 ? "黑子" : "白子";
  const statusText =
    raw.phase === "GAME_OVER"
      ? raw.result?.text ?? "对局结束"
      : raw.mode === "PVE" && raw.machineThinking
        ? "机器正在思考最佳落点"
        : `${currentPlayerLabel}行动`;

  return {
    ...raw,
    currentPlayerLabel,
    modeLabel: raw.mode ? MODE_LABELS[raw.mode] : "未选择",
    difficultyLabel: raw.difficulty ? DIFFICULTY_LABELS[raw.difficulty] : "-",
    statusText
  };
}

export function useGameState() {
  const managerRef = useRef(new GameManager());
  const audioRef = useRef(new AudioManager());
  const machineTimerRef = useRef(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [snapshot, setSnapshot] = useState(buildSnapshot(managerRef.current.getSnapshot()));

  const syncSnapshot = () => {
    setSnapshot(buildSnapshot(managerRef.current.getSnapshot()));
  };

  const clearMachineTimer = () => {
    if (machineTimerRef.current) {
      window.clearTimeout(machineTimerRef.current);
      machineTimerRef.current = null;
    }
  };

  const activateAudio = () => {
    if (!audioEnabled) {
      return;
    }
    audioRef.current.activate();
  };

  useEffect(() => {
    audioRef.current.setEnabled(audioEnabled);
  }, [audioEnabled]);

  useEffect(() => clearMachineTimer, []);

  const runMachineTurn = () => {
    const manager = managerRef.current;
    if (manager.state.mode !== "PVE" || manager.state.currentPlayer !== 2) {
      return;
    }

    manager.setMachineThinking(true);
    syncSnapshot();

    const delay = 200 + Math.floor(Math.random() * 201);
    machineTimerRef.current = window.setTimeout(() => {
      const move = manager.getMachineMove();
      manager.setMachineThinking(false);
      if (!move) {
        syncSnapshot();
        return;
      }

      const result = manager.applyMove(move.x, move.y);
      activateAudio();
      audioRef.current.playPlace();
      if (result.result) {
        audioRef.current.playWin();
      }
      syncSnapshot();
    }, delay);
  };

  const startGame = (config) => {
    clearMachineTimer();
    activateAudio();
    managerRef.current.start(config);
    audioRef.current.playClick();
    syncSnapshot();
  };

  const restartGame = () => {
    clearMachineTimer();
    activateAudio();
    managerRef.current.restart();
    audioRef.current.playClick();
    syncSnapshot();
  };

  const returnToMenu = () => {
    clearMachineTimer();
    activateAudio();
    managerRef.current.returnToMenu();
    audioRef.current.playClick();
    syncSnapshot();
  };

  const placeStone = (x, y) => {
    const manager = managerRef.current;
    if (!manager.canPlace(x, y)) {
      return;
    }

    const result = manager.applyMove(x, y);
    if (!result.ok) {
      return;
    }

    activateAudio();
    audioRef.current.playPlace();
    if (result.result) {
      audioRef.current.playWin();
    }

    syncSnapshot();

    if (manager.state.mode === "PVE" && manager.state.phase === "PLAYING" && manager.state.currentPlayer === 2) {
      runMachineTurn();
    }
  };

  const toggleAudio = () => {
    audioRef.current.activate();
    audioRef.current.playClick();
    setAudioEnabled((value) => !value);
  };

  return {
    snapshot,
    startGame,
    restartGame,
    returnToMenu,
    placeStone,
    toggleAudio,
    audioEnabled
  };
}
