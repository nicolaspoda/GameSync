import { cn } from '@/lib/utils'
import johnImage from '@/assets/john.png'
import larryImage from '@/assets/larry.png'
import type { Puissance4Color } from './types'

const tokenMeta: Record<Puissance4Color, { image: string; label: string }> = {
  RED: {
    image: larryImage,
    label: 'Larry',
  },
  YELLOW: {
    image: johnImage,
    label: 'John',
  },
}

export function getPuissance4TokenLabel(color: Puissance4Color | null): string | null {
  return color ? tokenMeta[color]?.label ?? color : null
}

interface Puissance4TokenAvatarProps {
  color: Puissance4Color | null
  className?: string
  imageClassName?: string
}

function Puissance4TokenAvatar({
  color,
  className,
  imageClassName,
}: Puissance4TokenAvatarProps) {
  if (!color || !tokenMeta[color]) {
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-full border border-stone-200 bg-white/90',
          className,
        )}
      />
    )
  }

  const meta = tokenMeta[color]

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

export default Puissance4TokenAvatar
