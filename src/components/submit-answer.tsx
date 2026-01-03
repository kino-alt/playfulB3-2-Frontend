"use client"

import { useState, useEffect } from "react"
import { GameButton } from "./game-button"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { PageHeader } from "./page-header"
import { useRouter } from "next/navigation"
import { TextInput } from "./text-input"
import { TextDisplay } from "./text-display"
import { useRoomData } from '@/contexts/room-context';
import { GameState } from "@/contexts/types";

export default function SubmitAnswer() {
  const [answerInput, setAnswerInput] = useState("")
  const router = useRouter()
  const { 
      roomId,
      roomCode,
      roomState,
      submitAnswer
  } = useRoomData();

  useEffect(() => {
    if (roomState === GameState.CHECKING && roomCode) {
      router.push(`/room/${roomId}/review-answer`);
    }
  }, [roomState, roomId, router, roomCode])

  const handleSubmitAnswer = async () => {
    if (!answerInput) return
    try {
        await submitAnswer(answerInput); 
    } catch (error) {
        console.error("Error submitting answer:", error);
    }
  }

  return (
    <EmojiBackgroundLayout>
      <div className="w-full max-w-xs flex flex-col h-full mx-auto">
        {/* Header */}
        <PageHeader 
            title="Final Answer" 
            subtitle="The moment of truth" 
        />

        {/* 1. Leader Label Area - 情報を削ぎ落としてシンプルに */}
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
        
        {/* 2. Main Input Area */}
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

        {/* 3. Submit Button  */}
        <div className="mt-auto">
          <GameButton variant="secondary" onClick={handleSubmitAnswer} disabled={!answerInput}>
            {"Submit"}
          </GameButton>
        </div>
      </div>
    </EmojiBackgroundLayout>
  )
}