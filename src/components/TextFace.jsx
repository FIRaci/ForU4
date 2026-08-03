/**
 * TextFace.jsx
 * Very basic, minimal text layout. Just the word in the center.
 */

export default function TextFace({ beat }) {
  const content = beat.content || ''
  const isNumber = /^\d+$/.test(content)
  const wordCls = ['card-word', isNumber ? 'number' : ''].filter(Boolean).join(' ')

  return (
    <div className="text-face">
      <span className={wordCls}>{content}</span>
    </div>
  )
}
