function Puissance4Status({ gameState, roomCode }) {
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
      {players.length < 2 && roomCode && (
        <div className="p4-waiting-help" style={{
          marginTop: 12,
          padding: 12,
          background: 'var(--surface-alt, rgba(255,255,255,0.06))',
          borderRadius: 8,
          fontSize: 13,
          lineHeight: 1.5,
        }}>
          <strong>Pour ajouter le 2ᵉ joueur :</strong>
          <ol style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            <li>Ouvre un <strong>nouvel onglet</strong> (Ctrl+T ou Cmd+T), pas un doublon d’onglet.</li>
            <li>Va sur <strong>{typeof window !== 'undefined' ? window.location.origin : 'localhost:5173'}</strong></li>
            <li>Puissance 4 → Rejoindre avec le code → entre le code <strong>{roomCode}</strong> et un <strong>autre pseudo</strong>.</li>
          </ol>
        </div>
      )}
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

