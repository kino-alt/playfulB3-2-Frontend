"use client"

import { useState, useEffect, use } from "react"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { PageHeader } from "./page-header"
import { TextDisplay } from "./text-display"
import { CountTimer } from "./count-timer"
import { Modal } from "./modal"
import { useRouter } from "next/navigation"
//FIX: Add
import { useRoomData } from '@/contexts/room-context';
import { GameState } from "@/contexts/types";
import Image from "next/image"

export function DiscussionTime() {
  const [showHintOverlay, setShowHintOverlay] = useState(true)
  const router = useRouter();
  const {
    roomId,
    roomState,
    AssignedEmoji,
    isLeader,
    timer, 
    globalError,
  } = useRoomData();
  
  // push next page
  useEffect(() => { 
    if (roomState === GameState.ANSWERING && roomId) {
      if(isLeader)
         router.push(`/room/${roomId}/submit-answer`);
      else
         router.push(`/room/${roomId}/waiting-answer`);
    }
  }, [roomState, roomId, router])

  {/* Toggle hint overlay visibility */}
  const handleToggleHintOverlay = () => {
    setShowHintOverlay(prev => !prev)
  }

  return (
    <EmojiBackgroundLayout>
      
      {/* Hint Overlay Modal */}
      <Modal 
        isOpen={showHintOverlay}
        onClose={handleToggleHintOverlay}
        title="Discussion Hint"
        content={`1. 自分の絵文字を順番に言葉で説明していく
2. テーマがなにかを考える
3. お題がなにか導き出す`}
      />

      <div className="w-full max-w-xs flex flex-col h-full">
        
        <PageHeader title="Discussion" subtitle={`Let's discuss emojis`} />

        <div className="w-full flex justify-between items-center mb-6">
                
            {/* Leader Display */}
            {isLeader &&(
              <TextDisplay
                  value={"Leader"}
                  inputtitle=""
                  height="py-0.5"
                  variant="primary"
                  textSize="text-xs"
                  marginBottom="mb-0" 
              />
            )}
            
            {/* 2. Hint Button  */}
            <button
                onClick={handleToggleHintOverlay}
                className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-400 text-white font-bold flex items-center justify-center text-sm shadow-md hover:bg-yellow-500 transition-colors"
                title="Refer to Hints"
            >
                !
            </button>
        </div>
        
        {/* Timer Display */}
        <CountTimer timervalue={timer}/>

        {/* Emoji Display */}
        <div className="w-full flex justify-center mt-4 mb-4">
            <div className="relative w-full max-w-[280px] h-[250px] flex items-center justify-center">
                
                <Image
                    src="/images/speech_bubble.png"
                    alt="Speech Bubble"
                    fill
                    className="absolute inset-0 w-full h-full object-contain"
                />
              
                <div className="absolute inset-0 flex items-center justify-center transform translate-y-[-15px]">
                    <p className="text-8xl font-bold">
                        {AssignedEmoji || "🍎"}
                    </p>
                </div>
                
            </div>
        </div>
      </div>
    </EmojiBackgroundLayout>
  )
}
