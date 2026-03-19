export type Puissance4Color = 'RED' | 'YELLOW'
export type Puissance4Winner = Puissance4Color | 'DRAW' | null
export type Puissance4Cell = Puissance4Color | null
export type Puissance4Board = Puissance4Cell[][]

export type Puissance4Screen = 'lobby' | 'private-room' | 'game'

export interface Puissance4Player {
  id: string
  name: string
  color: Puissance4Color | null
}

export interface Puissance4GameState {
  board: Puissance4Board
  currentPlayer: Puissance4Color
  winner: Puissance4Winner
  players: Puissance4Player[]
}

export interface Puissance4RoomSession {
  code: string
  name: string
  isPrivate: boolean
  playerId: string
}

export interface Puissance4RoomPayload {
  roomCode: string
  roomName: string
  playerId: string
}

export function createEmptyPuissance4Board(): Puissance4Board {
  return Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => null))
}

export function createInitialPuissance4GameState(): Puissance4GameState {
  return {
    board: createEmptyPuissance4Board(),
    currentPlayer: 'RED',
    winner: null,
    players: [],
  }
}
