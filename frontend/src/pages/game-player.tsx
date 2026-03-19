import { useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { gameCatalog, getGameById } from "@/games/catalog";
import { Link, useParams, useSearchParams } from "react-router-dom";

export default function GamePlayerPage() {
  const { gameId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const frameRef = useRef<HTMLDivElement | null>(null);
  const game = getGameById(gameId);
  const recommendedGames = gameCatalog.filter((entry) => entry.id !== gameId);
  const requestedPath = searchParams.get("path");
  const frameSource =
    requestedPath && requestedPath.startsWith("/")
      ? requestedPath
      : game?.launchPath ?? null;

  async function handleFullscreen() {
    if (!frameRef.current) {
      return;
    }

    try {
      await frameRef.current.requestFullscreen();
    } catch (error) {
      console.error("Unable to enter fullscreen", error);
    }
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,196,90,0.16),_transparent_28%),linear-gradient(180deg,_#fff8ef_0%,_#f4efe7_100%)] px-6 py-10">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <Card className="border border-stone-200/80 bg-white/90 shadow-[0_24px_80px_rgba(60,42,17,0.10)]">
            <CardHeader>
              <CardTitle className="text-2xl text-stone-900">
                Game not found
              </CardTitle>
              <CardDescription>
                This player route does not match any game currently available in the catalog.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/">Back to games</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,196,90,0.16),_transparent_28%),linear-gradient(180deg,_#fff8ef_0%,_#f4efe7_100%)] px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-amber-700/80">
              GameSync Player
            </p>
            <h1 className="text-3xl font-semibold text-stone-900">
              {game.title}
            </h1>
          </div>

          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link to="/">Back to games</Link>
            </Button>
            {game.launchPath ? (
              <Button onClick={handleFullscreen}>Fullscreen</Button>
            ) : null}
          </div>
        </div>

        <Card className="border border-stone-200/80 bg-white/90 shadow-[0_24px_80px_rgba(60,42,17,0.10)]">
          <CardContent className="space-y-5 p-5">
            <div
              ref={frameRef}
              className="game-player-frame overflow-hidden rounded-[1.75rem] border border-stone-200 bg-stone-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            >
              {frameSource ? (
                <iframe
                  src={frameSource}
                  title={game.title}
                  className="block h-[78vh] min-h-[720px] w-full bg-white"
                />
              ) : (
                <div className="flex h-[78vh] min-h-[720px] items-center justify-center bg-[linear-gradient(180deg,_#f8f5ef_0%,_#efe6d8_100%)] p-8 text-center">
                  <div className="space-y-3">
                    <p className="text-xl font-semibold text-stone-900">
                      {game.title}
                    </p>
                    <p className="max-w-md text-sm leading-6 text-stone-600">
                      This game is listed in the catalog, but it does not currently have an in-player experience.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xl font-semibold text-stone-900">
                  {game.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {game.description}
                </p>
              </div>

              {frameSource ? (
                <Button onClick={handleFullscreen}>Go fullscreen</Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-stone-500">
              Recommended Games
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-900">
              Try something else next
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {recommendedGames.map((entry) => (
              <Card
                key={entry.id}
                className={cn(
                  "border border-stone-200/80 shadow-[0_18px_50px_rgba(60,42,17,0.08)]",
                  entry.accentClassName,
                )}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-xl text-stone-900">
                      {entry.title}
                    </CardTitle>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        entry.status === "available"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-stone-200 text-stone-600",
                      )}
                    >
                      {entry.status === "available" ? "Live" : "Soon"}
                    </span>
                  </div>
                  <CardDescription className="text-sm leading-6 text-stone-600">
                    {entry.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {entry.status === "available" ? (
                    <Button asChild className="w-full">
                      <Link to={`/play/${entry.id}`}>Open player</Link>
                    </Button>
                  ) : (
                    <Button disabled className="w-full">
                      Coming soon
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
