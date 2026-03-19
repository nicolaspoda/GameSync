import { useState, type FormEvent } from 'react'
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
import { backendBaseUrl } from './config'
import type { Puissance4RoomPayload } from './types'

interface JoinRoomResponse extends Puissance4RoomPayload {
  error?: string
}

interface Puissance4LobbyProps {
  onJoinRoom: (payload: Puissance4RoomPayload) => void
  onCreatePrivateRoom: () => void
}

function Puissance4Lobby({
  onJoinRoom,
  onCreatePrivateRoom,
}: Puissance4LobbyProps) {
  const [gameCode, setGameCode] = useState('')
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleJoinRandom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedUsername = username.trim()
    if (!trimmedUsername) {
      setError('Entre un pseudo pour rejoindre une partie.')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      const response = await fetch(`${backendBaseUrl}/api/puissance4/join-random-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: trimmedUsername }),
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as Partial<JoinRoomResponse> | null
        throw new Error(payload?.error || 'Impossible de rejoindre une partie.')
      }
      const data = (await response.json()) as JoinRoomResponse
      onJoinRoom({
        roomCode: data.roomCode,
        roomName: data.roomName,
        playerId: data.playerId,
      })
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Impossible de rejoindre une partie.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedCode = gameCode.trim().toUpperCase()
    const trimmedUsername = username.trim()

    if (!trimmedCode || !trimmedUsername) {
      setError('Pseudo et code de partie sont requis.')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const response = await fetch(`${backendBaseUrl}/api/puissance4/join-room-by-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: trimmedUsername,
          roomCode: trimmedCode,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as Partial<JoinRoomResponse> | null
        throw new Error(payload?.error || 'Impossible de rejoindre cette partie.')
      }

      const data = (await response.json()) as JoinRoomResponse
      onJoinRoom({
        roomCode: data.roomCode,
        roomName: data.roomName,
        playerId: data.playerId,
      })
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Impossible de rejoindre cette partie.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
      <section className="rounded-[2rem] border border-black/5 bg-white/75 p-8 shadow-[0_24px_80px_rgba(60,42,17,0.10)] backdrop-blur">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-amber-700/80">
          Puissance 4
        </p>
        <h2 className="max-w-xl text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
          Pick a name and slide straight into a match.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-stone-600">
          Public rooms let you start fast, while private rooms give you a clean
          code-based setup to invite someone in.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
            <p className="text-sm font-medium text-stone-900">Quick Match</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Jump into the first available public room with one click.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
            <p className="text-sm font-medium text-stone-900">Private Codes</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Share a room code and keep the session focused on your own group.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
            <p className="text-sm font-medium text-stone-900">Instant Rematch</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Restart a finished board without leaving the room flow.
            </p>
          </div>
        </div>
      </section>

      <Card className="border border-stone-200/80 bg-white/90 shadow-[0_24px_80px_rgba(60,42,17,0.10)]">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-stone-900">Enter The Lobby</CardTitle>
          <CardDescription className="text-sm leading-6 text-stone-600">
            Use a nickname for matchmaking, then either join a public room or
            connect directly with a private code.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form className="space-y-4" onSubmit={handleJoinRandom}>
            <div className="space-y-2">
              <Label htmlFor="p4-username">Pseudo</Label>
              <Input
                id="p4-username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Ton pseudo"
              />
            </div>

            <Button className="h-10 w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Recherche de partie...' : 'Rejoindre une partie aleatoire'}
            </Button>
          </form>

          <div className="border-t border-stone-200 pt-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="p4-game-code">Code de partie</Label>
                <Input
                  id="p4-game-code"
                  type="text"
                  value={gameCode}
                  onChange={(event) => setGameCode(event.target.value)}
                  placeholder="Ex. ABCD1234"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button className="h-10 w-full" type="submit">
                  Rejoindre avec un code
                </Button>
                <Button
                  className="h-10 w-full"
                  type="button"
                  variant="outline"
                  onClick={onCreatePrivateRoom}
                >
                  Creer une salle privee
                </Button>
              </div>
            </form>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}

export default Puissance4Lobby
