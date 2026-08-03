/**
 * BeatCounter.jsx
 * Shows current progress: "4 / 31"
 */

export default function BeatCounter({ current, total }) {
  if (current < 0) return null
  return (
    <div className="beat-counter" aria-live="polite" aria-label={`Card ${current + 1} of ${total}`}>
      <em>{current + 1}</em>
      <span style={{ opacity: 0.4 }}>/</span>
      <span>{total}</span>
    </div>
  )
}
