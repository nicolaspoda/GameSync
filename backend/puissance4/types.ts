import type { Server as SocketIoServer } from "socket.io";

export type Puissance4Cell = "RED" | "YELLOW" | null;
export type Puissance4PlayerColor = Exclude<Puissance4Cell, null>;
export type Puissance4Winner = Puissance4PlayerColor | "DRAW" | null;
export type Puissance4Board = Puissance4Cell[][];

export type Puissance4Player = {
  id: string;
  name: string;
  color?: Puissance4PlayerColor;
};

export type Puissance4GameState = {
  board: Puissance4Board;
  currentPlayer: Puissance4PlayerColor;
  winner: Puissance4Winner;
  lastMoveAt: number;
};

export type Puissance4Room = {
  code: string;
  name: string;
  isPrivate: boolean;
  players: Puissance4Player[];
  gameState: Puissance4GameState;
};

export type Puissance4RoomStatePayload = Puissance4GameState & {
  players: Puissance4Player[];
};

export type JoinPuissance4RoomPayload = {
  roomCode?: string;
  playerId?: string;
};

export type LeavePuissance4RoomPayload = {
  roomCode?: string;
  playerId?: string;
};

export type Puissance4ClickColumnPayload = {
  roomCode?: string;
  columnIndex: number;
};

export type Puissance4RestartPayload = {
  roomCode?: string;
};

export type Puissance4SocketData = {
  roomCode?: string;
  playerId?: string;
};

export type Puissance4AppWithIo = {
  get(name: "io"): SocketIoServer | undefined;
};

export type Puissance4Timeout = ReturnType<typeof setTimeout>;
