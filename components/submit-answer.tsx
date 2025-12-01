"use client"

import { useState, useEffect } from "react"
import { GameButton } from "./game-button"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import {PageHeader} from "./page-header"
import { useRouter } from "next/navigation"
import { TextInput } from "./text-input"
import { TextDisplay } from "./text-display"
import { api } from "@/lib/api"

export default function SubmitAnswer({ roomCode }: { roomCode: string }) {
  const [answer, setAnswer] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  {/* (要修正）Handle answer submission */}
  const handleSubmitAnswer = async () => {
    if (!answer) {
      return
    }

    setIsSubmitting(true)
    try {
      const data = await api.submitAnswer(roomCode.toUpperCase(),answer)

      if (data.success) {
        router.push(`/room/${roomCode.toUpperCase()}/waiting-start-game`)
      } else {
        alert(data.error || "Failed to submit answer")
      }
    } catch (error) {
      console.error("Error submitting answer:", error)
      alert("Failed to submit answer")
    } finally {
      setIsSubmitting(false)
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
        <div className="w-full flex justify-start">
          <TextDisplay
            value={"Leader"}
            height="py-0.5"
            variant="primary"
            textSize="text-xs"
          />
        </div>
        
        {/* Answer Input */}
        <div className="flex flex-col items-center justify-center flex-grow">
          <TextInput
              value={answer}
              onChange={setAnswer}
              placeholder="Enter answer"
              maxLength={20}
              height="py-5"
              variant="secondary"
              textSize="text-2xl"
          />
        </div>

        {/* Submit Button */}
        <div className="mt-auto">
          <GameButton variant="secondary" onClick={handleSubmitAnswer} disabled={isSubmitting || !answer}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </GameButton>
        </div>
      </div>
    </EmojiBackgroundLayout>
  )
}
