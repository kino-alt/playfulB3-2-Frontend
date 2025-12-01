"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { PageHeader } from "./page-header"
import { ParticipantList } from "./participant-list"
import { WaitingAnimation } from "./waiting-animation"

export default function WaitingSartGame({roomCode }: { roomCode: string }) {
   const [participants, setParticipants] = useState<string[]>([])
   const router = useRouter()

    {/*(要修正）Temporary: Mock participants data*/}
    useEffect(() => {
      setParticipants(["Alice", "Bob", "Charlie", "David", "Eve"]) 
    }, [])

  return (
    <EmojiBackgroundLayout>
      <div className="w-full max-w-xs flex flex-col h-full">
        <PageHeader title="Waiting for players" subtitle="Please wait..." />

        {/* Waiting animation */}
        <div className="flex flex-col items-center">
          <WaitingAnimation variant="secondary" />
        </div>

        {/* Participants List */}
        <div className="w-full mb-8">
            <ParticipantList participants={participants} />
        </div>

      </div>
    </EmojiBackgroundLayout>
  )
}
