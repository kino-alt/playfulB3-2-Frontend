"use client"

import { useState, useEffect } from 'react'
import { GameButton } from '@/components/game-button'
import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/page-header'
import { TextInput } from '@/components/text-input'
import { TextDisplay } from '@/components/text-display'
import { useRoomData } from '@/contexts/room-context'
import { GameState } from '@/contexts/types'

const EmojiBackgroundLayoutNoSSR = dynamic(() => import('@/components/emoji-background-layout').then(m => m.EmojiBackgroundLayout), { ssr: false })

export default function SubmitAnswer() {
  const [answerInput, setAnswerInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    roomId,
    roomCode,
    roomState,
    submitAnswer,
    isLeader,
  } = useRoomData()

  useEffect(() => {
    if (typeof window === 'undefined' || !roomId) return
    const storageKey = `submitAnswer_draft_${roomId}`
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      setAnswerInput(saved)
    }
  }, [roomId])

  useEffect(() => {
    if (typeof window === 'undefined' || !roomId) return
    const storageKey = `submitAnswer_draft_${roomId}`
    if (answerInput) {
      localStorage.setItem(storageKey, answerInput)
    }
  }, [answerInput, roomId])

  useEffect(() => {
    if (roomState === GameState.CHECKING && roomCode) {
      if (typeof window !== 'undefined' && roomId) {
        localStorage.removeItem(`submitAnswer_draft_${roomId}`)
      }
      window.location.href = `/room/${roomId}/review-answer`
    }
  }, [roomState, roomId, roomCode])

  const handleSubmitAnswer = async () => {
    if (!answerInput.trim() || isSubmitting) return

    const isInAnsweringState = roomState === GameState.ANSWERING

    if (!isInAnsweringState && !isLeader) {
      alert('Only the leader can submit an answer during the answering phase.')
      return
    }

    setIsSubmitting(true)

    try {
      await submitAnswer(answerInput.trim())
      if (typeof window !== 'undefined' && roomId) {
        localStorage.removeItem(`submitAnswer_draft_${roomId}`)
      }
    } catch (error) {
      console.error('[SubmitAnswer] Error submitting answer:', error)
      alert('Failed to submit answer. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <EmojiBackgroundLayoutNoSSR>
      <div className="w-full max-w-xs flex flex-col h-full mx-auto">
        <PageHeader title="Final Answer" subtitle="The moment of truth" />

        <div className="flex flex-col items-center mt-6">
          <TextDisplay
            value="Leader's Decision"
            inputtitle=""
            height="py-0.5 px-4"
            variant="secondary"
            textSize="text-[10px]"
            marginBottom="mb-2"
          />
          <p className="text-[11px] font-black text-amber-600/80 uppercase tracking-widest">
            Finalize the team's consensus
          </p>
        </div>

        <div className="flex flex-col items-center justify-center flex-grow relative">
          <div className="absolute w-56 h-56 bg-amber-500/10 rounded-full blur-3xl -z-10"></div>

          <div className="w-full px-2 text-center">
            <TextInput
              value={answerInput}
              onChange={setAnswerInput}
              inputtitle="YOUR ANSWER"
              placeholder="What was it?"
              maxLength={20}
              height="py-5"
              variant="secondary"
              textSize="text-2xl"
              uppercase={false}
            />

            <p className="mt-4 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
              Confirm before reveal
            </p>
          </div>
        </div>

        <div className="mt-auto">
          <GameButton
            variant="secondary"
            onClick={handleSubmitAnswer}
            disabled={!answerInput.trim() || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </GameButton>
        </div>
      </div>
    </EmojiBackgroundLayoutNoSSR>
  )
}
