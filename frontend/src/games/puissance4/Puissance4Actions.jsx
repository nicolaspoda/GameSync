function Puissance4Actions({ onRestart, onLeave }) {
  return (
    <div className="p4-actions">
      <h3>Actions</h3>
      <div className="p4-actions-column">
        <button className="primary-button" type="button" onClick={onRestart}>
          Recommencer la partie
        </button>
        <button className="secondary-button" type="button" onClick={onLeave}>
          Quitter la partie
        </button>
      </div>
    </div>
  )
}

export default Puissance4Actions

