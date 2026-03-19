import { useCallback, useEffect, useRef, useState } from "react";

import {
  connectTicTacToeSocket,
  emitPlayMove,
  emitPlayerReady,
  emitRestart,
  ticTacToeServerEvents,
} from "@/games/tic-tac-toe/socket";
import type {
  RoomJoinedPayload,
  SocketErrorPayload,
  TicTacToeRoomState,
  TicTacToeSession,
} from "@/games/tic-tac-toe/socket";

// ─── State shape ──────────────────────────────────────────────────────────────

export type GameState = {
  room:         TicTacToeRoomState | null;
  selfPlayerId: string | null;
  error:        SocketErrorPayload | null;
  isConnected:  boolean;
};

const initialState: GameState = {
  room:         null,
  selfPlayerId: null,
  error:        null,
  isConnected:  false,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGame(session: TicTacToeSession | null) {
  const [state, setState] = useState<GameState>(initialState);
  const hasEmittedReady   = useRef(false);

  useEffect(() => {
    if (!session) return;

    const socket = connectTicTacToeSocket(session);

    // ── Connexion ────────────────────────────────────────────────────────────
    function onConnect() {
      setState((prev) => ({ ...prev, isConnected: true, error: null }));
    }

    function onDisconnect() {
      setState((prev) => ({ ...prev, isConnected: false }));
    }

    // ── Room joined (1ère connexion ou reconnexion) ──────────────────────────
    function onRoomJoined({ room, selfPlayerId }: RoomJoinedPayload) {
      setState((prev) => ({ ...prev, room, selfPlayerId }));
    }

    // ── Room state (mise à jour générique) ───────────────────────────────────
    function onRoomState(room: TicTacToeRoomState) {
      setState((prev) => ({ ...prev, room }));
    }

    // ── Game started → émet player:ready automatiquement ────────────────────
    function onGameStarted(room: TicTacToeRoomState) {
      setState((prev) => ({ ...prev, room }));

      if (!hasEmittedReady.current) {
        hasEmittedReady.current = true;
        emitPlayerReady();
      }
    }

    // ── Move played ──────────────────────────────────────────────────────────
    function onMovePlayed(room: TicTacToeRoomState) {
      setState((prev) => ({ ...prev, room }));
    }

    // ── Round finished ───────────────────────────────────────────────────────
    function onRoundFinished(room: TicTacToeRoomState) {
      setState((prev) => ({ ...prev, room }));
    }

    // ── Game finished ────────────────────────────────────────────────────────
    function onGameFinished(room: TicTacToeRoomState) {
      setState((prev) => ({ ...prev, room }));
      // Nettoie la session localStorage — la partie est terminée
      localStorage.removeItem(`tic-tac-toe:session:${room.id}`);
    }

    // ── Player reconnected ───────────────────────────────────────────────────
    function onPlayerReconnected(room: TicTacToeRoomState) {
      setState((prev) => ({ ...prev, room }));
    }

    // ── Error ────────────────────────────────────────────────────────────────
    function onError(error: SocketErrorPayload) {
      setState((prev) => ({ ...prev, error }));
    }

    // ── Register listeners ───────────────────────────────────────────────────
    socket.on("connect",                                    onConnect);
    socket.on("disconnect",                                 onDisconnect);
    socket.on(ticTacToeServerEvents.roomJoined,             onRoomJoined);
    socket.on(ticTacToeServerEvents.roomState,              onRoomState);
    socket.on(ticTacToeServerEvents.gameStarted,            onGameStarted);
    socket.on(ticTacToeServerEvents.movePlayed,             onMovePlayed);
    socket.on(ticTacToeServerEvents.roundFinished,          onRoundFinished);
    socket.on(ticTacToeServerEvents.gameFinished,           onGameFinished);
    socket.on(ticTacToeServerEvents.playerReconnected,      onPlayerReconnected);
    socket.on(ticTacToeServerEvents.error,                  onError);

    return () => {
      socket.off("connect",                               onConnect);
      socket.off("disconnect",                            onDisconnect);
      socket.off(ticTacToeServerEvents.roomJoined,        onRoomJoined);
      socket.off(ticTacToeServerEvents.roomState,         onRoomState);
      socket.off(ticTacToeServerEvents.gameStarted,       onGameStarted);
      socket.off(ticTacToeServerEvents.movePlayed,        onMovePlayed);
      socket.off(ticTacToeServerEvents.roundFinished,     onRoundFinished);
      socket.off(ticTacToeServerEvents.gameFinished,      onGameFinished);
      socket.off(ticTacToeServerEvents.playerReconnected, onPlayerReconnected);
      socket.off(ticTacToeServerEvents.error,             onError);
    };
  }, [session]);

  // ─── Actions exposées ──────────────────────────────────────────────────────

  const playMove = useCallback((index: number) => {
    emitPlayMove(index);
  }, []);

  const restart = useCallback(() => {
    hasEmittedReady.current = false;
    emitRestart();
  }, []);

  return { ...state, playMove, restart };
}