export type PlayerNumber = 0 | 1 | 2
export type GameStatus = 'playing' | 'won' | 'lost'

export type RoomPlayer = {
  username: string
  playerNumber: PlayerNumber
}

export type RoomState = {
  word: string
  guesses: string[]
  wrongCounts: Record<1 | 2, number>
  currentPlayer: 1 | 2
  status: GameStatus
  winner: 1 | 2 | null
  players: Record<string, RoomPlayer>
}

export type PublicRoomState = {
  wordLength: number
  wordMask: string
  guesses: string[]
  wrongCounts: Record<1 | 2, number>
  currentPlayer: 1 | 2
  status: GameStatus
  winner: 1 | 2 | null
  players: Record<1 | 2, string | null>
}

const rooms = new Map<string, RoomState>()

const words = ['METAAAAAL', 'HELLFEST', 'MOUDENC']
const maxErrors = 5

export function createRoomState(): RoomState {
  const word = words[Math.floor(Math.random() * words.length)]
  return {
    word,
    guesses: [],
    wrongCounts: {
      1: 0,
      2: 0,
    },
    currentPlayer: 1,
    status: 'playing',
    winner: null,
    players: {},
  }
}

export function getPublicState(roomState: RoomState): PublicRoomState {
  const { word, guesses, wrongCounts, currentPlayer, status, winner, players } = roomState
  const wordMask = word
    .split('')
    .map((character) => (guesses.includes(character) ? character : '_'))
    .join(' ')

  const playersByNumber: Record<1 | 2, string | null> = {
    1: null,
    2: null,
  }

  for (const player of Object.values(players)) {
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

export function generateRoomCode(length = 5): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = ''
  for (let index = 0; index < length; index += 1) {
    code += characters[Math.floor(Math.random() * characters.length)]
  }
  return code
}

export function getRooms() {
  return rooms
}

export function getMaxErrors(): number {
  return maxErrors
}
