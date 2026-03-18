const {
  createInitialGameState,
  checkWinner,
  rooms,
  scheduleRoomDeletion,
  cancelRoomDeletion,
} = require('../services/puissance4Game')

function registerPuissance4Sockets(io) {
  io.on('connection', (socket) => {
    const syncRoomState = (roomCode) => {
      const room = rooms.get(roomCode)
      if (!room) return
      io.to(roomCode).emit('puissance4GameStateUpdate', {
        ...room.gameState,
        players: room.players,
      })
    }

    const removePlayerFromRoom = ({ roomCode, playerId }) => {
      const room = rooms.get(roomCode)
      if (!room || !playerId) return

      const nextPlayers = room.players.filter((candidate) => candidate.id !== playerId)
      if (nextPlayers.length === room.players.length) return

      room.players = nextPlayers

      if (room.players.length === 0) {
        scheduleRoomDeletion(roomCode)
        return
      }

      // Si quelqu'un quitte, on repart sur un état propre.
      room.gameState = createInitialGameState()
      syncRoomState(roomCode)
    }

    socket.on('joinPuissance4Room', ({ roomCode, playerId }) => {
      const normalizedRoomCode = String(roomCode || '').trim().toUpperCase()
      if (!normalizedRoomCode) return

      const room = rooms.get(normalizedRoomCode)
      if (!room) return
      cancelRoomDeletion(normalizedRoomCode)

      socket.data.roomCode = normalizedRoomCode
      if (playerId) socket.data.playerId = playerId

      if (playerId) {
        const player = room.players.find((candidate) => candidate.id === playerId)
        if (player) {
          // ok
        } else {
          // Si l'id n'est pas connu côté serveur, on évite de bloquer le leave:
          // le client a probablement déjà récupéré un nouvel id via l'API REST.
        }
      }

      socket.join(normalizedRoomCode)
      syncRoomState(normalizedRoomCode)
    })

    socket.on('leavePuissance4Room', ({ roomCode, playerId }) => {
      const effectiveRoomCode = (roomCode || socket.data.roomCode || '')
        .toString()
        .trim()
        .toUpperCase()
      const effectivePlayerId = playerId || socket.data.playerId
      if (!effectiveRoomCode) return

      socket.leave(effectiveRoomCode)
      removePlayerFromRoom({ roomCode: effectiveRoomCode, playerId: effectivePlayerId })
    })

    socket.on('puissance4OnClickColumn', ({ roomCode, columnIndex }) => {
      const normalizedRoomCode = String(roomCode || '').trim().toUpperCase()
      const room = rooms.get(normalizedRoomCode)
      if (!room || room.gameState.winner) return
      if (room.players.length < 2) return

      const { playerId } = socket.data
      if (!playerId) return

      const player = room.players.find((candidate) => candidate.id === playerId)
      if (!player || player.color !== room.gameState.currentPlayer) return

      const { board, currentPlayer } = room.gameState
      const nextBoard = board.map((row) => [...row])

      let placed = false
      for (let row = nextBoard.length - 1; row >= 0; row -= 1) {
        if (!nextBoard[row][columnIndex]) {
          nextBoard[row][columnIndex] = currentPlayer
          placed = true
          break
        }
      }

      if (!placed) {
        return
      }

      const winner = checkWinner(nextBoard)
      const nextState = {
        board: nextBoard,
        currentPlayer: winner
          ? currentPlayer
          : currentPlayer === 'RED'
            ? 'YELLOW'
            : 'RED',
        winner,
        lastMoveAt: Date.now(),
      }

      room.gameState = nextState
      syncRoomState(normalizedRoomCode)
    })

    socket.on('puissance4Restart', ({ roomCode }) => {
      const normalizedRoomCode = String(roomCode || '').trim().toUpperCase()
      const room = rooms.get(normalizedRoomCode)
      if (!room) return

      room.gameState = createInitialGameState()
      syncRoomState(normalizedRoomCode)
    })

    socket.on('disconnect', () => {
      const roomCode = socket.data.roomCode
      const playerId = socket.data.playerId
      if (!roomCode || !playerId) return
      removePlayerFromRoom({ roomCode, playerId })
    })
  })
}

module.exports = { registerPuissance4Sockets }

