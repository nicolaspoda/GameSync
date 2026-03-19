export { createTicTacToeIo }           from "./io";
export { createTicTacToeRoomRegistry } from "./room-registry";
export { createTicTacToeRoutes }       from "./routes";
export { createTicTacToeServer }       from "./server";
export { createTicTacToeSessionStore } from "./session-store";
export { createTicTacToeSocketAuth }   from "./socket-auth";
export { ticTacToeClientEvents, ticTacToeServerEvents } from "./events";
export {
  emitToPlayer,
  emitToRoom,
  getSocketSession,
  getTicTacToePlayerChannel,
  getTicTacToeRoomChannel,
} from "./socket-helpers";
export {
  applyMove,
  buildInitialState,
  buildRestartState,
  checkWinner,
  createEmptyBoard,
  resolveRound,
  startNewRound,
  validateMove,
} from "./game-service";
export type * from "./types";