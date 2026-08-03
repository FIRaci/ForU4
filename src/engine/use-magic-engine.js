import { useState, useCallback, useRef, useMemo } from 'react'

function countCardsInScene(scene) {
  let count = 0
  if (scene.cards) {
    scene.cards.forEach(c => {
      if (c.magic?.rank || c.magic?.to?.rank || (c.rank && c.rank !== 'blank')) count++
    })
  }
  if (scene.into) {
    scene.into.forEach(c => {
      if (c.rank && c.rank !== 'blank') count++
    })
  }
  if (scene.burst) {
    scene.burst.forEach(c => {
      if (c.rank && c.rank !== 'blank') count++
    })
  }
  return count
}

export function useMagicEngine(script) {
  const total = script.length
  const totalCards = useMemo(
    () => script.reduce((sum, s) => sum + countCardsInScene(s), 0),
    [script]
  )

  const [sceneIdx,   setSceneIdx]   = useState(-1)
  const [deckCount,  setDeckCount]  = useState(totalCards)
  // sceneReady = user has flipped everything in the current scene AND any
  // magic/burst/magnet sequence triggered by that has finished playing.
  const [sceneReady, setSceneReady] = useState(false)
  const [isDone,     setIsDone]     = useState(false)

  const [currentScene, setCurrentScene] = useState(null)
  const [exitingScene, setExitingScene] = useState(null)

  const advancingRef = useRef(false)
  const historyRef = useRef([])

  const advance = useCallback(() => {
    if (isDone || advancingRef.current) return
    // Only the very first auto-deal (sceneIdx === -1) is allowed to skip
    // the "must be fully revealed" check — every scene after that requires
    // the user to have flipped everything first.
    if (sceneIdx >= 0 && !sceneReady) return

    const nextIdx = sceneIdx + 1
    if (nextIdx >= total) {
      setIsDone(true)
      return
    }

    advancingRef.current = true
    const nextScene = script[nextIdx]
    historyRef.current.push({ sceneIdx, scene: currentScene, deckCount })

    setSceneReady(false)
    setExitingScene(currentScene)
    setCurrentScene(null)

    setTimeout(() => {
      const cardsInScene = countCardsInScene(nextScene)
      setCurrentScene({ ...nextScene, renderKey: `scene-${nextIdx}-${Date.now()}` })
      setSceneIdx(nextIdx)
      setDeckCount(c => Math.max(0, c - cardsInScene))
      advancingRef.current = false
    }, 150)
  }, [sceneIdx, sceneReady, currentScene, isDone, script, total, deckCount])

  const goBack = useCallback(() => {
    if (advancingRef.current || historyRef.current.length === 0) return
    const prev = historyRef.current.pop()

    advancingRef.current = true
    setIsDone(false)
    setSceneReady(false)
    setExitingScene(currentScene)
    setCurrentScene(null)

    setTimeout(() => {
      setCurrentScene(
        prev.scene ? { ...prev.scene, renderKey: `scene-${prev.sceneIdx}-back-${Date.now()}` } : null
      )
      setSceneIdx(prev.sceneIdx)
      setDeckCount(prev.deckCount)
      // A scene we're returning to was already fully revealed before, so
      // let the user move forward again right away if they choose.
      setSceneReady(true)
      advancingRef.current = false
    }, 150)
  }, [currentScene])

  const onExitComplete = useCallback(() => setExitingScene(null), [])
  const markSceneComplete = useCallback(() => setSceneReady(true), [])

  return {
    sceneIdx, currentScene, exitingScene, deckCount, totalCards,
    canAdvance: sceneReady && sceneIdx < total - 1 && !isDone,
    canGoBack: sceneIdx >= 0 && historyRef.current.length > 0,
    isDone, total, advance, goBack, onExitComplete, markSceneComplete,
  }
}
