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

type JoinRandomRoomResponse = GuessTheDrawSession;

function getGuessTheDrawApiUrl() {
  if (typeof window === "undefined") {
    return "http://localhost:3001";
  }

  return (
    import.meta.env.VITE_GUESS_THE_DRAW_API_URL ??
    `${window.location.protocol}//${window.location.hostname}:3001`
  );
}

function isJoinRandomRoomResponse(
  value: unknown,
): value is JoinRandomRoomResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<JoinRandomRoomResponse>;

  return (
    typeof session.playerId === "string" &&
    typeof session.roomId === "string" &&
    typeof session.token === "string"
  );
}

export default function JoinGuessTheDraw() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const isJoinDisabled = useMemo(
    () => isJoining || playerName.trim().length < 2,
    [isJoining, playerName],
  );

  async function handleJoinRandomRoom() {
    const trimmedPlayerName = playerName.trim();

    if (trimmedPlayerName.length < 2) {
      toast.error("Choose a name with at least 2 characters.");
      return;
    }

    setIsJoining(true);
    const loadingToastId = toast.loading("Joining a random room...");

    try {
      const response = await fetch(
        `${getGuessTheDrawApiUrl()}/guess-the-draw/rooms/public/join-random`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerName: trimmedPlayerName,
          }),
        },
      );

      const data = (await response.json()) as
        | JoinRandomRoomResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to join a random room.");
      }

      if (!isJoinRandomRoomResponse(data)) {
        throw new Error("The server returned an invalid room session.");
      }

      resetGuessTheDrawSocket();

      toast.dismiss(loadingToastId);
      toast.success("Random room joined.");
      navigate(`/guess-the-draw/room/${data.roomId}`, {
        state: { session: data },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to join a random room.";

      toast.dismiss(loadingToastId);
      toast.error(message);
      console.error("Failed to join random room", error);
    } finally {
      setIsJoining(false);
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
              Jump into a live drawing room in seconds.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-stone-600">
              Pick a name, join a public lobby, and let the socket session spin
              up automatically. Private rooms stay one click away.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                <p className="text-sm font-medium text-stone-900">
                  Fast Matchmaking
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Finds an open public room or creates one if none are ready.
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                <p className="text-sm font-medium text-stone-900">
                  Socket Ready
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  REST returns your session, then Socket.IO connects with it.
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                <p className="text-sm font-medium text-stone-900">
                  Private Rooms
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Host your own match whenever you want tighter control.
                </p>
              </div>
            </div>
          </section>

          <Card className="justify-center border border-stone-200/80 bg-white/90 shadow-[0_24px_80px_rgba(60,42,17,0.10)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl text-stone-900">
                Join A Random Room
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-stone-600">
                Enter a display name, connect instantly, and move straight into
                the live room.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="player-name">Display name</Label>
                <Input
                  id="player-name"
                  placeholder="Choose your drawing alias"
                  value={playerName}
                  onChange={(event) => setPlayerName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !isJoinDisabled) {
                      void handleJoinRandomRoom();
                    }
                  }}
                />
              </div>

              <Button
                className="h-10 w-full"
                onClick={() => void handleJoinRandomRoom()}
                disabled={isJoinDisabled}
              >
                {isJoining ? "Joining..." : "Join random room"}
              </Button>

              <Button asChild variant="outline" className="h-10 w-full">
                <Link to="/guess-the-draw/create">Create private room</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
