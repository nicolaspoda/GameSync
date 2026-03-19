import johnImage from '@/assets/john.png'
import larryImage from '@/assets/larry.png'
import { cn } from '@/lib/utils'
import type { HangmanPlayerNumber } from './socket'

const playerMeta: Record<HangmanPlayerNumber, { image: string; label: string }> = {
  1: {
    image: larryImage,
    label: 'Larry',
  },
  2: {
    image: johnImage,
    label: 'John',
  },
}

interface HangmanPlayerAvatarProps {
  playerNumber: HangmanPlayerNumber
  className?: string
  imageClassName?: string
}

export function getHangmanPlayerLabel(playerNumber: HangmanPlayerNumber): string {
  return playerMeta[playerNumber].label
}

function HangmanPlayerAvatar({
  playerNumber,
  className,
  imageClassName,
}: HangmanPlayerAvatarProps) {
  const meta = playerMeta[playerNumber]

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full border border-stone-200 bg-white/90 p-1 shadow-sm',
        className,
      )}
    >
      <img
        src={meta.image}
        alt={meta.label}
        className={cn('size-full rounded-full object-cover', imageClassName)}
      />
    </div>
  )
}

export default HangmanPlayerAvatar
