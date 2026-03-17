import type { Server as HttpServer } from "node:http";
import type { Express } from "express";
import type { Server, Socket } from "socket.io";

export type PlayerId = string;
export type RoomId = string;
export type PlayerToken = string;

export type GamePhase = "waiting" | "drawing" | "round-results" | "finished";

export type PlayerSummary = {
  id: PlayerId;
  usernamename: string;
  score: number;
  isHost: boolean;
  isConnected: boolean;
};

export type Round = {
  number: number;
  pointGains: Record<PlayerId, number>;
  word: string;
  wordMasked: string;
  drawerId: PlayerId;
};

export type Message = {
  playerId: PlayerId;
  message: string;
  username: string;
  guessed: boolean;
};

export type Point = {
  x: number;
  y: number;
};

export type Stroke = {
  color: string;
  size: number;
  points: Point[];
  byPlayerId: string;
};

export type RoomState = {
  id: RoomId;
  status: GamePhase;
  maxRounds: number;
  maxPlayers: number;
  round: Round;
  players: PlayerSummary[];
  drawerId: PlayerId | null;
  messages: Message[];
  strokes: Stroke[];
};

export type GuessTheDrawSessionMetadata = {
  username?: string;
  playerName?: string;
  score?: number;
  isHost?: boolean;
  maxRounds?: number;
  maxPlayers?: number;
};

export type GuessTheDrawSession = {
  roomId: RoomId;
  playerId: PlayerId;
  token: PlayerToken;
  metadata?: GuessTheDrawSessionMetadata | null;
};

export type StoredGuessTheDrawSession = {
  roomId: RoomId;
  playerId: PlayerId;
  token: PlayerToken;
  metadata: GuessTheDrawSessionMetadata | null;
  createdAt: number;
};

export type GuessTheDrawRoomStore = {
  players: Map<PlayerId, StoredGuessTheDrawSession>;
  sockets: Map<string, PlayerId>;
  state: RoomState;
};

export type GuessTheDrawSessionValidationInput = {
  roomId: RoomId;
  playerId: PlayerId;
  token: PlayerToken;
};

export type AttachSocketToSessionInput = {
  roomId: RoomId;
  playerId: PlayerId;
  socketId: string;
};

export type GuessTheDrawSocketSession = {
  roomId: RoomId;
  playerId: PlayerId;
  token: PlayerToken;
  metadata: GuessTheDrawSessionMetadata | null;
};

export type GuessTheDrawClientEventsMap = {
  "room:leave": () => void;
  "game:start": () => void;
  "draw:stroke": (payload: Stroke) => void;
  "draw:clear": () => void;
  "chat:message": (payload: { guess: string }) => void;
};

export type GuessTheDrawServerEventsMap = {
  "system:connected": () => void;
  "room:joined": (payload: { room: RoomState | null; selfPlayerId: PlayerId }) => void;
  "room:state": (payload: RoomState | null) => void;
  "player:joined": (payload: RoomState | null) => void;
  "player:left": (payload: RoomState | null) => void;
  "game:started": (payload: RoomState | null) => void;
  "game:ended": (payload: PlayerSummary[]) => void;
  "turn:started": (payload: Round) => void;
  "turn:ended": (payload: Round) => void;
  "draw:update": (payload: Stroke[]) => void;
  "chat:message": (payload: Message) => void;
  "error:game": (payload: { code: string; message: string }) => void;
};

export type GuessTheDrawSocket = Socket<
  GuessTheDrawClientEventsMap,
  GuessTheDrawServerEventsMap,
  Record<string, never>,
  { guessTheDraw?: GuessTheDrawSocketSession }
>;

export type GuessTheDrawIoServer = Server<
  GuessTheDrawClientEventsMap,
  GuessTheDrawServerEventsMap,
  Record<string, never>,
  { guessTheDraw?: GuessTheDrawSocketSession }
>;

export type GuessTheDrawSessionStore = {
  addMessage: (roomId: RoomId, message: Message) => Message[];
  addStroke: (roomId: RoomId, stroke: Stroke) => Stroke[];
  attachSocketToSession: (input: AttachSocketToSessionInput) => RoomState | null;
  clearStrokes: (roomId: RoomId) => Stroke[];
  detachSocket: (socketId: string) => { roomId: RoomId; playerId: PlayerId } | null;
  getRoomSessions: (roomId: RoomId) => StoredGuessTheDrawSession[];
  getRoomState: (roomId: RoomId) => RoomState | null;
  registerSession: (session: GuessTheDrawSession) => RoomState | null;
  revokeSession: (input: { roomId: RoomId; playerId: PlayerId }) => boolean;
  setRoomState: (roomId: RoomId, partialState: Partial<RoomState>) => RoomState | null;
  setRound: (roomId: RoomId, round: Round) => Round;
  validateSession: (
    input: GuessTheDrawSessionValidationInput,
  ) => StoredGuessTheDrawSession | null;
};

export type GuessTheDrawIoOptions = {
  corsOrigin?: string;
  path?: string;
  sessionStore?: GuessTheDrawSessionStore;
};

export type GuessTheDrawServerOptions = {
  socket?: GuessTheDrawIoOptions;
};

export type GuessTheDrawServerInstance = {
  app: Express;
  httpServer: HttpServer;
  io: GuessTheDrawIoServer;
  sessionStore: GuessTheDrawSessionStore;
};

export type GuessTheDrawSocketMiddleware = (
  socket: GuessTheDrawSocket,
  next: (err?: Error) => void,
) => void;
