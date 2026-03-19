"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGuessTheDrawRoomRegistry = createGuessTheDrawRoomRegistry;
const node_crypto_1 = require("node:crypto");
function createRoomId() {
    return (0, node_crypto_1.randomUUID)().slice(0, 6).toUpperCase();
}
function createGuessTheDrawRoomRegistry(sessionStore) {
    const rooms = new Map();
    function createRoom(input) {
        let roomId = createRoomId();
        while (rooms.has(roomId)) {
            roomId = createRoomId();
        }
        const room = {
            id: roomId,
            visibility: input.visibility,
            maxPlayers: input.maxPlayers,
            maxRounds: input.maxRounds,
            createdAt: Date.now(),
        };
        rooms.set(roomId, room);
        return room;
    }
    function getRoom(roomId) {
        return rooms.get(roomId) ?? null;
    }
    function findJoinablePublicRoom() {
        for (const room of rooms.values()) {
            if (room.visibility !== "public") {
                continue;
            }
            const roomState = sessionStore.getRoomState(room.id);
            const currentPlayers = roomState?.players.length ?? 0;
            if (currentPlayers < room.maxPlayers) {
                return room;
            }
        }
        return null;
    }
    return {
        createRoom,
        getRoom,
        findJoinablePublicRoom,
    };
}
