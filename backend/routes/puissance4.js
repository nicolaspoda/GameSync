const express = require('express')
const {
  createInitialGameState,
  rooms,
  generateRoomCode,
  getOrCreateWaitingRoom,
} = require('../services/puissance4Game')

const router = express.Router()

router.post('/join-random-room', (request, response) => {
  const { username } = request.body
  if (!username) {
    response.status(400).json({ error: 'username is required' })
    return
  }

  const room = getOrCreateWaitingRoom()
  const playerId = `p${Date.now()}${Math.random().toString(16).slice(2)}`
  room.players.push({ id: playerId, name: username })

  if (room.players.length === 1) {
    room.players[0].color = 'RED'
  } else if (room.players.length === 2) {
    room.players[1].color = 'YELLOW'
  }

  response.json({
    roomCode: room.code,
    roomName: room.name,
    playerId,
  })
})

router.post('/create-private-room', (request, response) => {
  const { username, roomName } = request.body
  if (!username || !roomName) {
    response.status(400).json({ error: 'username and roomName are required' })
    return
  }

  const code = generateRoomCode()
  const room = {
    code,
    name: roomName,
    isPrivate: true,
    players: [],
    gameState: createInitialGameState(),
  }

  const playerId = `p${Date.now()}${Math.random().toString(16).slice(2)}`
  room.players.push({ id: playerId, name: username, color: 'RED' })
  rooms.set(code, room)

  response.json({
    roomCode: room.code,
    roomName: room.name,
    playerId,
  })
})

router.post('/join-room-by-code', (request, response) => {
  const { username, roomCode } = request.body
  if (!username || !roomCode) {
    response
      .status(400)
      .json({ error: 'username and roomCode are required' })
    return
  }

  const room = rooms.get(roomCode)
  if (!room) {
    response.status(404).json({ error: 'room not found' })
    return
  }

  if (room.players.length >= 2) {
    response.status(400).json({ error: 'room is already full' })
    return
  }

  const playerId = `p${Date.now()}${Math.random().toString(16).slice(2)}`
  const player = { id: playerId, name: username }

  if (room.players.length === 0) {
    player.color = 'RED'
  } else if (room.players.length === 1) {
    const existingColor = room.players[0].color
    if (!existingColor || existingColor === 'RED') {
      player.color = 'YELLOW'
    } else {
      player.color = 'RED'
    }
  }

  room.players.push(player)

  response.json({
    roomCode: room.code,
    roomName: room.name,
    playerId,
  })
})

module.exports = router

