import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { alphabet, hangmanFrames, maxErrors } from './constants'
import socket, { type HangmanGameState, type HangmanPlayerNumber } from './socket'
import HangmanPlayerAvatar, { getHangmanPlayerLabel } from './player-avatar'

function HangmanApp() {
  const [username, setUsername] = useState('')
  const [room, setRoom] = useState('')
  const [playerNumber, setPlayerNumber] = useState(0)
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)
  const [gameState, setGameState] = useState<HangmanGameState | null>(null)

  const isInGame = useMemo(
    () => Boolean(room) && Boolean(playerNumber) && Boolean(gameState),
    [room, playerNumber, gameState],
  )

  useEffect(() => {
    const handleGameState = (state: HangmanGameState) => {
      setGameState(state)
    }

    socket.on('gameState', handleGameState)

    return () => {
      socket.off('gameState', handleGameState)
    }
  }, [])

  const handleJoinRoom = () => {
    const trimmed = username.trim()
    if (!trimmed) {
      setError('Merci de saisir un nom d’utilisateur.')
      return
    }

    setError('')
    setJoining(true)

    socket.emit('joinRoom', { username: trimmed, room: room || undefined }, (response) => {
      setJoining(false)
      if (!response?.ok || !response.room || !response.playerNumber) {
        setError("Impossible de rejoindre la room. Réessaie.")
        return
      }

      setRoom(response.room)
      setPlayerNumber(response.playerNumber)
      if (response.state) {
        setGameState(response.state)
      }
    })
  }

  const handleGuess = (letter: string) => {
    if (!isInGame || !gameState) return
    if (gameState.guesses.includes(letter)) return
    if (gameState.status !== 'playing') return
    if (gameState.currentPlayer !== playerNumber) return

    socket.emit('guessLetter', { room, letter, playerNumber })
  }

  const statusLabel = useMemo(() => {
    if (!gameState) return ''
    if (gameState.status === 'playing') {
      if (gameState.currentPlayer === playerNumber) return `A ton tour avec ${getHangmanPlayerLabel(playerNumber as HangmanPlayerNumber)} !`
      return `Tour de ${getHangmanPlayerLabel(gameState.currentPlayer as HangmanPlayerNumber)}`
    }
    if (gameState.status === 'won') {
      return gameState.winner === playerNumber
        ? `Victoire de ${getHangmanPlayerLabel(playerNumber as HangmanPlayerNumber)} !`
        : `${getHangmanPlayerLabel((playerNumber === 1 ? 2 : 1) as HangmanPlayerNumber)} gagne.`
    }
    if (gameState.status === 'lost') {
      return gameState.winner === playerNumber
        ? `Victoire de ${getHangmanPlayerLabel(playerNumber as HangmanPlayerNumber)} !`
        : `${getHangmanPlayerLabel((playerNumber === 1 ? 2 : 1) as HangmanPlayerNumber)} gagne.`
    }
    return ''
  }, [gameState, playerNumber])

  const player1Name = useMemo(() => gameState?.players?.[1] ?? 'Joueur 1', [gameState])
  const player2Name = useMemo(() => gameState?.players?.[2] ?? 'Joueur 2', [gameState])

  const getHangmanFrameSrc = (wrongCount?: number) => {
    const count = typeof wrongCount === 'number' ? wrongCount : 0
    if (count <= 0) return null
    const frameIndex = Math.min(Math.max(count, 1), maxErrors) - 1
    return hangmanFrames[frameIndex]
  }

  const showLobbyPage = !isInGame
  const activePlayerName =
    gameState?.currentPlayer === 1 ? player1Name : gameState?.currentPlayer === 2 ? player2Name : null
  const activePlayerLabel =
    gameState?.currentPlayer === 1
      ? getHangmanPlayerLabel(1)
      : gameState?.currentPlayer === 2
        ? getHangmanPlayerLabel(2)
        : null

  const statusTone =
    gameState?.status === 'won' || gameState?.status === 'lost'
      ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
      : 'border-sky-300 bg-sky-100 text-sky-800'

  const descriptionText = isInGame
    ? gameState?.status === 'playing'
      ? 'Use the shared keyboard board to guess one letter at a time.'
      : 'This round is complete. The board stays visible so everyone can review the outcome.'
    : 'Choose a name, create a room or join one by code, and start a head-to-head Hangman match.'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,125,96,0.16),_transparent_28%),linear-gradient(180deg,_#fff8ef_0%,_#f4efe7_100%)] px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      {showLobbyPage && (
        <section className="rounded-[2rem] border border-black/5 bg-white/75 p-8 shadow-[0_24px_80px_rgba(60,42,17,0.10)] backdrop-blur">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-amber-700/80">
            GameSync
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
            Burn-out brings Hangman into the same polished multiplayer hub.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
            {descriptionText}
          </p>
        </section>
      )}

      {showLobbyPage ? (
        <main className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[2rem] border border-black/5 bg-white/75 p-8 shadow-[0_24px_80px_rgba(60,42,17,0.10)] backdrop-blur">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-amber-700/80">
              Hangman
            </p>
            <h2 className="max-w-xl text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
              Trade letters, survive mistakes, and race the other player.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-stone-600">
              Public-feeling presentation, private-room simplicity. Enter a code to join a
              friend or leave it blank to generate a fresh room.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                <p className="text-sm font-medium text-stone-900">Shared Board</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Both players see the same word progress and turn flow in real time.
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                <p className="text-sm font-medium text-stone-900">Quick Rooms</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Create a room instantly or jump into one with a short uppercase code.
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                <p className="text-sm font-medium text-stone-900">Turn Based</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Every guess matters, and mistakes push your own hangman closer to the edge.
                </p>
              </div>
            </div>
          </section>

          <Card className="border border-stone-200/80 bg-white/90 shadow-[0_24px_80px_rgba(60,42,17,0.10)]">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl text-stone-900">Join A Room</CardTitle>
              <CardDescription className="text-sm leading-6 text-stone-600">
                Choose a display name and optionally enter a room code to reconnect players in
                the same match.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Nom d&apos;utilisateur</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Nom d'utilisateur"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room">Code de room</Label>
                <Input
                  id="room"
                  type="text"
                  placeholder="Laisser vide pour créer une room"
                  value={room}
                  onChange={(event) => setRoom(event.target.value.toUpperCase())}
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <Button className="h-10 w-full" type="button" onClick={handleJoinRoom} disabled={joining}>
                {joining ? 'Connexion...' : 'Créer ou entrer dans une room'}
              </Button>
            </CardContent>
          </Card>
        </main>
      ) : (
        <main className="space-y-6">
          <Card className="border border-stone-200/80 bg-white/90 shadow-[0_24px_80px_rgba(60,42,17,0.10)]">
            <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-3xl text-stone-900">Room {room}</CardTitle>
                <CardDescription className="max-w-2xl text-sm leading-6 text-stone-600">
                  {descriptionText}
                </CardDescription>
              </div>

              <div className="flex flex-col items-start gap-2 sm:items-end">
                <div
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.24em]',
                    statusTone,
                  )}
                >
                  <span className="size-2 rounded-full bg-current" />
                  {gameState?.status === 'playing' ? 'En cours' : 'Round terminé'}
                </div>
                <p className="text-sm font-medium text-stone-700">{statusLabel}</p>
                {activePlayerName && activePlayerLabel ? (
                  <p className="text-sm text-stone-500">
                    Tour: {activePlayerLabel} ({activePlayerName})
                  </p>
                ) : null}
              </div>
            </CardHeader>
          </Card>

          <section className="grid gap-6 xl:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.4fr)_minmax(240px,0.8fr)]">
            <Card className="border border-stone-200/80 bg-white/90 shadow-[0_16px_50px_rgba(60,42,17,0.08)]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <HangmanPlayerAvatar playerNumber={1} className="size-12" />
                  <div>
                    <CardTitle className="text-xl text-stone-900">Larry</CardTitle>
                    <CardDescription>{player1Name}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50/80 p-3">
                  {getHangmanFrameSrc(gameState?.wrongCounts?.[1]) ? (
                    <img
                      className="mx-auto block h-auto w-full max-w-[220px] rounded-xl object-contain"
                      src={getHangmanFrameSrc(gameState?.wrongCounts?.[1]) ?? undefined}
                      alt={`Pendu ${gameState?.wrongCounts?.[1] ?? 0}/${maxErrors}`}
                      width={220}
                      height={300}
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <div
                      className="mx-auto h-[300px] w-full max-w-[220px] rounded-xl border border-dashed border-stone-300 bg-white"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-700">
                  Erreurs : <span className="font-medium text-stone-900">{gameState?.wrongCounts?.[1] ?? 0}</span> / {maxErrors}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-stone-200/80 bg-white/90 shadow-[0_16px_50px_rgba(60,42,17,0.08)]">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl text-stone-900">Word Board</CardTitle>
                <CardDescription className="text-sm leading-6 text-stone-600">
                  Guess letters one by one. Used letters stay visible for both players.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="rounded-[1.75rem] border border-stone-200 bg-[linear-gradient(180deg,_#fffdf8_0%,_#f4eee5_100%)] px-6 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
                    Word Progress
                  </p>
                  <p className="mt-4 break-all font-mono text-2xl tracking-[0.45em] text-stone-900 sm:text-3xl">
                    {gameState?.wordMask ?? '_ _ _ _ _'}
                  </p>
                </div>

                <div className="grid grid-cols-7 gap-2 sm:grid-cols-9 md:grid-cols-13">
                  {alphabet.map((letter) => {
                    const alreadyUsed = gameState?.guesses?.includes(letter)
                    const disabled =
                      !isInGame ||
                      alreadyUsed ||
                      gameState?.status !== 'playing' ||
                      gameState?.currentPlayer !== playerNumber

                    return (
                      <button
                        key={letter}
                        type="button"
                        className={cn(
                          'inline-flex h-10 items-center justify-center rounded-xl border text-sm font-medium transition',
                          alreadyUsed
                            ? 'border-stone-200 bg-stone-100 text-stone-500'
                            : 'border-stone-200 bg-white text-stone-900 hover:bg-stone-50',
                          disabled && 'cursor-not-allowed opacity-60',
                        )}
                        disabled={disabled}
                        onClick={() => handleGuess(letter)}
                      >
                        {letter}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-stone-200/80 bg-white/90 shadow-[0_16px_50px_rgba(60,42,17,0.08)]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <HangmanPlayerAvatar playerNumber={2} className="size-12" />
                  <div>
                    <CardTitle className="text-xl text-stone-900">John</CardTitle>
                    <CardDescription>{player2Name}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50/80 p-3">
                  {getHangmanFrameSrc(gameState?.wrongCounts?.[2]) ? (
                    <img
                      className="mx-auto block h-auto w-full max-w-[220px] rounded-xl object-contain"
                      src={getHangmanFrameSrc(gameState?.wrongCounts?.[2]) ?? undefined}
                      alt={`Pendu ${gameState?.wrongCounts?.[2] ?? 0}/${maxErrors}`}
                      width={220}
                      height={300}
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <div
                      className="mx-auto h-[300px] w-full max-w-[220px] rounded-xl border border-dashed border-stone-300 bg-white"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-700">
                  Erreurs : <span className="font-medium text-stone-900">{gameState?.wrongCounts?.[2] ?? 0}</span> / {maxErrors}
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      )}
      </div>
    </div>
  )
}

export default HangmanApp
