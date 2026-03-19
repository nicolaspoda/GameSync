import { randomUUID } from "node:crypto";
import { Router }     from "express";

import { buildInitialState } from "./game-service";
import type {
  JoinTicTacToeRequest,
  JoinTicTacToeResponse,
  TicTacToePlayer,
  TicTacToeRoutesFactory,
} from "./types.ts";

// Lock synchrone anti race-condition : rooms en cours d'assignation
const assignmentLock = new Set<string>();

export const createTicTacToeRoutes: TicTacToeRoutesFactory = ({
  roomRegistry,
  sessionStore,
}) => {
  const router = Router();

  /**
   * POST /tic-tac-toe/join
   * Body : { name: string }
   * Réponse : { playerId, roomId, token }
   */
  router.post("/join", (req, res) => {
    const { name } = req.body as JoinTicTacToeRequest;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "name is required." });
      return;
    }

    const username  = name.trim().slice(0, 24);
    const playerId  = randomUUID();
    const token     = randomUUID();

    // ── Trouver ou créer une room (section critique synchrone) ──────────────
    let room = roomRegistry.findJoinableRoom();

    if (!room || assignmentLock.has(room.id)) {
      // Toutes les rooms dispo sont verrouillées ou inexistantes → on en crée une
      room = roomRegistry.createRoom();
    }

    assignmentLock.add(room.id);

    try {
      const isFirstPlayer = room.playerCount === 0;
      const symbol        = isFirstPlayer ? "X" : "O";

      const player: TicTacToePlayer = {
        id:          playerId,
        username,
        score:       0,
        symbol,
        isConnected: false,
      };

      // Le 1er joueur fournit l'état initial de la room
      const initialState = isFirstPlayer
        ? {
            id:      room.id,
            status:  "WAITING_FOR_PLAYERS" as const,
            players: [player],
            round: {
              number:          1,
              board:           [null,null,null,null,null,null,null,null,null] as any,
              currentPlayerId: playerId,
              pointGains:      { [playerId]: 0 },
            },
          }
        : undefined;

      const roomState = sessionStore.registerSession({
        roomId:   room.id,
        playerId,
        token,
        username,
        initialState,
      });

      if (!roomState) {
        res.status(409).json({ error: "Room is full or unavailable." });
        return;
      }

      roomRegistry.incrementPlayerCount(room.id);

      const response: JoinTicTacToeResponse = {
        playerId,
        roomId: room.id,
        token,
      };

      res.status(200).json(response);
    } finally {
      // Libère le verrou dans tous les cas (succès ou erreur)
      assignmentLock.delete(room.id);
    }
  });

  return router;
};