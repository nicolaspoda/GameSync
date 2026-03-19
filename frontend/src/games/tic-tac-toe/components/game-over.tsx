import { Button } from "@/components/ui/button";
import type { TicTacToeRoomState } from "@/games/tic-tac-toe/socket";
import SymbolAvatar, { getSymbolLabel } from "./symbol-avatar";

type Props = {
  room:         TicTacToeRoomState;
  selfPlayerId: string;
  onRestart:    () => void;
  onLeave:      () => void;
};

export default function GameOver({ room, selfPlayerId, onRestart, onLeave }: Props) {
  const self   = room.players.find((p) => p.id === selfPlayerId);
  const opponent = room.players.find((p) => p.id !== selfPlayerId);
  const isDraw = room.players[0]?.score === room.players[1]?.score;
  const winner = isDraw ? null : room.players.reduce((a, b) => (a.score > b.score ? a : b));
  const iWon   = winner?.id === selfPlayerId;

  const headline = isDraw ? "It's a draw!" : iWon ? "You win! 🏆" : "You lose! 😤";
  const emoji    = isDraw ? "🤝"           : iWon ? "🎉"          : "😤";

  return (
    <div className="rounded-[2rem] border border-black/5 bg-white/80 p-8 shadow-[0_24px_80px_rgba(30,60,114,0.08)] backdrop-blur space-y-6 text-center">
      <div className="space-y-2">
        <p className="text-5xl">{emoji}</p>
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">{headline}</h2>
        <p className="text-sm text-stone-500">Match over</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[self, opponent].map((player) => {
          if (!player) return null;
          const isWinner = winner?.id === player.id;
          return (
            <div
              key={player.id}
              className={`rounded-2xl border p-4 space-y-1 ${
                isWinner ? "border-blue-300 bg-blue-50" : "border-stone-200 bg-stone-50/80"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-widest text-stone-500">
                {player.id === selfPlayerId ? "You" : "Opponent"}
              </p>
              <div className="flex items-center justify-center gap-2">
                <SymbolAvatar symbol={player.symbol} className="size-10" />
                <div className="min-w-0 text-left">
                  <p className="truncate text-sm font-semibold text-stone-800">
                    {player.username}
                  </p>
                  <p className="text-xs text-stone-500">
                    {getSymbolLabel(player.symbol)}
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold text-stone-900">{player.score}</p>
              {isWinner && <p className="text-xs font-medium text-blue-600">Winner</p>}
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <Button className="h-10 w-full" onClick={onRestart}>
          Play again
        </Button>
        <Button variant="outline" className="h-10 w-full" onClick={onLeave}>
          Back to lobby
        </Button>
      </div>
    </div>
  );
}
