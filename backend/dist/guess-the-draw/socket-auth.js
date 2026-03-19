"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGuessTheDrawSocketAuth = createGuessTheDrawSocketAuth;
function createGuessTheDrawSocketAuth(sessionStore) {
    return function guessTheDrawSocketAuth(socket, next) {
        const { roomId, playerId, token } = socket.handshake.auth ?? {};
        if (typeof roomId !== "string" ||
            typeof playerId !== "string" ||
            typeof token !== "string") {
            next(new Error("Missing roomId, playerId or token in socket auth payload."));
            return;
        }
        const session = sessionStore.validateSession({ roomId, playerId, token });
        if (!session) {
            next(new Error("Invalid Guess The Draw session."));
            return;
        }
        socket.data.guessTheDraw = {
            roomId,
            playerId,
            token,
            metadata: session.metadata ?? null,
        };
        next();
    };
}
