import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import socket from './socket.js'
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
    const joinRoom = () => {
      socket.emit('joinPuissance4Room', { roomCode: room.code, playerId: room.playerId })
    }

    joinRoom()

    const handleGameStateUpdate = (nextState) => {
      setGameState((current) => ({
        ...current,
        ...nextState,
      }))
    }

    const handleRoomNotFound = () => {
      onLeave()
    }

    socket.on('puissance4GameStateUpdate', handleGameStateUpdate)
    socket.on('connect', joinRoom)
    socket.on('puissance4RoomNotFound', handleRoomNotFound)

    return () => {
      socket.off('connect', joinRoom)
      socket.off('puissance4RoomNotFound', handleRoomNotFound)
      socket.off('puissance4GameStateUpdate', handleGameStateUpdate)
      // Ne pas émettre leave ici : en dev React Strict Mode fait effet → cleanup → effet,
      // ce qui vidait la salle avant le 2ᵉ join. On quitte uniquement au clic sur "Quitter la partie".
    }
  }, [room.code, room.playerId, onLeave])

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

  const handleLeave = () => {
    socket.emit('leavePuissance4Room', { roomCode: room.code, playerId: room.playerId })
    onLeave()
  }

  const players = gameState.players ?? []
  const me = players.find((player) => player.id === room.playerId)
  const isMyTurn = me && me.color && me.color === gameState.currentPlayer
  const canPlay = players.length >= 2 && !gameState.winner && isMyTurn
  const boardDescription =
    players.length < 2
      ? "Waiting for a second player before the first token can drop."
      : canPlay
        ? 'Your turn. Pick the column where you want to play.'
        : gameState.winner
          ? 'This round is over. Restart to play again.'
          : 'Watch the board and wait for your next turn.'

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-amber-700/80">
            Live Match
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-stone-900">
            {room.name}
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Room code: <span className="font-mono font-medium text-stone-900">{room.code}</span>
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleLeave}>
          Retour au lobby
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.9fr)]">
        <Card className="border border-stone-200/80 bg-white/90 shadow-[0_24px_80px_rgba(60,42,17,0.10)]">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-stone-900">Game Board</CardTitle>
            <CardDescription className="text-sm leading-6 text-stone-600">
              {boardDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Puissance4Board
              board={gameState.board}
              onClickColumn={handleClickColumn}
              disabled={!canPlay}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="border border-stone-200/80 bg-white/90 shadow-[0_24px_80px_rgba(60,42,17,0.10)]">
            <CardContent className="pt-4">
              <Puissance4Status
                gameState={gameState}
                roomCode={room.code}
                currentPlayerId={room.playerId}
              />
            </CardContent>
          </Card>
          <Card className="border border-stone-200/80 bg-white/90 shadow-[0_24px_80px_rgba(60,42,17,0.10)]">
            <CardContent className="pt-4">
              <Puissance4Actions onRestart={handleRestart} onLeave={handleLeave} />
            </CardContent>
          </Card>
        </div>
      </div>

      {gameState.winner && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-stone-950/45 p-6 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-[2rem] border border-stone-200 bg-white p-6 text-center shadow-[0_24px_80px_rgba(60,42,17,0.18)]">
            <h3 className="text-2xl font-semibold text-stone-900">Partie terminée</h3>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              {gameState.winner === 'DRAW'
                ? 'Match nul'
                : `Victoire de ${gameState.winner === 'RED' ? 'Rouge' : 'Jaune'}`}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                className="h-10 flex-1"
                onClick={handleRestart}
              >
                Rejouer
              </Button>
              <Button
                type="button"
                className="h-10 flex-1"
                variant="outline"
                onClick={handleLeave}
              >
                Quitter le lobby
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Puissance4Game
