function Puissance4Board({ board, onClickColumn, disabled = false }) {
  return (
    <div className="p4-board">
      {board[0].map((_, columnIndex) => (
        <button
          key={columnIndex}
          type="button"
          className="p4-board-column"
          disabled={disabled}
          onClick={() => onClickColumn(columnIndex)}
        >
          {board
            .map((row) => row[columnIndex])
            .slice()
            .reverse()
            .map((cell, rowIndexFromBottom) => {
              const key = `${columnIndex}-${rowIndexFromBottom}`
              const cellClass =
                cell === 'RED'
                  ? 'p4-cell p4-cell-red'
                  : cell === 'YELLOW'
                    ? 'p4-cell p4-cell-yellow'
                    : 'p4-cell'
              return <div key={key} className={cellClass} />
            })}
        </button>
      ))}
    </div>
  )
}

export default Puissance4Board

