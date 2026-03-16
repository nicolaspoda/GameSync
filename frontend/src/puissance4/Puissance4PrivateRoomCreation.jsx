import { useMemo, useState } from 'react'

const backendBaseUrl =
  import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim() !== ''
    ? import.meta.env.VITE_BACKEND_URL
    : 'http://localhost:3000'

function Puissance4PrivateRoomCreation({ onRoomCreated, onBack }) {
  const [roomName, setRoomName] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [roomCode, setRoomCode] = useState('')
  const inviteLink = useMemo(
    () => (roomCode ? `${window.location.origin}/puissance4/${roomCode}` : ''),
    [roomCode],
  )

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
      setRoomCode(data.roomCode)
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
    <section className="p4-screen">
      <header className="p4-header">
        <h2>Puissance 4 - Salle privée</h2>
        <button className="ghost-button" type="button" onClick={onBack}>
          Retour au lobby
        </button>
      </header>

      <div className="p4-lobby-layout">
        <form className="p4-panel" onSubmit={handleSubmit}>
          <label className="p4-field-label" htmlFor="p4-creator-name">
            Ton pseudo
          </label>
          <input
            id="p4-creator-name"
            className="p4-input"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Ton pseudo"
          />

          <label className="p4-field-label" htmlFor="p4-room-name">
            Nom de la salle
          </label>
          <input
            id="p4-room-name"
            className="p4-input"
            type="text"
            value={roomName}
            onChange={(event) => setRoomName(event.target.value)}
            placeholder="Ex. Soirée entre amis"
          />

          <div className="p4-field-group">
            <span className="p4-field-label">Lien d&apos;invitation</span>
            <div className="p4-invite-row">
              <input
                className="p4-input"
                type="text"
                value={inviteLink}
                readOnly
              />
            </div>
          </div>

          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? 'Création...' : 'Créer la salle'}
          </button>

          {error && <p style={{ marginTop: 12, color: '#b91c1c' }}>{error}</p>}
        </form>
      </div>
    </section>
  )
}

export default Puissance4PrivateRoomCreation

