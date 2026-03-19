import { io } from 'socket.io-client'

const endpoint =
  import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim() !== ''
    ? import.meta.env.VITE_BACKEND_URL
    : 'http://localhost:3000'

const socket = io(endpoint, {
  autoConnect: true,
})

export default socket

