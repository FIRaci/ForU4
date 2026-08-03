/**
 * card-image.js
 * Maps card rank/suit to local images in public/playing-cards-assets
 */

const LOCAL_BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

const rankToFileName = (rank) => {
  const map = { A: 'ace', J: 'jack', Q: 'queen', K: 'king' }
  return map[rank] || rank.toLowerCase()
}

export const cardImageUrl = (rank, suit) => {
  if (!rank || !suit || suit === 'heart-icon') return null
  const rankName = rankToFileName(rank)
  // Using the regular svg-cards folder since they are local and size doesn't matter for latency
  return `${LOCAL_BASE}/svg-cards/${rankName}_of_${suit}.svg`
}

export const backCardUrl = () => `${LOCAL_BASE}/png/back@2x.png`

export const hasMagicImage = (beat) => {
  return !!(beat.transform_to && beat.transform_to.suit !== 'heart-icon')
    || !!(beat.from_card)
    || !!(beat.to_card)
}

export const suitSymbol = (suit) => {
  const map = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }
  return map[suit] || ''
}

export const isRedSuit = (suit) => suit === 'hearts' || suit === 'diamonds'
