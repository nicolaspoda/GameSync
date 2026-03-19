import { useEffect, useState }  from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";

import { useGame }              from "@/games/tic-tac-toe/hooks/use-game";
import type { TicTacToeSession } from "@/games/tic-tac-toe/socket";

import WaitingScreen  from "../components/waiting-screen";
import GameBoard      from "../components/game-board";
import RoundResult    from "../components/round-result";
import GameOver       from "../components/game-over";

// ─── Session recovery ─────────────────────────────────────────────────────────

function recoverSession(roomId: string): TicTacToeSession | null {
  try {
    const raw = localStorage.getItem(`tic-tac-toe:session:${roomId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TicTacToeSession>;
    if (
      typeof parsed.playerId === "string" &&
      typeof parsed.roomId   === "string" &&
      typeof parsed.token    === "string"
    ) {
      return parsed as TicTacToeSession;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TicTacToeRoom() {
  const { roomId = "" }  = useParams();
  const location         = useLocation();
  const navigate         = useNavigate();

  // Session : depuis location.state (navigation directe) ou localStorage (refresh)
  const [session] = useState<TicTacToeSession | null>(() => {
    const fromState = (location.state as { session?: TicTacToeSession } | null)
      ?.session ?? null;
    return fromState ?? recoverSession(roomId);
  });

  const { room, selfPlayerId, error, isConnected, playMove, restart } =
    useGame(session);

  // Redirige si pas de session valide
  useEffect(() => {
    if (!session) navigate("/tic-tac-toe", { replace: true });
  }, [session, navigate]);

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#f6fbff_0%,_#eaf1f8_100%)]">
        <div className="rounded-2xl border border-red-100 bg-white p-8 shadow text-center space-y-4 max-w-sm">
          <p className="text-sm font-medium uppercase tracking-widest text-red-500">
            Error
          </p>
          <p className="text-stone-700">{error.message}</p>
          <button
            onClick={() => navigate("/tic-tac-toe")}
            className="mt-2 text-sm text-blue-600 underline"
          >
            Back to lobby
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!room || !selfPlayerId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#f6fbff_0%,_#eaf1f8_100%)]">
        <p className="text-sm text-stone-400 animate-pulse">Connecting...</p>
      </div>
    );
  }

  const self     = room.players.find((p) => p.id === selfPlayerId) ?? null;
  const opponent = room.players.find((p) => p.id !== selfPlayerId) ?? null;

  // ── Screens ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(115,170,255,0.12),_transparent_30%),linear-gradient(180deg,_#f6fbff_0%,_#eaf1f8_100%)] px-4 py-10">
      <div className="mx-auto max-w-lg space-y-6">

        {/* Waiting */}
        {(room.status === "WAITING_FOR_PLAYERS" || room.status === "STARTING") && (
          <WaitingScreen
            room={room}
            self={self}
            isConnected={isConnected}
          />
        )}

        {/* In progress */}
        {room.status === "IN_PROGRESS" && (
          <GameBoard
            room={room}
            selfPlayerId={selfPlayerId}
            onPlayMove={playMove}
          />
        )}

        {/* Round finished */}
        {room.status === "ROUND_FINISHED" && (
          <RoundResult
            room={room}
            selfPlayerId={selfPlayerId}
          />
        )}

        {/* Game finished */}
        {room.status === "GAME_FINISHED" && (
          <GameOver
            room={room}
            selfPlayerId={selfPlayerId}
            onRestart={restart}
            onLeave={() => navigate("/tic-tac-toe")}
          />
        )}

      </div>
    </div>
  );
}