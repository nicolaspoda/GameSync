import type { TicTacToeRoomState } from "@/games/tic-tac-toe/socket";

type Props = {
  room:         TicTacToeRoomState;
  selfPlayerId: string;
};

export default function RoundResult({ room, selfPlayerId }: Props) {
  const { winnerId } = room.round;

  const isDraw    = winnerId === "draw";
  const iWon      = winnerId === selfPlayerId;
  const self      = room.players.find((p) => p.id === selfPlayerId);
  const opponent  = room.players.find((p) => p.id !== selfPlayerId);

  const headline = isDraw ? "Draw!" : iWon ? "You won the round!" : "You lost the round.";
  const emoji    = isDraw ? "🤝"   : iWon ? "🎉"                 : "😤";

  return (
    <div className="rounded-[2rem] border border-black/5 bg-white/80 p-8 shadow-[0_24px_80px_rgba(30,60,114,0.08)] backdrop-blur space-y-6 text-center">
      <div className="space-y-2">
        <p className="text-5xl">{emoji}</p>
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
          {headline}
        </h2>
        <p className="text-sm text-stone-500">
          Round {room.round.number} complete · Next round starting soon…
        </p>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-4">
        {[self, opponent].map((player) => {
          if (!player) return null;
          const gain = room.round.pointGains[player.id] ?? 0;
          return (
            <div
              key={player.id}
              className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 space-y-1"
            >
              <p className="text-xs font-medium uppercase tracking-widest text-stone-500">
                {player.id === selfPlayerId ? "You" : "Opponent"}
              </p>
              <p className="text-sm font-semibold text-stone-800 truncate">
                {player.username}
              </p>
              <p className="text-2xl font-bold text-stone-900">{player.score}</p>
              {gain > 0 && (
                <p className="text-xs font-medium text-green-600">+{gain} pt</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}