"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/page-header'
import { TextDisplay } from '@/components/text-display'
import { CountTimer } from '@/components/count-timer'
import { Modal } from '@/components/modal'
import { GameButton } from '@/components/game-button'
import { useRoomData } from '@/contexts/room-context'
import { GameState } from '@/contexts/types'

const INITIAL_COUNTDOWN = 5
const HINT_CONTENT = `1. 自分の絵文字を順番に言葉で説明していく
2. テーマがなにかを考える
3. お題がなにか導き出す`
const DUMMY_BADGE_TEXT = '1 DUMMY'
const EmojiBackgroundLayoutNoSSR = dynamic(() => import('@/components/emoji-background-layout').then(m => m.EmojiBackgroundLayout), { ssr: false })

export function DiscussionTime() {
  const [showHintOverlay, setShowHintOverlay] = useState(false)
  const [preCountdown, setPreCountdown] = useState<number>(INITIAL_COUNTDOWN)
  const [isStarting, setIsStarting] = useState<boolean>(false)
  const router = useRouter()

  const {
    roomId,
    roomState,
    AssignedEmoji,
    isLeader,
    timer,
    skipDiscussion,
  } = useRoomData()

  const isDiscussionPhase = useMemo(() => roomState === GameState.DISCUSSING, [roomState])
  const isAnsweringPhase = useMemo(() => roomState === GameState.ANSWERING, [roomState])
  const shouldShowLeaderBadge = useMemo(() => isLeader, [isLeader])

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

    if (isInitialMount && isDiscussionPhase) {
      setIsStarting(false)
      return
    }

    const justEnteredDiscussing = prev !== null && prev !== GameState.DISCUSSING && isDiscussionPhase

    if (justEnteredDiscussing) {
      setIsStarting(true)
      setPreCountdown(INITIAL_COUNTDOWN)
      hasShownCountdownRef.current = true

      const countdownInterval = setInterval(() => {
        setPreCountdown((current) => {
          if (current <= 1) {
            clearInterval(countdownInterval)
            setIsStarting(false)
            return 0
          }
          return current - 1
        })
      }, 1000)

      return () => clearInterval(countdownInterval)
    }

    setIsStarting(false)
  }, [isDiscussionPhase, roomState])

  useEffect(() => {
    if (!isAnsweringPhase || !roomId) return

    const destination = isLeader ? `/room/${roomId}/submit-answer` : `/room/${roomId}/waiting-answer`
    router.push(destination)
  }, [isAnsweringPhase, roomId, router, isLeader])

  const handleToggleHintOverlay = useCallback(() => {
    setShowHintOverlay(prev => !prev)
  }, [])

  const handleSkip = useCallback(async () => {
    try {
      await skipDiscussion()
    } catch (error) {
      console.error('[DiscussionTime] Failed to skip discussion:', error)
    }
  }, [skipDiscussion])

  return (
    <EmojiBackgroundLayoutNoSSR>
      {isDiscussionPhase && isStarting && (
        <PreCountdownOverlay countdown={preCountdown} />
      )}

      <Modal
        isOpen={showHintOverlay}
        onClose={handleToggleHintOverlay}
        title="Discussion Hint"
        content={HINT_CONTENT}
      />

      <div className="w-full max-w-xs flex flex-col h-full mx-auto">
        <HeaderSection showLeaderBadge={shouldShowLeaderBadge} />

        <MainContent
          timer={timer}
          emoji={AssignedEmoji}
          onToggleHint={handleToggleHintOverlay}
        />

        <FooterSection
          isLeader={isLeader}
          isStarting={isStarting}
          onSkip={handleSkip}
        />
      </div>
    </EmojiBackgroundLayoutNoSSR>
  )
}

interface PreCountdownOverlayProps {
  countdown: number
}

function PreCountdownOverlay({ countdown }: PreCountdownOverlayProps) {
  const progressBars = Array.from({ length: 3 }, (_, i) => i < (3 - (countdown % 3)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <div className="relative group">
        <div className="absolute -inset-4 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />

        <div className="relative bg-white border-[3px] border-amber-400 rounded-[3rem] px-10 py-8 text-center shadow-[0_12px_0_0_#f59e0b]">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-black px-4 py-1 rounded-full shadow-md uppercase tracking-[0.2em] whitespace-nowrap">
            Attention Players
          </div>

          <div className="mt-2">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">
              Discussion starts in
            </h2>

            <div className="relative inline-block">
              <span className="text-8xl font-black text-amber-500 tabular-nums leading-none drop-shadow-sm">
                {countdown}
              </span>
              <span className="absolute inset-0 text-8xl font-black text-amber-200/30 blur-sm -z-10 tabular-nums">
                {countdown}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-1 mt-4">
            {progressBars.map((isActive, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${isActive ? 'w-8 bg-amber-500' : 'w-2 bg-amber-100'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface HeaderSectionProps {
  showLeaderBadge: boolean
}

function HeaderSection({ showLeaderBadge }: HeaderSectionProps) {
  return (
    <div className="flex flex-col">
      <PageHeader title="Discussion" subtitle="Guess the topic!" marginBottom="mb-1" />

      <div className="w-full flex justify-between items-center mb-0">
        <div className="min-w-[60px]">
          {showLeaderBadge ? (
            <TextDisplay
              value="Leader"
              inputtitle=""
              height="py-0.5"
              variant="secondary"
              textSize="text-[10px]"
              marginBottom="mb-0"
            />
          ) : (
            <div className="h-[32px]" />
          )}
        </div>
      </div>
    </div>
  )
}

interface MainContentProps {
  timer: number | null
  emoji: string | null
  onToggleHint: () => void
}

function MainContent({ timer, emoji, onToggleHint }: MainContentProps) {
  return (
    <div className="flex flex-col items-center justify-start flex-grow space-y-0 pt-3">
      <div className="w-full">
        <CountTimer timervalue={timer} height="py-6" />
      </div>

      <div className="flex flex-col items-center w-full">
        <DummyNoticeSection onToggleHint={onToggleHint} />
        <EmojiDisplayContainer emoji={emoji} />
        <p className="mt-4 text-[9px] text-amber-500 font-black text-center uppercase tracking-widest">
          — Your Emoji —
        </p>
      </div>
    </div>
  )
}

interface DummyNoticeSectionProps {
  onToggleHint: () => void
}

function DummyNoticeSection({ onToggleHint }: DummyNoticeSectionProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 mb-2 w-full">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full blur opacity-25 animate-pulse" />

        <div className="relative flex items-center bg-white border-2 border-amber-500 pl-1 pr-4 py-1.5 rounded-full shadow-[0_4px_0_0_#f59e0b]">
          <div className="flex items-center justify-center bg-amber-500 text-white px-3 py-1 rounded-full mr-3 shadow-inner">
            <span className="text-[12px] font-black tracking-tighter">{DUMMY_BADGE_TEXT}</span>
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] text-amber-600 font-black leading-none uppercase tracking-widest mb-1">
              Intruder Detected!
            </p>
            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">
              Find the fake description
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onToggleHint}
        className="flex items-center gap-1.5 text-gray-400 hover:text-amber-500 transition-colors"
        aria-label="Show discussion tips"
      >
        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold border border-gray-200">?</div>
        <span className="text-[10px] font-black uppercase tracking-widest">Discussion Tips</span>
      </button>
    </div>
  )
}

interface EmojiDisplayContainerProps {
  emoji: string | null
}

function EmojiDisplayContainer({ emoji }: EmojiDisplayContainerProps) {
  return (
    <div className="w-full flex justify-center items-center py-4">
      <div className="text-7xl leading-none select-none">{emoji || '❓'}</div>
    </div>
  )
}

interface FooterSectionProps {
  isLeader: boolean
  isStarting: boolean
  onSkip: () => void
}

function FooterSection({ isLeader, isStarting, onSkip }: FooterSectionProps) {
  return (
    <div className="mt-auto pt-4">
      {isLeader && (
        <GameButton variant="secondary" onClick={onSkip} disabled={isStarting}>
          Skip Discussion
        </GameButton>
      )}
    </div>
  )
}
