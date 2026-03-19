import { cn } from '@/lib/utils'
import Puissance4TokenAvatar, { getPuissance4TokenLabel } from './Puissance4TokenAvatar.jsx'

function Puissance4Status({ gameState, roomCode, currentPlayerId }) {
  const { currentPlayer, winner, players = [] } = gameState
  const currentTurnPlayer = players.find((player) => player.color === currentPlayer)
  const me = players.find((player) => player.id === currentPlayerId)

  let label = 'En attente du prochain coup'
  if (players.length < 2) {
    label = "En attente d'un deuxième joueur"
  } else if (winner === 'DRAW') {
    label = 'Match nul'
  } else if (winner) {
    label = `Victoire de ${getPuissance4TokenLabel(winner)}`
  } else if (currentPlayer) {
    label = `Tour de ${getPuissance4TokenLabel(currentPlayer)}`
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.24em]',
            winner === 'DRAW'
              ? 'border-stone-300 bg-stone-100 text-stone-700'
              : winner
                ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                : players.length < 2
                  ? 'border-amber-300 bg-amber-100 text-amber-800'
                  : 'border-sky-300 bg-sky-100 text-sky-800',
          )}
        >
          <span className="size-2 rounded-full bg-current" />
          {winner ? 'Partie terminée' : players.length < 2 ? 'En attente' : 'Tour en cours'}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-stone-900">État de la partie</h3>
          <p className="mt-1 text-sm leading-6 text-stone-600">{label}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">
            Salle
          </p>
          <p className="mt-2 font-mono text-lg text-stone-900">{roomCode}</p>
          {currentTurnPlayer ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-stone-600">
              <span>Joueur actif :</span>
              {currentTurnPlayer.color ? (
                <Puissance4TokenAvatar color={currentTurnPlayer.color} className="size-7" />
              ) : null}
              <span className="font-medium text-stone-900">{currentTurnPlayer.name}</span>
            </div>
          ) : null}
          {me ? (
            <p className="mt-1 text-sm text-stone-600">
              Toi : <span className="font-medium text-stone-900">{me.name}</span>
            </p>
          ) : null}
        </div>
      </div>

      {players.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium uppercase tracking-[0.24em] text-stone-500">
            Joueurs
          </h4>
          <ul className="space-y-3">
            {players.map((player) => (
              <li
                key={player.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {player.color ? (
                    <Puissance4TokenAvatar color={player.color} className="size-9" />
                  ) : (
                    <span className="size-3 rounded-full bg-stone-300" />
                  )}
                  <div>
                    <span className="text-sm font-medium text-stone-900">{player.name}</span>
                    {player.color ? (
                      <p className="text-xs text-stone-500">{getPuissance4TokenLabel(player.color)}</p>
                    ) : null}
                  </div>
                </div>
                {player.id === currentPlayerId ? (
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700">
                    You
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default Puissance4Status
