"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGuessTheDrawIo = createGuessTheDrawIo;
const socket_io_1 = require("socket.io");
const events_1 = require("./events");
const session_store_1 = require("./session-store");
const socket_auth_1 = require("./socket-auth");
const socket_helpers_1 = require("./socket-helpers");
const words_1 = require("./words");
const TURN_DURATION_MS = 80_000;
const NEXT_HINT_DELAY_MS = 25_000;
const CLEANUP_DURATION_MS = 5_000;
function normalizeGuess(value) {
    return value.trim().toLowerCase();
}
function getGuesserPoints(roomState) {
    const turnEndsAt = roomState.timers.turnEndsAt;
    if (!turnEndsAt) {
        return 100;
    }
    const remainingSeconds = Math.max(1, Math.ceil((turnEndsAt - Date.now()) / 1000));
    return remainingSeconds * 5;
}
function getDrawerPoints(guesserPoints) {
    return Math.max(50, Math.floor(guesserPoints * 0.6));
}
function shouldCheckGuessAttribution(roomState, playerId) {
    return (roomState.status === "drawing" &&
        playerId !== roomState.round.drawerId &&
        roomState.round.pointGains[playerId] === undefined);
}
function haveAllGuessersFinished(roomState) {
    const eligibleGuessers = roomState.players.filter((player) => player.id !== roomState.round.drawerId);
    if (eligibleGuessers.length === 0) {
        return false;
    }
    return eligibleGuessers.every((player) => roomState.round.pointGains[player.id] !== undefined);
}
function createInitialRound(drawerId) {
    const word = (0, words_1.getRandomGuessTheDrawWord)();
    return {
        number: 1,
        pointGains: {},
        word,
        wordMasked: (0, words_1.maskGuessTheDrawWord)(word),
        drawerId,
    };
}
function createRoundForTurn(drawerId, roundNumber) {
    const round = createInitialRound(drawerId);
    round.number = roundNumber;
    return round;
}
function createEmptyRound() {
    return {
        number: 1,
        pointGains: {},
        word: "",
        wordMasked: "",
        drawerId: "",
    };
}
function createTurnTimers(now = Date.now()) {
    return {
        turnEndsAt: now + TURN_DURATION_MS,
        nextHintAt: now + NEXT_HINT_DELAY_MS,
        cleanupEndsAt: null,
    };
}
function createCleanupTimers(now = Date.now()) {
    return {
        turnEndsAt: null,
        nextHintAt: null,
        cleanupEndsAt: now + CLEANUP_DURATION_MS,
    };
}
function revealNextHint(word, maskedWord) {
    const revealableIndexes = word
        .split("")
        .map((character, index) => ({ character, index }))
        .filter(({ character, index }) => character !== " " && maskedWord[index] === "_");
    if (revealableIndexes.length === 0) {
        return maskedWord;
    }
    const randomIndex = Math.floor(Math.random() * revealableIndexes.length);
    const selectedHint = revealableIndexes[randomIndex];
    return maskedWord
        .split("")
        .map((character, index) => index === selectedHint.index ? word[index] : character)
        .join("");
}
function clearRoomLifecycleTimers(roomTimers) {
    if (roomTimers.turnTimeout) {
        clearTimeout(roomTimers.turnTimeout);
        roomTimers.turnTimeout = null;
    }
    if (roomTimers.hintTimeout) {
        clearTimeout(roomTimers.hintTimeout);
        roomTimers.hintTimeout = null;
    }
    if (roomTimers.cleanupTimeout) {
        clearTimeout(roomTimers.cleanupTimeout);
        roomTimers.cleanupTimeout = null;
    }
}
function getPublicRoomState(roomState) {
    if (!roomState) {
        return null;
    }
    return {
        ...roomState,
        round: {
            ...roomState.round,
            word: "",
        },
    };
}
function hasPlayerGuessedThisTurn(roomState, playerId) {
    return (playerId !== roomState.round.drawerId &&
        roomState.round.pointGains[playerId] !== undefined);
}
function hasViewerFinishedGuessing(roomState, viewerPlayerId) {
    return (viewerPlayerId === roomState.round.drawerId ||
        hasPlayerGuessedThisTurn(roomState, viewerPlayerId));
}
function canViewerSeeMessage(roomState, viewerPlayerId, message) {
    if (roomState.status !== "drawing") {
        return true;
    }
    if (message.playerId === roomState.round.drawerId) {
        return hasViewerFinishedGuessing(roomState, viewerPlayerId);
    }
    const senderHasGuessed = hasPlayerGuessedThisTurn(roomState, message.playerId);
    if (!senderHasGuessed) {
        return true;
    }
    return viewerPlayerId === message.playerId || hasViewerFinishedGuessing(roomState, viewerPlayerId);
}
function getVisibleRoomState(roomState, viewerPlayerId) {
    const publicRoomState = getPublicRoomState(roomState);
    if (!publicRoomState) {
        return null;
    }
    return {
        ...publicRoomState,
        messages: publicRoomState.messages.flatMap((message) => {
            const visibleMessage = getVisibleMessage(publicRoomState, viewerPlayerId, message);
            return visibleMessage ? [visibleMessage] : [];
        }),
    };
}
function getVisibleMessage(roomState, viewerPlayerId, message) {
    if (canViewerSeeMessage(roomState, viewerPlayerId, message)) {
        return message;
    }
    if (message.guessed) {
        return {
            ...message,
            message: `${message.username} has guessed`,
        };
    }
    return null;
}
function createGuessTheDrawIo(httpServer, options = {}) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: options.corsOrigin ?? "*",
        },
        path: options.path ?? "/socket.io",
    });
    const sessionStore = options.sessionStore ?? (0, session_store_1.createGuessTheDrawSessionStore)();
    const roomLifecycleTimers = new Map();
    function getRoomLifecycleTimers(roomId) {
        if (!roomLifecycleTimers.has(roomId)) {
            roomLifecycleTimers.set(roomId, {
                cleanupTimeout: null,
                hintTimeout: null,
                turnTimeout: null,
            });
        }
        return roomLifecycleTimers.get(roomId);
    }
    function cleanupRoomIfEmpty(roomId) {
        if (sessionStore.getRoomSessions(roomId).length > 0) {
            return;
        }
        clearRoomLifecycleTimers(getRoomLifecycleTimers(roomId));
        roomLifecycleTimers.delete(roomId);
    }
    function emitRoomStateToActivePlayers(roomId, event) {
        const roomState = sessionStore.getRoomState(roomId);
        for (const playerSession of sessionStore.getRoomSessions(roomId)) {
            (0, socket_helpers_1.emitToPlayer)(io, playerSession.playerId, event, getVisibleRoomState(roomState, playerSession.playerId));
        }
    }
    function emitChatMessageToActivePlayers(roomId, message) {
        const roomState = sessionStore.getRoomState(roomId);
        if (!roomState) {
            return;
        }
        for (const playerSession of sessionStore.getRoomSessions(roomId)) {
            const visibleMessage = getVisibleMessage(roomState, playerSession.playerId, message);
            if (!visibleMessage) {
                continue;
            }
            (0, socket_helpers_1.emitToPlayer)(io, playerSession.playerId, events_1.guessTheDrawServerEvents.chatMessage, visibleMessage);
        }
    }
    function getNextDrawerId(roomId, currentDrawerId) {
        const joinedSessions = sessionStore.getRoomSessions(roomId);
        if (joinedSessions.length === 0) {
            return null;
        }
        if (!currentDrawerId) {
            return joinedSessions[0].playerId;
        }
        const currentIndex = joinedSessions.findIndex((playerSession) => playerSession.playerId === currentDrawerId);
        if (currentIndex === -1) {
            return joinedSessions[0].playerId;
        }
        const nextIndex = (currentIndex + 1) % joinedSessions.length;
        return joinedSessions[nextIndex].playerId;
    }
    function getNextTurnContext(roomId, currentRoomState, previousJoinOrder) {
        const joinedSessions = sessionStore.getRoomSessions(roomId);
        if (joinedSessions.length === 0) {
            return null;
        }
        const currentDrawerId = currentRoomState.drawerId;
        const currentIndex = joinedSessions.findIndex((playerSession) => playerSession.playerId === currentDrawerId);
        if (currentIndex === -1) {
            if (currentDrawerId && previousJoinOrder?.includes(currentDrawerId)) {
                const previousIndex = previousJoinOrder.findIndex((playerId) => playerId === currentDrawerId);
                const remainingJoinOrder = previousJoinOrder.filter((playerId) => joinedSessions.some((playerSession) => playerSession.playerId === playerId));
                if (remainingJoinOrder.length > 0) {
                    const nextIndex = previousIndex % remainingJoinOrder.length;
                    const wrapped = nextIndex === 0;
                    return {
                        drawerId: remainingJoinOrder[nextIndex],
                        roundNumber: wrapped
                            ? currentRoomState.round.number + 1
                            : currentRoomState.round.number,
                    };
                }
            }
            return {
                drawerId: joinedSessions[0].playerId,
                roundNumber: currentRoomState.round.number || 1,
            };
        }
        const nextIndex = (currentIndex + 1) % joinedSessions.length;
        const wrapped = nextIndex === 0;
        return {
            drawerId: joinedSessions[nextIndex].playerId,
            roundNumber: wrapped
                ? currentRoomState.round.number + 1
                : currentRoomState.round.number,
        };
    }
    function startTurn(roomId, drawerId, roundNumber) {
        const roomTimers = getRoomLifecycleTimers(roomId);
        clearRoomLifecycleTimers(roomTimers);
        const round = createRoundForTurn(drawerId, roundNumber);
        sessionStore.clearStrokes(roomId);
        sessionStore.setRoomState(roomId, {
            status: "drawing",
            drawerId,
            messages: [],
            strokes: [],
            timers: createTurnTimers(),
        });
        sessionStore.setRound(roomId, round);
        (0, socket_helpers_1.emitToRoom)(io, roomId, events_1.guessTheDrawServerEvents.gameStarted, getPublicRoomState(sessionStore.getRoomState(roomId)));
        (0, socket_helpers_1.emitToRoom)(io, roomId, events_1.guessTheDrawServerEvents.turnStarted, round);
        emitRoomStateToActivePlayers(roomId, events_1.guessTheDrawServerEvents.roomState);
        roomTimers.hintTimeout = setTimeout(() => {
            triggerHint(roomId);
        }, NEXT_HINT_DELAY_MS);
        roomTimers.turnTimeout = setTimeout(() => {
            endTurn(roomId);
        }, TURN_DURATION_MS);
    }
    function triggerHint(roomId) {
        const currentRoomState = sessionStore.getRoomState(roomId);
        if (!currentRoomState || currentRoomState.status !== "drawing") {
            return;
        }
        const roomTimers = getRoomLifecycleTimers(roomId);
        const nextMaskedWord = revealNextHint(currentRoomState.round.word, currentRoomState.round.wordMasked);
        if (nextMaskedWord === currentRoomState.round.wordMasked) {
            sessionStore.setRoomState(roomId, {
                timers: {
                    ...currentRoomState.timers,
                    nextHintAt: null,
                },
            });
            emitRoomStateToActivePlayers(roomId, events_1.guessTheDrawServerEvents.roomState);
            roomTimers.hintTimeout = null;
            return;
        }
        sessionStore.setRound(roomId, {
            ...currentRoomState.round,
            wordMasked: nextMaskedWord,
        });
        const updatedRoomState = sessionStore.getRoomState(roomId);
        const turnEndsAt = updatedRoomState?.timers.turnEndsAt ?? null;
        const hasTimeForAnotherHint = turnEndsAt !== null && turnEndsAt - Date.now() > NEXT_HINT_DELAY_MS;
        const hasMoreLettersToReveal = nextMaskedWord.includes("_");
        sessionStore.setRoomState(roomId, {
            timers: {
                turnEndsAt: updatedRoomState?.timers.turnEndsAt ?? null,
                nextHintAt: hasTimeForAnotherHint && hasMoreLettersToReveal
                    ? Date.now() + NEXT_HINT_DELAY_MS
                    : null,
                cleanupEndsAt: updatedRoomState?.timers.cleanupEndsAt ?? null,
            },
        });
        emitRoomStateToActivePlayers(roomId, events_1.guessTheDrawServerEvents.roomState);
        if (hasTimeForAnotherHint && hasMoreLettersToReveal) {
            roomTimers.hintTimeout = setTimeout(() => {
                triggerHint(roomId);
            }, NEXT_HINT_DELAY_MS);
            return;
        }
        roomTimers.hintTimeout = null;
    }
    function resetGame(roomId) {
        const joinedSessions = sessionStore.getRoomSessions(roomId);
        const roomTimers = getRoomLifecycleTimers(roomId);
        clearRoomLifecycleTimers(roomTimers);
        for (const playerSession of joinedSessions) {
            sessionStore.setPlayerScore(roomId, playerSession.playerId, 0);
        }
        sessionStore.clearStrokes(roomId);
        sessionStore.setRoomState(roomId, {
            status: "waiting",
            drawerId: null,
            messages: [],
            strokes: [],
            round: createEmptyRound(),
            timers: {
                turnEndsAt: null,
                nextHintAt: null,
                cleanupEndsAt: null,
            },
        });
    }
    function finishGame(roomId) {
        const roomTimers = getRoomLifecycleTimers(roomId);
        clearRoomLifecycleTimers(roomTimers);
        sessionStore.setRoomState(roomId, {
            status: "finished",
            drawerId: null,
            timers: {
                turnEndsAt: null,
                nextHintAt: null,
                cleanupEndsAt: null,
            },
        });
        const finishedRoomState = sessionStore.getRoomState(roomId);
        (0, socket_helpers_1.emitToRoom)(io, roomId, events_1.guessTheDrawServerEvents.gameEnded, finishedRoomState?.players ?? []);
        emitRoomStateToActivePlayers(roomId, events_1.guessTheDrawServerEvents.roomState);
    }
    function endTurn(roomId, nextTurnOverride) {
        const currentRoomState = sessionStore.getRoomState(roomId);
        if (!currentRoomState) {
            return;
        }
        const roomTimers = getRoomLifecycleTimers(roomId);
        if (roomTimers.turnTimeout) {
            clearTimeout(roomTimers.turnTimeout);
            roomTimers.turnTimeout = null;
        }
        if (roomTimers.hintTimeout) {
            clearTimeout(roomTimers.hintTimeout);
            roomTimers.hintTimeout = null;
        }
        sessionStore.setRoomState(roomId, {
            status: "round-results",
            timers: createCleanupTimers(),
        });
        (0, socket_helpers_1.emitToRoom)(io, roomId, events_1.guessTheDrawServerEvents.turnEnded, currentRoomState.round);
        emitRoomStateToActivePlayers(roomId, events_1.guessTheDrawServerEvents.roomState);
        roomTimers.cleanupTimeout = setTimeout(() => {
            const nextRoomState = sessionStore.getRoomState(roomId);
            if (!nextRoomState) {
                return;
            }
            const nextTurnContext = nextTurnOverride ?? getNextTurnContext(roomId, nextRoomState);
            if (!nextTurnContext) {
                return;
            }
            if (nextTurnContext.roundNumber > nextRoomState.maxRounds) {
                finishGame(roomId);
                return;
            }
            startTurn(roomId, nextTurnContext.drawerId, nextTurnContext.roundNumber);
        }, CLEANUP_DURATION_MS);
    }
    function handlePlayerDeparture(roomId, playerId) {
        const previousRoomState = sessionStore.getRoomState(roomId);
        const previousJoinOrder = sessionStore
            .getRoomSessions(roomId)
            .map((playerSession) => playerSession.playerId);
        const departingPlayer = previousRoomState?.players.find((player) => player.id === playerId);
        sessionStore.revokeSession({
            roomId,
            playerId,
        });
        const remainingSessions = sessionStore.getRoomSessions(roomId);
        if (remainingSessions.length === 0) {
            cleanupRoomIfEmpty(roomId);
            return;
        }
        if (departingPlayer?.isHost) {
            sessionStore.setHost(roomId, remainingSessions[0]?.playerId ?? null);
        }
        (0, socket_helpers_1.emitToRoom)(io, roomId, events_1.guessTheDrawServerEvents.playerLeft, getPublicRoomState(sessionStore.getRoomState(roomId)));
        if (remainingSessions.length === 1 &&
            previousRoomState?.status !== "waiting") {
            finishGame(roomId);
            return;
        }
        if (previousRoomState?.status === "drawing" &&
            previousRoomState.drawerId === playerId) {
            const roomStateAfterDeparture = sessionStore.getRoomState(roomId);
            const nextTurnContext = roomStateAfterDeparture
                ? getNextTurnContext(roomId, {
                    ...roomStateAfterDeparture,
                    drawerId: previousRoomState.drawerId,
                    round: {
                        ...roomStateAfterDeparture.round,
                        drawerId: previousRoomState.round.drawerId,
                        number: previousRoomState.round.number,
                    },
                }, previousJoinOrder)
                : null;
            endTurn(roomId, nextTurnContext ?? undefined);
            return;
        }
        emitRoomStateToActivePlayers(roomId, events_1.guessTheDrawServerEvents.roomState);
    }
    io.use((0, socket_auth_1.createGuessTheDrawSocketAuth)(sessionStore));
    io.on("connection", (socket) => {
        const session = (0, socket_helpers_1.getSocketSession)(socket);
        if (!session) {
            socket.disconnect(true);
            return;
        }
        const roomChannel = (0, socket_helpers_1.getGuessTheDrawRoomChannel)(session.roomId);
        const playerChannel = (0, socket_helpers_1.getGuessTheDrawPlayerChannel)(session.playerId);
        socket.join(roomChannel);
        socket.join(playerChannel);
        const roomState = sessionStore.attachSocketToSession({
            roomId: session.roomId,
            playerId: session.playerId,
            socketId: socket.id,
        });
        socket.emit(events_1.guessTheDrawServerEvents.connected);
        socket.emit(events_1.guessTheDrawServerEvents.roomJoined, {
            room: getVisibleRoomState(roomState, session.playerId),
            selfPlayerId: session.playerId,
        });
        emitRoomStateToActivePlayers(session.roomId, events_1.guessTheDrawServerEvents.roomState);
        emitRoomStateToActivePlayers(session.roomId, events_1.guessTheDrawServerEvents.playerJoined);
        socket.on(events_1.guessTheDrawClientEvents.leaveRoom, () => {
            socket.leave(roomChannel);
            socket.leave(playerChannel);
            sessionStore.detachSocket(socket.id);
            handlePlayerDeparture(session.roomId, session.playerId);
        });
        socket.on(events_1.guessTheDrawClientEvents.startGame, () => {
            const currentRoomState = sessionStore.getRoomState(session.roomId);
            if (!currentRoomState) {
                return;
            }
            if (currentRoomState.players.length < 2) {
                socket.emit(events_1.guessTheDrawServerEvents.error, {
                    code: "not-enough-players",
                    message: "At least 2 players are required to start a game.",
                });
                return;
            }
            resetGame(session.roomId);
            if (currentRoomState.status === "finished") {
                emitRoomStateToActivePlayers(session.roomId, events_1.guessTheDrawServerEvents.roomState);
                return;
            }
            const drawerId = getNextDrawerId(session.roomId, null) ?? session.playerId;
            startTurn(session.roomId, drawerId, 1);
        });
        socket.on(events_1.guessTheDrawClientEvents.sendStroke, (payload) => {
            const currentRoomState = sessionStore.getRoomState(session.roomId);
            if (!currentRoomState || currentRoomState.drawerId !== session.playerId) {
                return;
            }
            const strokes = sessionStore.addStroke(session.roomId, {
                ...payload,
                byPlayerId: session.playerId,
            });
            (0, socket_helpers_1.emitToRoom)(io, session.roomId, events_1.guessTheDrawServerEvents.canvasUpdated, strokes);
        });
        socket.on(events_1.guessTheDrawClientEvents.clearCanvas, () => {
            const currentRoomState = sessionStore.getRoomState(session.roomId);
            if (!currentRoomState || currentRoomState.drawerId !== session.playerId) {
                return;
            }
            const strokes = sessionStore.clearStrokes(session.roomId);
            (0, socket_helpers_1.emitToRoom)(io, session.roomId, events_1.guessTheDrawServerEvents.canvasUpdated, strokes);
        });
        socket.on(events_1.guessTheDrawClientEvents.submitGuess, (payload) => {
            const guess = payload.guess.trim();
            if (!guess) {
                return;
            }
            const currentRoomState = sessionStore.getRoomState(session.roomId);
            if (!currentRoomState) {
                return;
            }
            const shouldCheckGuess = shouldCheckGuessAttribution(currentRoomState, session.playerId);
            const isCorrectGuess = shouldCheckGuess &&
                normalizeGuess(currentRoomState.round.word) !== "" &&
                normalizeGuess(currentRoomState.round.word) === normalizeGuess(guess);
            if (isCorrectGuess) {
                const guesserPoints = getGuesserPoints(currentRoomState);
                const drawerId = currentRoomState.round.drawerId;
                const drawerPoints = getDrawerPoints(guesserPoints);
                const currentScore = currentRoomState.players.find((player) => player.id === session.playerId)?.score ?? 0;
                const currentDrawerScore = currentRoomState.players.find((player) => player.id === drawerId)?.score ??
                    0;
                const currentDrawerRoundGain = currentRoomState.round.pointGains[drawerId] ?? 0;
                sessionStore.setPointGain(session.roomId, session.playerId, guesserPoints);
                sessionStore.setPlayerScore(session.roomId, session.playerId, currentScore + guesserPoints);
                if (drawerId) {
                    sessionStore.setPointGain(session.roomId, drawerId, currentDrawerRoundGain + drawerPoints);
                    sessionStore.setPlayerScore(session.roomId, drawerId, currentDrawerScore + drawerPoints);
                }
            }
            const message = {
                playerId: session.playerId,
                message: guess,
                username: session.metadata?.username ??
                    session.metadata?.playerName ??
                    session.playerId,
                guessed: isCorrectGuess,
            };
            sessionStore.addMessage(session.roomId, message);
            emitChatMessageToActivePlayers(session.roomId, message);
            emitRoomStateToActivePlayers(session.roomId, events_1.guessTheDrawServerEvents.roomState);
            const updatedRoomState = sessionStore.getRoomState(session.roomId);
            if (isCorrectGuess && updatedRoomState && haveAllGuessersFinished(updatedRoomState)) {
                endTurn(session.roomId);
            }
        });
        socket.on("disconnect", () => {
            const detached = sessionStore.detachSocket(socket.id);
            if (!detached) {
                return;
            }
            handlePlayerDeparture(detached.roomId, detached.playerId);
        });
    });
    return {
        io,
        sessionStore,
    };
}
