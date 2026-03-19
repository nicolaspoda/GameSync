import { TIC_TAC_TOE_CONFIG, WIN_PATTERNS } from "./constants";
import type {
  Board,
  PlayerId,
  TicTacToePlayer,
  TicTacToeRoomState,
  TicTacToeRound,
} from "./types.ts";

// ─── Board helpers ─────────────────────────────────────────────────────────────

export function createEmptyBoard(): Board {
  return [null, null, null, null, null, null, null, null, null];
}

export function checkWinner(board: Board): PlayerId | "draw" | null {
  for (const [a, b, c] of WIN_PATTERNS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as string; // "X" ou "O" — on résoudra vers un PlayerId après
    }
  }

  const isDraw = board.every((cell) => cell !== null);
  return isDraw ? "draw" : null;
}

// ─── Move validation ───────────────────────────────────────────────────────────

export type MoveValidationResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export function validateMove(
  state: TicTacToeRoomState,
  playerId: PlayerId,
  index: number,
): MoveValidationResult {
  if (state.status !== "IN_PROGRESS") {
    return { ok: false, code: "NOT_IN_PROGRESS", message: "The game is not in progress." };
  }

  if (state.round.currentPlayerId !== playerId) {
    return { ok: false, code: "NOT_YOUR_TURN", message: "It is not your turn." };
  }

  if (!Number.isInteger(index) || index < 0 || index > 8) {
    return { ok: false, code: "INVALID_INDEX", message: "Move index must be between 0 and 8." };
  }

  if (state.round.board[index] !== null) {
    return { ok: false, code: "CELL_TAKEN", message: "This cell is already taken." };
  }

  return { ok: true };
}

// ─── State transitions ─────────────────────────────────────────────────────────

export function applyMove(
  state: TicTacToeRoomState,
  playerId: PlayerId,
  index: number,
): TicTacToeRoomState {
  const player = state.players.find((p) => p.id === playerId)!;
  const newBoard = [...state.round.board] as Board;
  newBoard[index] = player.symbol;

  const opponent = state.players.find((p) => p.id !== playerId)!;

  return {
    ...state,
    round: {
      ...state.round,
      board:           newBoard,
      currentPlayerId: opponent.id, // passe la main
    },
  };
}

export function resolveRound(
  state: TicTacToeRoomState,
): TicTacToeRoomState {
  const { board } = state.round;
  const symbolResult = checkWinner(board);

  // Pas encore de gagnant
  if (!symbolResult) return state;

  let winnerId: PlayerId | "draw";
  let pointGains: Record<PlayerId, number> = {};

  if (symbolResult === "draw") {
    winnerId = "draw";
    // Pas de point pour personne
    for (const p of state.players) pointGains[p.id] = 0;
  } else {
    // symbolResult = "X" ou "O" → on cherche le joueur correspondant
    const winner = state.players.find((p) => p.symbol === symbolResult)!;
    winnerId    = winner.id;
    pointGains  = Object.fromEntries(
      state.players.map((p) => [p.id, p.id === winner.id ? 1 : 0]),
    );
  }

  // Applique les gains aux scores
  const updatedPlayers: TicTacToePlayer[] = state.players.map((p) => ({
    ...p,
    score: p.score + (pointGains[p.id] ?? 0),
  }));

  // Détermine si la partie est terminée
  const isGameFinished = updatedPlayers.some(
    (p) => p.score >= TIC_TAC_TOE_CONFIG.WINNING_SCORE,
  ) || state.round.number >= TIC_TAC_TOE_CONFIG.MAX_ROUNDS;

  return {
    ...state,
    status:  isGameFinished ? "GAME_FINISHED" : "ROUND_FINISHED",
    players: updatedPlayers,
    round: {
      ...state.round,
      pointGains,
      winnerId,
    },
  };
}

export function startNewRound(
  state: TicTacToeRoomState,
): TicTacToeRoomState {
  // Le perdant du round précédent commence (ou l'autre joueur en cas de draw)
  const previousStarterId = state.round.currentPlayerId;
  const nextStarter = state.players.find((p) => p.id !== previousStarterId)!;

  const newRound: TicTacToeRound = {
    number:          state.round.number + 1,
    board:           createEmptyBoard(),
    currentPlayerId: nextStarter.id,
    pointGains:      Object.fromEntries(state.players.map((p) => [p.id, 0])),
  };

  return {
    ...state,
    status: "IN_PROGRESS",
    round:  newRound,
  };
}

export function buildInitialState(
  roomId: string,
  players: TicTacToePlayer[],
): TicTacToeRoomState {
  // Le joueur X commence toujours la première manche
  const firstPlayer = players.find((p) => p.symbol === "X")!;

  return {
    id:      roomId,
    status:  "IN_PROGRESS",
    players,
    round: {
      number:          1,
      board:           createEmptyBoard(),
      currentPlayerId: firstPlayer.id,
      pointGains:      Object.fromEntries(players.map((p) => [p.id, 0])),
    },
  };
}

export function buildRestartState(
  state: TicTacToeRoomState,
): TicTacToeRoomState {
  // Réinitialise les scores et repart à la manche 1
  // Les symboles X/O sont échangés pour varier
  const resetPlayers: TicTacToePlayer[] = state.players.map((p) => ({
    ...p,
    score:  0,
    symbol: p.symbol === "X" ? "O" : "X",
  }));

  return buildInitialState(state.id, resetPlayers);
}