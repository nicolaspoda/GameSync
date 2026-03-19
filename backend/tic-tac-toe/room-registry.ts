import { randomUUID } from "node:crypto";

import { TIC_TAC_TOE_CONFIG } from "./constants";
import type {
  RoomId,
  TicTacToeRoomRecord,
  TicTacToeRoomRegistry,
} from "./types.ts";

function createRoomId(): RoomId {
  return randomUUID().slice(0, 6).toUpperCase();
}

export function createTicTacToeRoomRegistry(): TicTacToeRoomRegistry {
  const rooms = new Map<RoomId, TicTacToeRoomRecord>();

  function createRoom(): TicTacToeRoomRecord {
    let roomId = createRoomId();
    while (rooms.has(roomId)) roomId = createRoomId();

    const room: TicTacToeRoomRecord = {
      id:          roomId,
      playerCount: 0,
      createdAt:   Date.now(),
    };

    rooms.set(roomId, room);
    return room;
  }

  function getRoom(roomId: RoomId): TicTacToeRoomRecord | null {
    return rooms.get(roomId) ?? null;
  }

  // Cherche une room avec de la place — synchrone pour éviter la race condition
  function findJoinableRoom(): TicTacToeRoomRecord | null {
    for (const room of rooms.values()) {
      if (room.playerCount < TIC_TAC_TOE_CONFIG.MAX_PLAYERS) {
        return room;
      }
    }
    return null;
  }

  function incrementPlayerCount(roomId: RoomId): void {
    const room = rooms.get(roomId);
    if (room) room.playerCount += 1;
  }

  function deleteRoom(roomId: RoomId): void {
    rooms.delete(roomId);
  }

  return {
    createRoom,
    deleteRoom,
    findJoinableRoom,
    getRoom,
    incrementPlayerCount,
  };
}