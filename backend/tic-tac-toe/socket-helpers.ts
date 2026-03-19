import type {
    PlayerId,
    RoomId,
    TicTacToeIoServer,
    TicTacToeSocket,
    TicTacToeSocketSession,
    TicTacToeServerEventsMap,
  } from "./types.ts";
  
  // ─── Channel names ─────────────────────────────────────────────────────────────
  
  export function getTicTacToeRoomChannel(roomId: RoomId): string {
    return `tic-tac-toe:room:${roomId}`;
  }
  
  export function getTicTacToePlayerChannel(playerId: PlayerId): string {
    return `tic-tac-toe:player:${playerId}`;
  }
  
  // ─── Session accessor ──────────────────────────────────────────────────────────
  
  export function getSocketSession(
    socket: TicTacToeSocket,
  ): TicTacToeSocketSession | null {
    return socket.data.ticTacToe ?? null;
  }
  
  // ─── Types internes ────────────────────────────────────────────────────────────
  
  type EmitFn = {
    emit<Ev extends keyof TicTacToeServerEventsMap>(
      event: Ev,
      payload: Parameters<TicTacToeServerEventsMap[Ev]>[0],
    ): void;
  };
  
  // ─── Emit helpers ──────────────────────────────────────────────────────────────
  
  export function emitToRoom<Ev extends keyof TicTacToeServerEventsMap>(
    io: TicTacToeIoServer,
    roomId: RoomId,
    event: Ev,
    payload: Parameters<TicTacToeServerEventsMap[Ev]>[0],
  ): void {
    (io.to(getTicTacToeRoomChannel(roomId)) as unknown as EmitFn).emit(event, payload);
  }
  
  export function emitToPlayer<Ev extends keyof TicTacToeServerEventsMap>(
    io: TicTacToeIoServer,
    playerId: PlayerId,
    event: Ev,
    payload: Parameters<TicTacToeServerEventsMap[Ev]>[0],
  ): void {
    (io.to(getTicTacToePlayerChannel(playerId)) as unknown as EmitFn).emit(event, payload);
  }