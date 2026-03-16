const {
  createInitialGameState,
  checkWinner,
  rooms,
} = require('../services/puissance4Game')

function registerPuissance4Sockets(io) {
  io.on('connection', (socket) => {
    socket.on('joinPuissance4Room', ({ roomCode, playerId }) => {
      const room = rooms.get(roomCode)
      if (!room) return

      if (playerId) {
        const player = room.players.find((candidate) => candidate.id === playerId)
        if (player) {
          socket.data.playerId = playerId
          socket.data.roomCode = roomCode
        }
      }

      socket.join(roomCode)
      io.to(roomCode).emit('puissance4GameStateUpdate', {
        ...room.gameState,
        players: room.players,
      })
    })

    socket.on('puissance4OnClickColumn', ({ roomCode, columnIndex }) => {
      const room = rooms.get(roomCode)
      if (!room || room.gameState.winner) return

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
      io.to(roomCode).emit('puissance4GameStateUpdate', {
        ...nextState,
        players: room.players,
      })
    })

    socket.on('puissance4Restart', ({ roomCode }) => {
      const room = rooms.get(roomCode)
      if (!room) return

      room.gameState = createInitialGameState()
      io.to(roomCode).emit('puissance4GameStateUpdate', {
        ...room.gameState,
        players: room.players,
      })
    })
  })
}

module.exports = { registerPuissance4Sockets }

