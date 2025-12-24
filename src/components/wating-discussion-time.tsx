"use client"

import { useState, useEffect, use } from "react"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { PageHeader } from "./page-header"
import { TextInput } from "./text-input"
import { TextDisplay } from "./text-display"
import { CountTimer } from "./count-timer"
import { DisplaySelectedEmojis } from "./display-selected-emojis"
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
      selectedEmojis,
      maxEmojis,
      timer,
      roomState,
      globalError,
    } = useRoomData();

    // push next page
    useEffect(() => { 
      console.log("Current Room State:", roomState); // デバッグ用
      if (roomState === GameState.CHECKING && roomCode) {
        console.log("Navigating to discussion-time...");
        router.push(`/room/${roomId}/review-answer`);
      }
    }, [roomState, roomId, router])

    return (
        <EmojiBackgroundLayout>
        <div className="w-full max-w-xs flex flex-col h-full">
            
            <PageHeader title="Discussion" subtitle={`Let's discuss emojis`} />

            {/*display theme*/}
            <TextDisplay
                value={theme || "N/A"}
                inputtitle=""
                height="py-0.5"
                variant="primary"
                textSize="text-sm"
                marginBottom="mb-2"
            />

            {/*display topic*/}
            <TextInput
                value={topic || "N/A"}
                onChange={()=>{}}
                inputtitle=""
                placeholder=""
                height="py-2"
                variant="primary"
                mode="display"
                textSize="text-lg"
                marginBottom="mb-6"
            />

            {/* Discussion Timer */}
            <CountTimer timervalue={timer}/>

            {/* Display Selected Emojis */} 
            <DisplaySelectedEmojis
                selectedEmojis={selectedEmojis}
                handleRemoveEmoji={() => {}}
                maxEmojis={maxEmojis}
                roomState={roomState}
            />    
        </div>
        </EmojiBackgroundLayout>
    )
}
