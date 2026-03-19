export const TIC_TAC_TOE_CONFIG = {
    MAX_PLAYERS: 2,
    BOARD_SIZE: 9,
    WINNING_SCORE: 2,   // Premier à 2 victoires gagne la partie
    MAX_ROUNDS: 3,      // Best of 3
    ROOM_CLEANUP_TTL_MS: 60_000,
  } as const;
  
  export const WIN_PATTERNS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // lignes
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // colonnes
    [0, 4, 8], [2, 4, 6],             // diagonales
  ] as const;