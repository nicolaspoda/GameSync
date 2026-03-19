"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guessTheDrawServerEvents = exports.guessTheDrawClientEvents = void 0;
exports.guessTheDrawClientEvents = {
    leaveRoom: "room:leave",
    startGame: "game:start",
    sendStroke: "draw:stroke",
    clearCanvas: "draw:clear",
    submitGuess: "chat:message",
};
exports.guessTheDrawServerEvents = {
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
};
