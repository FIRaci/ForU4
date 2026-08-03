import { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import {
  animDeal, animFlipToFront, animSecondFlip, animExit,
  getDeckToStageOffset,
} from '../engine/animations.js'
import { cardImageUrl, backCardUrl } from '../engine/card-image.js'
import { play } from '../engine/sound-manager.js'

const MAGIC_ICONS = {
  'heart-icon': '❤️',
  'infinity-icon': '∞',
}

export default function Card({
  cardData, dealDelay = 0, deckRef, stageRef,
  shouldExit, onExitComplete, isSpecial, onRevealed,
}) {
  const containerRef  = useRef(null)
  const innerRef      = useRef(null)
  const frontFaceRef  = useRef(null)
  const isMounted      = useRef(true)
  const hasFlippedRef  = useRef(false)
  const hasReportedRef = useRef(false)

  const [phase, setPhase] = useState('init')
  const [magicReady, setMagicReady] = useState(false)
  const [showFromCard, setShowFromCard] = useState(false)

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const reportRevealed = useCallback(() => {
    if (hasReportedRef.current) return
    hasReportedRef.current = true
    onRevealed?.()
  }, [onRevealed])

  // Deal face-down. No auto-flip — the user flips it.
  //
  // IMPORTANT: from this effect onward, GSAP is the ONLY thing allowed to
  // touch opacity/x/y/rotation/scale on `container`. Previously the JSX
  // also set `style={{ opacity: ... }}` from React state, and the two
  // fought each other on every re-render — that race is what could leave
  // a card stuck fully transparent, or (worse) frozen at the deck's
  // off-center coordinates. See failsafe fix below.
  useEffect(() => {
    const container = containerRef.current
    const inner = innerRef.current
    if (!container || !inner) return

    gsap.set(container, { opacity: 0, x: 0, y: 0, rotation: 0, scale: 1 })
    gsap.set(inner, { rotationY: 0 })
    const fromPos = getDeckToStageOffset(deckRef?.current, stageRef?.current)

    let dealt = false
    const revealFacedown = () => {
      if (dealt || !isMounted.current) return
      dealt = true
      // BUG FIX: this used to only do `gsap.set(container, { opacity: 1 })`.
      // If animDeal's tween ever got interrupted before firing onComplete
      // (slow device, throttled tab, GSAP tween killed by a re-render),
      // the card would still be sitting at the DECK's x/y offset from the
      // very first gsap.set() below — so it "appeared" but stuck in the
      // corner, invisible against an empty center stage. Failsafe must
      // reset the FULL transform, not just opacity.
      gsap.set(container, { opacity: 1, x: 0, y: 0, rotation: 0, scale: 1 })
      setPhase('facedown')
    }
    const failsafeTimer = setTimeout(revealFacedown, dealDelay + 1500)

    const delayTimer = setTimeout(() => {
      if (!isMounted.current) return
      setPhase('dealing')
      play('deal')
      animDeal(container, fromPos, () => {
        if (!isMounted.current || dealt) return
        dealt = true
        setPhase('facedown')
      })
    }, dealDelay)

    return () => { clearTimeout(delayTimer); clearTimeout(failsafeTimer) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Tap the face-down card → user-triggered flip.
  const handleFlip = useCallback((e) => {
    e.stopPropagation()
    if (phase !== 'facedown' || hasFlippedRef.current) return
    hasFlippedRef.current = true

    play('flip')
    animFlipToFront(innerRef.current, () => {
      if (isMounted.current) setPhase('word')
    })
  }, [phase])

  useEffect(() => {
    if (phase !== 'word') return

    if (isSpecial) {
      reportRevealed()
      const t = setTimeout(() => { if (isMounted.current) setPhase('hidden') }, 1200)
      return () => clearTimeout(t)
    }

    const magic = cardData.magic
    if (!magic) { reportRevealed(); return }

    const delay = magic.delay || 2000
    const t = setTimeout(() => {
      if (!isMounted.current) return
      if (magic.type === 'evolve') setPhase('evolve_reveal_from')
      else if (magic.type === 'transform') setPhase('transform_reveal')
    }, delay)
    return () => clearTimeout(t)
  }, [phase, cardData, isSpecial, reportRevealed])

  useEffect(() => {
    if (phase !== 'transform_reveal') return
    play('shimmer')
    animSecondFlip(
      innerRef.current,
      () => { setMagicReady(true); frontFaceRef.current?.classList.add('card-glow') },
      () => { if (isMounted.current) setPhase('revealed') }
    )
  }, [phase])

  useEffect(() => {
    if (phase !== 'evolve_reveal_from') return
    play('shimmer')
    animSecondFlip(
      innerRef.current,
      () => setShowFromCard(true),
      () => { if (isMounted.current) setTimeout(() => setPhase('evolve_reveal_to'), 800) }
    )
  }, [phase])

  useEffect(() => {
    if (phase !== 'evolve_reveal_to') return
    play('evolve')
    animSecondFlip(
      innerRef.current,
      () => { setShowFromCard(false); setMagicReady(true); frontFaceRef.current?.classList.add('card-glow') },
      () => { if (isMounted.current) { play('shimmer'); setPhase('revealed') } }
    )
  }, [phase])

  useEffect(() => {
    if (phase === 'revealed') reportRevealed()
  }, [phase, reportRevealed])

  useEffect(() => {
    if (!shouldExit || phase === 'exiting') return
    setPhase('exiting')
    animExit(containerRef.current, () => { if (isMounted.current) onExitComplete?.() })
  }, [shouldExit, phase, onExitComplete])

  const magic = cardData.magic
  const icon = magic?.icon ? MAGIC_ICONS[magic.icon] : null
  const cardImgSrc = (() => {
    if (showFromCard && magic?.from) return cardImageUrl(magic.from.rank, magic.from.suit)
    if (magicReady && magic?.to) return cardImageUrl(magic.to.rank, magic.to.suit)
    if (magicReady && magic?.rank) return cardImageUrl(magic.rank, magic.suit)
    return null
  })()

  const showWord = !magicReady && !showFromCard && phase !== 'hidden'
  const isNumber = /^\d+$/.test(cardData?.text || '')
  const isFlippable = phase === 'facedown'

  return (
    <div
      className={`card-container ${isFlippable ? 'is-flippable' : ''}`}
      ref={containerRef}
      onClick={isFlippable ? handleFlip : undefined}
      onTouchEnd={isFlippable ? handleFlip : undefined}
      // NOTE: no `style={{ opacity }}` here anymore — GSAP fully owns
      // opacity/x/y/rotation/scale on this element (see effect above).
      // The starting opacity:0 now comes purely from `.card-container`'s
      // base CSS (see index.css) so there's no React-vs-GSAP race.
    >
      <div className="card-inner" ref={innerRef}>
        <div className="card-face card-back-face" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
          <img src={backCardUrl()} alt="back" onError={e => e.target.style.display = 'none'} />
        </div>
        <div className="card-face card-front-face" ref={frontFaceRef} style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
          <div className={`word-content ${showWord ? 'visible' : 'hidden'}`}>
            <div className="text-face">
              <span className={`card-word ${isNumber ? 'number' : ''}`}>{cardData?.text || ''}</span>
            </div>
          </div>
          {(magic || showFromCard) && (
            <div className={`card-image-content ${(magicReady || showFromCard) ? 'visible' : 'hidden'}`}>
              {icon ? <div className="heart-reveal">{icon}</div>
                : cardImgSrc ? <img src={cardImgSrc} alt="card" className="card-img" onError={e => e.target.style.display = 'none'} />
                : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
