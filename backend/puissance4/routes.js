const express = require('express')
const {
  createInitialGameState,
  rooms,
  generateRoomCode,
  getOrCreateWaitingRoom,
  cancelRoomDeletion,
} = require('./game')

const router = express.Router()

router.post('/join-random-room', (request, response) => {
  const { username } = request.body
  if (!username) {
    response.status(400).json({ error: 'Pseudo requis.' })
    return
  }

  const room = getOrCreateWaitingRoom()
  cancelRoomDeletion(room.code)
  const playerId = `p${Date.now()}${Math.random().toString(16).slice(2)}`
  room.players.push({ id: playerId, name: username })

  if (room.players.length === 1) {
    room.players[0].color = 'RED'
  } else if (room.players.length === 2) {
    room.players[1].color = 'YELLOW'
  }

  const io = request.app.get('io') || request.socket?.server?.io
  if (io) {
    io.to(room.code).emit('puissance4GameStateUpdate', {
      ...room.gameState,
      players: room.players,
    })
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
    response.status(400).json({ error: 'Pseudo et nom de salle requis.' })
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
  cancelRoomDeletion(code)

  const playerId = `p${Date.now()}${Math.random().toString(16).slice(2)}`
  room.players.push({ id: playerId, name: username, color: 'RED' })
  rooms.set(code, room)

  const io = request.app.get('io') || request.socket?.server?.io
  if (io) {
    io.to(room.code).emit('puissance4GameStateUpdate', {
      ...room.gameState,
      players: room.players,
    })
  }

  response.json({
    roomCode: room.code,
    roomName: room.name,
    playerId,
  })
})

router.post('/join-room-by-code', (request, response) => {
  const { username, roomCode } = request.body
  if (!username || !roomCode) {
    response.status(400).json({ error: 'Pseudo et code de partie requis.' })
    return
  }

  const normalizedRoomCode = String(roomCode).trim().toUpperCase()
  const room = rooms.get(normalizedRoomCode)
  if (!room) {
    response.status(404).json({
      error:
        "Salle introuvable. Vérifie le code (6 caractères) ou recrée une salle (le serveur a peut-être redémarré).",
    })
    return
  }
  cancelRoomDeletion(normalizedRoomCode)

  if (room.players.length >= 2) {
    response.status(400).json({ error: 'Cette salle est déjà complète.' })
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

  const io = request.app.get('io') || request.socket?.server?.io
  if (io) {
    io.to(normalizedRoomCode).emit('puissance4GameStateUpdate', {
      ...room.gameState,
      players: room.players,
    })
    // eslint-disable-next-line no-console
    console.log(
      '[P4 REST] join-room-by-code: salle',
      normalizedRoomCode,
      '→',
      room.players.length,
      'joueur(s), emit OK',
    )
  } else {
    // eslint-disable-next-line no-console
    console.warn('[P4 REST] join-room-by-code: io non disponible, pas d emit')
  }

  response.json({
    roomCode: room.code,
    roomName: room.name,
    playerId,
  })
})

module.exports = router
