import { useState } from 'react'
import Puissance4Lobby from './Puissance4Lobby'
import Puissance4PrivateRoomCreation from './Puissance4PrivateRoomCreation'
import Puissance4Game from './Puissance4Game'
import type { Puissance4RoomPayload, Puissance4RoomSession, Puissance4Screen } from './types'

function Puissance4App() {
  const [screen, setScreen] = useState<Puissance4Screen>('lobby')
  const [currentRoom, setCurrentRoom] = useState<Puissance4RoomSession | null>(null)

  const handleJoinRoom = ({ roomCode, roomName, playerId }: Puissance4RoomPayload) => {
    setCurrentRoom({
      code: roomCode,
      name: roomName,
      isPrivate: false,
      playerId,
    })
    setScreen('game')
  }

  const handlePrivateRoomCreated = ({
    roomCode,
    roomName,
    playerId,
  }: Puissance4RoomPayload) => {
    setCurrentRoom({
      code: roomCode,
      name: roomName,
      isPrivate: true,
      playerId,
    })
    setScreen('game')
  }

  const handleLeaveGame = () => {
    setCurrentRoom(null)
    setScreen('lobby')
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,125,96,0.18),_transparent_28%),linear-gradient(180deg,_#fff8ef_0%,_#f4efe7_100%)] px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="rounded-[2rem] border border-black/5 bg-white/75 p-8 shadow-[0_24px_80px_rgba(60,42,17,0.10)] backdrop-blur">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-amber-700/80">
            GameSync
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
            Puissance 4
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
            Join a public room, host a private match, and play inside the same
            polished player experience as the rest of the catalog.
          </p>
        </section>

        {screen === 'lobby' && (
          <Puissance4Lobby
            onJoinRoom={handleJoinRoom}
            onCreatePrivateRoom={() => setScreen('private-room')}
          />
        )}

        {screen === 'private-room' && (
          <Puissance4PrivateRoomCreation
            onRoomCreated={handlePrivateRoomCreated}
            onBack={() => setScreen('lobby')}
          />
        )}

        {screen === 'game' && currentRoom && (
          <Puissance4Game room={currentRoom} onLeave={handleLeaveGame} />
        )}
      </div>
    </div>
  )
}

export default Puissance4App
