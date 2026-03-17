import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  guessTheDrawServerEvents,
  useGuessTheDrawSocket,
  type GuessTheDrawSession,
  type Message,
  type RoomState,
} from "@/games/guess-the-draw/socket";
import { useLocation, useParams } from "react-router-dom";
import { toast } from "sonner";

type GuessTheDrawRoomLocationState = {
  session?: GuessTheDrawSession;
};

function WaitingPill() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-amber-800">
      <span className="size-2 rounded-full bg-amber-500" />
      Waiting
    </div>
  );
}

function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 p-6 text-center",
        className,
      )}
    >
      <div className="space-y-2">
        <p className="text-sm font-medium text-stone-900">{title}</p>
        <p className="text-sm leading-6 text-stone-600">{description}</p>
      </div>
    </div>
  );
}

export default function GuessTheDrawRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const locationState = (location.state ?? null) as GuessTheDrawRoomLocationState | null;
  const session = locationState?.session ?? null;
  const socket = useGuessTheDrawSocket({ session });

  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [connectionLabel, setConnectionLabel] = useState("Connecting");

  useEffect(() => {
    if (!session) {
      setConnectionLabel("Missing session");
      return;
    }

    if (!socket) {
      return;
    }

    function handleRoomJoined(payload: { room: RoomState }) {
      setRoomState(payload.room);
      setConnectionLabel("Connected");
    }

    function handleRoomState(nextRoomState: RoomState) {
      setRoomState(nextRoomState);
      setConnectionLabel("Connected");
    }

    function handleSocketError(error: { message: string }) {
      setConnectionLabel("Connection issue");
      toast.error(error.message || "The room socket reported an error.");
    }

    function handleConnectError(error: Error) {
      setConnectionLabel("Connection failed");
      toast.error(error.message || "Unable to connect to the room socket.");
    }

    socket.on(guessTheDrawServerEvents.roomJoined, handleRoomJoined);
    socket.on(guessTheDrawServerEvents.roomState, handleRoomState);
    socket.on(guessTheDrawServerEvents.playerJoined, handleRoomState);
    socket.on(guessTheDrawServerEvents.playerLeft, handleRoomState);
    socket.on(guessTheDrawServerEvents.gameStarted, handleRoomState);
    socket.on(guessTheDrawServerEvents.error, handleSocketError);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off(guessTheDrawServerEvents.roomJoined, handleRoomJoined);
      socket.off(guessTheDrawServerEvents.roomState, handleRoomState);
      socket.off(guessTheDrawServerEvents.playerJoined, handleRoomState);
      socket.off(guessTheDrawServerEvents.playerLeft, handleRoomState);
      socket.off(guessTheDrawServerEvents.gameStarted, handleRoomState);
      socket.off(guessTheDrawServerEvents.error, handleSocketError);
      socket.off("connect_error", handleConnectError);
    };
  }, [session, socket]);

  const players = roomState?.players ?? [];
  const messages = roomState?.messages ?? [];
  const activeRoomId = roomState?.id ?? roomId ?? session?.roomId ?? "Unknown";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,205,120,0.18),_transparent_28%),linear-gradient(180deg,_#fcf8f1_0%,_#f4eee5_100%)] px-6 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="border border-stone-200/80 bg-white/90 shadow-[0_24px_80px_rgba(60,42,17,0.10)]">
          <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl text-stone-900">
                Room {activeRoomId}
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm leading-6 text-stone-600">
                Simple waiting-room shell for now. The layout is ready for the
                game loop: canvas and chat sit side by side, with the player
                list directly under the canvas.
              </CardDescription>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <WaitingPill />
              <p className="text-sm text-stone-500">{connectionLabel}</p>
            </div>
          </CardHeader>
        </Card>

        {!session ? (
          <Card className="border border-stone-200/80 bg-white/90">
            <CardContent className="py-10">
              <EmptyState
                title="No room session found"
                description="Open this page through the join flow once you start redirecting, or pass the session through route state."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
            <div className="grid gap-6">
              <Card className="border border-stone-200/80 bg-white/90 shadow-[0_16px_50px_rgba(60,42,17,0.08)]">
                <CardHeader>
                  <CardTitle className="text-xl text-stone-900">
                    Canvas
                  </CardTitle>
                  <CardDescription>
                    Drawing area placeholder while the room is waiting for the game
                    to start.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    className="min-h-[360px] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(247,241,231,0.92))]"
                    title="Canvas is idle"
                    description="Once a round begins, this panel can host the collaborative whiteboard."
                  />
                </CardContent>
              </Card>

              <Card className="border border-stone-200/80 bg-white/90 shadow-[0_16px_50px_rgba(60,42,17,0.08)]">
                <CardHeader>
                  <CardTitle className="text-xl text-stone-900">
                    Players
                  </CardTitle>
                  <CardDescription>
                    Everyone currently registered in the room.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {players.length > 0 ? (
                    players.map((player) => (
                      <div
                        key={player.id}
                        className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-stone-900">
                              {player.usernamename}
                            </p>
                            <p className="text-xs text-stone-500">
                              Score: {player.score}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                              player.isConnected
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-stone-200 text-stone-600",
                            )}
                          >
                            {player.isConnected ? "Online" : "Offline"}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-500">
                          {player.isHost ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-700">
                              Host
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="No players yet"
                      description="Players will appear here as the room state comes in."
                      className="sm:col-span-2"
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border border-stone-200/80 bg-white/90 shadow-[0_16px_50px_rgba(60,42,17,0.08)]">
              <CardHeader>
                <CardTitle className="text-xl text-stone-900">Chat</CardTitle>
                <CardDescription>
                  Waiting-room messages and future guesses will show here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex min-h-[calc(360px+12.25rem)] flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
                  {messages.length > 0 ? (
                    messages.map((message: Message, index) => (
                      <div
                        key={`${message.playerId}-${index}`}
                        className="rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-black/5"
                      >
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                          {message.username}
                        </p>
                        <p className="mt-1 text-sm text-stone-800">
                          {message.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="Chat is quiet"
                      description="Messages will appear here once players start talking."
                      className="min-h-full flex-1"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
