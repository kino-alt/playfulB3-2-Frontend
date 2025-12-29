"use client"

import { useState, useEffect, use } from "react"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { PageHeader } from "./page-header"
import { TextInput } from "./text-input"
import { TextDisplay } from "./text-display"
import { CountTimer } from "./count-timer"
import { EmojiComparisonDisplay } from "./emoji-comparison-display"
import { useRouter } from "next/navigation"
//FIX: Add
import { useRoomData } from '@/contexts/room-context';
import { GameState } from "@/contexts/types";

export function WaitingDiscussionTime() {
    const router = useRouter()
    const { 
      roomId,
      roomCode,
      theme,
      topic,
      originalEmojis = [],  // FIX: Add
      displayedEmojis = [], // FIX: Add
      dummyIndex = null,          // FIX: Add
      selectedEmojis,
      maxEmojis,
      timer,
      roomState,
      globalError,
    } = useRoomData();

    // push next page
    useEffect(() => { 
      console.log("Current Room State:", roomState); // デバッグ用
      if (roomState === GameState.ANSWERING && roomCode) {
        console.log("Navigating to discussion-time...");
        router.push(`/room/${roomId}/waiting-answer`);
      }
    }, [roomState, roomId, router])

    return (
        <EmojiBackgroundLayout>
        <div className="w-full max-w-xs flex flex-col h-full">
            
            <PageHeader title="Discussion" subtitle={`Let's discuss emojis`} />

            {/*display theme*/}
            <TextDisplay
                value={"テーマ: " + (theme || "N/A")}
                inputtitle=""
                height="py-0.5"
                variant="primary"
                textSize="text-sm"
            />

            {/*display topic*/}
            <TextInput
                value={topic || "N/A"}
                onChange={()=>{}}
                inputtitle="TOPIC"
                placeholder=""
                height="py-2"
                variant="primary"
                mode="display"
                textSize="text-lg"
            />

            {/* Discussion Timer */}
            <CountTimer timervalue={timer}/>

            {/* Display Selected Emojis */} 
            <EmojiComparisonDisplay 
                originalEmojis={originalEmojis}
                displayedEmojis={displayedEmojis}
                dummyIndex={dummyIndex}
                selectedEmojis={selectedEmojis}
                className="mt-0 flex-grow"
            />
          </div>
        </EmojiBackgroundLayout>
    )
}
