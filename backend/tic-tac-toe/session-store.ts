import { TIC_TAC_TOE_CONFIG } from "./constants.ts";
import type {
  AttachSocketToSessionInput,
  PlayerId,
  RegisterSessionInput,
  RoomId,
  TicTacToeRoomState,
  TicTacToeRoomStore,
  TicTacToeSessionStore,
  TicTacToeSessionValidationInput,
  StoredTicTacToeSession,
} from "./types.ts";

export function createTicTacToeSessionStore(): TicTacToeSessionStore {
  const rooms = new Map<RoomId, TicTacToeRoomStore>();

  // ─── Helpers privés ────────────────────────────────────────────────────────

  function getStore(roomId: RoomId): TicTacToeRoomStore | null {
    return rooms.get(roomId) ?? null;
  }

  function syncPlayersIntoState(store: TicTacToeRoomStore): void {
    store.state.players = Array.from(store.players.values()).map((session) => {
      const existing = store.state.players.find((p) => p.id === session.playerId);
      return {
        id:          session.playerId,
        username:    session.username,
        score:       existing?.score   ?? 0,
        symbol:      existing?.symbol  ?? (store.players.size === 1 ? "X" : "O"),
        isConnected: existing?.isConnected ?? false,
      };
    });
  }

  // ─── API publique ──────────────────────────────────────────────────────────

  function registerSession(input: RegisterSessionInput): TicTacToeRoomState | null {
    const { roomId, playerId, token, username, initialState } = input;

    // Crée la room en mémoire si c'est le 1er joueur
    if (!rooms.has(roomId)) {
      if (!initialState) return null;

      rooms.set(roomId, {
        players:      new Map(),
        sockets:      new Map(),
        readyPlayers: new Set(),
        restartVotes: new Set(),
        cleanupTimer: null,
        state:        initialState,
      });
    }

    const store = rooms.get(roomId)!;

    // Vérifie que la room n'est pas pleine (anti race-condition)
    if (
      store.players.size >= TIC_TAC_TOE_CONFIG.MAX_PLAYERS &&
      !store.players.has(playerId)
    ) {
      return null;
    }

    store.players.set(playerId, {
      roomId,
      playerId,
      token,
      username,
      createdAt: Date.now(),
    });

    syncPlayersIntoState(store);

    return store.state;
  }

  function validateSession(
    input: TicTacToeSessionValidationInput,
  ): StoredTicTacToeSession | null {
    const { roomId, playerId, token } = input;
    const store = getStore(roomId);
    if (!store) return null;

    const session = store.players.get(playerId);
    if (!session || session.token !== token) return null;

    return session;
  }

  function attachSocketToSession(
    input: AttachSocketToSessionInput,
  ): TicTacToeRoomState | null {
    const { roomId, playerId, socketId } = input;
    const store = getStore(roomId);
    if (!store) return null;

    // Nettoie l'ancien socket du joueur si reconnexion
    for (const [sid, pid] of store.sockets.entries()) {
      if (pid === playerId) {
        store.sockets.delete(sid);
        break;
      }
    }

    store.sockets.set(socketId, playerId);

    // Marque le joueur comme connecté
    const player = store.state.players.find((p) => p.id === playerId);
    if (player) player.isConnected = true;

    return store.state;
  }

  function detachSocket(
    socketId: string,
  ): { roomId: RoomId; playerId: PlayerId } | null {
    for (const [roomId, store] of rooms.entries()) {
      const playerId = store.sockets.get(socketId);
      if (!playerId) continue;

      store.sockets.delete(socketId);

      const player = store.state.players.find((p) => p.id === playerId);
      if (player) player.isConnected = false;

      return { roomId, playerId };
    }

    return null;
  }

  function getRoomState(roomId: RoomId): TicTacToeRoomState | null {
    return getStore(roomId)?.state ?? null;
  }

  function getRoomStore(roomId: RoomId): TicTacToeRoomStore | null {
    return getStore(roomId);
  }

  function setRoomState(
    roomId: RoomId,
    updater: (prev: TicTacToeRoomState) => TicTacToeRoomState,
  ): TicTacToeRoomState | null {
    const store = getStore(roomId);
    if (!store) return null;

    store.state = updater(store.state);
    return store.state;
  }

  function markPlayerReady(roomId: RoomId, playerId: PlayerId): boolean {
    const store = getStore(roomId);
    if (!store) return false;

    store.readyPlayers.add(playerId);
    return store.readyPlayers.size === TIC_TAC_TOE_CONFIG.MAX_PLAYERS;
  }

  function scheduleCleanup(roomId: RoomId, onCleanup: () => void): void {
    const store = getStore(roomId);
    if (!store) return;

    // Évite les timers en double
    if (store.cleanupTimer) clearTimeout(store.cleanupTimer);

    store.cleanupTimer = setTimeout(() => {
      rooms.delete(roomId);
      onCleanup();
    }, TIC_TAC_TOE_CONFIG.ROOM_CLEANUP_TTL_MS);
  }

  function cancelCleanup(roomId: RoomId): void {
    const store = getStore(roomId);
    if (!store?.cleanupTimer) return;

    clearTimeout(store.cleanupTimer);
    store.cleanupTimer = null;
  }

  function removeRoom(roomId: RoomId): void {
    const store = getStore(roomId);
    if (store?.cleanupTimer) clearTimeout(store.cleanupTimer);
    rooms.delete(roomId);
  }

  return {
    attachSocketToSession,
    cancelCleanup,
    detachSocket,
    getRoomState,
    getRoomStore,
    markPlayerReady,
    registerSession,
    removeRoom,
    scheduleCleanup,
    setRoomState,
    validateSession,
  };
}