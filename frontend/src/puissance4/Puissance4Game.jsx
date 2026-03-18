import { useEffect, useState } from 'react'
import socket from '../socket.js'
import Puissance4Board from './Puissance4Board.jsx'
import Puissance4Status from './Puissance4Status.jsx'
import Puissance4Actions from './Puissance4Actions.jsx'

const EMPTY_BOARD = Array.from({ length: 6 }, () =>
  Array.from({ length: 7 }, () => null),
)

const INITIAL_GAME_STATE = {
  board: EMPTY_BOARD,
  currentPlayer: 'RED',
  winner: null,
  players: [],
}

function Puissance4Game({ room, onLeave }) {
  const [gameState, setGameState] = useState(INITIAL_GAME_STATE)

  useEffect(() => {
    socket.emit('joinPuissance4Room', { roomCode: room.code, playerId: room.playerId })

    const handleGameStateUpdate = (nextState) => {
      setGameState((current) => ({
        ...current,
        ...nextState,
      }))
    }

    socket.on('puissance4GameStateUpdate', handleGameStateUpdate)

    return () => {
      socket.emit('leavePuissance4Room', { roomCode: room.code, playerId: room.playerId })
      socket.off('puissance4GameStateUpdate', handleGameStateUpdate)
    }
  }, [room.code, room.playerId])

  const handleClickColumn = (columnIndex) => {
    socket.emit('puissance4OnClickColumn', {
      roomCode: room.code,
      columnIndex,
    })
  }

  const handleRestart = () => {
    socket.emit('puissance4Restart', { roomCode: room.code })
    setGameState(INITIAL_GAME_STATE)
  }

  const players = gameState.players ?? []
  const me = players.find((player) => player.id === room.playerId)
  const isMyTurn = me && me.color && me.color === gameState.currentPlayer
  const canPlay = players.length >= 2 && !gameState.winner && isMyTurn

  return (
    <section className="p4-screen">
      <header className="p4-header">
        <div>
          <h2>Puissance 4 - Partie</h2>
          <p className="p4-room-subtitle">
            Salle&nbsp;: <strong>{room.name}</strong> ({room.code})
          </p>
        </div>
        <button className="ghost-button" type="button" onClick={onLeave}>
          Retour au lobby
        </button>
      </header>

      <div className="p4-game-layout">
        <div className="p4-panel">
          <Puissance4Board
            board={gameState.board}
            onClickColumn={handleClickColumn}
            disabled={!canPlay}
          />
        </div>

        <div className="p4-sidebar">
          <div className="p4-panel">
            <Puissance4Status gameState={gameState} />
          </div>
          <div className="p4-panel">
            <Puissance4Actions onRestart={handleRestart} onLeave={onLeave} />
          </div>
        </div>
      </div>

      {gameState.winner && (
        <div className="p4-modal-backdrop">
          <div className="p4-modal">
            <h3>Partie terminée</h3>
            <p className="p4-modal-text">
              {gameState.winner === 'DRAW'
                ? 'Match nul'
                : `Victoire de ${gameState.winner === 'RED' ? 'Rouge' : 'Jaune'}`}
            </p>
            <div className="p4-modal-actions">
              <button
                type="button"
                className="primary-button"
                onClick={handleRestart}
              >
                Rejouer
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={onLeave}
              >
                Quitter le lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Puissance4Game

