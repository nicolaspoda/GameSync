import { useState } from 'react'

const backendBaseUrl =
  import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim() !== ''
    ? import.meta.env.VITE_BACKEND_URL
    : 'http://localhost:3000'

function Puissance4Lobby({ onJoinRoom, onCreatePrivateRoom, onBack }) {
  const [gameCode, setGameCode] = useState('')
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleJoinRandom = async (event) => {
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
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'Impossible de rejoindre une partie.')
      }
      const data = await response.json()
      onJoinRoom({
        roomCode: data.roomCode,
        roomName: data.roomName,
        playerId: data.playerId,
      })
    } catch (joinError) {
      setError(joinError.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (event) => {
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
      const response = await fetch(
        `${backendBaseUrl}/api/puissance4/join-room-by-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: trimmedUsername,
            roomCode: trimmedCode,
          }),
        },
      )

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || "Impossible de rejoindre cette partie.")
      }

      const data = await response.json()
      onJoinRoom({
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
    <section className="p4-screen">
      <header className="p4-header">
        <h2>Puissance 4 - Lobby</h2>
        <button className="ghost-button" type="button" onClick={onBack}>
          Retour au hub
        </button>
      </header>

      <div className="p4-lobby-layout">
        <div className="p4-panel">
          <form onSubmit={handleJoinRandom}>
            <label className="p4-field-label" htmlFor="p4-username">
              Pseudo
            </label>
            <input
              id="p4-username"
              className="p4-input"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Ton pseudo"
            />

            <button className="primary-button" type="submit" disabled={isLoading}>
              {isLoading ? 'Recherche de partie...' : 'Rejoindre une partie aléatoire'}
            </button>
          </form>

          <hr style={{ margin: '20px 0', borderColor: 'var(--border)' }} />

          <form onSubmit={handleSubmit}>
            <label className="p4-field-label" htmlFor="p4-game-code">
              Code de partie
            </label>
            <input
              id="p4-game-code"
              className="p4-input"
              type="text"
              value={gameCode}
              onChange={(event) => setGameCode(event.target.value)}
              placeholder="Ex. ABCD1234"
            />

            <div className="p4-actions-row">
              <button className="secondary-button" type="submit">
                Rejoindre avec un code
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={onCreatePrivateRoom}
              >
                Créer une salle privée
              </button>
            </div>
          </form>

          {error && <p style={{ marginTop: 12, color: '#b91c1c' }}>{error}</p>}
        </div>
      </div>
    </section>
  )
}

export default Puissance4Lobby

