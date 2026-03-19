import express, { type Request, type Response, type Router } from "express";
import type { Server as SocketIoServer } from "socket.io";

import {
  cancelRoomDeletion,
  createInitialGameState,
  generateRoomCode,
  getOrCreateWaitingRoom,
  rooms,
} from "./game";
import type {
  Puissance4AppWithIo,
  Puissance4Player,
  Puissance4Room,
  Puissance4RoomStatePayload,
} from "./types";

type JoinRandomRoomBody = {
  username?: string;
};

type CreatePrivateRoomBody = {
  username?: string;
  roomName?: string;
};

type JoinRoomByCodeBody = {
  username?: string;
  roomCode?: string;
};

function getIo(request: Request): SocketIoServer | undefined {
  return (request.app as unknown as Puissance4AppWithIo).get("io");
}

function emitRoomState(io: SocketIoServer | undefined, room: Puissance4Room): void {
  if (!io) return;

  const payload: Puissance4RoomStatePayload = {
    ...room.gameState,
    players: room.players,
  };
  io.to(room.code).emit("puissance4GameStateUpdate", payload);
}

function createPlayerId(): string {
  return `p${Date.now()}${Math.random().toString(16).slice(2)}`;
}

export const puissance4Router: Router = express.Router();

puissance4Router.post(
  "/join-random-room",
  (request: Request<{}, {}, JoinRandomRoomBody>, response: Response) => {
    const { username } = request.body;
    if (!username) {
      response.status(400).json({ error: "Pseudo requis." });
      return;
    }

    const room = getOrCreateWaitingRoom();
    cancelRoomDeletion(room.code);
    const playerId = createPlayerId();
    room.players.push({ id: playerId, name: username });

    if (room.players.length === 1) {
      room.players[0].color = "RED";
    } else if (room.players.length === 2) {
      room.players[1].color = "YELLOW";
    }

    emitRoomState(getIo(request), room);

    response.json({
      roomCode: room.code,
      roomName: room.name,
      playerId,
    });
  },
);

puissance4Router.post(
  "/create-private-room",
  (request: Request<{}, {}, CreatePrivateRoomBody>, response: Response) => {
    const { username, roomName } = request.body;
    if (!username || !roomName) {
      response.status(400).json({ error: "Pseudo et nom de salle requis." });
      return;
    }

    const code = generateRoomCode();
    const room: Puissance4Room = {
      code,
      name: roomName,
      isPrivate: true,
      players: [],
      gameState: createInitialGameState(),
    };
    cancelRoomDeletion(code);

    const playerId = createPlayerId();
    room.players.push({ id: playerId, name: username, color: "RED" });
    rooms.set(code, room);

    emitRoomState(getIo(request), room);

    response.json({
      roomCode: room.code,
      roomName: room.name,
      playerId,
    });
  },
);

puissance4Router.post(
  "/join-room-by-code",
  (request: Request<{}, {}, JoinRoomByCodeBody>, response: Response) => {
    const { username, roomCode } = request.body;
    if (!username || !roomCode) {
      response.status(400).json({ error: "Pseudo et code de partie requis." });
      return;
    }

    const normalizedRoomCode = String(roomCode).trim().toUpperCase();
    const room = rooms.get(normalizedRoomCode);
    if (!room) {
      response.status(404).json({
        error:
          "Salle introuvable. Vérifie le code (6 caractères) ou recrée une salle (le serveur a peut-être redémarré).",
      });
      return;
    }
    cancelRoomDeletion(normalizedRoomCode);

    if (room.players.length >= 2) {
      response.status(400).json({ error: "Cette salle est déjà complète." });
      return;
    }

    const playerId = createPlayerId();
    const player: Puissance4Player = { id: playerId, name: username };

    if (room.players.length === 0) {
      player.color = "RED";
    } else if (room.players.length === 1) {
      const existingColor = room.players[0].color;
      player.color = !existingColor || existingColor === "RED" ? "YELLOW" : "RED";
    }

    room.players.push(player);

    const io = getIo(request);
    emitRoomState(io, room);
    if (io) {
      console.log(
        "[P4 REST] join-room-by-code: salle",
        normalizedRoomCode,
        "->",
        room.players.length,
        "joueur(s), emit OK",
      );
    } else {
      console.warn("[P4 REST] join-room-by-code: io non disponible, pas d emit");
    }

    response.json({
      roomCode: room.code,
      roomName: room.name,
      playerId,
    });
  },
);
