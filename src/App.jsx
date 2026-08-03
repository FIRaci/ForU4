/**
 * App.jsx
 * Root component. Shows IntroScreen until user taps,
 * then transitions to MagicTable.
 */

import { useState } from 'react'
import IntroScreen from './components/IntroScreen.jsx'
import MagicTable  from './components/MagicTable.jsx'
import { initAudio } from './engine/sound-manager.js'

export default function App() {
  const [started, setStarted] = useState(false)

  const handleStart = async () => {
    try {
      await initAudio()
    } catch (e) {
      // Audio not available — continue anyway
      console.warn('Audio init failed:', e)
    }
    setStarted(true)
  }

  return (
    <div className="app">
      {started ? (
        <MagicTable />
      ) : (
        <IntroScreen onStart={handleStart} />
      )}
    </div>
  )
}
