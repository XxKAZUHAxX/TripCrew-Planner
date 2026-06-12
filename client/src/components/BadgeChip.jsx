// Tooltip-style chip describing a member's archetype badge.
const BADGE_STYLES = {
  'The Dictator': { bg: '#dc3545', icon: '👑' },
  'The Ghost': { bg: '#6c757d', icon: '👻' },
  'The Accountant': { bg: '#198754', icon: '🧮' },
  'The Overthinker': { bg: '#fd7e14', icon: '🤔' },
  'The Hype Machine': { bg: '#0d6efd', icon: '🎉' },
};

export default function BadgeChip({ label, description }) {
  const style = BADGE_STYLES[label] || { bg: '#343a40', icon: '🏷️' };
  return (
    <span
      className="badge rounded-pill badge-chip"
      style={{ backgroundColor: style.bg }}
      title={description || label}
    >
      {style.icon} {label}
    </span>
  );
}
