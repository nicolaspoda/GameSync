import type { Server, Socket } from "socket.io";

import {
  cancelRoomDeletion,
  checkWinner,
  createInitialGameState,
  rooms,
  scheduleRoomDeletion,
} from "./game";
import type {
  JoinPuissance4RoomPayload,
  LeavePuissance4RoomPayload,
  Puissance4ClickColumnPayload,
  Puissance4Player,
  Puissance4Room,
  Puissance4RoomStatePayload,
  Puissance4SocketData,
  Puissance4RestartPayload,
} from "./types";

function normalizeRoomCode(roomCode?: string): string {
  return String(roomCode || "").trim().toUpperCase();
}

function syncRoomState(io: Server, roomCode: string): void {
  const room = rooms.get(roomCode);
  if (!room) return;

  const payload: Puissance4RoomStatePayload = {
    ...room.gameState,
    players: room.players,
  };
  io.to(roomCode).emit("puissance4GameStateUpdate", payload);
}

function removePlayerFromRoom(
  io: Server,
  params: { roomCode: string; playerId?: string },
): void {
  const { roomCode, playerId } = params;
  const room = rooms.get(roomCode);
  if (!room || !playerId) return;

  const nextPlayers = room.players.filter((candidate) => candidate.id !== playerId);
  if (nextPlayers.length === room.players.length) return;

  room.players = nextPlayers;

  if (room.players.length === 0) {
    scheduleRoomDeletion(roomCode);
    return;
  }

  room.gameState = createInitialGameState();
  syncRoomState(io, roomCode);
}

function getCurrentPlayer(room: Puissance4Room, playerId?: string): Puissance4Player | undefined {
  if (!playerId) return undefined;
  return room.players.find((candidate) => candidate.id === playerId);
}

export function registerPuissance4Sockets(io: Server): void {
  io.on("connection", (socket: Socket<any, any, any, Puissance4SocketData>) => {
    socket.on(
      "joinPuissance4Room",
      ({ roomCode, playerId }: JoinPuissance4RoomPayload = {}) => {
        const normalizedRoomCode = normalizeRoomCode(roomCode);
        if (!normalizedRoomCode) return;

        const room = rooms.get(normalizedRoomCode);
        if (!room) {
          socket.emit("puissance4RoomNotFound", { roomCode: normalizedRoomCode });
          return;
        }
        cancelRoomDeletion(normalizedRoomCode);

        socket.data.roomCode = normalizedRoomCode;
        if (playerId) {
          socket.data.playerId = playerId;
        }

        socket.join(normalizedRoomCode);
        syncRoomState(io, normalizedRoomCode);
        console.log(
          "[P4 Socket] joinPuissance4Room:",
          normalizedRoomCode,
          "playerId=",
          playerId,
          "-> salle a",
          room.players.length,
          "joueur(s)",
        );
      },
    );

    socket.on(
      "leavePuissance4Room",
      ({ roomCode, playerId }: LeavePuissance4RoomPayload = {}) => {
        const effectiveRoomCode = normalizeRoomCode(roomCode || socket.data.roomCode);
        const effectivePlayerId = playerId || socket.data.playerId;
        if (!effectiveRoomCode) return;

        socket.leave(effectiveRoomCode);
        removePlayerFromRoom(io, {
          roomCode: effectiveRoomCode,
          playerId: effectivePlayerId,
        });
      },
    );

    socket.on(
      "puissance4OnClickColumn",
      ({ roomCode, columnIndex }: Puissance4ClickColumnPayload) => {
        const normalizedRoomCode = normalizeRoomCode(roomCode);
        const room = rooms.get(normalizedRoomCode);
        if (!room || room.gameState.winner) return;
        if (room.players.length < 2) return;
        if (columnIndex < 0 || columnIndex >= room.gameState.board[0].length) return;

        const player = getCurrentPlayer(room, socket.data.playerId);
        if (!player || player.color !== room.gameState.currentPlayer) return;

        const { board, currentPlayer } = room.gameState;
        const nextBoard = board.map((row) => [...row]);

        let placed = false;
        for (let row = nextBoard.length - 1; row >= 0; row -= 1) {
          if (!nextBoard[row][columnIndex]) {
            nextBoard[row][columnIndex] = currentPlayer;
            placed = true;
            break;
          }
        }

        if (!placed) return;

        const winner = checkWinner(nextBoard);
        room.gameState = {
          board: nextBoard,
          currentPlayer: winner
            ? currentPlayer
            : currentPlayer === "RED"
              ? "YELLOW"
              : "RED",
          winner,
          lastMoveAt: Date.now(),
        };

        syncRoomState(io, normalizedRoomCode);
      },
    );

    socket.on("puissance4Restart", ({ roomCode }: Puissance4RestartPayload = {}) => {
      const normalizedRoomCode = normalizeRoomCode(roomCode);
      const room = rooms.get(normalizedRoomCode);
      if (!room) return;

      room.gameState = createInitialGameState();
      syncRoomState(io, normalizedRoomCode);
    });

    socket.on("disconnect", () => {});
  });
}
