import express from 'express'
import http from 'http'
import { Server } from 'socket.io'

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
})

const ROOMS = new Map()

const WORDS = ['SOCKET', 'REACT', 'JAVASCRIPT', 'PENDU', 'BURNOUT', 'GAMESYNC']

function createRoomState() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)]
  return {
    word,
    guesses: [],
    wrongCounts: {
      1: 0,
      2: 0,
    },
    currentPlayer: 1,
    status: 'playing', // 'playing' | 'won' | 'lost'
    winner: null,
    players: {}, // socketId -> { username, playerNumber }
  }
}

function getPublicState(roomState) {
  const { word, guesses, wrongCounts, currentPlayer, status, winner, players } = roomState
  const wordMask = word
    .split('')
    .map((ch) => (guesses.includes(ch) ? ch : '_'))
    .join(' ')

  const playersByNumber = {
    1: null,
    2: null,
  }

  for (const player of Object.values(players ?? {})) {
    if (!player) continue
    if (player.playerNumber !== 1 && player.playerNumber !== 2) continue
    playersByNumber[player.playerNumber] = player.username ?? null
  }

  return {
    wordLength: word.length,
    wordMask,
    guesses,
    wrongCounts,
    currentPlayer,
    status,
    winner,
    players: playersByNumber,
  }
}

function generateRoomCode(length = 5) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < length; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, room }, callback) => {
    if (!username || typeof username !== 'string' || !username.trim()) {
      callback?.({ ok: false, error: 'INVALID_USERNAME' })
      return
    }

    const finalRoom =
      room && typeof room === 'string' && room.trim() ? room.trim().toUpperCase() : generateRoomCode()

    socket.join(finalRoom)

    let state = ROOMS.get(finalRoom)
    if (!state) {
      state = createRoomState()
      ROOMS.set(finalRoom, state)
    }

    let playerNumber = 0
    const existingPlayers = Object.values(state.players).map((p) => p.playerNumber)
    if (!existingPlayers.includes(1)) playerNumber = 1
    else if (!existingPlayers.includes(2)) playerNumber = 2

    state.players[socket.id] = {
      username: username.trim(),
      playerNumber,
    }

    callback?.({
      ok: true,
      room: finalRoom,
      playerNumber,
      state: getPublicState(state),
    })

    io.to(finalRoom).emit('gameState', getPublicState(state))
  })

  socket.on('guessLetter', ({ room, letter, playerNumber }) => {
    const state = ROOMS.get(room)
    if (!state || state.status !== 'playing') return

    const playerInfo = state.players[socket.id]
    if (!playerInfo || playerInfo.playerNumber !== playerNumber) return
    if (state.currentPlayer !== playerNumber) return

    const upper = typeof letter === 'string' ? letter.toUpperCase() : ''
    if (!upper || !/^[A-Z]$/.test(upper)) return
    if (state.guesses.includes(upper)) return

    state.guesses.push(upper)

    if (!state.word.includes(upper)) {
      state.wrongCounts[playerNumber] += 1
    }

    const allRevealed = state.word.split('').every((ch) => state.guesses.includes(ch))
    if (allRevealed) {
      state.status = 'won'
      state.winner = playerNumber
    }

    const maxErrors = 6
    if (state.wrongCounts[playerNumber] >= maxErrors) {
      state.status = 'lost'
      state.winner = playerNumber === 1 ? 2 : 1
    }

    if (state.status === 'playing') {
      state.currentPlayer = state.currentPlayer === 1 ? 2 : 1
    }

    io.to(room).emit('gameState', getPublicState(state))
  })

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room === socket.id) continue
      const state = ROOMS.get(room)
      if (!state) continue
      if (state.players[socket.id]) {
        delete state.players[socket.id]
        if (Object.keys(state.players).length === 0) {
          ROOMS.delete(room)
        }
      }
    }
  })
})

app.get('/', (_req, res) => {
  res.send('GameSync backend is running')
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${PORT}`)
})

