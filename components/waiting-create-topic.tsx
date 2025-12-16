"use client"
import { useEffect } from "react"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { PageHeader } from "./page-header"
import { WaitingAnimation } from "./waiting-animation"
import { useRouter } from "next/router"
//FIX: Add
import { useRoomData } from '@/contexts/room-context';
import { GameState } from "@/contexts/types";

export default function WaitingCreateTopic() {
  const router = useRouter()
    const { 
          roomId,
          roomState,
          globalError,
      } = useRoomData();
  
    // push next page
      useEffect(() => { 
        if (roomState === GameState.DISCUSSING && roomId) {
          router.push(`/room/${roomId}/discussion-time`);
        }
      }, [roomState, roomId, router])

  return (
    <EmojiBackgroundLayout>
      <div className="w-full max-w-xs flex flex-col h-full">
        <PageHeader title="Waiting for Host" subtitle="Please wait..." />

        {/* Waiting animation */}
        <div className="flex flex-col items-center flex-1 justify-center">
          <WaitingAnimation variant="secondary" />
        </div>

      </div>
    </EmojiBackgroundLayout>
  )
}
