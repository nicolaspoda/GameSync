import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  clearDrawingCanvas,
  guessTheDrawServerEvents,
  sendDrawingStroke,
  sendMessage,
  startGuessTheDrawGame,
  useGuessTheDrawSocket,
  type GuessTheDrawSession,
  type Message,
  type Point,
  type Round,
  type RoomState,
  type Stroke,
} from "@/games/guess-the-draw/socket";
import { useLocation, useParams } from "react-router-dom";
import { toast } from "sonner";

type GuessTheDrawRoomLocationState = {
  session?: GuessTheDrawSession;
};

function StatusPill({ status }: { status: RoomState["status"] | "connecting" }) {
  const variants = {
    connecting: "border-sky-300 bg-sky-100 text-sky-800",
    waiting: "border-amber-300 bg-amber-100 text-amber-800",
    drawing: "border-emerald-300 bg-emerald-100 text-emerald-800",
    "round-results": "border-orange-300 bg-orange-100 text-orange-800",
    finished: "border-stone-300 bg-stone-200 text-stone-700",
  } as const;

  const labels = {
    connecting: "Connecting",
    waiting: "Waiting",
    drawing: "Drawing",
    "round-results": "Cleanup",
    finished: "Finished",
  } as const;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.24em]",
        variants[status],
      )}
    >
      <span className="size-2 rounded-full bg-current" />
      {labels[status]}
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const currentStrokePointsRef = useRef<Point[]>([]);

  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [activeTurn, setActiveTurn] = useState<Round | null>(null);
  const [connectionLabel, setConnectionLabel] = useState("Connecting");
  const [chatInput, setChatInput] = useState("");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [brushColor, setBrushColor] = useState("#1f2937");
  const [brushSize, setBrushSize] = useState(4);
  const [now, setNow] = useState(Date.now());

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
      setStrokes(nextRoomState.strokes ?? []);
      setConnectionLabel("Connected");
    }

    function handleTurnStarted(nextTurn: Round) {
      setActiveTurn(nextTurn);
    }

    function handleTurnEnded() {
      setActiveTurn(null);
    }

    function handleCanvasUpdated(nextStrokes: Stroke[]) {
      setStrokes(nextStrokes);
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
    socket.on(guessTheDrawServerEvents.turnStarted, handleTurnStarted);
    socket.on(guessTheDrawServerEvents.turnEnded, handleTurnEnded);
    socket.on(guessTheDrawServerEvents.canvasUpdated, handleCanvasUpdated);
    socket.on(guessTheDrawServerEvents.error, handleSocketError);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off(guessTheDrawServerEvents.roomJoined, handleRoomJoined);
      socket.off(guessTheDrawServerEvents.roomState, handleRoomState);
      socket.off(guessTheDrawServerEvents.playerJoined, handleRoomState);
      socket.off(guessTheDrawServerEvents.playerLeft, handleRoomState);
      socket.off(guessTheDrawServerEvents.gameStarted, handleRoomState);
      socket.off(guessTheDrawServerEvents.turnStarted, handleTurnStarted);
      socket.off(guessTheDrawServerEvents.turnEnded, handleTurnEnded);
      socket.off(guessTheDrawServerEvents.canvasUpdated, handleCanvasUpdated);
      socket.off(guessTheDrawServerEvents.error, handleSocketError);
      socket.off("connect_error", handleConnectError);
    };
  }, [session, socket]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    context.lineCap = "round";
    context.lineJoin = "round";

    for (const stroke of strokes) {
      if (stroke.points.length === 0) {
        continue;
      }

      context.beginPath();
      context.strokeStyle = stroke.color;
      context.lineWidth = stroke.size;

      stroke.points.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.x, point.y);
          return;
        }

        context.lineTo(point.x, point.y);
      });

      if (stroke.points.length === 1) {
        const point = stroke.points[0];
        context.lineTo(point.x + 0.01, point.y + 0.01);
      }

      context.stroke();
    }
  }, [strokes]);

  const players = roomState?.players ?? [];
  const messages = roomState?.messages ?? [];
  const activeRoomId = roomState?.id ?? roomId ?? session?.roomId ?? "Unknown";
  const selfPlayerId = session?.playerId ?? null;
  const selfPlayer = players.find((player) => player.id === selfPlayerId) ?? null;
  const isHost = Boolean(selfPlayer?.isHost);
  const isWaiting = roomState?.status === "waiting";
  const currentDrawer = players.find((player) => player.id === roomState?.drawerId) ?? null;
  const isSelfDrawing =
    Boolean(selfPlayerId) &&
    (activeTurn?.drawerId ?? roomState?.drawerId ?? null) === selfPlayerId;
  const activeStatus = roomState?.status ?? "connecting";

  const activeTimerTarget =
    roomState?.status === "drawing"
      ? roomState.timers?.turnEndsAt ?? null
      : roomState?.status === "round-results"
        ? roomState.timers?.cleanupEndsAt ?? null
        : null;

  const timerSeconds =
    activeTimerTarget && activeTimerTarget > now
      ? Math.ceil((activeTimerTarget - now) / 1000)
      : 0;
  const roundNumber = roomState?.round.number ?? 1;
  const totalRounds = roomState?.maxRounds ?? 1;
  const displayedWord =
    isSelfDrawing && activeTurn?.word?.trim()
      ? activeTurn.word
      : roomState?.round.wordMasked?.trim() || "No word yet";

  function handleSendMessage() {
    const trimmedMessage = chatInput.trim();

    if (!trimmedMessage) {
      return;
    }

    try {
      sendMessage({ guess: trimmedMessage });
      setChatInput("");
    } catch (error) {
      console.error("Unable to send chat message", error);
      toast.error("Unable to send the chat message.");
    }
  }

  function getCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>): Point | null {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const point = getCanvasPoint(event);

    if (!point) {
      return;
    }

    isDrawingRef.current = true;
    currentStrokePointsRef.current = [point];
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) {
      return;
    }

    const point = getCanvasPoint(event);

    if (!point) {
      return;
    }

    currentStrokePointsRef.current = [...currentStrokePointsRef.current, point];

    const previewStroke: Stroke = {
      byPlayerId: selfPlayerId ?? "local-player",
      color: brushColor,
      size: brushSize,
      points: currentStrokePointsRef.current,
    };

    setStrokes((currentStrokes) => [
      ...currentStrokes.filter((stroke) => stroke.byPlayerId !== "__preview__"),
      { ...previewStroke, byPlayerId: "__preview__" },
    ]);
  }

  function finishStroke() {
    if (!isDrawingRef.current) {
      return;
    }

    isDrawingRef.current = false;

    const points = currentStrokePointsRef.current;
    currentStrokePointsRef.current = [];

    setStrokes((currentStrokes) =>
      currentStrokes.filter((stroke) => stroke.byPlayerId !== "__preview__"),
    );

    if (points.length === 0) {
      return;
    }

    try {
      sendDrawingStroke({
        byPlayerId: selfPlayerId ?? "",
        color: brushColor,
        size: brushSize,
        points,
      });
    } catch (error) {
      console.error("Unable to send drawing stroke", error);
      toast.error("Unable to sync the drawing stroke.");
    }
  }

  function handleClearCanvas() {
    try {
      clearDrawingCanvas();
    } catch (error) {
      console.error("Unable to clear canvas", error);
      toast.error("Unable to clear the canvas.");
    }
  }

  function handleStartGame() {
    try {
      startGuessTheDrawGame();
    } catch (error) {
      console.error("Unable to start game", error);
      toast.error("Unable to start the game.");
    }
  }

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
              <StatusPill status={activeStatus} />
              <p className="text-sm text-stone-500">{connectionLabel}</p>
              {currentDrawer ? (
                <p className="text-sm font-medium text-stone-700">
                  Drawing: {currentDrawer.usernamename}
                </p>
              ) : null}
              {activeTimerTarget ? (
                <p className="text-sm text-stone-500">
                  {roomState?.status === "drawing" ? "Turn ends" : "Next turn"} in{" "}
                  {timerSeconds}s
                </p>
              ) : null}
              {isHost && isWaiting ? (
                <Button onClick={handleStartGame}>Start game</Button>
              ) : null}
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
                <CardHeader className="gap-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                        <span>Round {roundNumber}/{totalRounds}</span>
                        {currentDrawer ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 tracking-normal text-emerald-700">
                            {currentDrawer.usernamename} draws
                          </span>
                        ) : null}
                      </div>
                      <CardTitle className="text-xl text-stone-900">
                        {roomState?.status === "drawing" ? "Turn in progress" : "Board ready"}
                      </CardTitle>
                      <CardDescription className="text-sm leading-6 text-stone-600">
                        {roomState?.status === "drawing"
                          ? "Everyone can draw for now while the turn system is taking shape."
                          : "The board stays open between turns so everyone can see the current state."}
                      </CardDescription>
                    </div>

                    <div className="grid min-w-[220px] gap-2 rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-stone-500">Timer</span>
                        <span className="font-medium text-stone-900">
                          {activeTimerTarget ? `${timerSeconds}s` : "--"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-stone-500">
                          {isSelfDrawing ? "Word" : "Hint"}
                        </span>
                        <span className="font-mono text-base tracking-[0.24em] text-stone-900">
                          {displayedWord}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                      <span>Color</span>
                      <input
                        aria-label="Brush color"
                        type="color"
                        value={brushColor}
                        onChange={(event) => setBrushColor(event.target.value)}
                        className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                      />
                    </label>

                    <label className="flex items-center gap-3 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                      <span>Size</span>
                      <input
                        aria-label="Brush size"
                        type="range"
                        min="2"
                        max="16"
                        value={brushSize}
                        onChange={(event) => setBrushSize(Number(event.target.value))}
                      />
                      <span className="w-5 text-right text-xs text-stone-500">
                        {brushSize}
                      </span>
                    </label>

                    <Button variant="outline" onClick={handleClearCanvas}>
                      Clear canvas
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(247,241,231,0.92))] p-3">
                    <canvas
                      ref={canvasRef}
                      className="block h-[360px] w-full touch-none rounded-xl bg-white shadow-inner"
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={finishStroke}
                      onPointerLeave={finishStroke}
                    />
                  </div>
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
                        className={cn(
                          "rounded-2xl border p-4",
                          player.id === selfPlayerId
                            ? "border-amber-300 bg-amber-50/90 shadow-[0_10px_30px_rgba(245,158,11,0.12)]"
                            : "border-stone-200 bg-stone-50/80",
                        )}
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
                          {player.id === selfPlayerId ? (
                            <span className="rounded-full bg-sky-100 px-2.5 py-1 font-medium text-sky-700">
                              You
                            </span>
                          ) : null}
                          {player.id === roomState?.drawerId ? (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-700">
                              Drawing
                            </span>
                          ) : null}
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
                  Waiting-room messages and future guesses will show here. Chat
                  stays usable even before the turn starts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex min-h-[calc(360px+12.25rem)] flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
                  {messages.length > 0 ? (
                    messages.map((message: Message, index) => (
                      <div
                        key={`${message.playerId}-${index}`}
                        className={cn(
                          "rounded-2xl px-3 py-2 shadow-sm ring-1 ring-black/5",
                          message.guessed
                            ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
                            : "bg-white",
                        )}
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

                  <div className="mt-auto flex gap-2 pt-2">
                    <Input
                      placeholder="Send a message to the room"
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!session || chatInput.trim().length === 0}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
