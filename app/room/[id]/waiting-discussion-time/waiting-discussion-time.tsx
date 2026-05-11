"use client"

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { TextInput } from '@/components/text-input'
import { TextDisplay } from '@/components/text-display'
import { CountTimer } from '@/components/count-timer'
import { EmojiComparisonDisplay } from '@/components/emoji-comparison-display'
import { useRoomData } from '@/contexts/room-context'
import { GameState } from '@/contexts/types'

const EmojiBackgroundLayoutNoSSR = dynamic(() => import('@/components/emoji-background-layout').then(m => m.EmojiBackgroundLayout), { ssr: false })

export function WaitingDiscussionTime() {
  const router = useRouter()
  const [preCountdown, setPreCountdown] = useState<number>(5)
  const [isStarting, setIsStarting] = useState<boolean>(false)

  const {
    roomId,
    roomCode,
    theme,
    topic,
    originalEmojis = [],
    displayedEmojis = [],
    dummyIndex = null,
    selectedEmojis,
    timer,
    roomState,
  } = useRoomData()

  const prevStateRef = useRef<GameState | null>(null)
  const hasShownCountdownRef = useRef<boolean>(false)
  const isInitialMountRef = useRef<boolean>(true)

  useEffect(() => {
    const prev = prevStateRef.current
    const isInitialMount = isInitialMountRef.current

    if (isInitialMount) {
      isInitialMountRef.current = false
    }

    prevStateRef.current = roomState

    if (hasShownCountdownRef.current) {
      setIsStarting(false)
      return
    }

    if (isInitialMount && roomState === GameState.DISCUSSING) {
      setIsStarting(false)
      return
    }

    const justEntered = prev !== null && prev !== GameState.DISCUSSING && roomState === GameState.DISCUSSING

    if (justEntered) {
      setIsStarting(true)
      setPreCountdown(5)
      hasShownCountdownRef.current = true

      const id = setInterval(() => {
        setPreCountdown((current) => {
          if (current <= 1) {
            clearInterval(id)
            setIsStarting(false)
            return 0
          }
          return current - 1
        })
      }, 1000)

      return () => clearInterval(id)
    }

    setIsStarting(false)
  }, [roomState])

  useEffect(() => {
    if (roomState === GameState.ANSWERING && roomCode) {
      router.push(`/room/${roomId}/waiting-answer`)
    }
  }, [roomState, roomId, router])

  return (
    <EmojiBackgroundLayoutNoSSR>
      {roomState === GameState.DISCUSSING && isStarting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="relative group">
            <div className="absolute -inset-4 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />

            <div className="relative bg-white border-[3px] border-amber-400 rounded-[3rem] px-10 py-8 text-center shadow-[0_12px_0_0_#f59e0b]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-black px-4 py-1 rounded-full shadow-md uppercase tracking-[0.2em] whitespace-nowrap">
                Attention
              </div>

              <div className="mt-2">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">
                  Discussion starts in
                </h2>

                <div className="relative inline-block">
                  <span className="text-8xl font-black text-amber-500 tabular-nums leading-none drop-shadow-sm">
                    {preCountdown}
                  </span>
                  <span className="absolute inset-0 text-8xl font-black text-amber-200/30 blur-sm -z-10 tabular-nums">
                    {preCountdown}
                  </span>
                </div>
              </div>
              <div className="flex justify-center gap-1 mt-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i < (3 - (preCountdown % 3)) ? 'w-8 bg-amber-500' : 'w-2 bg-amber-100'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-xs flex flex-col h-full">
        <PageHeader title="Discussion" subtitle={`Let's discuss emojis`} />

        <TextDisplay
          value={"テーマ: " + (theme || "N/A")}
          inputtitle=""
          height="py-0.5"
          variant="primary"
          textSize="text-sm"
        />

        <TextInput
          value={topic || "N/A"}
          onChange={() => {}}
          inputtitle="TOPIC"
          placeholder=""
          height="py-2"
          variant="primary"
          mode="display"
          textSize="text-lg"
        />

        <CountTimer timervalue={timer} />

        <EmojiComparisonDisplay
          originalEmojis={originalEmojis}
          displayedEmojis={displayedEmojis}
          dummyIndex={dummyIndex}
          selectedEmojis={selectedEmojis}
          className="mt-0 flex-grow"
        />
      </div>
    </EmojiBackgroundLayoutNoSSR>
  )
}
