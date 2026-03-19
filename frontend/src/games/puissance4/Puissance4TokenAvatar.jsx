import { cn } from '@/lib/utils'
import johnImage from '@/assets/john.png'
import larryImage from '@/assets/larry.png'

const tokenMeta = {
  RED: {
    image: larryImage,
    label: 'Larry',
  },
  YELLOW: {
    image: johnImage,
    label: 'John',
  },
}

export function getPuissance4TokenLabel(color) {
  return color ? tokenMeta[color]?.label ?? color : null
}

function Puissance4TokenAvatar({ color, className, imageClassName }) {
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
