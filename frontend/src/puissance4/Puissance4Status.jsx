function Puissance4Status({ gameState }) {
  const { currentPlayer, winner, players = [] } = gameState

  let label = 'En attente du prochain coup'
  if (players.length < 2) {
    label = "En attente d'un deuxième joueur"
  } else if (winner === 'DRAW') {
    label = 'Match nul'
  } else if (winner) {
    label = `Victoire de ${winner === 'RED' ? 'Rouge' : 'Jaune'}`
  } else if (currentPlayer) {
    label = `Tour de ${currentPlayer === 'RED' ? 'Rouge' : 'Jaune'}`
  }

  return (
    <div className="p4-status">
      <h3>État de la partie</h3>
      <p>{label}</p>
      {players.length > 0 && (
        <div className="p4-players">
          <h4>Joueurs</h4>
          <ul>
            {players.map((player) => (
              <li key={player.id} className="p4-player-row">
                <span
                  className={`p4-player-color ${
                    player.color === 'RED'
                      ? 'p4-player-color-red'
                      : player.color === 'YELLOW'
                        ? 'p4-player-color-yellow'
                        : ''
                  }`}
                />
                <span className="p4-player-name">
                  {player.name}{' '}
                  {player.color === 'RED'
                    ? '(Rouge)'
                    : player.color === 'YELLOW'
                      ? '(Jaune)'
                      : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default Puissance4Status

