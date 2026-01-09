"use client"

import type React from "react"

import { useState, useEffect, memo, useMemo } from "react"

interface RandomEmoji {
  id: number
  emoji: string
  left: number
  top: number
  delay: number
  duration: number
}

interface EmojiBackgroundLayoutProps {
  children: React.ReactNode
}

function EmojiBackgroundLayoutComponent({ children }: EmojiBackgroundLayoutProps) {
  const [emojis, setEmojis] = useState<RandomEmoji[]>([])

  useEffect(() => {
    const emojiList = ["🍴","🤔", "💡", "🎯", "🗣️", "🎨", "✨", "🧠", "💫"]
    const cols = 4
    const rows = 4
    const totalEmojis = cols * rows

    const generatedEmojis: RandomEmoji[] = Array.from({ length: totalEmojis }, (_, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)

      // グリッド位置の基本座標
      const baseLeft = (col / cols) * 100 + 100 / cols / 2
      const baseTop = (row / rows) * 100 + 100 / rows / 2

      // 各セル内でランダムオフセット（±5%）
      const offsetLeft = (Math.random() - 0.5) * 10
      const offsetTop = (Math.random() - 0.5) * 10

      return {
        id: i,
        emoji: emojiList[i % emojiList.length],
        left: Math.max(0, Math.min(100, baseLeft + offsetLeft)),
        top: Math.max(0, Math.min(100, baseTop + offsetTop)),
        delay: Math.random() * 0.5,
        duration: 3 + Math.random() * 2,
      }
    })
    setEmojis(generatedEmojis)
  }, [])

  return (
    <div className="h-screen w-screen bg-white flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background emoji animation - 固定レイアウト */}
      <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
        {emojis.map((item) => (
          <div
            key={item.id}
            className="absolute text-6xl animate-pulse"
            style={{
              left: `${item.left}%`,
              top: `${item.top}%`,
              animation: `float ${item.duration}s ease-in-out ${item.delay}s infinite`,
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Content wrapper - 子コンポーネント再レンダリング時も背景は変わらない */}
      <div className="relative z-10 w-full max-w-xs flex flex-col items-center justify-center h-full">{children}</div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }
      `}</style>
    </div>
  )
}

// memo でラップして、children の参照が変わらない限り再レンダリングされない
export const EmojiBackgroundLayout = memo(EmojiBackgroundLayoutComponent)
