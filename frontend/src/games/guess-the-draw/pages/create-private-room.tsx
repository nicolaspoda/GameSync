import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resetGuessTheDrawSocket,
  type GuessTheDrawSession,
} from "@/games/guess-the-draw/socket";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type CreatePrivateRoomResponse = GuessTheDrawSession;

function getGuessTheDrawApiUrl() {
  if (typeof window === "undefined") {
    return "http://localhost:3001";
  }

  return (
    import.meta.env.VITE_GUESS_THE_DRAW_API_URL ??
    `${window.location.protocol}//${window.location.hostname}:3001`
  );
}

function isCreatePrivateRoomResponse(
  value: unknown,
): value is CreatePrivateRoomResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<CreatePrivateRoomResponse>;

  return (
    typeof session.playerId === "string" &&
    typeof session.roomId === "string" &&
    typeof session.token === "string"
  );
}

export default function CreatePrivateRoom() {
  const navigate = useNavigate();
  const minPlayers = 2;
  const maxPlayers = 12;
  const minRounds = 1;
  const maxRounds = 10;

  const playerOptions = Array.from(
    { length: maxPlayers - minPlayers + 1 },
    (_, i) => minPlayers + i,
  );
  const roundOptions = Array.from(
    { length: maxRounds - minRounds + 1 },
    (_, i) => minRounds + i,
  );

  const [playerName, setPlayerName] = useState("");
  const [maxPlayerCount, setMaxPlayerCount] = useState("8");
  const [roundCount, setRoundCount] = useState("3");
  const [isCreating, setIsCreating] = useState(false);

  const isCreateDisabled = useMemo(
    () => isCreating || playerName.trim().length < 2,
    [isCreating, playerName],
  );

  async function handleCreatePrivateRoom() {
    const trimmedPlayerName = playerName.trim();

    if (trimmedPlayerName.length < 2) {
      toast.error("Choose a name with at least 2 characters.");
      return;
    }

    setIsCreating(true);
    const loadingToastId = toast.loading("Creating a private room...");

    try {
      const response = await fetch(`${getGuessTheDrawApiUrl()}/guess-the-draw/rooms/private`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerName: trimmedPlayerName,
          maxPlayers: Number(maxPlayerCount),
          rounds: Number(roundCount),
        }),
      });

      const data = (await response.json()) as
        | CreatePrivateRoomResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to create a private room.");
      }

      if (!isCreatePrivateRoomResponse(data)) {
        throw new Error("The server returned an invalid room session.");
      }

      resetGuessTheDrawSocket();

      toast.dismiss(loadingToastId);
      toast.success("Private room created.");
      navigate(`/guess-the-draw/room/${data.roomId}`, {
        state: { session: data },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create a private room.";

      toast.dismiss(loadingToastId);
      toast.error(message);
      console.error("Failed to create private room", error);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,196,90,0.16),_transparent_28%),linear-gradient(180deg,_#fff8ef_0%,_#f4efe7_100%)] px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[2rem] border border-black/5 bg-white/75 p-8 shadow-[0_24px_80px_rgba(60,42,17,0.10)] backdrop-blur">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-amber-700/80">
              Guess The Draw
            </p>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
              Set up a private room for your next drawing match.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-stone-600">
              Choose your room settings, claim host status, and get a private
              lobby ready for friends to join.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                <p className="text-sm font-medium text-stone-900">
                  Host Controls
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Start the game when everyone is in and replay with the same
                  room later.
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                <p className="text-sm font-medium text-stone-900">
                  Custom Limits
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Control how many players can join and how many rounds you want
                  to run.
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                <p className="text-sm font-medium text-stone-900">
                  Invite Ready
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  The room is designed for private codes and coordinated group
                  play.
                </p>
              </div>
            </div>
          </section>

          <Card className="justify-center border border-stone-200/80 bg-white/90 shadow-[0_24px_80px_rgba(60,42,17,0.10)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl text-stone-900">
                Create A Private Room
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-stone-600">
                The layout is now aligned with the join page. Room creation can
                plug into the REST flow next.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="private-player-name">Display name</Label>
                <Input
                  id="private-player-name"
                  placeholder="Choose your host name"
                  value={playerName}
                  onChange={(event) => setPlayerName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !isCreateDisabled) {
                      void handleCreatePrivateRoom();
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-players">Max players</Label>
                <select
                  id="max-players"
                  value={maxPlayerCount}
                  onChange={(event) => setMaxPlayerCount(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm outline-none transition focus-visible:border-stone-400 focus-visible:ring-2 focus-visible:ring-stone-200"
                >
                  {playerOptions.map((playerCount) => (
                    <option key={playerCount} value={playerCount}>
                      {playerCount} players
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="round-count">Rounds</Label>
                <select
                  id="round-count"
                  value={roundCount}
                  onChange={(event) => setRoundCount(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm outline-none transition focus-visible:border-stone-400 focus-visible:ring-2 focus-visible:ring-stone-200"
                >
                  {roundOptions.map((roundOption) => (
                    <option key={roundOption} value={roundOption}>
                      {roundOption} round{roundOption > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                className="h-10 w-full"
                disabled={isCreateDisabled}
                onClick={() => void handleCreatePrivateRoom()}
              >
                {isCreating ? "Creating..." : "Create private room"}
              </Button>

              <Button asChild variant="outline" className="h-10 w-full">
                <Link to="/guess-the-draw">Join random room</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
