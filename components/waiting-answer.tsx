"use client"

import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { PageHeader } from "./page-header"
import { WaitingAnimation } from "./waiting-animation"
import { useEffect } from "react"
import { useRouter } from "next/router"
//FIX: Add
import { useRoomData } from '@/contexts/room-context';
import { GameState } from "@/contexts/types";

export default function WaitingAnswer() {
  const router = useRouter()
  const { 
        roomId,
        roomState,
        globalError,
    } = useRoomData();

  // push next page
    useEffect(() => { 
      if (roomState === GameState.CHECKING && roomId) {
        router.push(`/room/${roomId}/review-answer`);
      }
    }, [roomState, roomId, router])

  return (
    <EmojiBackgroundLayout>
      <div className="w-full max-w-xs flex flex-col h-full">
        <PageHeader title="Waiting for Leader" subtitle="Please wait..." />

        {/* Waiting animation */}
        <div className="flex flex-col items-center flex-1 justify-center">
          <WaitingAnimation variant="secondary" />
        </div>

      </div>
    </EmojiBackgroundLayout>
  )
}
