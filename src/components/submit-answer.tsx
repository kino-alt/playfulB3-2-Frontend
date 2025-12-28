"use client"

import { useState, useEffect } from "react"
import { GameButton } from "./game-button"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import {PageHeader} from "./page-header"
import { useRouter } from "next/navigation"
import { TextInput } from "./text-input"
import { TextDisplay } from "./text-display"
//FIX: Add
import { useRoomData } from '@/contexts/room-context';
import { GameState } from "@/contexts/types";

export default function SubmitAnswer() {
  const [answerInput, setAnswerInput] = useState("")
  const router = useRouter()
  const { 
      roomId,
      roomCode,
      roomState,
      globalError,
      submitAnswer
  } = useRoomData();

  // push next page
  useEffect(() => {
   console.log("Current Room State:", roomState); // デバッグ用
    if (roomState === GameState.CHECKING && roomCode) {
      console.log("Navigating to review-answer...");
      router.push(`/room/${roomId}/review-answer`);
    }
  }, [roomState, roomId, router])

  {/* Handle answer submission */}
  const handleSubmitAnswer = async () => {
    if (!answerInput) {
      return
    }
    try {
        console.log(`Submitting answer: ${answerInput}`);
        await submitAnswer(answerInput); 
    } catch (error) {
        console.error("Error submitting answer:", error);
        alert("Fail to submit answer");
    }
  }

  return (
    <EmojiBackgroundLayout>
      <div className="w-full max-w-xs flex flex-col h-full">
        {/* Header */}
        <PageHeader 
            title="Submit Answer" 
            subtitle="Enter an answer" 
        />

        {/* Leader Label */}
        <div className="min-w-[60px] self-start mb-2">
            <TextDisplay
              value="Leader"
              inputtitle=""
              height="py-1"
              variant="primary"
              textSize="text-[10px]"
              marginBottom="mb-0" 
            />
        </div>
        
        {/* Answer Input */}
        <div className="flex flex-col items-center justify-center flex-grow">
          <TextInput
              value={answerInput}
              onChange={setAnswerInput}
              inputtitle=""
              placeholder="Enter answer"
              maxLength={20}
              height="py-5"
              variant="secondary"
              textSize="text-2xl"
              uppercase={false}
          />
        </div>

        {/* Submit Button */}
        <div className="mt-auto">
          <GameButton variant="secondary" onClick={handleSubmitAnswer} disabled={!answerInput}>
            {"Submit"}
          </GameButton>
        </div>
      </div>
    </EmojiBackgroundLayout>
  )
}
