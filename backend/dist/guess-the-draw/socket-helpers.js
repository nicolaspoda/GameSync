"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGuessTheDrawRoomChannel = getGuessTheDrawRoomChannel;
exports.getGuessTheDrawPlayerChannel = getGuessTheDrawPlayerChannel;
exports.getSocketSession = getSocketSession;
exports.emitToRoom = emitToRoom;
exports.emitToPlayer = emitToPlayer;
function getGuessTheDrawRoomChannel(roomId) {
    return `guess-the-draw:room:${roomId}`;
}
function getGuessTheDrawPlayerChannel(playerId) {
    return `guess-the-draw:player:${playerId}`;
}
function getSocketSession(socket) {
    return socket.data.guessTheDraw ?? null;
}
function emitToRoom(io, roomId, event, payload) {
    io.to(getGuessTheDrawRoomChannel(roomId)).emit(event, payload);
}
function emitToPlayer(io, playerId, event, payload) {
    io.to(getGuessTheDrawPlayerChannel(playerId)).emit(event, payload);
}
