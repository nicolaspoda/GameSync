import type { TicTacToePlayer, TicTacToeRoomState } from "@/games/tic-tac-toe/socket";

type Props = {
  room:        TicTacToeRoomState;
  self:        TicTacToePlayer | null;
  isConnected: boolean;
};

export default function WaitingScreen({ room, self, isConnected }: Props) {
  return (
    <div className="rounded-[2rem] border border-black/5 bg-white/80 p-8 shadow-[0_24px_80px_rgba(30,60,114,0.08)] backdrop-blur space-y-6">
      <div className="text-center space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-600/80">
          Tic Tac Toe
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          {room.status === "WAITING_FOR_PLAYERS"
            ? "Waiting for opponent..."
            : "Get ready!"}
        </h1>
        <p className="text-sm text-stone-500">
          Room <span className="font-mono font-semibold text-stone-700">{room.id}</span>
        </p>
      </div>

      {/* Players */}
      <div className="grid grid-cols-2 gap-4">
        {room.players.map((player) => (
          <div
            key={player.id}
            className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 text-center space-y-1"
          >
            <p className="text-2xl font-bold text-stone-800">{player.symbol}</p>
            <p className="text-sm font-medium text-stone-700 truncate">{player.username}</p>
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                player.isConnected ? "bg-green-400" : "bg-stone-300"
              }`}
            />
          </div>
        ))}

        {/* Slot vide si 1 seul joueur */}
        {room.players.length < 2 && (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/50 p-4 text-center flex items-center justify-center">
            <p className="text-sm text-stone-400 animate-pulse">Waiting...</p>
          </div>
        )}
      </div>

      {/* Status */}
      <p className="text-center text-xs text-stone-400">
        {isConnected ? "Connected" : "Reconnecting..."}
      </p>
    </div>
  );
}