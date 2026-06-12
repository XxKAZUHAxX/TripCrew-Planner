export default function Legend({ memberCount }) {
  const steps = [
    { color: '#ffffff', label: '0' },
    { color: '#C0DD97', label: '1' },
    { color: '#5DCAA5', label: '2' },
    { color: '#0F6E56', label: `3+` },
  ];
  return (
    <div className="d-flex align-items-center gap-2 mt-2">
      <small className="text-muted">Members free:</small>
      {steps.map((s) => (
        <span key={s.label} className="d-flex align-items-center gap-1">
          <span
            style={{
              width: 16,
              height: 16,
              display: 'inline-block',
              backgroundColor: s.color,
              border: '1px solid #dee2e6',
              borderRadius: 3,
            }}
          />
          <small>{s.label}</small>
        </span>
      ))}
    </div>
  );
}
