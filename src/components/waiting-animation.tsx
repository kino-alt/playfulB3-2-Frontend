"use client"

import { useState, useEffect, useRef } from "react"

type WaitingAnimationProps = {
  variant?: "primary" | "secondary"
  inputText?: string 
}

interface Ripple {
  id: number
  x: number // 画面中央からの相対X座標
  y: number // 画面中央からの相対Y座標
  startTime: number
}

const ORBIT_EMOJIS = ["🍎", "🍔", "🍣", "🍦", "🍭", "🍩", "🍉", "🍍"]

export function WaitingAnimation({ 
  variant = "primary", 
  inputText = "ホスト" 
}: WaitingAnimationProps) {
  const [time, setTime] = useState(0)
  const [speedMultiplier, setSpeedMultiplier] = useState(1)
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [activeRotations, setActiveRotations] = useState<Record<number, number>>({})

  const containerRef = useRef<HTMLDivElement>(null)
  const emojiCount = 8
  const radius = 126
  const RIPPLE_MAX_RADIUS = 100 // 波紋の最大半径(px)

  const colorClass = variant === "primary" ? "text-emerald-500" : "text-amber-500"
  const rippleColor = variant === "primary" ? "border-emerald-400" : "border-amber-400"

  // 回転ループ
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => prev + 0.008 * speedMultiplier)
    }, 16)
    return () => clearInterval(interval)
  }, [speedMultiplier])

  // 当たり判定：中央からの相対座標で統一
  useEffect(() => {
    if (ripples.length === 0) return

    const checkCollision = setInterval(() => {
      const now = Date.now()
      
      ripples.forEach(ripple => {
        const elapsed = now - ripple.startTime
        // 800msでRIPPLE_MAX_RADIUSまで広がる
        const currentRippleRadius = (elapsed / 800) * RIPPLE_MAX_RADIUS

        ORBIT_EMOJIS.slice(0, emojiCount).forEach((_, i) => {
          const angle = time + (i * (Math.PI * 2)) / emojiCount
          // 絵文字の中央からの相対座標
          const emojiX = Math.cos(angle) * radius
          const emojiY = Math.sin(angle) * radius

          // 波紋の発生源(ripple.x, ripple.y)から絵文字までの距離
          const dist = Math.sqrt(Math.pow(ripple.x - emojiX, 2) + Math.pow(ripple.y - emojiY, 2))
          
          // 波紋の半径が絵文字との距離に一致した瞬間に即時回転
          if (Math.abs(dist - currentRippleRadius) < 25) {
            if (now - (activeRotations[i] || 0) > 800) {
              setActiveRotations(prev => ({ ...prev, [i]: now }))
            }
          }
        })
      })
    }, 10)
    return () => clearInterval(checkCollision)
  }, [ripples, time, activeRotations, emojiCount, radius])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    
    // コンテナの中央を(0, 0)とした相対座標を算出
    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const relativeX = e.clientX - centerX
    const relativeY = e.clientY - centerY
    
    const newRipple = { 
      id: Date.now(), 
      x: relativeX, 
      y: relativeY, 
      startTime: Date.now() 
    }
    setRipples((prev) => [...prev, newRipple])

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
    }, 850)
  }

  const handleTextClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSpeedMultiplier(3.5)
    setTimeout(() => setSpeedMultiplier(1), 1500)
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center select-none overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      {/* 1. 波紋レイヤー (コンテナの中央からの相対座標で描画) */}
      <div className="absolute inset-0 pointer-events-none">
        {ripples.map((ripple) => (
          <div
            key={ripple.id}
            className={`absolute rounded-full border-4 ${rippleColor} animate-ripple-fixed`}
            style={{
              left: `calc(50% + ${ripple.x}px)`,
              top: `calc(50% + ${ripple.y}px)`,
              width: RIPPLE_MAX_RADIUS * 2,
              height: RIPPLE_MAX_RADIUS * 2,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>

      {/* 2. 回転する絵文字コンテナ (中央配置) */}
      <div className="relative flex items-center justify-center pointer-events-none">
        {ORBIT_EMOJIS.slice(0, emojiCount).map((emoji, i) => {
          const angle = time + (i * (Math.PI * 2)) / emojiCount
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          const isRotating = Date.now() - (activeRotations[i] || 0) < 600

          return (
            <div
              key={i}
              className="absolute pointer-events-auto"
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <div 
                className={`w-14 h-14 flex items-center justify-center 
                            bg-gray-200/40 backdrop-blur-sm 
                            border-2 border-gray-200/50 
                            rounded-full text-2xl transition-all duration-500
                            hover:scale-125 hover:border-white hover:bg-gray-200/60`}
                style={{
                  transform: isRotating ? "rotate(360deg) scale(1.3)" : "rotate(0deg) scale(1)"
                }}
              >
                {emoji}
              </div>
            </div>
          )
        })}

        {/* 3. 中央のテキスト */}
        <div 
          className="z-50 flex flex-col items-center cursor-pointer hover:scale-110 active:scale-90 transition-transform pointer-events-auto"
          onClick={handleTextClick}
        >
          <h2 className={`text-3xl font-bold ${colorClass} animate-pulse`}>
            Waiting...
          </h2>
          <p className="text-gray-400 text-xs mt-2 bg-white/10 px-3 py-1 rounded-full border border-white/20 whitespace-nowrap">
            {inputText}の準備を待っています
          </p>
        </div>
      </div>

      <style>{`
        @keyframes ripple-fixed {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; border-width: 6px; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; border-width: 1px; }
        }
        .animate-ripple-fixed {
          animation: ripple-fixed 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
