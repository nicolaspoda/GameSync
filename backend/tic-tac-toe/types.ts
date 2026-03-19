import type { Server as HttpServer } from "node:http";
import type { Express, Router }       from "express";
import type { Server, Socket }        from "socket.io";

// ─── Primitives ───────────────────────────────────────────────────────────────

export type PlayerId    = string;
export type RoomId      = string;
export type PlayerToken = string;

// ─── Domain ───────────────────────────────────────────────────────────────────

export type TicTacToeSymbol = "X" | "O";
export type BoardCell       = TicTacToeSymbol | null;
export type Board = [
  BoardCell, BoardCell, BoardCell,
  BoardCell, BoardCell, BoardCell,
  BoardCell, BoardCell, BoardCell,
];

export type RoomStatus =
  | "WAITING_FOR_PLAYERS"
  | "STARTING"
  | "IN_PROGRESS"
  | "ROUND_FINISHED"
  | "GAME_FINISHED";

export type TicTacToePlayer = {
  id:          PlayerId;
  username:    string;
  score:       number;
  symbol:      TicTacToeSymbol;
  isConnected: boolean;
};

export type TicTacToeRound = {
  number:          number;
  board:           Board;
  currentPlayerId: PlayerId;
  pointGains:      Record<PlayerId, number>;
  winnerId?:       PlayerId | "draw";
};

export type TicTacToeRoomState = {
  id:      RoomId;
  status:  RoomStatus;
  players: TicTacToePlayer[];
  round:   TicTacToeRound;
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

export type StoredTicTacToeSession = {
  roomId:    RoomId;
  playerId:  PlayerId;
  token:     PlayerToken;
  username:  string;
  createdAt: number;
};

export type TicTacToeRoomStore = {
  players:      Map<PlayerId, StoredTicTacToeSession>;
  sockets:      Map<string, PlayerId>; // socketId → playerId
  state:        TicTacToeRoomState;
  readyPlayers: Set<PlayerId>;
  restartVotes: Set<PlayerId>;
  cleanupTimer: ReturnType<typeof setTimeout> | null;
};

export type TicTacToeSessionValidationInput = {
  roomId:   RoomId;
  playerId: PlayerId;
  token:    PlayerToken;
};

export type AttachSocketToSessionInput = {
  roomId:   RoomId;
  playerId: PlayerId;
  socketId: string;
};

export type TicTacToeSocketSession = {
  roomId:   RoomId;
  playerId: PlayerId;
  token:    PlayerToken;
};

// ─── Socket event maps ────────────────────────────────────────────────────────

export type TicTacToeClientEventsMap = {
  "player:ready":  () => void;
  "game:move":     (payload: { index: number }) => void;
  "game:restart":  () => void;
};

export type TicTacToeServerEventsMap = {
  "room:joined":        (payload: { room: TicTacToeRoomState; selfPlayerId: PlayerId }) => void;
  "room:state":         (payload: TicTacToeRoomState) => void;
  "game:started":       (payload: TicTacToeRoomState) => void;
  "game:move":          (payload: TicTacToeRoomState) => void;
  "round:finished":     (payload: TicTacToeRoomState) => void;
  "game:finished":      (payload: TicTacToeRoomState) => void;
  "player:reconnected": (payload: TicTacToeRoomState) => void;
  "error:game":         (payload: { code: string; message: string }) => void;
};

export type TicTacToeSocket = Socket<
  TicTacToeClientEventsMap,
  TicTacToeServerEventsMap,
  Record<string, never>,
  { ticTacToe?: TicTacToeSocketSession }
>;

export type TicTacToeIoServer = Server<
  TicTacToeClientEventsMap,
  TicTacToeServerEventsMap,
  Record<string, never>,
  { ticTacToe?: TicTacToeSocketSession }
>;

// ─── Session store interface ──────────────────────────────────────────────────

export type RegisterSessionInput = {
  roomId:        RoomId;
  playerId:      PlayerId;
  token:         PlayerToken;
  username:      string;
  initialState?: TicTacToeRoomState; // fourni uniquement pour le 1er joueur
};

export type TicTacToeSessionStore = {
  attachSocketToSession: (input: AttachSocketToSessionInput) => TicTacToeRoomState | null;
  cancelCleanup:         (roomId: RoomId) => void;
  detachSocket:          (socketId: string) => { roomId: RoomId; playerId: PlayerId } | null;
  getRoomState:          (roomId: RoomId) => TicTacToeRoomState | null;
  getRoomStore:          (roomId: RoomId) => TicTacToeRoomStore | null;
  markPlayerReady:       (roomId: RoomId, playerId: PlayerId) => boolean;
  registerSession:       (input: RegisterSessionInput) => TicTacToeRoomState | null;
  removeRoom:            (roomId: RoomId) => void;
  scheduleCleanup:       (roomId: RoomId, onCleanup: () => void) => void;
  setRoomState:          (roomId: RoomId, updater: (prev: TicTacToeRoomState) => TicTacToeRoomState) => TicTacToeRoomState | null;
  validateSession:       (input: TicTacToeSessionValidationInput) => StoredTicTacToeSession | null;
};

// ─── Room registry ────────────────────────────────────────────────────────────

export type TicTacToeRoomRecord = {
  id:          RoomId;
  playerCount: number;
  createdAt:   number;
};

export type TicTacToeRoomRegistry = {
  createRoom:          () => TicTacToeRoomRecord;
  deleteRoom:          (roomId: RoomId) => void;
  findJoinableRoom:    () => TicTacToeRoomRecord | null;
  getRoom:             (roomId: RoomId) => TicTacToeRoomRecord | null;
  incrementPlayerCount:(roomId: RoomId) => void;
};

// ─── Server / IO ──────────────────────────────────────────────────────────────

export type TicTacToeIoOptions = {
  corsOrigin?: string;
  path?:       string;
};

export type TicTacToeServerOptions = {
  socket?: TicTacToeIoOptions;
};

export type TicTacToeServerInstance = {
  app:          Express;
  httpServer:   HttpServer;
  io:           TicTacToeIoServer;
  sessionStore: TicTacToeSessionStore;
  roomRegistry: TicTacToeRoomRegistry;
};

export type TicTacToeSocketMiddleware = (
  socket: TicTacToeSocket,
  next: (err?: Error) => void,
) => void;

// ─── Routes ───────────────────────────────────────────────────────────────────

export type TicTacToeRoutesDependencies = {
  roomRegistry: TicTacToeRoomRegistry;
  sessionStore: TicTacToeSessionStore;
};

export type TicTacToeRoutesFactory = (
  dependencies: TicTacToeRoutesDependencies,
) => Router;

export type JoinTicTacToeRequest  = { name: string };
export type JoinTicTacToeResponse = { playerId: PlayerId; roomId: RoomId; token: PlayerToken };