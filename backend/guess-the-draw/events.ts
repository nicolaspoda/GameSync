export const guessTheDrawClientEvents = {
  leaveRoom: "room:leave",
  startGame: "game:start",
  sendStroke: "draw:stroke",
  clearCanvas: "draw:clear",
  submitGuess: "chat:message",
} as const;

export const guessTheDrawServerEvents = {
  connected: "system:connected",
  roomJoined: "room:joined",
  roomState: "room:state",
  playerJoined: "player:joined",
  playerLeft: "player:left",
  gameStarted: "game:started",
  gameEnded: "game:ended",
  turnStarted: "turn:started",
  turnEnded: "turn:ended",
  canvasUpdated: "draw:update",
  chatMessage: "chat:message",
  error: "error:game",
} as const;

export type GuessTheDrawClientEvent =
  (typeof guessTheDrawClientEvents)[keyof typeof guessTheDrawClientEvents];

export type GuessTheDrawServerEvent =
  (typeof guessTheDrawServerEvents)[keyof typeof guessTheDrawServerEvents];
