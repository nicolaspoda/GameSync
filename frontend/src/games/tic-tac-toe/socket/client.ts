import { io, type Socket } from "socket.io-client";

import { ticTacToeClientEvents, ticTacToeServerEvents } from "./events";
import type {
  RoomJoinedPayload,
  SocketErrorPayload,
  TicTacToeRoomState,
  TicTacToeSession,
} from "./types";

// ─── Socket event maps ────────────────────────────────────────────────────────

type ServerToClientEvents = {
  [ticTacToeServerEvents.roomJoined]:        (payload: RoomJoinedPayload) => void;
  [ticTacToeServerEvents.roomState]:         (payload: TicTacToeRoomState) => void;
  [ticTacToeServerEvents.gameStarted]:       (payload: TicTacToeRoomState) => void;
  [ticTacToeServerEvents.movePlayed]:        (payload: TicTacToeRoomState) => void;
  [ticTacToeServerEvents.roundFinished]:     (payload: TicTacToeRoomState) => void;
  [ticTacToeServerEvents.gameFinished]:      (payload: TicTacToeRoomState) => void;
  [ticTacToeServerEvents.playerReconnected]: (payload: TicTacToeRoomState) => void;
  [ticTacToeServerEvents.error]:             (payload: SocketErrorPayload) => void;
};

type ClientToServerEvents = {
  [ticTacToeClientEvents.playerReady]: () => void;
  [ticTacToeClientEvents.playMove]:    (payload: { index: number }) => void;
  [ticTacToeClientEvents.restart]:     () => void;
};

export type TicTacToeSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// ─── Singleton ────────────────────────────────────────────────────────────────

let socketInstance:   TicTacToeSocket | null = null;
let socketSessionKey: string | null          = null;

function getDefaultSocketUrl() {
  if (typeof window === "undefined") return "http://localhost:3002";
  return `${window.location.protocol}//${window.location.hostname}:3002`;
}

function resolveSocketUrl() {
  return (
    import.meta.env.VITE_TIC_TAC_TOE_SOCKET_URL ?? getDefaultSocketUrl()
  );
}

function getSessionKey(session: TicTacToeSession) {
  return `${session.roomId}:${session.playerId}:${session.token}`;
}

function ensureSocketInstance(session: TicTacToeSession): TicTacToeSocket {
  const nextKey = getSessionKey(session);

  if (socketInstance && socketSessionKey === nextKey) {
    return socketInstance;
  }

  if (socketInstance) socketInstance.disconnect();

  socketInstance = io(resolveSocketUrl(), {
    autoConnect:  false,
    path:         "/tic-tac-toe/socket.io",
    transports:   ["websocket"],
    auth: {
      roomId:   session.roomId,
      playerId: session.playerId,
      token:    session.token,
    },
  });

  socketSessionKey = nextKey;
  return socketInstance;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function initializeTicTacToeSocket(session: TicTacToeSession) {
  return ensureSocketInstance(session);
}

export function connectTicTacToeSocket(session: TicTacToeSession) {
  const socket = ensureSocketInstance(session);
  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectTicTacToeSocket() {
  socketInstance?.disconnect();
}

export function getTicTacToeSocket(): TicTacToeSocket {
  if (!socketInstance) {
    throw new Error(
      "Tic Tac Toe socket not initialized. Call connectTicTacToeSocket(session) first.",
    );
  }
  return socketInstance;
}

export function resetTicTacToeSocket() {
  if (!socketInstance) return;
  socketInstance.disconnect();
  socketInstance   = null;
  socketSessionKey = null;
}

// ─── Emit helpers ─────────────────────────────────────────────────────────────

export function emitPlayerReady() {
  getTicTacToeSocket().emit(ticTacToeClientEvents.playerReady);
}

export function emitPlayMove(index: number) {
  getTicTacToeSocket().emit(ticTacToeClientEvents.playMove, { index });
}

export function emitRestart() {
  getTicTacToeSocket().emit(ticTacToeClientEvents.restart);
}