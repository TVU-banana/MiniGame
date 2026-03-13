import { useEffect, useRef, useState } from "react";
import AudioManager from "../audio/AudioManager.js";
import { AI_PLAYER, GAME_MODES, GAME_STATES, HUMAN_PLAYER, PLAYER_LABELS } from "../constants/game.js";
import { DEFAULT_DIFFICULTY } from "../constants/difficulty.js";
import GameManager from "../core/GameManager.js";
import MachinePlayer from "../core/MachinePlayer.js";

const SOUND_STORAGE_KEY = "gomoku-lite-sound-enabled";

function readSavedSound() {
  try {
    const raw = window.localStorage.getItem(SOUND_STORAGE_KEY);
    return raw === null ? true : raw === "true";
  } catch {
    return true;
  }
}

export default function useGameState() {
  const managerRef = useRef(new GameManager());
  const machineRef = useRef(new MachinePlayer());
  const audioRef = useRef(new AudioManager());
  const resultPlayedRef = useRef("");
  const gameRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(readSavedSound);
  const [game, setGame] = useState(() =>
    managerRef.current.createInitialState({ difficulty: DEFAULT_DIFFICULTY }),
  );

  gameRef.current = game;

  useEffect(() => {
    try {
      window.localStorage.setItem(SOUND_STORAGE_KEY, String(soundEnabled));
    } catch {
      // 忽略浏览器隐私模式下的存储异常。
    }
  }, [soundEnabled]);

  useEffect(() => {
    const audio = audioRef.current;
    audio.setEnabled(soundEnabled);

    if (!soundEnabled) {
      return;
    }

    if (game.phase === GAME_STATES.MENU) {
      audio.playScene("menu");
    } else {
      audio.playScene("game");
    }
  }, [game.phase, soundEnabled]);

  useEffect(() => {
    if (
      game.phase !== GAME_STATES.PLAYING ||
      game.mode !== GAME_MODES.PVE ||
      game.currentPlayer !== AI_PLAYER ||
      !game.isThinking
    ) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      const move = machineRef.current.chooseMove(game.board, game.difficulty, AI_PLAYER, HUMAN_PLAYER);
      audioRef.current.playPlace();
      setGame((current) => managerRef.current.applyMachineMove(current, move));
    }, game.machineDelay);

    return () => window.clearTimeout(timer);
  }, [game]);

  useEffect(() => {
    const signature = `${game.phase}-${game.winner}-${game.isDraw}`;

    if (game.phase === GAME_STATES.GAME_OVER && resultPlayedRef.current !== signature) {
      audioRef.current.playVictory();
      resultPlayedRef.current = signature;
      return;
    }

    if (game.phase !== GAME_STATES.GAME_OVER) {
      resultPlayedRef.current = "";
    }
  }, [game.phase, game.winner, game.isDraw]);

  async function unlockAudio() {
    await audioRef.current.unlock();
  }

  async function handleGlobalInteraction() {
    await unlockAudio();
  }

  async function setDifficulty(difficulty) {
    await unlockAudio();
    audioRef.current.playButton();
    setGame(managerRef.current.setDifficulty(gameRef.current, difficulty));
  }

  async function startPvp() {
    await unlockAudio();
    audioRef.current.playButton();
    setGame(managerRef.current.startGame(gameRef.current, GAME_MODES.PVP, gameRef.current.difficulty));
  }

  async function startPve() {
    await unlockAudio();
    audioRef.current.playButton();
    setGame(managerRef.current.startGame(gameRef.current, GAME_MODES.PVE, gameRef.current.difficulty));
  }

  async function restartGame() {
    await unlockAudio();
    audioRef.current.playButton();
    setGame(managerRef.current.restartGame(gameRef.current));
  }

  async function returnToMenu() {
    await unlockAudio();
    audioRef.current.playButton();
    setGame(managerRef.current.returnToMenu(gameRef.current));
  }

  async function toggleSound() {
    await unlockAudio();
    const nextValue = !soundEnabled;
    setSoundEnabled(nextValue);

    if (nextValue) {
      audioRef.current.playButton();
    }
  }

  async function placeStone(x, y) {
    await unlockAudio();
    const next = managerRef.current.applyPlayerMove(gameRef.current, x, y);
    setGame(next);

    if (next !== gameRef.current) {
      audioRef.current.playPlace();
    }
  }

  return {
    game,
    soundEnabled,
    resultText: managerRef.current.getResultText(game),
    currentPlayerLabel: PLAYER_LABELS[game.currentPlayer],
    handleGlobalInteraction,
    setDifficulty,
    startPvp,
    startPve,
    restartGame,
    returnToMenu,
    toggleSound,
    placeStone,
  };
}
