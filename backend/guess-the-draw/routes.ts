import { randomUUID } from "node:crypto";

import { Router, type Request, type Response } from "express";

import type {
  CreatePrivateRoomRequest,
  GuessTheDrawAuthResponse,
  GuessTheDrawRoutesDependencies,
  JoinPrivateRoomRequest,
  JoinRandomPublicRoomRequest,
} from "./types";

function createPlayerId(): string {
  return randomUUID();
}

function createPlayerToken(): string {
  return randomUUID();
}

function isValidPlayerName(playerName: string): boolean {
  return playerName.trim().length >= 2;
}

function buildAuthResponse(roomId: string): GuessTheDrawAuthResponse {
  return {
    playerId: createPlayerId(),
    roomId,
    token: createPlayerToken(),
  };
}

export function createGuessTheDrawRoutes({
  roomRegistry,
  sessionStore,
}: GuessTheDrawRoutesDependencies) {
  const router = Router();

  router.post(
    "/rooms/public/join-random",
    (
      request: Request<unknown, unknown, JoinRandomPublicRoomRequest>,
      response: Response<GuessTheDrawAuthResponse | { error: string }>,
    ) => {
      const playerName = request.body?.playerName?.trim() ?? "";

      if (!isValidPlayerName(playerName)) {
        response
          .status(400)
          .json({ error: "Player name must be at least 2 characters long." });
        return;
      }

      const room =
        roomRegistry.findJoinablePublicRoom() ??
        roomRegistry.createRoom({
          visibility: "public",
          maxPlayers: 8,
          maxRounds: 3,
        });

      const auth = buildAuthResponse(room.id);

      sessionStore.registerSession({
        roomId: auth.roomId,
        playerId: auth.playerId,
        token: auth.token,
        metadata: {
          playerName,
          username: playerName,
          isHost: sessionStore.getRoomSessions(room.id).length === 0,
          maxPlayers: room.maxPlayers,
          maxRounds: room.maxRounds,
          visibility: room.visibility,
        },
      });

      response.status(200).json(auth);
    },
  );

  router.post(
    "/rooms/private",
    (
      request: Request<unknown, unknown, CreatePrivateRoomRequest>,
      response: Response<GuessTheDrawAuthResponse | { error: string }>,
    ) => {
      const playerName = request.body?.playerName?.trim() ?? "";
      const maxPlayers = Number(request.body?.maxPlayers);
      const rounds = Number(request.body?.rounds);

      if (!isValidPlayerName(playerName)) {
        response
          .status(400)
          .json({ error: "Player name must be at least 2 characters long." });
        return;
      }

      if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 12) {
        response
          .status(400)
          .json({ error: "maxPlayers must be an integer between 2 and 12." });
        return;
      }

      if (!Number.isInteger(rounds) || rounds < 1 || rounds > 10) {
        response
          .status(400)
          .json({ error: "rounds must be an integer between 1 and 10." });
        return;
      }

      const room = roomRegistry.createRoom({
        visibility: "private",
        maxPlayers,
        maxRounds: rounds,
      });

      const auth = buildAuthResponse(room.id);

      sessionStore.registerSession({
        roomId: auth.roomId,
        playerId: auth.playerId,
        token: auth.token,
        metadata: {
          playerName,
          username: playerName,
          isHost: true,
          maxPlayers: room.maxPlayers,
          maxRounds: room.maxRounds,
          visibility: room.visibility,
        },
      });

      response.status(201).json(auth);
    },
  );

  router.post(
    "/rooms/private/join",
    (
      request: Request<unknown, unknown, JoinPrivateRoomRequest>,
      response: Response<GuessTheDrawAuthResponse | { error: string }>,
    ) => {
      const playerName = request.body?.playerName?.trim() ?? "";
      const roomId = request.body?.roomId?.trim().toUpperCase() ?? "";

      if (!isValidPlayerName(playerName)) {
        response
          .status(400)
          .json({ error: "Player name must be at least 2 characters long." });
        return;
      }

      if (!roomId) {
        response.status(400).json({ error: "roomId is required." });
        return;
      }

      const room = roomRegistry.getRoom(roomId);

      if (!room || room.visibility !== "private") {
        response.status(404).json({ error: "Private room not found." });
        return;
      }

      const roomState = sessionStore.getRoomState(room.id);
      const currentPlayers = roomState?.players.length ?? 0;

      if (currentPlayers >= room.maxPlayers) {
        response.status(409).json({ error: "Room is full." });
        return;
      }

      const auth = buildAuthResponse(room.id);

      sessionStore.registerSession({
        roomId: auth.roomId,
        playerId: auth.playerId,
        token: auth.token,
        metadata: {
          playerName,
          username: playerName,
          isHost: false,
          maxPlayers: room.maxPlayers,
          maxRounds: room.maxRounds,
          visibility: room.visibility,
        },
      });

      response.status(200).json(auth);
    },
  );

  return router;
}
