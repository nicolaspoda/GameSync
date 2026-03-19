import type { Server, Socket } from "socket.io";
import {
  createRoomState,
  generateRoomCode,
  getMaxErrors,
  getPublicState,
  getRooms,
  type PlayerNumber,
  type RoomState,
} from "./game";

type JoinRoomPayload = {
  username?: string;
  room?: string;
};

type GuessLetterPayload = {
  room: string;
  letter: string;
  playerNumber: PlayerNumber;
};

type JoinRoomResponse = {
  ok: boolean;
  error?: string;
  room?: string;
  playerNumber?: PlayerNumber;
  state?: ReturnType<typeof getPublicState>;
};

const rooms = getRooms();
const maxErrors = getMaxErrors();

export function registerHangmanSockets(io: Server): void {
  io.on("connection", (socket: Socket) => {
    socket.on(
      "joinRoom",
      (
        { username, room }: JoinRoomPayload,
        callback?: (response: JoinRoomResponse) => void,
      ) => {
        if (!username || typeof username !== "string" || !username.trim()) {
          callback?.({ ok: false, error: "INVALID_USERNAME" });
          return;
        }

        const finalRoom =
          room && typeof room === "string" && room.trim()
            ? room.trim().toUpperCase()
            : generateRoomCode();

        socket.join(finalRoom);

        let state = rooms.get(finalRoom);
        if (!state) {
          state = createRoomState();
          rooms.set(finalRoom, state);
        }

        let playerNumber: PlayerNumber = 0;
        const existingPlayers = Object.values(state.players).map(
          (player) => player.playerNumber,
        );
        if (!existingPlayers.includes(1)) playerNumber = 1;
        else if (!existingPlayers.includes(2)) playerNumber = 2;

        state.players[socket.id] = {
          username: username.trim(),
          playerNumber,
        };

        callback?.({
          ok: true,
          room: finalRoom,
          playerNumber,
          state: getPublicState(state),
        });

        io.to(finalRoom).emit("gameState", getPublicState(state));
      },
    );

    socket.on(
      "guessLetter",
      ({ room, letter, playerNumber }: GuessLetterPayload) => {
        const state = rooms.get(room);
        if (!state || state.status !== "playing") return;

        const playerInfo = state.players[socket.id];
        if (!playerInfo || playerInfo.playerNumber !== playerNumber) return;
        if (playerNumber !== 1 && playerNumber !== 2) return;
        if (state.currentPlayer !== playerNumber) return;

        const upper = typeof letter === "string" ? letter.toUpperCase() : "";
        if (!upper || !/^[A-Z]$/.test(upper)) return;
        if (state.guesses.includes(upper)) return;

        state.guesses.push(upper);

        if (!state.word.includes(upper)) {
          state.wrongCounts[playerNumber] += 1;
        }

        const allRevealed = state.word
          .split("")
          .every((character) => state?.guesses.includes(character));
        if (allRevealed) {
          state.status = "won";
          state.winner = playerNumber;
        }

        if (state.wrongCounts[playerNumber] >= maxErrors) {
          state.status = "lost";
          state.winner = playerNumber === 1 ? 2 : 1;
        }

        if (state.status === "playing") {
          state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
        }

        io.to(room).emit("gameState", getPublicState(state));
      },
    );

    socket.on("disconnecting", () => {
      for (const room of socket.rooms) {
        if (room === socket.id) continue;
        const state = rooms.get(room);
        if (!state) continue;
        removePlayerFromState(state, socket.id);
        if (Object.keys(state.players).length === 0) {
          rooms.delete(room);
        }
      }
    });
  });
}

function removePlayerFromState(state: RoomState, socketId: string): void {
  if (state.players[socketId]) {
    delete state.players[socketId];
  }
}
