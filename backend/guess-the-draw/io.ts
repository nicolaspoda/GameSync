import type { Server as HttpServer } from "node:http";

import { Server } from "socket.io";

import { guessTheDrawClientEvents, guessTheDrawServerEvents } from "./events";
import { createGuessTheDrawSessionStore } from "./session-store";
import { createGuessTheDrawSocketAuth } from "./socket-auth";
import {
  emitToRoom,
  getGuessTheDrawPlayerChannel,
  getGuessTheDrawRoomChannel,
  getSocketSession,
} from "./socket-helpers";
import type {
  GuessTheDrawIoOptions,
  GuessTheDrawIoServer,
  GuessTheDrawSessionStore,
  Message,
  PlayerId,
  RoomState,
  Round,
  Stroke,
} from "./types";

function createInitialRound(drawerId: PlayerId): Round {
  return {
    number: 1,
    pointGains: {},
    word: "",
    wordMasked: "",
    drawerId,
  };
}

export function createGuessTheDrawIo(
  httpServer: HttpServer,
  options: GuessTheDrawIoOptions = {},
): {
  io: GuessTheDrawIoServer;
  sessionStore: GuessTheDrawSessionStore;
} {
  const io = new Server(httpServer, {
    cors: {
      origin: options.corsOrigin ?? "*",
    },
    path: options.path ?? "/socket.io",
  }) as GuessTheDrawIoServer;

  const sessionStore = options.sessionStore ?? createGuessTheDrawSessionStore();

  io.use(createGuessTheDrawSocketAuth(sessionStore));

  io.on("connection", (socket) => {
    const session = getSocketSession(socket);

    if (!session) {
      socket.disconnect(true);
      return;
    }

    const roomChannel = getGuessTheDrawRoomChannel(session.roomId);
    const playerChannel = getGuessTheDrawPlayerChannel(session.playerId);

    socket.join(roomChannel);
    socket.join(playerChannel);

    const roomState = sessionStore.attachSocketToSession({
      roomId: session.roomId,
      playerId: session.playerId,
      socketId: socket.id,
    });

    socket.emit(guessTheDrawServerEvents.connected);
    socket.emit(guessTheDrawServerEvents.roomJoined, {
      room: roomState,
      selfPlayerId: session.playerId,
    });

    emitToRoom(
      io,
      session.roomId,
      guessTheDrawServerEvents.roomState,
      roomState,
    );
    emitToRoom(
      io,
      session.roomId,
      guessTheDrawServerEvents.playerJoined,
      roomState,
    );

    socket.on(guessTheDrawClientEvents.leaveRoom, () => {
      socket.leave(roomChannel);
      socket.leave(playerChannel);

      sessionStore.detachSocket(socket.id);

      emitToRoom(
        io,
        session.roomId,
        guessTheDrawServerEvents.playerLeft,
        sessionStore.getRoomState(session.roomId),
      );
    });

    socket.on(guessTheDrawClientEvents.startGame, () => {
      const currentRoomState = sessionStore.getRoomState(session.roomId);
      const players = currentRoomState?.players ?? [];
      const drawerId = players[0]?.id ?? session.playerId;
      const round = createInitialRound(drawerId);

      sessionStore.setRoomState(session.roomId, {
        status: "drawing",
        drawerId,
      });
      sessionStore.setRound(session.roomId, round);

      emitToRoom(
        io,
        session.roomId,
        guessTheDrawServerEvents.gameStarted,
        sessionStore.getRoomState(session.roomId),
      );
      emitToRoom(
        io,
        session.roomId,
        guessTheDrawServerEvents.turnStarted,
        round,
      );
    });

    socket.on(guessTheDrawClientEvents.sendStroke, (payload: Stroke) => {
      const strokes = sessionStore.addStroke(session.roomId, {
        ...payload,
        byPlayerId: session.playerId,
      });

      emitToRoom(
        io,
        session.roomId,
        guessTheDrawServerEvents.canvasUpdated,
        strokes,
      );
    });

    socket.on(guessTheDrawClientEvents.clearCanvas, () => {
      const strokes = sessionStore.clearStrokes(session.roomId);

      emitToRoom(
        io,
        session.roomId,
        guessTheDrawServerEvents.canvasUpdated,
        strokes,
      );
    });

    socket.on(
      guessTheDrawClientEvents.submitGuess,
      (payload: { guess: string }) => {
        const message: Message = {
          playerId: session.playerId,
          message: payload.guess,
          username:
            session.metadata?.username ??
            session.metadata?.playerName ??
            session.playerId,
          guessed: false,
        };

        sessionStore.addMessage(session.roomId, message);
        emitToRoom(
          io,
          session.roomId,
          guessTheDrawServerEvents.chatMessage,
          message,
        );
        emitToRoom(
          io,
          session.roomId,
          guessTheDrawServerEvents.roomState,
          sessionStore.getRoomState(session.roomId),
        );
      },
    );

    socket.on("disconnect", () => {
      const detached = sessionStore.detachSocket(socket.id);

      if (!detached) {
        return;
      }

      emitToRoom(
        io,
        detached.roomId,
        guessTheDrawServerEvents.playerLeft,
        sessionStore.getRoomState(detached.roomId),
      );
    });
  });

  return {
    io,
    sessionStore,
  };
}
