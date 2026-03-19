import type {
  GuessTheDrawSessionStore,
  GuessTheDrawSocket,
  GuessTheDrawSocketMiddleware,
} from "./types";

export function createGuessTheDrawSocketAuth(
  sessionStore: GuessTheDrawSessionStore,
): GuessTheDrawSocketMiddleware {
  return function guessTheDrawSocketAuth(
    socket: GuessTheDrawSocket,
    next: (err?: Error) => void,
  ): void {
    const { roomId, playerId, token } = socket.handshake.auth ?? {};

    if (
      typeof roomId !== "string" ||
      typeof playerId !== "string" ||
      typeof token !== "string"
    ) {
      next(new Error("Missing roomId, playerId or token in socket auth payload."));
      return;
    }

    const session = sessionStore.validateSession({ roomId, playerId, token });

    if (!session) {
      next(new Error("Invalid Guess The Draw session."));
      return;
    }

    socket.data.guessTheDraw = {
      roomId,
      playerId,
      token,
      metadata: session.metadata ?? null,
    };

    next();
  };
}
