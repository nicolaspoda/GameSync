import { useMemo, useState } from "react";
import { useNavigate }       from "react-router-dom";
import { toast }             from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";

import { resetTicTacToeSocket } from "@/games/tic-tac-toe/socket";
import type { TicTacToeSession } from "@/games/tic-tac-toe/socket";

// ─── Config ───────────────────────────────────────────────────────────────────

function getTicTacToeApiUrl() {
  if (typeof window === "undefined") return "http://localhost:3002";
  return (
    import.meta.env.VITE_TIC_TAC_TOE_API_URL ??
    `${window.location.protocol}//${window.location.hostname}:3002`
  );
}

// ─── Type guard ───────────────────────────────────────────────────────────────

function isJoinResponse(value: unknown): value is TicTacToeSession {
  if (!value || typeof value !== "object") return false;
  const s = value as Partial<TicTacToeSession>;
  return (
    typeof s.playerId === "string" &&
    typeof s.roomId   === "string" &&
    typeof s.token    === "string"
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function JoinTicTacToe() {
  const navigate  = useNavigate();
  const [name, setName]       = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const isDisabled = useMemo(
    () => isJoining || name.trim().length < 2,
    [isJoining, name],
  );

  async function handleJoin() {
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      toast.error("Choose a name with at least 2 characters.");
      return;
    }

    setIsJoining(true);
    const loadingToastId = toast.loading("Finding a room...");

    try {
      const response = await fetch(`${getTicTacToeApiUrl()}/tic-tac-toe/join`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: trimmedName }),
      });

      const data = (await response.json()) as TicTacToeSession | { error?: string };

      if (!response.ok) {
        throw new Error((data as { error?: string }).error ?? "Unable to join a room.");
      }

      if (!isJoinResponse(data)) {
        throw new Error("The server returned an invalid session.");
      }

      // Persiste la session pour la reconnexion
      localStorage.setItem(
        `tic-tac-toe:session:${data.roomId}`,
        JSON.stringify(data),
      );

      resetTicTacToeSocket();

      toast.dismiss(loadingToastId);
      toast.success("Room found!");

      navigate(`/tic-tac-toe/room/${data.roomId}`, {
        state: { session: data },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to join a room.";
      toast.dismiss(loadingToastId);
      toast.error(message);
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(115,170,255,0.16),_transparent_28%),linear-gradient(180deg,_#f6fbff_0%,_#eaf1f8_100%)] px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">

          {/* ── Hero ── */}
          <section className="rounded-[2rem] border border-black/5 bg-white/75 p-8 shadow-[0_24px_80px_rgba(30,60,114,0.08)] backdrop-blur">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-blue-600/80">
              Tic Tac Toe
            </p>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
              Fast head-to-head rounds, no setup needed.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-stone-600">
              Pick a name, get matched instantly, and let the best of three
              decide the winner.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Instant Matchmaking",
                  body:  "Joins an open room or creates one if none are available.",
                },
                {
                  title: "Best of 3",
                  body:  "First to 2 victories wins the match. Symbols swap each game.",
                },
                {
                  title: "Reconnect Ready",
                  body:  "Your session is saved locally — refresh without losing your spot.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4"
                >
                  <p className="text-sm font-medium text-stone-900">{card.title}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{card.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Form ── */}
          <Card className="justify-center border border-stone-200/80 bg-white/90 shadow-[0_24px_80px_rgba(30,60,114,0.08)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl text-stone-900">Play Now</CardTitle>
              <CardDescription className="text-sm leading-6 text-stone-600">
                Enter your name and we'll find you an opponent right away.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="player-name">Display name</Label>
                <Input
                  id="player-name"
                  placeholder="Choose your alias"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isDisabled) void handleJoin();
                  }}
                />
              </div>

              <Button
                className="h-10 w-full"
                onClick={() => void handleJoin()}
                disabled={isDisabled}
              >
                {isJoining ? "Finding a room..." : "Play"}
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}