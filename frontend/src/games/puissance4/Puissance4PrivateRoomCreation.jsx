import { useState } from 'react'
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
import { backendBaseUrl } from './config.js'

function Puissance4PrivateRoomCreation({ onRoomCreated, onBack }) {
  const [roomName, setRoomName] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = roomName.trim()
    const trimmedUsername = username.trim()
    if (!trimmed || !trimmedUsername) {
      setError('Pseudo et nom de salle sont requis.')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      const response = await fetch(
        `${backendBaseUrl}/api/puissance4/create-private-room`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: trimmedUsername,
            roomName: trimmed,
          }),
        },
      )
      if (!response.ok) {
        throw new Error("Impossible de créer la salle privée.")
      }
      const data = await response.json()
      onRoomCreated({
        roomCode: data.roomCode,
        roomName: data.roomName,
        playerId: data.playerId,
      })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-[2rem] border border-black/5 bg-white/75 p-8 shadow-[0_24px_80px_rgba(60,42,17,0.10)] backdrop-blur">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-amber-700/80">
          Private Match
        </p>
        <h2 className="max-w-xl text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
          Create a room that feels curated, not chaotic.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-stone-600">
          Name the room, choose your display name, and share the generated code
          with the second player when you are ready.
        </p>
      </section>

      <Card className="border border-stone-200/80 bg-white/90 shadow-[0_24px_80px_rgba(60,42,17,0.10)]">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-stone-900">Create A Private Room</CardTitle>
          <CardDescription className="text-sm leading-6 text-stone-600">
            The room host enters first and receives the room code immediately.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="p4-creator-name">Ton pseudo</Label>
              <Input
                id="p4-creator-name"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Ton pseudo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="p4-room-name">Nom de la salle</Label>
              <Input
                id="p4-room-name"
                type="text"
                value={roomName}
                onChange={(event) => setRoomName(event.target.value)}
                placeholder="Ex. Soiree entre amis"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button className="h-10 w-full" type="submit" disabled={isLoading}>
                {isLoading ? 'Création...' : 'Créer la salle'}
              </Button>
              <Button
                className="h-10 w-full"
                type="button"
                variant="outline"
                onClick={onBack}
              >
                Retour au lobby
              </Button>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </section>
  )
}

export default Puissance4PrivateRoomCreation
