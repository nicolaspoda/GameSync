export const ticTacToeClientEvents = {
    playerReady: "player:ready",
    playMove:    "game:move",
    restart:     "game:restart",
  } as const;
  
  export const ticTacToeServerEvents = {
    roomJoined:        "room:joined",
    roomState:         "room:state",
    gameStarted:       "game:started",
    movePlayed:        "game:move",
    roundFinished:     "round:finished",
    gameFinished:      "game:finished",
    playerReconnected: "player:reconnected",
    error:             "error:game",
  } as const;
  
  export type TicTacToeClientEvent =
    (typeof ticTacToeClientEvents)[keyof typeof ticTacToeClientEvents];
  
  export type TicTacToeServerEvent =
    (typeof ticTacToeServerEvents)[keyof typeof ticTacToeServerEvents];