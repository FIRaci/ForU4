import { useRef, useEffect, useCallback, useState } from 'react'
import gsap from 'gsap'
import { useMagicEngine } from '../engine/use-magic-engine.js'
import { play } from '../engine/sound-manager.js'
import {
  animSplitBurst, animPackBurst, animMagnet, animMetamorphosis,
  SPLIT_2_POSITIONS, SPLIT_3_POSITIONS, SPLIT_4_POSITIONS
} from '../engine/animations.js'
import { cardImageUrl, suitSymbol, isRedSuit } from '../engine/card-image.js'

import Card from './Card.jsx'
import BeatCounter from './BeatCounter.jsx'
import CardDictionaryDrawer from './CardDictionaryDrawer.jsx'
import script from '../data/script.json'

function FooterCards({ lines = [], onDone }) {
  const wordRefs = useRef([])

  useEffect(() => {
    const els = wordRefs.current.filter(Boolean)
    if (!els.length) { onDone?.(); return }

    gsap.set(els, { opacity: 0, y: 16, scale: 0.7 })
    play('deal')
    gsap.to(els, {
      opacity: 1, y: 0, scale: 1,
      duration: 0.32, ease: 'back.out(1.6)',
      stagger: 0.05,
      onComplete: () => setTimeout(() => onDone?.(), 700),
    })
  }, [lines, onDone])

  let counter = -1
  return (
    <div className="footer-cards-lines">
      {lines.map((line, li) => (
        <div className="footer-line" key={li}>
          {line.map((word) => {
            counter++
            const idx = counter
            return (
              <span
                className="footer-word-card"
                key={idx}
                ref={el => (wordRefs.current[idx] = el)}
              >
                {word}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function SplitOverlay({ scene, onDone }) {
  const refs = useRef([])
  const [burstDone, setBurstDone] = useState(false)
  const cards = scene.into || []

  useEffect(() => {
    const els = refs.current.filter(Boolean)
    if (!els.length) return
    const t = setTimeout(() => {
      play('crack')
      const positions = cards.length === 2 ? SPLIT_2_POSITIONS : 
                        cards.length === 4 ? SPLIT_4_POSITIONS : SPLIT_3_POSITIONS
      animSplitBurst(els, positions, () => setBurstDone(true))
    }, 500)
    return () => clearTimeout(t)
  }, [cards])

  return (
    <div className="scene-overlay">
      <div className="split-cards-container">
        {cards.map((c, i) => (
          <div key={i} className="split-card-wrap" ref={el => (refs.current[i] = el)} style={{ opacity: 0 }}>
            <div className="pack-card-inner" style={{ width: 'var(--card-w)', height: 'var(--card-h)', borderRadius: 'var(--card-r)' }}>
              <img src={cardImageUrl(c.rank, c.suit)} alt="card" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => (e.target.style.display = 'none')} />
            </div>
          </div>
        ))}
      </div>
      {burstDone && <FooterCards lines={scene.footer} onDone={onDone} />}
    </div>
  )
}

function PackOverlay({ scene, onDone, deckRef }) {
  const [burstDone, setBurstDone] = useState(false)
  const refs = useRef([])

  useEffect(() => {
    const cards = refs.current.filter(Boolean)
    if (deckRef.current) {
      gsap.to(deckRef.current, { y: -160, duration: 0.5, ease: 'power2.out' })
    }
    gsap.fromTo(cards, 
      { y: -200, opacity: 0, scale: 0.5 },
      { 
        y: 0, opacity: 1, scale: 1, 
        duration: 0.6, ease: 'back.out(1.2)', 
        stagger: 0.08,
        onComplete: () => setTimeout(() => setBurstDone(true), 500)
      }
    )
  }, [deckRef])

  const cards = scene.cards || []
  return (
    <div className="scene-overlay" style={{ justifyContent: 'flex-start', paddingTop: '180px' }}>
      <div 
        className="pack-cards-container"
        style={{
          display: 'flex', flexWrap: 'wrap', gap: '35px 20px', 
          justifyContent: 'center', width: '100%', maxWidth: '900px',
          padding: '0 20px'
        }}
      >
        {cards.map((c, i) => (
          <div key={i} className="pack-card-wrap" ref={el => (refs.current[i] = el)}>
            <div className="pack-card-inner" style={{ width: 'var(--card-w)', height: 'var(--card-h)', background: 'transparent', border: 'none', boxShadow: 'none' }}>
              <img src={cardImageUrl(c.rank, c.suit)} alt="card" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => (e.target.style.display = 'none')} />
            </div>
            {c.label && <div className="pack-card-footer-label">{c.label}</div>}
          </div>
        ))}
      </div>
      {burstDone && <FooterCards lines={scene.footer} onDone={onDone} />}
    </div>
  )
}

function MagnetOverlay({ scene, onDone }) {
  const card1Ref = useRef(null)
  const card2Ref = useRef(null)
  const heartRef = useRef(null)

  useEffect(() => {
    const c1 = card1Ref.current, c2 = card2Ref.current, h = heartRef.current
    if (!c1 || !c2 || !h) return
    const t = setTimeout(() => {
      play('magnet')
      animMagnet(c1, c2, h, () => {
        play('heartbeat')
        setTimeout(() => onDone?.(), 1200)
      })
    }, 400)
    return () => clearTimeout(t)
  }, [onDone])

  const words = scene.cards || [{ text: 'You' }, { text: 'Me' }]

  return (
    <div className="scene-overlay">
      <div className="magnet-container">
        <div className="magnet-mini-card" ref={card1Ref}><span className="magnet-mini-word">{words[0].text}</span></div>
        <div className="magnet-mini-card" ref={card2Ref}><span className="magnet-mini-word">{words[1].text}</span></div>
        <div className="magnet-heart-result" ref={heartRef}>❤️</div>
      </div>
    </div>
  )
}

function MetamorphosisOverlay({ scene, onDone }) {
  const card1Ref = useRef(null)
  const card2Ref = useRef(null)
  const resultRef = useRef(null)
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    const c1 = card1Ref.current, c2 = card2Ref.current, res = resultRef.current
    if (!c1 || !c2 || !res) return
    const t = setTimeout(() => {
      play('magnet')
      animMetamorphosis(c1, c2, res, () => {
        play('shimmer')
        setShowText(true)
        setTimeout(() => onDone?.(), 1500)
      })
    }, 400)
    return () => clearTimeout(t)
  }, [onDone])

  const words = scene.cards
  const resCard = scene.result || { rank: 'K', suit: 'hearts' }

  return (
    <div className="scene-overlay">
      <div className="magnet-container">
        <div className="magnet-mini-card" ref={card1Ref} style={{ padding: 4 }}>
           <div className="pack-card-inner" style={{ width: '100%', height: '100%', borderRadius: 'var(--card-r)', overflow: 'hidden' }}>
             <img src={cardImageUrl(words[0].magic.rank, words[0].magic.suit)} alt="c1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.target.style.display = 'none')} />
           </div>
        </div>
        <div className="magnet-mini-card" ref={card2Ref} style={{ padding: 4 }}>
           <div className="pack-card-inner" style={{ width: '100%', height: '100%', borderRadius: 'var(--card-r)', overflow: 'hidden' }}>
             <img src={cardImageUrl(words[1].magic.rank, words[1].magic.suit)} alt="c2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.target.style.display = 'none')} />
           </div>
        </div>
        <div className="magnet-result-card" ref={resultRef} style={{ position: 'absolute', width: 'var(--card-w)', height: 'var(--card-h)', zIndex: 10 }}>
           <div className="pack-card-inner" style={{ width: '100%', height: '100%', borderRadius: 'var(--card-r)', overflow: 'hidden', boxShadow: '0 0 40px rgba(255,107,157,0.8)' }}>
             <img src={cardImageUrl(resCard.rank, resCard.suit)} alt="result" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.target.style.display = 'none')} />
           </div>
        </div>
      </div>
      <div className={`scene-footer ${showText ? 'visible' : ''}`} style={{ marginTop: '380px' }}>
        {scene.subtext}
      </div>
    </div>
  )
}

function EndingOverlay({ scene, onDone }) {
  const [showText, setShowText] = useState(false)
  
  useEffect(() => {
    play('piano')
    const t1 = setTimeout(() => setShowText(true), 500)
    const t2 = setTimeout(() => onDone?.(), 3000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div className="scene-overlay" style={{ pointerEvents: 'none' }}>
      <div className={`scene-footer ${showText ? 'visible' : ''}`} style={{ marginTop: '280px' }}>
        {scene.finalText}
      </div>
    </div>
  )
}

export default function MagicTable() {
  const deckRef = useRef(null)
  const stageRef = useRef(null)

  const engine = useMagicEngine(script)
  const {
    sceneIdx, currentScene, exitingScene,
    deckCount, totalCards, canAdvance, canGoBack, isDone, total,
    advance, goBack, onExitComplete, markSceneComplete,
  } = engine

  const revealedRef = useRef(0)
  const [overlayTriggered, setOverlayTriggered] = useState(false)

  useEffect(() => {
    revealedRef.current = 0
    setOverlayTriggered(false)
  }, [currentScene?.renderKey])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'ArrowLeft') goBack() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goBack])

  useEffect(() => {
    if (sceneIdx === -1) {
      const t = setTimeout(() => advance(), 500)
      return () => clearTimeout(t)
    }
  }, [sceneIdx, advance])

  const totalTriggerCards = (() => {
    if (!currentScene) return 0
    if (currentScene.type === 'scene' || currentScene.type === 'ending') return currentScene.cards?.length ?? 0
    if (currentScene.type === 'split' || currentScene.type === 'pack') return 1
    if (currentScene.type === 'magnet' || currentScene.type === 'metamorphosis') return currentScene.cards?.length ?? 2
    return 0
  })()

  const handleCardRevealed = useCallback(() => {
    revealedRef.current += 1
    if (revealedRef.current < totalTriggerCards) return

    if (currentScene?.type === 'scene') {
      markSceneComplete() // plain scene: fully flipped = fully done
    } else {
      setOverlayTriggered(true) // split/pack/magnet/metamorphosis/ending: kick off the overlay
    }
  }, [currentScene, totalTriggerCards, markSceneComplete])

  const renderSceneCards = (scene, isExiting) => {
    if (!scene) return null
    const isSpecial = ['split', 'pack', 'magnet', 'metamorphosis', 'ending'].includes(scene.type)

    let cardsToRender = []
    if ((scene.type === 'scene' || scene.type === 'ending') && scene.cards) cardsToRender = scene.cards
    else if (scene.type === 'split' || scene.type === 'pack') cardsToRender = [scene.card]
    else if (scene.type === 'magnet' || scene.type === 'metamorphosis') cardsToRender = scene.cards || []

    return (
      <div className={`cards-layout ${isExiting ? 'exiting-layout' : ''}`} key={scene.renderKey || 'exit'}>
        {(cardsToRender || []).map((cardData, idx) => (
          <Card
            key={idx}
            cardData={cardData}
            dealDelay={idx * 250}
            deckRef={deckRef}
            stageRef={stageRef}
            shouldExit={isExiting}
            onExitComplete={idx === 0 ? onExitComplete : null}
            isSpecial={isSpecial}
            onRevealed={isExiting ? undefined : handleCardRevealed}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="magic-table" role="main">
      <div className="deck-pile" ref={deckRef} style={{ opacity: currentScene?.type === 'ending' ? 0 : 1, transition: 'opacity 1s ease' }}>
        <div className="deck-visual">
          <div className="deck-card" /><div className="deck-card" />
          <div className="deck-card">
             <div className="deck-secret-ace">A<span style={{ color: 'var(--red-suit)' }}>♥</span></div>
          </div>
        </div>
        <div className="deck-count">{deckCount} / {totalCards}</div>
      </div>

      <CardDictionaryDrawer sceneIdx={sceneIdx} />
      <BeatCounter current={sceneIdx} total={total} />

      {currentScene?.header && (
        <div className="scene-header-text">{currentScene.header}</div>
      )}

      <div className="card-stage" ref={stageRef}>
        {renderSceneCards(exitingScene, true)}
        {renderSceneCards(currentScene, false)}

        {overlayTriggered && currentScene?.type === 'split'  && <SplitOverlay  scene={currentScene} onDone={markSceneComplete} />}
        {overlayTriggered && currentScene?.type === 'pack'   && <PackOverlay   scene={currentScene} onDone={markSceneComplete} deckRef={deckRef} />}
        {overlayTriggered && currentScene?.type === 'magnet' && <MagnetOverlay scene={currentScene} onDone={markSceneComplete} />}
        {overlayTriggered && currentScene?.type === 'metamorphosis' && <MetamorphosisOverlay scene={currentScene} onDone={markSceneComplete} />}
        {overlayTriggered && currentScene?.type === 'ending' && <EndingOverlay scene={currentScene} onDone={markSceneComplete} />}
      </div>

      {currentScene?.footerText && (
        <div className="scene-footer-text">{currentScene.footerText}</div>
      )}

      {!isDone && (
        <p className="tap-hint tap-hint-facedown">
          {canAdvance ? 'Tap next to continue' : 'Tap the card to flip it'}
        </p>
      )}

      <button
        className="nav-btn-back"
        disabled={!canGoBack}
        onClick={e => { e.stopPropagation(); goBack() }}
        aria-label="Back"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
      </button>

      {!isDone && (
        <button
          className={`nav-btn-next ${canAdvance ? 'is-ready' : 'is-locked'}`}
          disabled={!canAdvance}
          onClick={e => { e.stopPropagation(); advance() }}
          aria-label="Next"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
        </button>
      )}

      {isDone && <p className="done-message">♥ The End ♥</p>}
    </div>
  )
}
