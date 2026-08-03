import gsap from 'gsap'

export const getDeckToStageOffset = (deckEl, stageEl) => {
  if (!deckEl || !stageEl) return { x: 200, y: -200 }
  const deckR  = deckEl.getBoundingClientRect()
  const stageR = stageEl.getBoundingClientRect()
  return {
    x: (deckR.left + deckR.width  / 2) - (stageR.left + stageR.width  / 2),
    y: (deckR.top  + deckR.height / 2) - (stageR.top  + stageR.height / 2),
  }
}

export const animDeal = (el, fromPos, onComplete) => {
  gsap.set(el, { x: fromPos.x, y: fromPos.y, rotation: 15, opacity: 0, scale: 0.8 })
  return gsap.to(el, {
    x: 0, y: 0, rotation: gsap.utils.random(-3, 3), opacity: 1, scale: 1,
    duration: 0.5, ease: 'power2.out',
    onComplete
  })
}

// Container starts at rotationY:0 (back face towards viewer, per index.css:
// .card-front-face has transform: rotateY(180deg), .card-back-face has none).
// This animates 0 -> 180, revealing the front face.
export const animFlipToFront = (innerEl, onComplete) => {
  return gsap.to(innerEl, { rotationY: 180, duration: 0.5, ease: 'power2.inOut', onComplete })
}

export const animFlipToBack = (innerEl, onComplete) => {
  return gsap.to(innerEl, { rotationY: 0, duration: 0.5, ease: 'power2.inOut', onComplete })
}

export const animExit = (el, onComplete) => {
  return gsap.to(el, {
    x: -300, y: 200, opacity: 0, scale: 0.7, rotation: -15,
    duration: 0.4, ease: 'power2.in',
    onComplete
  })
}



// BUG FIX: this used to bounce 0 -> 90 -> 0. But by the time a card is
// showing its word (ready for a "second flip" reveal), its inner element is
// already resting at rotationY:180 (that's what "front face visible" means
// in this project's CSS — see animFlipToFront above), NOT 0. Bouncing
// toward 0 meant the reveal flip was animating toward the BACK face's
// resting angle, not a clean front-to-front flip. Fixed to bounce around
// the real front-facing angle (180), so the card visibly stays "facing you"
// the whole time, just flashes edge-on for a beat while the face swaps.
export function animSecondFlip(el, onMid, onDone) {
  gsap.timeline()
    .to(el, {
      rotationY: 90,
      duration: 0.22,
      ease: 'power1.in',
      onComplete: () => onMid?.(),
    })
    .to(el, {
      rotationY: 180,
      duration: 0.28,
      ease: 'back.out(1.4)',
      onComplete: () => onDone?.(),
    })
}

export const animSplitBurst = (childEls, positions, onComplete) => {
  childEls.forEach((el, i) => {
    const pos = positions[i] || { x: 0, y: 0, rotation: 0 }
    gsap.set(el, { x: 0, y: 0, rotation: 0, opacity: 0, scale: 0.8 })
    gsap.to(el, {
      x: pos.x, y: pos.y, rotation: pos.rotation, opacity: 1, scale: 1,
      duration: 0.4, ease: 'power2.out', delay: i * 0.05
    })
  })
  if(onComplete) setTimeout(onComplete, 450)
}

export const animChapter3 = (el, onComplete) => {
  return gsap.to(el, { 
    scale: 1.2, duration: 0.3, yoyo: true, repeat: 1, ease: 'power1.inOut', onComplete 
  })
}

export const animChapter5 = (el, onComplete) => {
  return gsap.to(el, { 
    rotation: 360, duration: 1, ease: 'power2.inOut', onComplete 
  })
}

export const SPLIT_2_POSITIONS = [
  { x: -140, y: 30, rotation: -14 },
  { x:  140, y: 30, rotation:  14 },
]

export const SPLIT_3_POSITIONS = [
  { x: -180, y: 30, rotation: -18 },
  { x:    0, y: 48, rotation:   0 },
  { x:  180, y: 30, rotation:  18 },
]

export const SPLIT_4_POSITIONS = [
  { x: -220, y: 20, rotation: -22 },
  { x:  -75, y: 45, rotation:  -7 },
  { x:   75, y: 45, rotation:   7 },
  { x:  220, y: 20, rotation:  22 },
]

export const animPackBurst = (packEl, cards, onComplete) => {
  gsap.set(packEl, { opacity: 0 })
  const count = cards.length
  
  const spreadDeg = count > 1 ? (count - 1) * 16 : 0 // 16 degrees between cards
  const startDeg  = -spreadDeg / 2

  cards.forEach((card, i) => {
    const frac  = count > 1 ? i / (count - 1) : 0
    const angle = startDeg + frac * spreadDeg
    const rad   = (angle * Math.PI) / 180
    const radius = 220
    const x = Math.sin(rad) * radius
    const y = 140 - Math.cos(rad) * 160

    gsap.set(card, { x: 0, y: 0, rotation: 0, opacity: 0, scale: 0.5 })
    gsap.to(card, {
      x, y, rotation: angle, opacity: 1, scale: 1,
      duration: 0.5, ease: 'back.out(1.2)', delay: i * 0.05
    })
  })
  if(onComplete) setTimeout(onComplete, 500 + count * 50)
}

export const animMagnet = (card1El, card2El, heartEl, onComplete) => {
  gsap.set(card1El, { x: -180, y: 0, opacity: 0 })
  gsap.set(card2El, { x:  180, y: 0, opacity: 0 })
  gsap.set(heartEl, { opacity: 0, scale: 0 })

  const tl = gsap.timeline({ onComplete })
  tl.to([card1El, card2El], { opacity: 1, duration: 0.2, ease: 'none' })
    .to(card1El, { x: -20, duration: 0.4, ease: 'power2.in' }, 'slide')
    .to(card2El, { x:  20, duration: 0.4, ease: 'power2.in' }, 'slide')
    .to([card1El, card2El], { x: 0, opacity: 0, scale: 0.5, duration: 0.1 })
    .to(heartEl, { opacity: 1, scale: 1.2, duration: 0.2, ease: 'power2.out' })
    .to(heartEl, { scale: 1, duration: 0.2, ease: 'power2.inOut' })
}

export const animMetamorphosis = (card1El, card2El, resultCardEl, onComplete) => {
  gsap.set(card1El, { x: -180, y: 0, opacity: 0 })
  gsap.set(card2El, { x:  180, y: 0, opacity: 0 })
  gsap.set(resultCardEl, { opacity: 0, scale: 0 })

  const tl = gsap.timeline({ onComplete })
  tl.to([card1El, card2El], { opacity: 1, duration: 0.2, ease: 'none' })
    .to(card1El, { x: -20, duration: 0.4, ease: 'power2.in' }, 'slide')
    .to(card2El, { x:  20, duration: 0.4, ease: 'power2.in' }, 'slide')
    .to([card1El, card2El], { x: 0, opacity: 0, scale: 0.5, duration: 0.1 })
    .to(resultCardEl, { opacity: 1, scale: 1.2, duration: 0.2, ease: 'power2.out' })
    .to(resultCardEl, { scale: 1, duration: 0.2, ease: 'power2.inOut' })
}

