import { useEffect, useRef } from "react";

import { connectGuessTheDrawSocket } from "./client";
import type { GuessTheDrawSocket } from "./client";
import type { GuessTheDrawSession } from "./types";

type UseGuessTheDrawSocketOptions = {
  session?: GuessTheDrawSession | null;
  autoConnect?: boolean;
};

export function useGuessTheDrawSocket(
  options: UseGuessTheDrawSocketOptions = {},
) {
  const { session = null, autoConnect = true } = options;
  const socketRef = useRef<GuessTheDrawSocket | null>(null);

  useEffect(() => {
    if (!autoConnect || !session) {
      return;
    }

    socketRef.current = connectGuessTheDrawSocket(session);
  }, [autoConnect, session]);

  return socketRef.current;
}
