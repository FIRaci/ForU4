import { useState, useMemo } from 'react'
import scriptData from '../data/script.json'

// Normalize rank string for matching (e.g., 'A♦' -> rank: 'A', suit: 'diamonds')
const SUIT_KEY_MAP = {
  '♦': 'diamonds',
  '♣': 'clubs',
  '♠': 'spades',
  '♥': 'hearts'
}

const CARD_DICTIONARY = [
  {
    suitName: 'Kim Cương (♦ Diamonds)',
    suitIcon: '♦',
    suitKey: 'diamonds',
    color: '#fb7185',
    theme: 'Phẩm chất & Nét đẹp rạng rỡ',
    items: [
      { rank: 'A', displayRank: 'A♦', word: 'Spark', mean: 'Tia sáng khởi đầu rung động' },
      { rank: '2', displayRank: '2♦', word: 'Eyes', mean: 'Ánh mắt mê đắm' },
      { rank: '3', displayRank: '3♦', word: 'Voice', mean: 'Giọng nói ngọt ngào' },
      { rank: '4', displayRank: '4♦', word: 'Smile', mean: 'Nụ cười rạng rỡ' },
      { rank: '5', displayRank: '5♦', word: 'Kindness', mean: 'Sự tử tế & Trái tim ấm áp' },
      { rank: '6', displayRank: '6♦', word: 'Quirks', mean: 'Nét thói quen đáng yêu' },
      { rank: '7', displayRank: '7♦', word: 'Mind', mean: 'Trí tuệ & Sự tinh tế' },
      { rank: '8', displayRank: '8♦', word: 'Energy', mean: 'Năng lượng tích cực lan tỏa' },
      { rank: '9', displayRank: '9♦', word: 'Grace', mean: 'Sự dịu dàng, nết na' },
      { rank: '10', displayRank: '10♦', word: 'Perfection', mean: 'Sự hoàn hảo trọn vẹn' },
      { rank: 'J', displayRank: 'J♦', word: 'Playful', mean: 'Sự nhí nhảnh, hồn nhiên' },
      { rank: 'Q', displayRank: 'Q♦', word: 'My Goddess', mean: 'Nữ thần cao quý' },
      { rank: 'K', displayRank: 'K♦', word: 'My Treasure', mean: 'Kho báu vô giá' },
    ]
  },
  {
    suitName: 'Chuồn / Tép (♣ Clubs)',
    suitIcon: '♣',
    suitKey: 'clubs',
    color: '#38bdf8',
    theme: 'Dòng chảy thời gian & Cột mốc hành trình',
    items: [
      { rank: 'A', displayRank: 'A♣', word: 'Beginning', mean: 'Khởi đầu hành trình kỳ diệu' },
      { rank: '2', displayRank: '2♣', word: 'Every Second', mean: 'Từng giây trôi qua' },
      { rank: '3', displayRank: '3♣', word: 'Every Minute', mean: 'Từng phút đếm trôi' },
      { rank: '4', displayRank: '4♣', word: 'Every Hour', mean: 'Từng giờ vun đắp' },
      { rank: '5', displayRank: '5♣', word: 'Days', mean: 'Những ngày đếm trôi' },
      { rank: '6', displayRank: '6♣', word: 'Weeks', mean: 'Những tuần lễ đồng hành' },
      { rank: '7', displayRank: '7♣', word: 'Months', mean: 'Những tháng ngày ý nghĩa' },
      { rank: '8', displayRank: '8♣', word: 'Seasons', mean: 'Bốn mùa luân chuyển' },
      { rank: '9', displayRank: '9♣', word: 'Years', mean: 'Những năm tháng trôi qua' },
      { rank: '10', displayRank: '10♣', word: 'Decades', mean: 'Cùng nhau qua nhiều thập kỷ' },
      { rank: 'J', displayRank: 'J♣', word: 'Past', mean: 'Những kỷ niệm quá khứ' },
      { rank: 'Q', displayRank: 'Q♣', word: 'Present', mean: 'Khoảnh khắc hiện tại quý giá' },
      { rank: 'K', displayRank: 'K♣', word: 'Future', mean: 'Tương lai vĩnh cửu mãi mãi' },
    ]
  },
  {
    suitName: 'Bích (♠ Spades)',
    suitIcon: '♠',
    suitKey: 'spades',
    color: '#cbd5e1',
    theme: 'Thử thách, Trưởng thành & Lời hứa bảo vệ',
    items: [
      { rank: 'A', displayRank: 'A♠', word: 'Realization', mean: 'Thấu hiểu tình cảm thực sự' },
      { rank: '2', displayRank: '2♠', word: 'Distance', mean: 'Khoảng cách địa lý & Thử thách' },
      { rank: '3', displayRank: '3♠', word: 'Doubts', mean: 'Vượt qua hoài nghi & lo âu' },
      { rank: '4', displayRank: '4♠', word: 'Waiting', mean: 'Sự kiên nhẫn chờ đợi' },
      { rank: '5', displayRank: '5♠', word: 'Changes', mean: 'Thích nghi với mọi đổi thay' },
      { rank: '6', displayRank: '6♠', word: 'Silence', mean: 'Khoảng lặng thấu hiểu' },
      { rank: '7', displayRank: '7♠', word: 'Leap', mean: 'Dũng khí bước qua giới hạn' },
      { rank: '8', displayRank: '8♠', word: 'Growing', mean: 'Cùng nhau trưởng thành' },
      { rank: '9', displayRank: '9♠', word: 'Courage', mean: 'Bản lĩnh mạnh mẽ' },
      { rank: '10', displayRank: '10♠', word: 'Unbreakable Bond', mean: 'Sợi dây gắn kết bền chặt' },
      { rank: 'Q', displayRank: 'Q♠', word: 'Sanctuary', mean: 'Nơi trú ẩn bình yên' },
      { rank: 'K', displayRank: 'K♠', word: 'Sword', mean: 'Thanh kiếm kiên cường che chở' },
    ]
  },
  {
    suitName: 'Cơ (♥ Hearts)',
    suitIcon: '♥',
    suitKey: 'hearts',
    color: '#f43f5e',
    theme: 'Cảm xúc sâu thẳm & Tình yêu chân thành',
    items: [
      { rank: 'A', displayRank: 'A♥', word: 'Only You', mean: 'Lá bài mở đầu & Tình yêu duy nhất' },
      { rank: '2', displayRank: '2♥', word: 'Us Together', mean: 'Gắn kết bên nhau' },
      { rank: '3', displayRank: '3♥', word: 'Joy', mean: 'Niềm vui đong đầy' },
      { rank: '4', displayRank: '4♥', word: 'Inner', mean: 'Sự sâu thẳm bình yên' },
      { rank: '5', displayRank: '5♥', word: 'Peace', mean: 'Bình yên trọn vẹn' },
      { rank: '6', displayRank: '6♥', word: 'Miss You', mean: 'Nỗi nhớ da diết' },
      { rank: '7', displayRank: '7♥', word: 'Care', mean: 'Sự quan tâm chu đáo' },
      { rank: '8', displayRank: '8♥', word: 'Dream', mean: 'Giấc mơ nhiệm màu' },
      { rank: '9', displayRank: '9♥', word: 'Wish', mean: 'Nguyện ước trọn đời' },
      { rank: '10', displayRank: '10♥', word: 'Happiness', mean: 'Hạnh phúc trọn vẹn' },
      { rank: 'J', displayRank: 'J♥', word: 'Admirer', mean: 'Trái tim si tình' },
      { rank: 'Q', displayRank: 'Q♥', word: 'My Queen', mean: 'Nữ hoàng duy nhất' },
      { rank: 'K', displayRank: 'K♥', word: 'King of Hearts', mean: 'Vị vua bảo hộ tình yêu' },
    ]
  }
]

export default function CardDictionaryDrawer({ sceneIdx = 0 }) {
  const [isOpen, setIsOpen] = useState(false)

  // Compute set of unlocked cards up to current sceneIdx
  const unlockedSet = useMemo(() => {
    const set = new Set()
    for (let i = 0; i <= sceneIdx && i < scriptData.length; i++) {
      const scene = scriptData[i]
      if (scene.cards) {
        scene.cards.forEach(c => {
          if (c.magic?.rank && c.magic?.suit) {
            set.add(`${c.magic.rank}_${c.magic.suit}`)
          }
        })
      }
      if (scene.into) {
        scene.into.forEach(c => {
          if (c.rank && c.suit) {
            set.add(`${c.rank}_${c.suit}`)
          }
        })
      }
      if (scene.burst) {
        scene.burst.forEach(c => {
          if (c.rank && c.suit) {
            set.add(`${c.rank}_${c.suit}`)
          }
        })
      }
    }
    return set
  }, [sceneIdx])

  const totalUnlocked = unlockedSet.size

  return (
    <>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="dictionary-toggle-btn"
        title="Xem danh sách 52 lá bài & ý nghĩa"
      >
        📜 52 Lá Bài & Ý Nghĩa <span className="unlock-badge">{totalUnlocked}/52</span>
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="dictionary-overlay" onClick={() => setIsOpen(false)}>
          <div className="dictionary-drawer" onClick={e => e.stopPropagation()}>
            <div className="dictionary-header">
              <div>
                <h3>📜 Ý Nghĩa Bộ Bài 52 Lá</h3>
                <span className="unlock-subtitle">Đã giải mã: {totalUnlocked} / 52 lá bài</span>
              </div>
              <button className="dictionary-close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>
            <p className="dictionary-desc">
              Các lá bài sẽ lần lượt giải mã ý nghĩa khi bạn tiến bước qua từng phân cảnh.
            </p>

            <div className="dictionary-content">
              {CARD_DICTIONARY.map((suit, idx) => (
                <div key={idx} className="suit-section">
                  <div className="suit-title" style={{ color: suit.color }}>
                    <span>{suit.suitIcon} {suit.suitName}</span>
                  </div>
                  <div className="suit-theme">{suit.theme}</div>

                  <div className="cards-grid">
                    {suit.items.map((item, cIdx) => {
                      const key = `${item.rank}_${suit.suitKey}`
                      const isUnlocked = unlockedSet.has(key)

                      return (
                        <div key={cIdx} className={`dict-card-item ${isUnlocked ? 'unlocked' : 'locked'}`}>
                          <span className="dict-rank" style={{ color: isUnlocked ? suit.color : '#475569' }}>
                            {item.displayRank}
                          </span>
                          <div className="dict-info">
                            <strong className="dict-word" style={{ color: isUnlocked ? '#f1f5f9' : '#64748b' }}>
                              {isUnlocked ? item.word : '🔒 ???'}
                            </strong>
                            <span className="dict-mean" style={{ color: isUnlocked ? '#94a3b8' : '#475569' }}>
                              {isUnlocked ? item.mean : 'Chưa mở khóa (Xem tiếp để giải mã)'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
