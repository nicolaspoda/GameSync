const EMPTY_BOARD = Array.from({ length: 6 }, () =>
  Array.from({ length: 7 }, () => null),
)

function createInitialGameState() {
  return {
    board: EMPTY_BOARD.map((row) => [...row]),
    currentPlayer: 'RED',
    winner: null,
    lastMoveAt: Date.now(),
  }
}

function checkWinner(board) {
  const directions = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ]

  const inBounds = (row, column) =>
    row >= 0 && row < board.length && column >= 0 && column < board[0].length

  for (let row = 0; row < board.length; row += 1) {
    for (let column = 0; column < board[0].length; column += 1) {
      const cell = board[row][column]
      if (!cell) continue

      for (const [deltaRow, deltaColumn] of directions) {
        let count = 1
        let nextRow = row + deltaRow
        let nextColumn = column + deltaColumn
        while (
          inBounds(nextRow, nextColumn) &&
          board[nextRow][nextColumn] === cell
        ) {
          count += 1
          if (count === 4) {
            return cell
          }
          nextRow += deltaRow
          nextColumn += deltaColumn
        }
      }
    }
  }

  const isFull = board.every((row) => row.every((cell) => cell !== null))
  if (isFull) return 'DRAW'

  return null
}

const rooms = new Map()

function generateRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let index = 0; index < 6; index += 1) {
    const randomIndex = Math.floor(Math.random() * alphabet.length)
    result += alphabet[randomIndex]
  }
  return result
}

function getOrCreateWaitingRoom() {
  for (const room of rooms.values()) {
    if (!room.isPrivate && room.players.length === 1) {
      return room
    }
  }

  const code = generateRoomCode()
  const room = {
    code,
    name: `Room ${code}`,
    isPrivate: false,
    players: [],
    gameState: createInitialGameState(),
  }
  rooms.set(code, room)
  return room
}

module.exports = {
  createInitialGameState,
  checkWinner,
  rooms,
  generateRoomCode,
  getOrCreateWaitingRoom,
}

