/**
 * IntroScreen.jsx
 * Full-screen overlay. Tap anywhere to init AudioContext and start.
 */

export default function IntroScreen({ onStart }) {
  return (
    <div
      className="intro-screen"
      onClick={onStart}
      onTouchEnd={(e) => { e.preventDefault(); onStart() }}
      role="button"
      aria-label="Tap to begin"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onStart()}
    >
      {/* Suit symbols */}
      <div className="intro-suits" aria-hidden="true">
        <span className="red">♥</span> ♠ <span className="red">♦</span> ♣
      </div>

      {/* Title */}
      <h1 className="intro-title">52</h1>

      <div className="intro-divider" aria-hidden="true" />

      {/* CTA */}
      <p className="intro-hint">Tap anywhere to begin</p>
    </div>
  )
}
