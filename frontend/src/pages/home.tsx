import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { gameCatalog } from "@/games/catalog";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,196,90,0.16),_transparent_28%),linear-gradient(180deg,_#fff8ef_0%,_#f4efe7_100%)] px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="rounded-[2rem] border border-black/5 bg-white/75 p-8 shadow-[0_24px_80px_rgba(60,42,17,0.10)] backdrop-blur">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-amber-700/80">
            GameSync
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
            Pick a game and launch it inside a dedicated player view.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
            This homepage works like a catalog. Available games open in a player
            page with a framed experience, fullscreen support, and space for
            recommendations underneath.
          </p>
        </section>

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {gameCatalog.map((game) => (
            <Card
              key={game.id}
              className={cn(
                "border border-stone-200/80 shadow-[0_18px_50px_rgba(60,42,17,0.08)]",
                game.accentClassName,
              )}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-xl text-stone-900">
                    {game.title}
                  </CardTitle>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      game.status === "available"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-stone-200 text-stone-600",
                    )}
                  >
                    {game.status === "available" ? "Live" : "Soon"}
                  </span>
                </div>
                <CardDescription className="text-sm leading-6 text-stone-600">
                  {game.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {game.status === "available" ? (
                  <Button asChild className="w-full">
                    <Link to={`/play/${game.id}`}>Open player</Link>
                  </Button>
                ) : (
                  <Button disabled className="w-full">
                    Coming soon
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}
