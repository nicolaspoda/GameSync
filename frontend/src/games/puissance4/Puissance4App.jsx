import { useState } from 'react'
import Puissance4Lobby from './Puissance4Lobby.jsx'
import Puissance4PrivateRoomCreation from './Puissance4PrivateRoomCreation.jsx'
import Puissance4Game from './Puissance4Game.jsx'

const SCREENS = {
  LOBBY: 'lobby',
  PRIVATE_ROOM: 'private-room',
  GAME: 'game',
}

function Puissance4App() {
  const [screen, setScreen] = useState(SCREENS.LOBBY)
  const [currentRoom, setCurrentRoom] = useState(null)

  const handleJoinRoom = ({ roomCode, roomName, playerId }) => {
    setCurrentRoom({ code: roomCode, name: roomName, isPrivate: false, playerId })
    setScreen(SCREENS.GAME)
  }

  const handlePrivateRoomCreated = ({ roomCode, roomName, playerId }) => {
    setCurrentRoom({ code: roomCode, name: roomName, isPrivate: true, playerId })
    setScreen(SCREENS.GAME)
  }

  const handleLeaveGame = () => {
    setCurrentRoom(null)
    setScreen(SCREENS.LOBBY)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>GameSync</h1>
        <p className="app-subtitle">Puissance 4</p>
      </header>

      <main className="app-main">
        {screen === SCREENS.LOBBY && (
          <Puissance4Lobby
            onJoinRoom={handleJoinRoom}
            onCreatePrivateRoom={() => setScreen(SCREENS.PRIVATE_ROOM)}
          />
        )}

        {screen === SCREENS.PRIVATE_ROOM && (
          <Puissance4PrivateRoomCreation
            onRoomCreated={handlePrivateRoomCreated}
            onBack={() => setScreen(SCREENS.LOBBY)}
          />
        )}

        {screen === SCREENS.GAME && currentRoom && (
          <Puissance4Game room={currentRoom} onLeave={handleLeaveGame} />
        )}
      </main>
    </div>
  )
}

export default Puissance4App
