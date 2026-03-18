export type GameCatalogEntry = {
  id: string;
  title: string;
  description: string;
  accentClassName: string;
  launchPath?: string;
  status: "available" | "coming-soon";
};

export const gameCatalog: GameCatalogEntry[] = [
  {
    id: "guess-the-draw",
    title: "Guess The Draw",
    description: "A skribbl.io style party game with live drawing, guessing, and round-based scoring.",
    accentClassName:
      "bg-[radial-gradient(circle_at_top_left,_rgba(255,196,90,0.24),_transparent_52%),linear-gradient(180deg,_#fff7ea_0%,_#f4ede2_100%)]",
    launchPath: "/guess-the-draw",
    status: "available",
  },
  {
    id: "tic-tac-toe",
    title: "Tic Tac Toe",
    description: "Fast head-to-head rounds with simple rules and short matches.",
    accentClassName:
      "bg-[radial-gradient(circle_at_top_left,_rgba(115,170,255,0.22),_transparent_50%),linear-gradient(180deg,_#f6fbff_0%,_#eaf1f8_100%)]",
    status: "coming-soon",
  },
  {
    id: "hangman",
    title: "Hangman",
    description: "Classic word guessing with multiplayer twists and shared pacing.",
    accentClassName:
      "bg-[radial-gradient(circle_at_top_left,_rgba(145,210,160,0.22),_transparent_50%),linear-gradient(180deg,_#f4fbf4_0%,_#e7efe8_100%)]",
    status: "coming-soon",
  },
  {
    id: "power4",
    title: "Power 4",
    description: "A connect-four style battle with clean turns and quick rematches.",
    accentClassName:
      "bg-[radial-gradient(circle_at_top_left,_rgba(255,125,96,0.20),_transparent_52%),linear-gradient(180deg,_#fff7f2_0%,_#f3e7df_100%)]",
    status: "coming-soon",
  },
];

export function getGameById(gameId: string) {
  return gameCatalog.find((game) => game.id === gameId) ?? null;
}
