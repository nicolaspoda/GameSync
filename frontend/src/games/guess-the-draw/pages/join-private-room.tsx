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
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

type JoinPrivateRoomResponse = GuessTheDrawSession;

function getGuessTheDrawApiUrl() {
  if (typeof window === "undefined") {
    return "http://localhost:3001";
  }

  return (
    import.meta.env.VITE_GUESS_THE_DRAW_API_URL ??
    `${window.location.protocol}//${window.location.hostname}:3001`
  );
}

function isJoinPrivateRoomResponse(
  value: unknown,
): value is JoinPrivateRoomResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<JoinPrivateRoomResponse>;

  return (
    typeof session.playerId === "string" &&
    typeof session.roomId === "string" &&
    typeof session.token === "string"
  );
}

export default function JoinPrivateRoom() {
  const navigate = useNavigate();
  const { roomId = "" } = useParams();
  const normalizedRoomId = roomId.trim().toUpperCase();
  const [playerName, setPlayerName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const isJoinDisabled = useMemo(
    () =>
      isJoining || playerName.trim().length < 2 || normalizedRoomId.length === 0,
    [isJoining, normalizedRoomId.length, playerName],
  );

  async function handleJoinPrivateRoom() {
    const trimmedPlayerName = playerName.trim();

    if (trimmedPlayerName.length < 2) {
      toast.error("Choose a name with at least 2 characters.");
      return;
    }

    if (!normalizedRoomId) {
      toast.error("This invite link does not contain a room code.");
      return;
    }

    setIsJoining(true);
    const loadingToastId = toast.loading("Joining the private room...");

    try {
      const response = await fetch(
        `${getGuessTheDrawApiUrl()}/guess-the-draw/rooms/private/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerName: trimmedPlayerName,
            roomId: normalizedRoomId,
          }),
        },
      );

      const data = (await response.json()) as
        | JoinPrivateRoomResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to join the private room.");
      }

      if (!isJoinPrivateRoomResponse(data)) {
        throw new Error("The server returned an invalid room session.");
      }

      resetGuessTheDrawSocket();

      toast.dismiss(loadingToastId);
      toast.success("Private room joined.");
      navigate(`/guess-the-draw/room/${data.roomId}`, {
        state: { session: data },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to join the private room.";

      toast.dismiss(loadingToastId);
      toast.error(message);
      console.error("Failed to join private room", error);
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
              Join a private room with one quick name check.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-stone-600">
              You were invited to room{" "}
              <span className="font-semibold text-stone-900">
                {normalizedRoomId || "Unknown"}
              </span>
              . Pick your display name and hop into the lobby.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                <p className="text-sm font-medium text-stone-900">
                  Invite Link
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  The room code is already carried by the link, so no extra form
                  field is needed here.
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                <p className="text-sm font-medium text-stone-900">
                  Fast Entry
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Just provide your display name and the room session is created
                  for you.
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                <p className="text-sm font-medium text-stone-900">
                  Private Lobby
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Perfect for friends, classrooms, or small group matches.
                </p>
              </div>
            </div>
          </section>

          <Card className="justify-center border border-stone-200/80 bg-white/90 shadow-[0_24px_80px_rgba(60,42,17,0.10)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl text-stone-900">
                Join Private Room
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-stone-600">
                Use the invite link room code and enter with your display name.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="private-join-player-name">Display name</Label>
                <Input
                  id="private-join-player-name"
                  placeholder="Choose your drawing alias"
                  value={playerName}
                  onChange={(event) => setPlayerName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !isJoinDisabled) {
                      void handleJoinPrivateRoom();
                    }
                  }}
                />
              </div>

              <Button
                className="h-10 w-full"
                onClick={() => void handleJoinPrivateRoom()}
                disabled={isJoinDisabled}
              >
                {isJoining ? "Joining..." : "Join private room"}
              </Button>

              <Button asChild variant="outline" className="h-10 w-full">
                <Link to="/guess-the-draw">Back to public join</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
