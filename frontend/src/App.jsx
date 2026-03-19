import { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

const socket = io('http://localhost:3000')

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function App() {
  const [username, setUsername] = useState('')
  const [room, setRoom] = useState('')
  const [playerNumber, setPlayerNumber] = useState(0)
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)
  const [gameState, setGameState] = useState(null)

  const isInGame = useMemo(() => !!room && !!playerNumber && !!gameState, [room, playerNumber, gameState])

  useEffect(() => {
    const handleGameState = (state) => {
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
      if (!response?.ok) {
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

  const handleGuess = (letter) => {
    if (!isInGame || !gameState) return
    if (gameState.guesses.includes(letter)) return
    if (gameState.status !== 'playing') return
    if (gameState.currentPlayer !== playerNumber) return

    socket.emit('guessLetter', { room, letter, playerNumber })
  }

  const statusLabel = useMemo(() => {
    if (!gameState) return ''
    if (gameState.status === 'playing') {
      if (gameState.currentPlayer === playerNumber) return 'À ton tour !'
      return "Tour de l'adversaire"
    }
    if (gameState.status === 'won') {
      return gameState.winner === playerNumber ? 'Tu as gagné !' : 'Tu as perdu.'
    }
    if (gameState.status === 'lost') {
      return gameState.winner === playerNumber ? 'Tu as gagné !' : 'Tu as perdu.'
    }
    return ''
  }, [gameState, playerNumber])

  const player1Name = useMemo(() => gameState?.players?.[1] ?? 'Joueur 1', [gameState])
  const player2Name = useMemo(() => gameState?.players?.[2] ?? 'Joueur 2', [gameState])

  const showLobbyPage = !isInGame

  return (
    <div className="app-root">
      <header className="app-header">
        <h1 className="game-title">Burn-out</h1>
        <p className="game-subtitle">Jeu du pendu à deux joueurs</p>
      </header>

      {showLobbyPage ? (
        <main className="app-main app-main--lobby">
          <section className="welcome-card">
            <h2 className="welcome-title">Rejoins une partie</h2>

            <div className="form-row">
              <label htmlFor="username" className="form-label">
                Nom d&apos;utilisateur
              </label>
              <input
                id="username"
                className="text-input"
                type="text"
                placeholder="Nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-row">
              <label htmlFor="room" className="form-label">
                Code de room (optionnel)
              </label>
              <input
                id="room"
                className="text-input"
                type="text"
                placeholder="Laisse vide pour créer une room"
                value={room}
                onChange={(e) => setRoom(e.target.value.toUpperCase())}
              />
            </div>

            {error && <p className="error-text">{error}</p>}

            <button
              className="primary-button"
              type="button"
              onClick={handleJoinRoom}
              disabled={joining}
            >
              {joining ? 'Connexion...' : 'Créer ou entrer dans une room'}
            </button>
          </section>
        </main>
      ) : (
        <main className="app-main">
          <section className="welcome-card">
            <h2 className="welcome-title">Partie en cours</h2>

            {room && (
              <p className="info-text">
                Room : <strong>{room}</strong> —{' '}
                {playerNumber ? `Tu es le joueur ${playerNumber}.` : 'Spectateur.'}
              </p>
            )}

            {isInGame && <p className="info-text status-text">{statusLabel}</p>}
          </section>

          <section className="layout-preview">
            <div className="hangman-column">
              <div className="hangman-placeholder">
                <div className="hangman-label">{player1Name}</div>
                <div className="hangman-body">
                  <div className={`hangman-part ${gameState?.wrongCounts?.[1] > 0 ? 'visible' : ''}`} />
                  <div className={`hangman-part ${gameState?.wrongCounts?.[1] > 1 ? 'visible' : ''}`} />
                  <div className={`hangman-part ${gameState?.wrongCounts?.[1] > 2 ? 'visible' : ''}`} />
                  <div className={`hangman-part ${gameState?.wrongCounts?.[1] > 3 ? 'visible' : ''}`} />
                  <div className={`hangman-part ${gameState?.wrongCounts?.[1] > 4 ? 'visible' : ''}`} />
                  <div className={`hangman-part ${gameState?.wrongCounts?.[1] > 5 ? 'visible' : ''}`} />
                </div>
                <div className="error-count">Erreurs : {gameState?.wrongCounts?.[1] ?? 0} / 6</div>
              </div>
            </div>

            <div className="center-column">
              <div className="word-placeholder">{gameState?.wordMask ?? '_ _ _ _ _'}</div>
              <div className="alphabet-grid">
                {ALPHABET.map((letter) => {
                  const already = gameState?.guesses?.includes(letter)
                  const disabled =
                    !isInGame ||
                    already ||
                    gameState?.status !== 'playing' ||
                    gameState?.currentPlayer !== playerNumber

                  return (
                    <button
                      key={letter}
                      type="button"
                      className={`alpha-button ${already ? 'alpha-used' : ''}`}
                      disabled={disabled}
                      onClick={() => handleGuess(letter)}
                    >
                      {letter}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="hangman-column">
              <div className="hangman-placeholder">
                <div className="hangman-label">{player2Name}</div>
                <div className="hangman-body">
                  <div className={`hangman-part ${gameState?.wrongCounts?.[2] > 0 ? 'visible' : ''}`} />
                  <div className={`hangman-part ${gameState?.wrongCounts?.[2] > 1 ? 'visible' : ''}`} />
                  <div className={`hangman-part ${gameState?.wrongCounts?.[2] > 2 ? 'visible' : ''}`} />
                  <div className={`hangman-part ${gameState?.wrongCounts?.[2] > 3 ? 'visible' : ''}`} />
                  <div className={`hangman-part ${gameState?.wrongCounts?.[2] > 4 ? 'visible' : ''}`} />
                  <div className={`hangman-part ${gameState?.wrongCounts?.[2] > 5 ? 'visible' : ''}`} />
                </div>
                <div className="error-count">Erreurs : {gameState?.wrongCounts?.[2] ?? 0} / 6</div>
              </div>
            </div>
          </section>
        </main>
      )}
    </div>
  )
}

export default App
