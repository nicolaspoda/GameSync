export type PlayerId   = string;
export type RoomId     = string;
export type PlayerToken = string;

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

export type TicTacToeSession = {
  roomId:   RoomId;
  playerId: PlayerId;
  token:    PlayerToken;
};

export type RoomJoinedPayload = {
  room:         TicTacToeRoomState;
  selfPlayerId: PlayerId;
};

export type SocketErrorPayload = {
  code:    string;
  message: string;
};