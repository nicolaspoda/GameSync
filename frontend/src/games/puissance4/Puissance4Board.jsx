import { cn } from '@/lib/utils'

function Puissance4Board({ board, onClickColumn, disabled = false }) {
  return (
    <div className="grid grid-cols-7 gap-2 rounded-[1.75rem] bg-[linear-gradient(180deg,_#2563eb_0%,_#1d4ed8_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] sm:gap-3 sm:p-4">
      {board[0].map((_, columnIndex) => (
        <button
          key={columnIndex}
          type="button"
          className={cn(
            'flex flex-col-reverse gap-2 rounded-2xl bg-black/10 p-1.5 transition hover:bg-white/10 sm:gap-3 sm:p-2',
            disabled && 'cursor-not-allowed opacity-70 hover:bg-black/10',
          )}
          disabled={disabled}
          onClick={() => onClickColumn(columnIndex)}
        >
          {board
            .map((row) => row[columnIndex])
            .slice()
            .reverse()
            .map((cell, rowIndexFromBottom) => {
              const key = `${columnIndex}-${rowIndexFromBottom}`
              return (
                <div
                  key={key}
                  className={cn(
                    'aspect-square w-full rounded-full border border-black/10 bg-white shadow-[inset_0_3px_8px_rgba(15,23,42,0.12)]',
                    cell === 'RED' &&
                      'bg-[linear-gradient(180deg,_#fb7185_0%,_#dc2626_100%)] shadow-[inset_0_3px_8px_rgba(255,255,255,0.2)]',
                    cell === 'YELLOW' &&
                      'bg-[linear-gradient(180deg,_#fde68a_0%,_#eab308_100%)] shadow-[inset_0_3px_8px_rgba(255,255,255,0.25)]',
                  )}
                />
              )
            })}
        </button>
      ))}
    </div>
  )
}

export default Puissance4Board
