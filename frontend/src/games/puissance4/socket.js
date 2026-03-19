import { io } from 'socket.io-client'
import { backendBaseUrl } from './config.js'

const socket = io(backendBaseUrl, {
  autoConnect: true,
})

export default socket
