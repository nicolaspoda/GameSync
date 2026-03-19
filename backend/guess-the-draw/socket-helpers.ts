import type { GuessTheDrawServerEvent } from "./events";
import type {
  GuessTheDrawIoServer,
  GuessTheDrawSocket,
  PlayerId,
  RoomId,
} from "./types";

export function getGuessTheDrawRoomChannel(roomId: RoomId): string {
  return `guess-the-draw:room:${roomId}`;
}

export function getGuessTheDrawPlayerChannel(playerId: PlayerId): string {
  return `guess-the-draw:player:${playerId}`;
}

export function getSocketSession(socket: GuessTheDrawSocket) {
  return socket.data.guessTheDraw ?? null;
}

export function emitToRoom(
  io: GuessTheDrawIoServer,
  roomId: RoomId,
  event: GuessTheDrawServerEvent,
  payload?: any,
): void {
  io.to(getGuessTheDrawRoomChannel(roomId)).emit(event, payload);
}

export function emitToPlayer(
  io: GuessTheDrawIoServer,
  playerId: PlayerId,
  event: GuessTheDrawServerEvent,
  payload?: any,
): void {
  io.to(getGuessTheDrawPlayerChannel(playerId)).emit(event, payload);
}
