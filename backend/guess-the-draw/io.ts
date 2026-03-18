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
import { getRandomGuessTheDrawWord, maskGuessTheDrawWord } from "./words";
import type {
  GuessTheDrawIoOptions,
  GuessTheDrawIoServer,
  GuessTheDrawSessionStore,
  Message,
  PlayerId,
  RoomState,
  RoomTimers,
  Round,
  Stroke,
} from "./types";

const TURN_DURATION_MS = 80_000;
const NEXT_HINT_DELAY_MS = 25_000;
const CLEANUP_DURATION_MS = 5_000;

type RoomLifecycleTimers = {
  cleanupTimeout: NodeJS.Timeout | null;
  hintTimeout: NodeJS.Timeout | null;
  turnTimeout: NodeJS.Timeout | null;
};

function normalizeGuess(value: string): string {
  return value.trim().toLowerCase();
}

function getGuesserPoints(roomState: RoomState): number {
  const turnEndsAt = roomState.timers.turnEndsAt;

  if (!turnEndsAt) {
    return 100;
  }

  const remainingSeconds = Math.max(
    1,
    Math.ceil((turnEndsAt - Date.now()) / 1000),
  );

  return remainingSeconds * 5;
}

function getDrawerPoints(guesserPoints: number): number {
  return Math.max(50, Math.floor(guesserPoints * 0.6));
}

function shouldCheckGuessAttribution(
  roomState: RoomState,
  playerId: PlayerId,
): boolean {
  return (
    roomState.status === "drawing" &&
    playerId !== roomState.round.drawerId &&
    roomState.round.pointGains[playerId] === undefined
  );
}

function haveAllGuessersFinished(roomState: RoomState): boolean {
  const eligibleGuessers = roomState.players.filter(
    (player) => player.id !== roomState.round.drawerId,
  );

  if (eligibleGuessers.length === 0) {
    return false;
  }

  return eligibleGuessers.every(
    (player) => roomState.round.pointGains[player.id] !== undefined,
  );
}

function createInitialRound(drawerId: PlayerId): Round {
  const word = getRandomGuessTheDrawWord();

  return {
    number: 1,
    pointGains: {},
    word,
    wordMasked: maskGuessTheDrawWord(word),
    drawerId,
  };
}

function createRoundForTurn(drawerId: PlayerId, roundNumber: number): Round {
  const round = createInitialRound(drawerId);
  round.number = roundNumber;
  return round;
}

function createTurnTimers(now = Date.now()): RoomTimers {
  return {
    turnEndsAt: now + TURN_DURATION_MS,
    nextHintAt: now + NEXT_HINT_DELAY_MS,
    cleanupEndsAt: null,
  };
}

function createCleanupTimers(now = Date.now()): RoomTimers {
  return {
    turnEndsAt: null,
    nextHintAt: null,
    cleanupEndsAt: now + CLEANUP_DURATION_MS,
  };
}

function revealNextHint(word: string, maskedWord: string): string {
  const revealableIndexes = word
    .split("")
    .map((character, index) => ({ character, index }))
    .filter(({ character, index }) => character !== " " && maskedWord[index] === "_");

  if (revealableIndexes.length === 0) {
    return maskedWord;
  }

  const randomIndex = Math.floor(Math.random() * revealableIndexes.length);
  const selectedHint = revealableIndexes[randomIndex];

  return maskedWord
    .split("")
    .map((character, index) =>
      index === selectedHint.index ? word[index] : character,
    )
    .join("");
}

function clearRoomLifecycleTimers(roomTimers: RoomLifecycleTimers) {
  if (roomTimers.turnTimeout) {
    clearTimeout(roomTimers.turnTimeout);
    roomTimers.turnTimeout = null;
  }

  if (roomTimers.hintTimeout) {
    clearTimeout(roomTimers.hintTimeout);
    roomTimers.hintTimeout = null;
  }

  if (roomTimers.cleanupTimeout) {
    clearTimeout(roomTimers.cleanupTimeout);
    roomTimers.cleanupTimeout = null;
  }
}

function getPublicRoomState(roomState: RoomState | null): RoomState | null {
  if (!roomState) {
    return null;
  }

  return {
    ...roomState,
    round: {
      ...roomState.round,
      word: "",
    },
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
  const roomLifecycleTimers = new Map<string, RoomLifecycleTimers>();

  function getRoomLifecycleTimers(roomId: string): RoomLifecycleTimers {
    if (!roomLifecycleTimers.has(roomId)) {
      roomLifecycleTimers.set(roomId, {
        cleanupTimeout: null,
        hintTimeout: null,
        turnTimeout: null,
      });
    }

    return roomLifecycleTimers.get(roomId)!;
  }

  function cleanupRoomIfEmpty(roomId: string) {
    if (sessionStore.getRoomSessions(roomId).length > 0) {
      return;
    }

    clearRoomLifecycleTimers(getRoomLifecycleTimers(roomId));
    roomLifecycleTimers.delete(roomId);
  }

  function getNextDrawerId(roomId: string, currentDrawerId: string | null) {
    const joinedSessions = sessionStore.getRoomSessions(roomId);

    if (joinedSessions.length === 0) {
      return null;
    }

    if (!currentDrawerId) {
      return joinedSessions[0].playerId;
    }

    const currentIndex = joinedSessions.findIndex(
      (playerSession) => playerSession.playerId === currentDrawerId,
    );

    if (currentIndex === -1) {
      return joinedSessions[0].playerId;
    }

    const nextIndex = (currentIndex + 1) % joinedSessions.length;
    return joinedSessions[nextIndex].playerId;
  }

  function getNextTurnContext(roomId: string, currentRoomState: RoomState) {
    const joinedSessions = sessionStore.getRoomSessions(roomId);

    if (joinedSessions.length === 0) {
      return null;
    }

    const currentDrawerId = currentRoomState.drawerId;
    const currentIndex = joinedSessions.findIndex(
      (playerSession) => playerSession.playerId === currentDrawerId,
    );

    if (currentIndex === -1) {
      return {
        drawerId: joinedSessions[0].playerId,
        roundNumber: currentRoomState.round.number || 1,
      };
    }

    const nextIndex = (currentIndex + 1) % joinedSessions.length;
    const wrapped = nextIndex === 0;

    return {
      drawerId: joinedSessions[nextIndex].playerId,
      roundNumber: wrapped
        ? currentRoomState.round.number + 1
        : currentRoomState.round.number,
    };
  }

  function startTurn(roomId: string, drawerId: string, roundNumber: number) {
    const roomTimers = getRoomLifecycleTimers(roomId);
    clearRoomLifecycleTimers(roomTimers);

    const round = createRoundForTurn(drawerId, roundNumber);

    sessionStore.clearStrokes(roomId);
    sessionStore.setRoomState(roomId, {
      status: "drawing",
      drawerId,
      strokes: [],
      timers: createTurnTimers(),
    });
    sessionStore.setRound(roomId, round);

    emitToRoom(
      io,
      roomId,
      guessTheDrawServerEvents.gameStarted,
      getPublicRoomState(sessionStore.getRoomState(roomId)),
    );
    emitToRoom(io, roomId, guessTheDrawServerEvents.turnStarted, round);
    emitToRoom(
      io,
      roomId,
      guessTheDrawServerEvents.roomState,
      getPublicRoomState(sessionStore.getRoomState(roomId)),
    );

    roomTimers.hintTimeout = setTimeout(() => {
      triggerHint(roomId);
    }, NEXT_HINT_DELAY_MS);

    roomTimers.turnTimeout = setTimeout(() => {
      endTurn(roomId);
    }, TURN_DURATION_MS);
  }

  function triggerHint(roomId: string) {
    const currentRoomState = sessionStore.getRoomState(roomId);

    if (!currentRoomState || currentRoomState.status !== "drawing") {
      return;
    }

    const roomTimers = getRoomLifecycleTimers(roomId);
    const nextMaskedWord = revealNextHint(
      currentRoomState.round.word,
      currentRoomState.round.wordMasked,
    );

    if (nextMaskedWord === currentRoomState.round.wordMasked) {
      sessionStore.setRoomState(roomId, {
        timers: {
          ...currentRoomState.timers,
          nextHintAt: null,
        },
      });
      emitToRoom(
        io,
        roomId,
        guessTheDrawServerEvents.roomState,
        getPublicRoomState(sessionStore.getRoomState(roomId)),
      );
      roomTimers.hintTimeout = null;
      return;
    }

    sessionStore.setRound(roomId, {
      ...currentRoomState.round,
      wordMasked: nextMaskedWord,
    });

    const updatedRoomState = sessionStore.getRoomState(roomId);
    const turnEndsAt = updatedRoomState?.timers.turnEndsAt ?? null;
    const hasTimeForAnotherHint =
      turnEndsAt !== null && turnEndsAt - Date.now() > NEXT_HINT_DELAY_MS;
    const hasMoreLettersToReveal = nextMaskedWord.includes("_");

    sessionStore.setRoomState(roomId, {
      timers: {
        turnEndsAt: updatedRoomState?.timers.turnEndsAt ?? null,
        nextHintAt:
          hasTimeForAnotherHint && hasMoreLettersToReveal
            ? Date.now() + NEXT_HINT_DELAY_MS
            : null,
        cleanupEndsAt: updatedRoomState?.timers.cleanupEndsAt ?? null,
      },
    });

    emitToRoom(
      io,
      roomId,
      guessTheDrawServerEvents.roomState,
      getPublicRoomState(sessionStore.getRoomState(roomId)),
    );

    if (hasTimeForAnotherHint && hasMoreLettersToReveal) {
      roomTimers.hintTimeout = setTimeout(() => {
        triggerHint(roomId);
      }, NEXT_HINT_DELAY_MS);
      return;
    }

    roomTimers.hintTimeout = null;
  }

  function resetGame(roomId: string) {
    const joinedSessions = sessionStore.getRoomSessions(roomId);

    for (const playerSession of joinedSessions) {
      sessionStore.setPlayerScore(roomId, playerSession.playerId, 0);
    }

    sessionStore.clearStrokes(roomId);
    sessionStore.setRoomState(roomId, {
      status: "waiting",
      drawerId: null,
      messages: [],
      strokes: [],
      timers: {
        turnEndsAt: null,
        nextHintAt: null,
        cleanupEndsAt: null,
      },
    });
  }

  function endTurn(roomId: string) {
    const currentRoomState = sessionStore.getRoomState(roomId);

    if (!currentRoomState) {
      return;
    }

    const roomTimers = getRoomLifecycleTimers(roomId);
    if (roomTimers.turnTimeout) {
      clearTimeout(roomTimers.turnTimeout);
      roomTimers.turnTimeout = null;
    }

    sessionStore.setRoomState(roomId, {
      status: "round-results",
      timers: createCleanupTimers(),
    });

    emitToRoom(
      io,
      roomId,
      guessTheDrawServerEvents.turnEnded,
      currentRoomState.round,
    );
    emitToRoom(
      io,
      roomId,
      guessTheDrawServerEvents.roomState,
      getPublicRoomState(sessionStore.getRoomState(roomId)),
    );

    roomTimers.cleanupTimeout = setTimeout(() => {
      const nextRoomState = sessionStore.getRoomState(roomId);

      if (!nextRoomState) {
        return;
      }

      const nextTurnContext = getNextTurnContext(roomId, nextRoomState);

      if (!nextTurnContext) {
        return;
      }

      if (nextTurnContext.roundNumber > nextRoomState.maxRounds) {
        sessionStore.setRoomState(roomId, {
          status: "finished",
          timers: {
            turnEndsAt: null,
            nextHintAt: null,
            cleanupEndsAt: null,
          },
        });

        emitToRoom(
          io,
          roomId,
          guessTheDrawServerEvents.gameEnded,
          nextRoomState.players,
        );
        emitToRoom(
          io,
          roomId,
          guessTheDrawServerEvents.roomState,
          getPublicRoomState(sessionStore.getRoomState(roomId)),
        );
        return;
      }

      startTurn(
        roomId,
        nextTurnContext.drawerId,
        nextTurnContext.roundNumber,
      );
    }, CLEANUP_DURATION_MS);
  }

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
      room: getPublicRoomState(roomState),
      selfPlayerId: session.playerId,
    });

    emitToRoom(
      io,
      session.roomId,
      guessTheDrawServerEvents.roomState,
      getPublicRoomState(roomState),
    );
    emitToRoom(
      io,
      session.roomId,
      guessTheDrawServerEvents.playerJoined,
      getPublicRoomState(roomState),
    );

    socket.on(guessTheDrawClientEvents.leaveRoom, () => {
      socket.leave(roomChannel);
      socket.leave(playerChannel);

      sessionStore.detachSocket(socket.id);
      sessionStore.revokeSession({
        roomId: session.roomId,
        playerId: session.playerId,
      });

      emitToRoom(
        io,
        session.roomId,
        guessTheDrawServerEvents.playerLeft,
        getPublicRoomState(sessionStore.getRoomState(session.roomId)),
      );

      cleanupRoomIfEmpty(session.roomId);
    });

    socket.on(guessTheDrawClientEvents.startGame, () => {
      resetGame(session.roomId);
      const drawerId =
        getNextDrawerId(session.roomId, null) ?? session.playerId;
      startTurn(session.roomId, drawerId, 1);
    });

    socket.on(guessTheDrawClientEvents.sendStroke, (payload: Stroke) => {
      const currentRoomState = sessionStore.getRoomState(session.roomId);

      if (!currentRoomState || currentRoomState.drawerId !== session.playerId) {
        return;
      }

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
      const currentRoomState = sessionStore.getRoomState(session.roomId);

      if (!currentRoomState || currentRoomState.drawerId !== session.playerId) {
        return;
      }

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
        const guess = payload.guess.trim();

        if (!guess) {
          return;
        }

        const currentRoomState = sessionStore.getRoomState(session.roomId);

        if (!currentRoomState) {
          return;
        }

        const shouldCheckGuess = shouldCheckGuessAttribution(
          currentRoomState,
          session.playerId,
        );
        const isCorrectGuess =
          shouldCheckGuess &&
          normalizeGuess(currentRoomState.round.word) !== "" &&
          normalizeGuess(currentRoomState.round.word) === normalizeGuess(guess);

        if (isCorrectGuess) {
          const guesserPoints = getGuesserPoints(currentRoomState);
          const drawerId = currentRoomState.round.drawerId;
          const drawerPoints = getDrawerPoints(guesserPoints);
          const currentScore =
            currentRoomState.players.find(
              (player) => player.id === session.playerId,
            )?.score ?? 0;
          const currentDrawerScore =
            currentRoomState.players.find((player) => player.id === drawerId)?.score ??
            0;
          const currentDrawerRoundGain =
            currentRoomState.round.pointGains[drawerId] ?? 0;

          sessionStore.setPointGain(
            session.roomId,
            session.playerId,
            guesserPoints,
          );
          sessionStore.setPlayerScore(
            session.roomId,
            session.playerId,
            currentScore + guesserPoints,
          );

          if (drawerId) {
            sessionStore.setPointGain(
              session.roomId,
              drawerId,
              currentDrawerRoundGain + drawerPoints,
            );
            sessionStore.setPlayerScore(
              session.roomId,
              drawerId,
              currentDrawerScore + drawerPoints,
            );
          }
        }

        const message: Message = {
          playerId: session.playerId,
          message: guess,
          username:
            session.metadata?.username ??
            session.metadata?.playerName ??
            session.playerId,
          guessed: isCorrectGuess,
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
          getPublicRoomState(sessionStore.getRoomState(session.roomId)),
        );

        const updatedRoomState = sessionStore.getRoomState(session.roomId);

        if (isCorrectGuess && updatedRoomState && haveAllGuessersFinished(updatedRoomState)) {
          endTurn(session.roomId);
        }
      },
    );

    socket.on("disconnect", () => {
      const detached = sessionStore.detachSocket(socket.id);

      if (!detached) {
        return;
      }

      sessionStore.revokeSession({
        roomId: detached.roomId,
        playerId: detached.playerId,
      });

      emitToRoom(
        io,
        detached.roomId,
        guessTheDrawServerEvents.playerLeft,
        getPublicRoomState(sessionStore.getRoomState(detached.roomId)),
      );

      cleanupRoomIfEmpty(detached.roomId);
    });
  });

  return {
    io,
    sessionStore,
  };
}
