import type { Server as HttpServer } from "node:http";

import { Server } from "socket.io";

import { createTicTacToeSessionStore } from "./session-store";
import { createTicTacToeSocketAuth }   from "./socket-auth";
import {
  emitToPlayer,
  emitToRoom,
  getSocketSession,
  getTicTacToePlayerChannel,
  getTicTacToeRoomChannel,
} from "./socket-helpers";


import {
  applyMove,
  buildInitialState,
  buildRestartState,
  resolveRound,
  startNewRound,
  validateMove,
} from "./game-service";


import { ticTacToeClientEvents, ticTacToeServerEvents } from "./events";
import { TIC_TAC_TOE_CONFIG }                           from "./constants";


import type {
    TicTacToeClientEventsMap,
    TicTacToeServerEventsMap,
    TicTacToeSocketSession,
    TicTacToeIoServer,
    TicTacToeIoOptions,
    TicTacToeSessionStore,
    TicTacToeSocket,
  } from "./types";

// ─── Setup ────────────────────────────────────────────────────────────────────

export function createTicTacToeIo(
  httpServer: HttpServer,
  options: TicTacToeIoOptions = {},
): { io: TicTacToeIoServer; sessionStore: TicTacToeSessionStore } {
  const sessionStore = createTicTacToeSessionStore();

  const io = new Server<
  TicTacToeClientEventsMap,
  TicTacToeServerEventsMap,
  Record<string, never>,
  { ticTacToe?: TicTacToeSocketSession }
>(httpServer, {
  path: options.path ?? "/tic-tac-toe/socket.io",
  cors: {
    origin: options.corsOrigin ?? "*",
    methods: ["GET", "POST"],
  },
}) as TicTacToeIoServer;

  // Auth middleware
  io.use(createTicTacToeSocketAuth(sessionStore));

  io.on("connection", (socket) => {
    handleConnection(io, socket, sessionStore);
  });

  return { io, sessionStore };
}

// ─── Connection ───────────────────────────────────────────────────────────────

function handleConnection(
  io: TicTacToeIoServer,
  socket: TicTacToeSocket,
  sessionStore: TicTacToeSessionStore,
): void {
  const session = getSocketSession(socket);
  if (!session) return;

  const { roomId, playerId } = session;

  // Rejoint les channels Socket.io
  socket.join(getTicTacToeRoomChannel(roomId));
  socket.join(getTicTacToePlayerChannel(playerId));

  // Attache le socket à la session en mémoire
  const roomState = sessionStore.attachSocketToSession({
    roomId,
    playerId,
    socketId: socket.id,
  });

  if (!roomState) {
    socket.emit(ticTacToeServerEvents.error, {
      code:    "ROOM_NOT_FOUND",
      message: "Room not found.",
    });
    socket.disconnect();
    return;
  }

  const store = sessionStore.getRoomStore(roomId);
  const isReconnection = roomState.status !== "WAITING_FOR_PLAYERS";

  // ── Reconnexion ──────────────────────────────────────────────────────────
  if (isReconnection) {
    sessionStore.cancelCleanup(roomId);

    socket.emit(ticTacToeServerEvents.roomJoined, {
      room:         roomState,
      selfPlayerId: playerId,
    });

    // Prévient les autres joueurs de la room
    socket.to(getTicTacToeRoomChannel(roomId)).emit(
      ticTacToeServerEvents.playerReconnected,
      roomState,
    );
    return;
  }

  // ── Première connexion ───────────────────────────────────────────────────
  socket.emit(ticTacToeServerEvents.roomJoined, {
    room:         roomState,
    selfPlayerId: playerId,
  });

  // Vérifie si les 2 joueurs sont maintenant connectés
  const connectedPlayers = roomState.players.filter((p) => p.isConnected);

  if (connectedPlayers.length === TIC_TAC_TOE_CONFIG.MAX_PLAYERS) {
    // Passe en STARTING — attend les PLAYER_READY
    sessionStore.setRoomState(roomId, (prev) => ({
      ...prev,
      status: "STARTING",
    }));

    const updatedState = sessionStore.getRoomState(roomId)!;
    emitToRoom(io, roomId, ticTacToeServerEvents.roomState, updatedState);
  }

  // ── Événements gameplay ──────────────────────────────────────────────────
  socket.on(ticTacToeClientEvents.playerReady, () =>
    handlePlayerReady(io, socket, sessionStore, roomId, playerId),
  );

  socket.on(ticTacToeClientEvents.playMove, (payload) =>
    handlePlayMove(io, socket, sessionStore, roomId, playerId, payload.index),
  );

  socket.on(ticTacToeClientEvents.restart, () =>
    handleRestart(io, socket, sessionStore, roomId, playerId),
  );

  socket.on("disconnect", () =>
    handleDisconnect(io, socket, sessionStore),
  );
}

// ─── player:ready ─────────────────────────────────────────────────────────────

function handlePlayerReady(
  io: TicTacToeIoServer,
  socket: TicTacToeSocket,
  sessionStore: TicTacToeSessionStore,
  roomId: string,
  playerId: string,
): void {
  const state = sessionStore.getRoomState(roomId);

  if (!state || state.status !== "STARTING") {
    socket.emit(ticTacToeServerEvents.error, {
      code:    "NOT_IN_STARTING",
      message: "Game is not in starting phase.",
    });
    return;
  }

  const allReady = sessionStore.markPlayerReady(roomId, playerId);

  if (!allReady) return; // Attend l'autre joueur

  // Les 2 sont prêts → construit l'état IN_PROGRESS et démarre
  const players = state.players;
  const initialState = buildInitialState(roomId, players);

  sessionStore.setRoomState(roomId, () => initialState);

  emitToRoom(io, roomId, ticTacToeServerEvents.gameStarted, initialState);
}

// ─── game:move ────────────────────────────────────────────────────────────────

function handlePlayMove(
    io: TicTacToeIoServer,
    socket: TicTacToeSocket,
    sessionStore: TicTacToeSessionStore,
    roomId: string,
    playerId: string,
    index: number,
  ): void {
    const state = sessionStore.getRoomState(roomId);
    if (!state) return;
  
    const validation = validateMove(state, playerId, index);
    if (!validation.ok) {
      socket.emit(ticTacToeServerEvents.error, {
        code:    validation.code,
        message: validation.message,
      });
      return;
    }
  
    const afterMove    = applyMove(state, playerId, index);
    const afterResolve = resolveRound(afterMove);
  
    sessionStore.setRoomState(roomId, () => afterResolve);
    emitToRoom(io, roomId, ticTacToeServerEvents.movePlayed, afterResolve);
  
    if (afterResolve.status === "ROUND_FINISHED") {
      emitToRoom(io, roomId, ticTacToeServerEvents.roundFinished, afterResolve);
  
      // ✅ Auto-démarre le round suivant après 3 secondes
      setTimeout(() => {
        const current = sessionStore.getRoomState(roomId);
        if (!current || current.status !== "ROUND_FINISHED") return;
  
        const nextRound = startNewRound(current);
        sessionStore.setRoomState(roomId, () => nextRound);
        emitToRoom(io, roomId, ticTacToeServerEvents.gameStarted, nextRound);
      }, 3000);
  
      return;
    }
  
    if (afterResolve.status === "GAME_FINISHED") {
      emitToRoom(io, roomId, ticTacToeServerEvents.gameFinished, afterResolve);
  
      sessionStore.scheduleCleanup(roomId, () => {
        console.log(`Room ${roomId} cleaned up after game finished.`);
      });
    }
  }

// ─── game:restart ─────────────────────────────────────────────────────────────
function handleRestart(
    io: TicTacToeIoServer,
    socket: TicTacToeSocket,
    sessionStore: TicTacToeSessionStore,
    roomId: string,
    playerId: string,
  ): void {
    const state = sessionStore.getRoomState(roomId);
  
    if (!state || state.status !== "GAME_FINISHED") {
      socket.emit(ticTacToeServerEvents.error, {
        code:    "NOT_GAME_FINISHED",
        message: "Cannot restart a game that is not finished.",
      });
      return;
    }
  
    const store = sessionStore.getRoomStore(roomId);
    if (!store) return;
  
    // ✅ Premier joueur qui clique redémarre immédiatement
    sessionStore.cancelCleanup(roomId);
    store.restartVotes.clear();
    store.readyPlayers.clear();
  
    const restartState = buildRestartState(state);
    sessionStore.setRoomState(roomId, () => restartState);
    emitToRoom(io, roomId, ticTacToeServerEvents.gameStarted, restartState);
  }

// ─── disconnect ───────────────────────────────────────────────────────────────

function handleDisconnect(
  io: TicTacToeIoServer,
  socket: TicTacToeSocket,
  sessionStore: TicTacToeSessionStore,
): void {
  const result = sessionStore.detachSocket(socket.id);
  if (!result) return;

  const { roomId, playerId } = result;
  const state = sessionStore.getRoomState(roomId);
  if (!state) return;

  // Informe la room
  emitToRoom(io, roomId, ticTacToeServerEvents.roomState, state);

  // Si la partie est en cours → planifie le cleanup
  // Le joueur a ROOM_CLEANUP_TTL_MS pour se reconnecter
  if (
    state.status === "IN_PROGRESS" ||
    state.status === "STARTING"
  ) {
    sessionStore.scheduleCleanup(roomId, () => {
      emitToRoom(io, roomId, ticTacToeServerEvents.gameFinished, {
        ...state,
        status: "GAME_FINISHED",
      });
    });
  }
}