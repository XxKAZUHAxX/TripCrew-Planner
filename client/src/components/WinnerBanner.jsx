// Celebratory banner displayed after the wheel lands.
export default function WinnerBanner({ destination, onClose }) {
  if (!destination) return null;
  return (
    <div className="alert alert-success text-center mt-4 shadow">
      <h2 className="h4">🎉 Destination decided!</h2>
      <p className="fs-5 fw-bold mb-1">{destination.name}</p>
      <button className="btn btn-success btn-sm" onClick={onClose}>
        Continue to Playbook →
      </button>
    </div>
  );
}
