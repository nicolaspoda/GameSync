import { useEffect, useMemo, useState } from 'react'
import './hangman.css'
import { alphabet, hangmanFrames, maxErrors } from './constants'
import socket, { type HangmanGameState } from './socket'

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

  const getHangmanFrameSrc = (wrongCount?: number) => {
    const count = typeof wrongCount === 'number' ? wrongCount : 0
    if (count <= 0) return null
    const frameIndex = Math.min(Math.max(count, 1), maxErrors) - 1
    return hangmanFrames[frameIndex]
  }

  const showLobbyPage = !isInGame

  return (
    <div className="hangman-app-root">
      {showLobbyPage && (
        <header className="hangman-app-header">
          <h1 className="hangman-game-title">Burn-out</h1>
          <p className="hangman-game-subtitle">Le jeu</p>
        </header>
      )}

      {showLobbyPage ? (
        <main className="hangman-app-main hangman-app-main--lobby">
          <section className="hangman-welcome-card">
            <h2 className="hangman-welcome-title">Rejoins une partie</h2>

            <div className="hangman-form-row">
              <label htmlFor="username" className="hangman-form-label">
                Nom d&apos;utilisateur
              </label>
              <input
                id="username"
                className="hangman-text-input"
                type="text"
                placeholder="Nom d'utilisateur"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>

            <div className="hangman-form-row">
              <label htmlFor="room" className="hangman-form-label">
                Code de room (optionnel)
              </label>
              <input
                id="room"
                className="hangman-text-input"
                type="text"
                placeholder="Laisser vide pour créer une room"
                value={room}
                onChange={(event) => setRoom(event.target.value.toUpperCase())}
              />
            </div>

            {error && <p className="hangman-error-text">{error}</p>}

            <button
              className="hangman-primary-button"
              type="button"
              onClick={handleJoinRoom}
              disabled={joining}
            >
              {joining ? 'Connexion...' : 'Créer ou entrer dans une room'}
            </button>
          </section>
        </main>
      ) : (
        <main className="hangman-app-game">
          <section className="hangman-welcome-card">
            <h2 className="hangman-welcome-title">Partie en cours</h2>

            {room && (
              <p className="hangman-info-text">
                Room : <strong>{room}</strong> —{' '}
                {playerNumber ? `Tu es le joueur ${playerNumber}.` : 'Spectateur.'}
              </p>
            )}

            {isInGame && (
              <p className="hangman-info-text hangman-status-text">{statusLabel}</p>
            )}
          </section>

          <section className="hangman-layout-preview">
            <div className="hangman-column">
              <div className="hangman-placeholder">
                <div className="hangman-label">{player1Name}</div>
                <div className="hangman-frame">
                  {getHangmanFrameSrc(gameState?.wrongCounts?.[1]) ? (
                    <img
                      className="hangman-image"
                      src={getHangmanFrameSrc(gameState?.wrongCounts?.[1]) ?? undefined}
                      alt={`Pendu ${gameState?.wrongCounts?.[1] ?? 0}/${maxErrors}`}
                      width={220}
                      height={300}
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <div className="hangman-image hangman-image--empty" aria-hidden="true" />
                  )}
                </div>
                <div className="hangman-error-count">
                  Erreurs : {gameState?.wrongCounts?.[1] ?? 0} / {maxErrors}
                </div>
              </div>
            </div>

            <div className="hangman-center-column">
              <div className="hangman-word-placeholder">
                {gameState?.wordMask ?? '_ _ _ _ _'}
              </div>
              <div className="hangman-alphabet-grid">
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
                      className={`hangman-alpha-button ${alreadyUsed ? 'hangman-alpha-used' : ''}`}
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
                <div className="hangman-frame">
                  {getHangmanFrameSrc(gameState?.wrongCounts?.[2]) ? (
                    <img
                      className="hangman-image"
                      src={getHangmanFrameSrc(gameState?.wrongCounts?.[2]) ?? undefined}
                      alt={`Pendu ${gameState?.wrongCounts?.[2] ?? 0}/${maxErrors}`}
                      width={220}
                      height={300}
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <div className="hangman-image hangman-image--empty" aria-hidden="true" />
                  )}
                </div>
                <div className="hangman-error-count">
                  Erreurs : {gameState?.wrongCounts?.[2] ?? 0} / {maxErrors}
                </div>
              </div>
            </div>
          </section>
        </main>
      )}
    </div>
  )
}

export default HangmanApp
