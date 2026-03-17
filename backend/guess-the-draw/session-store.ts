import type {
  AttachSocketToSessionInput,
  GuessTheDrawRoomStore,
  GuessTheDrawSession,
  GuessTheDrawSessionStore,
  GuessTheDrawSessionValidationInput,
  Message,
  RoomId,
  RoomState,
  Round,
  Stroke,
} from "./types";

function createDefaultRound(): Round {
  return {
    number: 1,
    pointGains: {},
    word: "",
    wordMasked: "",
    drawerId: "",
  };
}

function createDefaultRoomState(roomId: RoomId): RoomState {
  return {
    id: roomId,
    status: "waiting",
    maxRounds: 3,
    maxPlayers: 8,
    round: createDefaultRound(),
    players: [],
    drawerId: null,
    messages: [],
    strokes: [],
  };
}

export function createGuessTheDrawSessionStore(): GuessTheDrawSessionStore {
  const rooms = new Map<RoomId, GuessTheDrawRoomStore>();

  function getOrCreateRoom(roomId: RoomId): GuessTheDrawRoomStore {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        players: new Map(),
        sockets: new Map(),
        state: createDefaultRoomState(roomId),
      });
    }

    return rooms.get(roomId)!;
  }

  function syncRoomPlayers(roomId: RoomId): RoomState | null {
    const room = rooms.get(roomId);

    if (!room) {
      return null;
    }

    const connectedPlayerIds = new Set(room.sockets.values());

    room.state.players = Array.from(room.players.values()).map((player) => ({
      id: player.playerId,
      usernamename:
        player.metadata?.username ??
        player.metadata?.playerName ??
        player.playerId,
      score: player.metadata?.score ?? 0,
      isHost: Boolean(player.metadata?.isHost),
      isConnected: connectedPlayerIds.has(player.playerId),
    }));

    return room.state;
  }

  function registerSession(session: GuessTheDrawSession): RoomState | null {
    const room = getOrCreateRoom(session.roomId);

    room.players.set(session.playerId, {
      token: session.token,
      playerId: session.playerId,
      roomId: session.roomId,
      metadata: session.metadata ?? null,
      createdAt: Date.now(),
    });

    if (session.metadata?.maxRounds) {
      room.state.maxRounds = session.metadata.maxRounds;
    }

    if (session.metadata?.maxPlayers) {
      room.state.maxPlayers = session.metadata.maxPlayers;
    }

    return syncRoomPlayers(session.roomId);
  }

  function validateSession(input: GuessTheDrawSessionValidationInput) {
    const room = rooms.get(input.roomId);

    if (!room) {
      return null;
    }

    const playerSession = room.players.get(input.playerId);

    if (!playerSession || playerSession.token !== input.token) {
      return null;
    }

    return playerSession;
  }

  function attachSocketToSession(
    input: AttachSocketToSessionInput,
  ): RoomState | null {
    const room = getOrCreateRoom(input.roomId);
    room.sockets.set(input.socketId, input.playerId);
    return syncRoomPlayers(input.roomId);
  }

  function detachSocket(socketId: string) {
    for (const [roomId, room] of rooms.entries()) {
      if (!room.sockets.has(socketId)) {
        continue;
      }

      const playerId = room.sockets.get(socketId)!;
      room.sockets.delete(socketId);
      syncRoomPlayers(roomId);

      if (room.players.size === 0 && room.sockets.size === 0) {
        rooms.delete(roomId);
      }

      return { roomId, playerId };
    }

    return null;
  }

  function revokeSession(input: { roomId: RoomId; playerId: string }): boolean {
    const room = rooms.get(input.roomId);

    if (!room) {
      return false;
    }

    room.players.delete(input.playerId);
    syncRoomPlayers(input.roomId);

    if (room.players.size === 0 && room.sockets.size === 0) {
      rooms.delete(input.roomId);
    }

    return true;
  }

  function getRoomSessions(roomId: RoomId) {
    const room = rooms.get(roomId);
    return room ? Array.from(room.players.values()) : [];
  }

  function getRoomState(roomId: RoomId): RoomState | null {
    const room = rooms.get(roomId);
    return room ? syncRoomPlayers(roomId) : null;
  }

  function setRoomState(
    roomId: RoomId,
    partialState: Partial<RoomState>,
  ): RoomState | null {
    const room = getOrCreateRoom(roomId);
    room.state = {
      ...room.state,
      ...partialState,
    };

    return syncRoomPlayers(roomId);
  }

  function setRound(roomId: RoomId, round: Round): Round {
    const room = getOrCreateRoom(roomId);
    room.state.round = round;
    room.state.drawerId = round.drawerId ?? null;
    return room.state.round;
  }

  function addStroke(roomId: RoomId, stroke: Stroke): Stroke[] {
    const room = getOrCreateRoom(roomId);
    room.state.strokes = [...room.state.strokes, stroke];
    return room.state.strokes;
  }

  function clearStrokes(roomId: RoomId): Stroke[] {
    const room = getOrCreateRoom(roomId);
    room.state.strokes = [];
    return room.state.strokes;
  }

  function addMessage(roomId: RoomId, message: Message): Message[] {
    const room = getOrCreateRoom(roomId);
    room.state.messages = [...room.state.messages, message];
    return room.state.messages;
  }

  return {
    addMessage,
    addStroke,
    attachSocketToSession,
    clearStrokes,
    detachSocket,
    getRoomSessions,
    getRoomState,
    registerSession,
    revokeSession,
    setRoomState,
    setRound,
    validateSession,
  };
}
