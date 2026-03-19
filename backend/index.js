const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { puissance4Router, registerPuissance4Sockets } = require('./puissance4')

const app = express()

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }),
)
app.use(express.json())

app.use('/api/puissance4', puissance4Router)

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
app.set('io', io)
server.io = io

registerPuissance4Sockets(io)

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Puissance 4 backend listening on http://localhost:${PORT}`)
})
