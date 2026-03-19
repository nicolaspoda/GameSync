"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGuessTheDrawSessionStore = createGuessTheDrawSessionStore;
function createDefaultRound() {
    return {
        number: 1,
        pointGains: {},
        word: "",
        wordMasked: "",
        drawerId: "",
    };
}
function createDefaultTimers() {
    return {
        turnEndsAt: null,
        nextHintAt: null,
        cleanupEndsAt: null,
    };
}
function createDefaultRoomState(roomId) {
    return {
        id: roomId,
        visibility: "public",
        status: "waiting",
        maxRounds: 3,
        maxPlayers: 8,
        timers: createDefaultTimers(),
        round: createDefaultRound(),
        players: [],
        drawerId: null,
        messages: [],
        strokes: [],
    };
}
function createGuessTheDrawSessionStore() {
    const rooms = new Map();
    function getOrCreateRoom(roomId) {
        if (!rooms.has(roomId)) {
            rooms.set(roomId, {
                players: new Map(),
                sockets: new Map(),
                state: createDefaultRoomState(roomId),
            });
        }
        return rooms.get(roomId);
    }
    function syncRoomPlayers(roomId) {
        const room = rooms.get(roomId);
        if (!room) {
            return null;
        }
        const connectedPlayerIds = new Set(room.sockets.values());
        room.state.players = Array.from(room.players.values()).map((player) => ({
            id: player.playerId,
            usernamename: player.metadata?.username ??
                player.metadata?.playerName ??
                player.playerId,
            score: player.metadata?.score ?? 0,
            isHost: Boolean(player.metadata?.isHost),
            isConnected: connectedPlayerIds.has(player.playerId),
        }));
        return room.state;
    }
    function registerSession(session) {
        const room = getOrCreateRoom(session.roomId);
        room.players.set(session.playerId, {
            token: session.token,
            playerId: session.playerId,
            roomId: session.roomId,
            metadata: session.metadata ?? null,
            createdAt: Date.now(),
        });
        if (session.metadata?.maxRounds) {
            room.state.maxRounds = session.metadata.maxRounds;
        }
        if (session.metadata?.maxPlayers) {
            room.state.maxPlayers = session.metadata.maxPlayers;
        }
        if (session.metadata?.visibility) {
            room.state.visibility = session.metadata.visibility;
        }
        return syncRoomPlayers(session.roomId);
    }
    function validateSession(input) {
        const room = rooms.get(input.roomId);
        if (!room) {
            return null;
        }
        const playerSession = room.players.get(input.playerId);
        if (!playerSession || playerSession.token !== input.token) {
            return null;
        }
        return playerSession;
    }
    function attachSocketToSession(input) {
        const room = getOrCreateRoom(input.roomId);
        room.sockets.set(input.socketId, input.playerId);
        return syncRoomPlayers(input.roomId);
    }
    function detachSocket(socketId) {
        for (const [roomId, room] of rooms.entries()) {
            if (!room.sockets.has(socketId)) {
                continue;
            }
            const playerId = room.sockets.get(socketId);
            room.sockets.delete(socketId);
            syncRoomPlayers(roomId);
            if (room.players.size === 0 && room.sockets.size === 0) {
                rooms.delete(roomId);
            }
            return { roomId, playerId };
        }
        return null;
    }
    function revokeSession(input) {
        const room = rooms.get(input.roomId);
        if (!room) {
            return false;
        }
        room.players.delete(input.playerId);
        syncRoomPlayers(input.roomId);
        if (room.players.size === 0 && room.sockets.size === 0) {
            rooms.delete(input.roomId);
        }
        return true;
    }
    function setHost(roomId, playerId) {
        const room = rooms.get(roomId);
        if (!room) {
            return null;
        }
        for (const [currentPlayerId, player] of room.players.entries()) {
            room.players.set(currentPlayerId, {
                ...player,
                metadata: {
                    ...player.metadata,
                    isHost: playerId !== null && currentPlayerId === playerId,
                },
            });
        }
        return syncRoomPlayers(roomId);
    }
    function getRoomSessions(roomId) {
        const room = rooms.get(roomId);
        return room ? Array.from(room.players.values()) : [];
    }
    function getRoomState(roomId) {
        const room = rooms.get(roomId);
        return room ? syncRoomPlayers(roomId) : null;
    }
    function setRoomState(roomId, partialState) {
        const room = getOrCreateRoom(roomId);
        room.state = {
            ...room.state,
            ...partialState,
        };
        return syncRoomPlayers(roomId);
    }
    function setRound(roomId, round) {
        const room = getOrCreateRoom(roomId);
        room.state.round = round;
        room.state.drawerId = round.drawerId ?? null;
        return room.state.round;
    }
    function setPointGain(roomId, playerId, points) {
        const room = rooms.get(roomId);
        if (!room) {
            return null;
        }
        room.state.round = {
            ...room.state.round,
            pointGains: {
                ...room.state.round.pointGains,
                [playerId]: points,
            },
        };
        return room.state.round;
    }
    function setPlayerScore(roomId, playerId, score) {
        const room = rooms.get(roomId);
        if (!room) {
            return null;
        }
        const player = room.players.get(playerId);
        if (!player) {
            return null;
        }
        room.players.set(playerId, {
            ...player,
            metadata: {
                ...player.metadata,
                score,
            },
        });
        return syncRoomPlayers(roomId);
    }
    function addStroke(roomId, stroke) {
        const room = getOrCreateRoom(roomId);
        room.state.strokes = [...room.state.strokes, stroke];
        return room.state.strokes;
    }
    function clearStrokes(roomId) {
        const room = getOrCreateRoom(roomId);
        room.state.strokes = [];
        return room.state.strokes;
    }
    function addMessage(roomId, message) {
        const room = getOrCreateRoom(roomId);
        room.state.messages = [...room.state.messages, message];
        return room.state.messages;
    }
    return {
        addMessage,
        addStroke,
        attachSocketToSession,
        clearStrokes,
        detachSocket,
        getRoomSessions,
        getRoomState,
        registerSession,
        revokeSession,
        setHost,
        setPlayerScore,
        setPointGain,
        setRoomState,
        setRound,
        validateSession,
    };
}
