import { io, type Socket } from 'socket.io-client'
import { getHangmanBackendUrl } from './config'

type JoinRoomResponse = {
  ok?: boolean
  room?: string
  playerNumber?: number
  state?: HangmanGameState
}

export type HangmanPlayerNumber = 1 | 2

export type HangmanGameStatus = 'playing' | 'won' | 'lost'

export type HangmanGameState = {
  guesses: string[]
  status: HangmanGameStatus
  currentPlayer: number
  winner?: number
  players?: Partial<Record<HangmanPlayerNumber, string>>
  wrongCounts?: Partial<Record<HangmanPlayerNumber, number>>
  wordMask?: string
}

type ServerToClientEvents = {
  gameState: (state: HangmanGameState) => void
}

type ClientToServerEvents = {
  joinRoom: (
    payload: { username: string; room?: string },
    callback: (response: JoinRoomResponse) => void,
  ) => void
  guessLetter: (payload: {
    room: string
    letter: string
    playerNumber: number
  }) => void
}

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  getHangmanBackendUrl(),
  {
    autoConnect: true,
  },
)

export default socket
