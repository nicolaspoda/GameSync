import { io, type Socket } from "socket.io-client";

import { guessTheDrawClientEvents, guessTheDrawServerEvents } from "./events";
import type {
  Message,
  GuessTheDrawSession,
  Stroke,
  RoomJoinedPayload,
  RoomState,
  ScoreUpdatedPayload,
  SocketErrorPayload,
  SubmitGuessPayload,
  Round,
  PlayerSummary,
} from "./types";

type ServerToClientEvents = {
  [guessTheDrawServerEvents.connected]: () => void;
  [guessTheDrawServerEvents.roomJoined]: (payload: RoomJoinedPayload) => void;
  [guessTheDrawServerEvents.roomState]: (payload: RoomState) => void;
  [guessTheDrawServerEvents.playerJoined]: (payload: RoomState) => void;
  [guessTheDrawServerEvents.playerLeft]: (payload: RoomState) => void;
  [guessTheDrawServerEvents.gameStarted]: (payload: RoomState) => void;
  [guessTheDrawServerEvents.gameEnded]: (payload: PlayerSummary[]) => void;
  [guessTheDrawServerEvents.turnStarted]: (payload: Round) => void;
  [guessTheDrawServerEvents.turnEnded]: (payload: Round) => void;
  [guessTheDrawServerEvents.chatMessage]: (payload: Message) => void;
  [guessTheDrawServerEvents.canvasUpdated]: (payload: Stroke[]) => void;
  [guessTheDrawServerEvents.error]: (payload: SocketErrorPayload) => void;
};

type ClientToServerEvents = {
  [guessTheDrawClientEvents.leaveRoom]: () => void;
  [guessTheDrawClientEvents.startGame]: () => void;
  [guessTheDrawClientEvents.sendStroke]: (payload: Stroke) => void;
  [guessTheDrawClientEvents.clearCanvas]: () => void;
  [guessTheDrawClientEvents.submitGuess]: (payload: SubmitGuessPayload) => void;
};

export type GuessTheDrawSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

type GuessTheDrawSocketOptions = {
  url?: string;
  path?: string;
};

let socketInstance: GuessTheDrawSocket | null = null;
let socketSessionKey: string | null = null;
let socketConfigKey: string | null = null;

function getDefaultSocketUrl() {
  if (typeof window === "undefined") {
    return "http://localhost:3001";
  }

  return `${window.location.protocol}//${window.location.hostname}:3001`;
}

function resolveSocketUrl(url?: string) {
  return (
    url ??
    import.meta.env.VITE_GUESS_THE_DRAW_SOCKET_URL ??
    getDefaultSocketUrl()
  );
}

function resolveSocketPath(path?: string) {
  return (
    path ?? import.meta.env.VITE_GUESS_THE_DRAW_SOCKET_PATH ?? "/socket.io"
  );
}

function getSessionKey(session: GuessTheDrawSession) {
  return `${session.roomId}:${session.playerId}:${session.token}`;
}

function getConfigKey(options: GuessTheDrawSocketOptions = {}) {
  return `${resolveSocketUrl(options.url)}|${resolveSocketPath(options.path)}`;
}

function ensureSocketInstance(
  session: GuessTheDrawSession,
  options: GuessTheDrawSocketOptions = {},
) {
  const nextSessionKey = getSessionKey(session);
  const nextConfigKey = getConfigKey(options);

  if (
    socketInstance &&
    socketSessionKey === nextSessionKey &&
    socketConfigKey === nextConfigKey
  ) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
  }

  socketInstance = io(resolveSocketUrl(options.url), {
    autoConnect: false,
    auth: {
      roomId: session.roomId,
      playerId: session.playerId,
      token: session.token,
    },
    path: resolveSocketPath(options.path),
    transports: ["websocket"],
  });

  socketSessionKey = nextSessionKey;
  socketConfigKey = nextConfigKey;

  return socketInstance;
}

export function initializeGuessTheDrawSocket(
  session: GuessTheDrawSession,
  options: GuessTheDrawSocketOptions = {},
) {
  return ensureSocketInstance(session, options);
}

export function connectGuessTheDrawSocket(
  session: GuessTheDrawSession,
  options: GuessTheDrawSocketOptions = {},
) {
  const socket = initializeGuessTheDrawSocket(session, options);

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectGuessTheDrawSocket() {
  if (!socketInstance) {
    return;
  }

  socketInstance.disconnect();
}

export function getGuessTheDrawSocket() {
  if (!socketInstance) {
    throw new Error(
      "Guess The Draw socket has not been initialized. Call connectGuessTheDrawSocket(session) first.",
    );
  }

  return socketInstance;
}

export function resetGuessTheDrawSocket() {
  if (!socketInstance) {
    return;
  }

  socketInstance.disconnect();
  socketInstance = null;
  socketSessionKey = null;
  socketConfigKey = null;
}

export function emitGuessTheDrawEvent<
  TEvent extends keyof ClientToServerEvents,
>(event: TEvent, ...args: Parameters<ClientToServerEvents[TEvent]>) {
  const socket = getGuessTheDrawSocket();
  socket.emit(event, ...args);
}

export function leaveGuessTheDrawRoom() {
  emitGuessTheDrawEvent(guessTheDrawClientEvents.leaveRoom);
}

export function startGuessTheDrawGame() {
  emitGuessTheDrawEvent(guessTheDrawClientEvents.startGame);
}

export function sendDrawingStroke(payload: Stroke) {
  emitGuessTheDrawEvent(guessTheDrawClientEvents.sendStroke, payload);
}

export function clearDrawingCanvas() {
  emitGuessTheDrawEvent(guessTheDrawClientEvents.clearCanvas);
}

export function sendMessage(payload: SubmitGuessPayload) {
  emitGuessTheDrawEvent(guessTheDrawClientEvents.submitGuess, payload);
}
