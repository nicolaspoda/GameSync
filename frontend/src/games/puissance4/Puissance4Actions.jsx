import { Button } from '@/components/ui/button'

function Puissance4Actions({ onRestart, onLeave }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-stone-900">Actions</h3>
        <p className="mt-1 text-sm leading-6 text-stone-600">
          Restart the board or return to the lobby when you are done.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Button className="h-10 w-full" type="button" onClick={onRestart}>
          Recommencer la partie
        </Button>
        <Button
          className="h-10 w-full"
          type="button"
          variant="outline"
          onClick={onLeave}
        >
          Quitter la partie
        </Button>
      </div>
    </div>
  )
}

export default Puissance4Actions
