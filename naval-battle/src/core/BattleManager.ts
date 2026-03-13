import type { AttackFeedback, CellData, DifficultyKey, ShipData } from "../app/gameState";
import { cloneBoard, setCellState } from "./BoardModel";
import { areAllShipsSunk, getShipCells } from "./RuleChecker";
import { cloneShips, findShip } from "./ShipModel";
import { chooseRobotAttack } from "./RobotPlayer";

type AttackResult = {
  board: CellData[][];
  ships: ShipData[];
  feedback: AttackFeedback | null;
  repeated: boolean;
  continueTurn: boolean;
  gameOver: boolean;
};

function sinkShip(board: CellData[][], ship: ShipData) {
  getShipCells(ship).forEach(({ x, y }) => {
    setCellState(board, x, y, "sunk", ship.id);
  });
}

export function attackCell(
  board: CellData[][],
  ships: ShipData[],
  x: number,
  y: number,
  owner: "player" | "robot",
): AttackResult {
  const nextBoard = cloneBoard(board);
  const nextShips = cloneShips(ships);
  const cell = nextBoard[y][x];

  if (cell.state === "miss" || cell.state === "hit" || cell.state === "sunk") {
    return {
      board,
      ships,
      feedback: null,
      repeated: true,
      continueTurn: true,
      gameOver: false,
    };
  }

  if (!cell.shipId) {
    setCellState(nextBoard, x, y, "miss");
    return {
      board: nextBoard,
      ships: nextShips,
      feedback: {
        owner,
        x,
        y,
        type: "miss",
      },
      repeated: false,
      continueTurn: false,
      gameOver: false,
    };
  }

  const ship = findShip(nextShips, cell.shipId);
  if (!ship) {
    return {
      board,
      ships,
      feedback: null,
      repeated: true,
      continueTurn: true,
      gameOver: false,
    };
  }

  ship.hitCount += 1;
  const sunk = ship.hitCount >= ship.length;

  if (sunk) {
    ship.sunk = true;
    sinkShip(nextBoard, ship);
  } else {
    setCellState(nextBoard, x, y, "hit", ship.id);
  }

  return {
    board: nextBoard,
    ships: nextShips,
    feedback: {
      owner,
      x,
      y,
      type: sunk ? "sunk" : "hit",
    },
    repeated: false,
    continueTurn: true,
    gameOver: areAllShipsSunk(nextShips),
  };
}

export function resolveRobotTurn(
  playerBoard: CellData[][],
  playerShips: ShipData[],
  difficulty: DifficultyKey,
) {
  let board = playerBoard;
  let ships = playerShips;
  let feedback: AttackFeedback | null = null;
  const feedbackLog: AttackFeedback[] = [];
  let gameOver = false;

  while (!gameOver) {
    const target = chooseRobotAttack(board, difficulty);
    if (!target) {
      break;
    }

    const result = attackCell(board, ships, target.x, target.y, "robot");
    board = result.board;
    ships = result.ships;
    feedback = result.feedback;
    gameOver = result.gameOver;

    if (result.feedback) {
      feedbackLog.push(result.feedback);
    }

    if (!result.continueTurn || result.repeated) {
      break;
    }
  }

  return {
    board,
    ships,
    feedback,
    feedbackLog,
    gameOver,
  };
}
