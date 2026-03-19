import type {
    TicTacToeSessionStore,
    TicTacToeSocket,
    TicTacToeSocketMiddleware,
  } from "./types.ts";
  
  export function createTicTacToeSocketAuth(
    sessionStore: TicTacToeSessionStore,
  ): TicTacToeSocketMiddleware {
    return function ticTacToeSocketAuth(
      socket: TicTacToeSocket,
      next: (err?: Error) => void,
    ): void {
      const { roomId, playerId, token } = socket.handshake.auth ?? {};
  
      if (
        typeof roomId   !== "string" ||
        typeof playerId !== "string" ||
        typeof token    !== "string"
      ) {
        next(new Error("Missing roomId, playerId or token in socket auth payload."));
        return;
      }
  
      const session = sessionStore.validateSession({ roomId, playerId, token });
  
      if (!session) {
        next(new Error("Invalid Tic Tac Toe session."));
        return;
      }
  
      socket.data.ticTacToe = { roomId, playerId, token };
  
      next();
    };
  }