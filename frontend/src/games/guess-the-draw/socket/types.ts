export type PlayerId = string;
export type RoomId = string;
export type RoomCode = RoomId;
export type PlayerToken = string;

export type RoomVisibility = "public" | "private";
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

export type RoomTimers = {
  turnEndsAt: number | null;
  nextHintAt: number | null;
  cleanupEndsAt: number | null;
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
  visibility: RoomVisibility;
  status: GamePhase;
  maxRounds: number;
  maxPlayers: number;
  timers: RoomTimers;
  round: Round;
  players: PlayerSummary[];
  drawerId: PlayerId | null;
  messages: Message[];
  strokes: Stroke[];
};

export type JoinRandomRoomPayload = {
  playerName: string;
};

export type JoinPrivateRoomPayload = {
  playerName: string;
  roomCode: RoomId;
};

export type CreatePrivateRoomPayload = {
  playerName: string;
  maxPlayers: number;
  rounds: number;
};

export type ChooseWordPayload = {
  word: string;
};

export type SubmitGuessPayload = {
  guess: string;
};

export type SocketErrorPayload = {
  code: string;
  message: string;
};

export type RoomJoinedPayload = {
  room: RoomState;
  selfPlayerId: PlayerId;
};

export type ScoreUpdatedPayload = {
  players: PlayerSummary[];
};

export type GuessTheDrawSession = {
  roomId: RoomId;
  playerId: PlayerId;
  token: PlayerToken;
};
