import type { ActivePiece } from "../app/GameConfig";
import { Board } from "./Board";
import { getTetrominoCells, movePiece } from "./Tetromino";

export const isPiecePositionValid = (board: Board, piece: ActivePiece): boolean => {
  return board.canPlace(getTetrominoCells(piece));
};

export const isPieceGrounded = (board: Board, piece: ActivePiece): boolean => {
  const movedDown = movePiece(piece, 0, 1);
  return !isPiecePositionValid(board, movedDown);
};

export const canMovePiece = (board: Board, piece: ActivePiece, dx: number, dy: number): boolean => {
  const moved = movePiece(piece, dx, dy);
  return isPiecePositionValid(board, moved);
};
