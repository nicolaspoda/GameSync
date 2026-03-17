import { randomUUID } from "node:crypto";

import type {
  GuessTheDrawRoomRecord,
  GuessTheDrawRoomRegistry,
  GuessTheDrawSessionStore,
  RoomId,
  RoomVisibility,
} from "./types";

function createRoomId(): RoomId {
  return randomUUID().slice(0, 6).toUpperCase();
}

export function createGuessTheDrawRoomRegistry(
  sessionStore: GuessTheDrawSessionStore,
): GuessTheDrawRoomRegistry {
  const rooms = new Map<RoomId, GuessTheDrawRoomRecord>();

  function createRoom(input: {
    visibility: RoomVisibility;
    maxPlayers: number;
    maxRounds: number;
  }): GuessTheDrawRoomRecord {
    let roomId = createRoomId();

    while (rooms.has(roomId)) {
      roomId = createRoomId();
    }

    const room: GuessTheDrawRoomRecord = {
      id: roomId,
      visibility: input.visibility,
      maxPlayers: input.maxPlayers,
      maxRounds: input.maxRounds,
      createdAt: Date.now(),
    };

    rooms.set(roomId, room);
    return room;
  }

  function getRoom(roomId: RoomId): GuessTheDrawRoomRecord | null {
    return rooms.get(roomId) ?? null;
  }

  function findJoinablePublicRoom(): GuessTheDrawRoomRecord | null {
    for (const room of rooms.values()) {
      if (room.visibility !== "public") {
        continue;
      }

      const roomState = sessionStore.getRoomState(room.id);
      const currentPlayers = roomState?.players.length ?? 0;

      if (currentPlayers < room.maxPlayers) {
        return room;
      }
    }

    return null;
  }

  return {
    createRoom,
    getRoom,
    findJoinablePublicRoom,
  };
}
