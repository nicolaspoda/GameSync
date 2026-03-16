import './App.css'

import { useState } from 'react'
import Puissance4Lobby from './puissance4/Puissance4Lobby.jsx'
import Puissance4PrivateRoomCreation from './puissance4/Puissance4PrivateRoomCreation.jsx'
import Puissance4Game from './puissance4/Puissance4Game.jsx'

const SCREENS = {
  HUB: 'hub',
  P4_LOBBY: 'p4-lobby',
  P4_PRIVATE: 'p4-private',
  P4_GAME: 'p4-game',
}

function App() {
  const [screen, setScreen] = useState(SCREENS.HUB)
  const [currentRoom, setCurrentRoom] = useState(null)

  const goBackToHub = () => {
    setCurrentRoom(null)
    setScreen(SCREENS.HUB)
  }

  const handleJoinRoom = ({ roomCode, roomName, playerId }) => {
    setCurrentRoom({ code: roomCode, name: roomName, isPrivate: false, playerId })
    setScreen(SCREENS.P4_GAME)
  }

  const handlePrivateRoomCreated = ({ roomCode, roomName, playerId }) => {
    setCurrentRoom({ code: roomCode, name: roomName, isPrivate: true, playerId })
    setScreen(SCREENS.P4_GAME)
  }

  const handleLeaveGame = () => {
    setCurrentRoom(null)
    setScreen(SCREENS.P4_LOBBY)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>GameSync</h1>
        <p className="app-subtitle">Hub de jeux multijoueurs</p>
      </header>

      <main className="app-main">
        {screen === SCREENS.HUB && (
          <section className="hub-screen">
            <h2>Choisis un jeu</h2>
            <div className="hub-games">
              <button
                className="primary-button"
                type="button"
                onClick={() => setScreen(SCREENS.P4_LOBBY)}
              >
                Puissance 4
              </button>
            </div>
          </section>
        )}

        {screen === SCREENS.P4_LOBBY && (
          <Puissance4Lobby
            onJoinRoom={handleJoinRoom}
            onCreatePrivateRoom={() => setScreen(SCREENS.P4_PRIVATE)}
            onBack={goBackToHub}
          />
        )}

        {screen === SCREENS.P4_PRIVATE && (
          <Puissance4PrivateRoomCreation
            onRoomCreated={handlePrivateRoomCreated}
            onBack={() => setScreen(SCREENS.P4_LOBBY)}
          />
        )}

        {screen === SCREENS.P4_GAME && currentRoom && (
          <Puissance4Game room={currentRoom} onLeave={handleLeaveGame} />
        )}
      </main>
    </div>
  )
}

export default App
