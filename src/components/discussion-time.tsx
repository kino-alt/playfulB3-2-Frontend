"use client"

import { useState, useEffect } from "react"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { PageHeader } from "./page-header"
import { TextDisplay } from "./text-display"
import { CountTimer } from "./count-timer"
import { Modal } from "./modal"
import { useRouter } from "next/navigation"
import { GameButton } from "./game-button"
import { useRoomData } from '@/contexts/room-context';
import { GameState } from "@/contexts/types";

export function DiscussionTime() {
  const [showHintOverlay, setShowHintOverlay] = useState(false);
  const router = useRouter();
  const {
    roomId,
    roomState,
    AssignedEmoji,
    isLeader,
    timer, 
    skipDiscussion,
  } = useRoomData();
  
  useEffect(() => { 
    if (roomState === GameState.ANSWERING && roomId) {
      if(isLeader)
          router.push(`/room/${roomId}/submit-answer`);
      else
          router.push(`/room/${roomId}/waiting-answer`);
    }
  }, [roomState, roomId, router, isLeader])

  const handleToggleHintOverlay = () => {
    setShowHintOverlay(prev => !prev)
  }

  const handleSkip = async () => {
    try {
      await skipDiscussion();
    } catch (error) {
      console.error("Failed to skip discussion:", error);
    }
  }

  return (
    <EmojiBackgroundLayout>
      <Modal 
        isOpen={showHintOverlay}
        onClose={handleToggleHintOverlay}
        title="Discussion Hint"
        content={`1. 自分の絵文字を順番に言葉で説明していく\n2. テーマがなにかを考える\n3. お題がなにか導き出す`}
      />

      <div className="w-full max-w-xs flex flex-col h-full">
        
        {/* 1. Header Area */}
        <div className="flex flex-col">
          <PageHeader title="Discussion" subtitle="Let's discuss emojis" marginBottom="mb-1" />
          
          <div className="w-full flex justify-between items-center mb-0">
            <div className="min-w-[60px]">
              {isLeader && (
                <TextDisplay
                  value="Leader"
                  inputtitle=""
                  height="py-1"
                  variant="primary"
                  textSize="text-[10px]"
                  marginBottom="mb-0" 
                />
              )}
            </div>
          </div>
        </div>

        {/* 2. Main Content Area - 他のUIと調和させたシンプルデザイン */}
        <div className="flex flex-col items-center justify-start flex-grow space-y-1 pt-3">
          <div className="w-full">
            <CountTimer timervalue={timer} height="py-6" />
          </div>
          
          {/* Emoji Display Area */}
          <div className="relative w-full max-w-[250px]">
           <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full shadow-sm whitespace-nowrap flex-shrink-0">
                <span className="text-amber-500 mr-2 text-xs animate-pulse">📢</span>
                <p className="text-[10px] text-amber-700 font-black uppercase tracking-wider">
                  Describe this to your friends!
                </p>
              </div>
              <button
                onClick={handleToggleHintOverlay}
                className="w-5 h-5 flex-shrink-0 rounded-full bg-white border border-gray-200 text-gray-400 font-bold flex items-center justify-center text-xs shadow-sm hover:border-amber-400 hover:text-amber-500 transition-all"
              >
                ?
              </button>
            </div>

            {/* メインコンテナ */}
            <div className="relative w-full h-[180px] bg-white border-[3px] border-gray-300 rounded-[3rem] shadow-[0_8px_0_0_rgba(245,158,11,0.5)] flex items-center justify-center">
              {/* 吹き出しのしっぽ */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border-b-[3px] border-r-[3px] border-gray-300 rotate-45 rounded-sm"></div>               
              {/* 絵文字 */}
              <p className="text-[100px] sm:text-[110px] select-none z-10 drop-shadow-sm leading-none">
                {AssignedEmoji || ""}
              </p>
            </div>
            {/* 下部の補足 */}
            <p className="mt-4 text-[10px] text-gray-400 font-medium text-center italic">
              — This is your assigned emoji —
            </p>
          </div>
        </div>

        {/* 3. Footer Button Area - 他ページと位置を統一 */}
        <div className="mt-auto ">
          {isLeader ? (
            <GameButton onClick={handleSkip} variant="secondary">
              SKIP DISCUSSION
            </GameButton>
          ) : (
            <div className="h-[52px]"></div>
          )}
        </div>
        
      </div>
    </EmojiBackgroundLayout>
  )
}