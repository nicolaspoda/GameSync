import type { TicTacToeRoomState } from "@/games/tic-tac-toe/socket";
import SymbolAvatar, { getSymbolLabel } from "./symbol-avatar";

type Props = {
  room:         TicTacToeRoomState;
  selfPlayerId: string;
  onPlayMove:   (index: number) => void;
};

export default function GameBoard({ room, selfPlayerId, onPlayMove }: Props) {
  const { board, currentPlayerId } = room.round;
  const isMyTurn = currentPlayerId === selfPlayerId;

  const self     = room.players.find((p) => p.id === selfPlayerId);
  const opponent = room.players.find((p) => p.id !== selfPlayerId);

  return (
    <div className="space-y-6">

      {/* Scores */}
      <div className="grid grid-cols-2 gap-4">
        {[self, opponent].map((player) => {
          if (!player) return null;
          const isActive = player.id === currentPlayerId;
          return (
            <div
              key={player.id}
              className={`rounded-2xl border p-4 text-center transition-all ${
                isActive
                  ? "border-blue-300 bg-blue-50 shadow-sm"
                  : "border-stone-200 bg-white/80"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-widest text-stone-500">
                {player.id === selfPlayerId ? "You" : "Opponent"}
              </p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <SymbolAvatar symbol={player.symbol} className="size-9" />
                <div className="min-w-0 text-left">
                  <p className="truncate text-sm font-semibold text-stone-800">
                    {player.username}
                  </p>
                  <p className="text-xs text-stone-500">
                    {getSymbolLabel(player.symbol)}
                  </p>
                </div>
              </div>
              <p className="mt-1 text-2xl font-bold text-stone-900">{player.score}</p>
              {isActive && (
                <p className="mt-1 text-xs text-blue-500 font-medium animate-pulse">
                  {player.id === selfPlayerId ? "Your turn" : "Thinking..."}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Board */}
      <div className="grid grid-cols-3 gap-3">
        {board.map((cell, index) => {
          const isPlayable = !cell && isMyTurn;
          return (
            <button
              key={index}
              onClick={() => isPlayable && onPlayMove(index)}
              disabled={!isPlayable}
              className={`
                aspect-square rounded-2xl border
                transition-all duration-150
                ${
                  isPlayable
                    ? "border-stone-200 bg-white hover:border-blue-300 hover:bg-blue-50 cursor-pointer"
                    : "border-stone-100 bg-stone-50/80 cursor-default"
                }
              `}
            >
              {cell ? (
                <div className="flex h-full items-center justify-center p-3">
                  <SymbolAvatar symbol={cell} className="size-full max-h-20 max-w-20 border-0 bg-transparent p-0 shadow-none" />
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Round info */}
      <p className="text-center text-xs text-stone-400">
        Round {room.round.number} · {isMyTurn ? "Your turn" : `${opponent?.username ?? "Opponent"}'s turn`}
      </p>
    </div>
  );
}
