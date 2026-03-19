import type {
  Puissance4Board,
  Puissance4GameState,
  Puissance4Room,
  Puissance4Timeout,
  Puissance4Winner,
} from "./types";

const EMPTY_BOARD: Puissance4Board = Array.from({ length: 6 }, () =>
  Array.from({ length: 7 }, () => null),
);

export function createInitialGameState(): Puissance4GameState {
  return {
    board: EMPTY_BOARD.map((row) => [...row]),
    currentPlayer: "RED",
    winner: null,
    lastMoveAt: Date.now(),
  };
}

export function checkWinner(board: Puissance4Board): Puissance4Winner {
  const directions: Array<readonly [number, number]> = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];

  const inBounds = (row: number, column: number) =>
    row >= 0 && row < board.length && column >= 0 && column < board[0].length;

  for (let row = 0; row < board.length; row += 1) {
    for (let column = 0; column < board[0].length; column += 1) {
      const cell = board[row][column];
      if (!cell) continue;

      for (const [deltaRow, deltaColumn] of directions) {
        let count = 1;
        let nextRow = row + deltaRow;
        let nextColumn = column + deltaColumn;
        while (
          inBounds(nextRow, nextColumn) &&
          board[nextRow][nextColumn] === cell
        ) {
          count += 1;
          if (count === 4) {
            return cell;
          }
          nextRow += deltaRow;
          nextColumn += deltaColumn;
        }
      }
    }
  }

  const isFull = board.every((row) => row.every((cell) => cell !== null));
  if (isFull) return "DRAW";

  return null;
}

export const rooms = new Map<string, Puissance4Room>();
const roomDeletionTimers = new Map<string, Puissance4Timeout>();
const roomTtlMs = 5 * 60 * 1000;

export function scheduleRoomDeletion(roomCode: string): void {
  const normalized = String(roomCode || "").trim().toUpperCase();
  if (!normalized) return;
  if (roomDeletionTimers.has(normalized)) return;

  const timeoutId = setTimeout(() => {
    roomDeletionTimers.delete(normalized);
    const room = rooms.get(normalized);
    if (!room) return;
    if (room.players.length === 0) {
      rooms.delete(normalized);
    }
  }, roomTtlMs);

  roomDeletionTimers.set(normalized, timeoutId);
}

export function cancelRoomDeletion(roomCode: string): void {
  const normalized = String(roomCode || "").trim().toUpperCase();
  const timeoutId = roomDeletionTimers.get(normalized);
  if (!timeoutId) return;
  clearTimeout(timeoutId);
  roomDeletionTimers.delete(normalized);
}

export function generateRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let index = 0; index < 6; index += 1) {
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    result += alphabet[randomIndex];
  }
  return result;
}

export function getOrCreateWaitingRoom(): Puissance4Room {
  for (const room of rooms.values()) {
    if (!room.isPrivate && room.players.length === 1) {
      cancelRoomDeletion(room.code);
      return room;
    }
  }

  const code = generateRoomCode();
  const room: Puissance4Room = {
    code,
    name: `Room ${code}`,
    isPrivate: false,
    players: [],
    gameState: createInitialGameState(),
  };
  rooms.set(code, room);
  return room;
}
