import { useEffect, useRef } from "react";

import {
  connectTicTacToeSocket,
  initializeTicTacToeSocket,
  type TicTacToeSocket,
} from "./client";
import type { TicTacToeSession } from "./types";

type UseTicTacToeSocketOptions = {
  session?:     TicTacToeSession | null;
  autoConnect?: boolean;
};

export function useTicTacToeSocket(
  options: UseTicTacToeSocketOptions = {},
) {
  const { session = null, autoConnect = true } = options;
  const socketRef = useRef<TicTacToeSocket | null>(null);

  // Initialise de façon synchrone pour que le ref soit dispo au 1er render
  if (session && !socketRef.current) {
    socketRef.current = initializeTicTacToeSocket(session);
  }

  useEffect(() => {
    if (!autoConnect || !session) return;
    socketRef.current = connectTicTacToeSocket(session);
  }, [autoConnect, session]);

  return socketRef.current;
}