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

const HEART_VARIATIONS = [
  '❤️', '💖', '💗', '💓', '💞', '💕', '❣️', '💘', '💝', '❤️‍🔥', '❤️‍🩹',
  '🤍', '💙', '💜', '💛', '🧡', '🤎', '🖤',
  '💌',
  '<3', '♡', '♥', '❥', '❣'
]

export default function Card({
  cardData, dealDelay = 0, deckRef, stageRef,
  shouldExit, onExitComplete, isSpecial, onRevealed,
}) {
  const containerRef = useRef(null)
  const innerRef = useRef(null)
  const frontFaceRef = useRef(null)
  const isMounted = useRef(true)
  const hasFlippedRef = useRef(false)
  const hasReportedRef = useRef(false)

  const [phase, setPhase] = useState('init')
  const [magicReady, setMagicReady] = useState(false)
  const [showFromCard, setShowFromCard] = useState(false)
  const [heartIdx, setHeartIdx] = useState(0)

  useEffect(() => {
    if (!cardData?.loopingHeart || phase !== 'word') return
    const inner = innerRef.current
    if (!inner) return

    let active = true

    const doFlipLoop = () => {
      if (!active || !isMounted.current) return

      play('flip')
      gsap.to(inner, {
        rotationY: 90,
        duration: 0.16,
        ease: 'power1.in',
        onComplete: () => {
          if (!active) return
          setHeartIdx(prev => (prev + 1) % HEART_VARIATIONS.length)
          gsap.to(inner, {
            rotationY: 180,
            duration: 0.22,
            ease: 'back.out(1.5)',
            onComplete: () => {
              if (!active) return
              setTimeout(doFlipLoop, 400)
            }
          })
        }
      })
    }

    const initialTimer = setTimeout(doFlipLoop, 500)
    return () => {
      active = false
      clearTimeout(initialTimer)
    }
  }, [cardData, phase])

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

  const isFlippable = phase === 'facedown'

  const handleFlip = useCallback((e) => {
    if (e) {
      e.stopPropagation()
      if (e.target && e.target.hasPointerCapture && e.pointerId) {
        e.target.releasePointerCapture(e.pointerId)
      }
    }
    if (phase === 'facedown') {
      if (hasFlippedRef.current) return
      hasFlippedRef.current = true

      play('flip')
      animFlipToFront(innerRef.current, () => {
        if (isMounted.current) setPhase('word')
      })
    } else if (phase === 'word' && cardData?.magic?.type === 'transform') {
      setPhase('transform_reveal')
    }
  }, [phase, cardData])

  const handlePointerEnter = useCallback((e) => {
    if (e.buttons === 1) { // Left mouse button down or touch drag
      if (isFlippable) handleFlip(e)
    }
  }, [isFlippable, handleFlip])

  useEffect(() => {
    if (phase !== 'word') return

    if (isSpecial) {
      reportRevealed()
      const t = setTimeout(() => { if (isMounted.current) setPhase('hidden') }, 1200)
      return () => clearTimeout(t)
    }

    const magic = cardData.magic
    if (!magic) { reportRevealed(); return }

    if (magic.type === 'evolve') {
      const delay = magic.delay || 2000
      const t = setTimeout(() => {
        if (!isMounted.current) return
        setPhase('evolve_reveal_from')
      }, delay)
      return () => clearTimeout(t)
    }

    if (magic.type === 'transform') {
      const delay = magic.delay || 2000
      const t = setTimeout(() => {
        if (!isMounted.current) return
        setPhase('transform_reveal')
      }, delay)
      return () => clearTimeout(t)
    }
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
    if (magic?.type === 'transform') {
      if (!magicReady) return cardImageUrl(magic.rank, magic.suit)
      return null
    }
    return null
  })()

  const showWord = (() => {
    if (phase === 'hidden') return false
    if (showFromCard) return false
    if (magic?.type === 'transform') return magicReady
    return !magicReady
  })()

  const showCardImgContent = (() => {
    if (showFromCard) return true
    if (magic?.type === 'transform') return !magicReady
    if (magicReady) return true
    return false
  })()

  const isNumber = /^\d+$/.test(cardData?.text || '')

  return (
    <div
      className={`card-container ${isFlippable ? 'is-flippable' : ''}`}
      ref={containerRef}
      onPointerDown={isFlippable ? handleFlip : undefined}
      onPointerEnter={isFlippable ? handlePointerEnter : undefined}
      style={{ touchAction: 'none' }} // Prevent scrolling while swiping over cards
    >
      <div className="card-inner" ref={innerRef}>
        <div className="card-face card-back-face" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
          <img src={backCardUrl()} alt="back" onError={e => e.target.style.display = 'none'} />
        </div>
        <div className="card-face card-front-face" ref={frontFaceRef} style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
          <div className={`word-content ${showWord ? 'visible' : 'hidden'}`}>
            <div className="text-face">
              {cardData?.loopingHeart ? (
                <span className="card-word looping-heart">{HEART_VARIATIONS[heartIdx]}</span>
              ) : (
                <span className={`card-word ${isNumber ? 'number' : ''}`}>{cardData?.text || ''}</span>
              )}
            </div>
          </div>
          {(magic || showFromCard) && (
            <div className={`card-image-content ${showCardImgContent ? 'visible' : 'hidden'}`}>
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
