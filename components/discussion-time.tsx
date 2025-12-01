"use client"

import { useState, useEffect, use } from "react"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { PageHeader } from "./page-header"
import { TextDisplay } from "./text-display"
import { CountTimer } from "./count-timer"
import { api } from "@/lib/api"
import FukidashiImage from '../images/speach_bubble.png'
import { Modal } from "./modal"


export function DiscussionTime({roomCode}:  { roomCode: string }) {
  const [isLoading, setIsLoading] = useState(true)
  const [emoji, setEmoji] = useState("")
  const [leader, setLeader] = useState("")
  const [showHintOverlay, setShowHintOverlay] = useState(true)

  {/*(要修正）temporary values*/}
  useEffect(() => { 
    setEmoji("👑")
    setIsLoading(false)
    setLeader("Leader")
  }, [])

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
        content="Discuss the meaning and relevance of the emoji to the topic. Share your thoughts and listen to others!"
      />

      <div className="w-full max-w-xs flex flex-col h-full">
        
        <PageHeader title="Discussion" subtitle={`Let's discuss emojis`} />

        <div className="w-full flex justify-between items-center mb-6">
                
            {/* Leader Display */}
            <TextDisplay
                value={isLoading ? "Loading..." : ` ${leader}`}
                inputtitle=""
                height="py-0.5"
                variant="primary"
                textSize="text-xs"
                marginBottom="mb-0" 
            />
            
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
        <CountTimer roomCode={roomCode}/>

        {/* Emoji Display */}
        <div className="w-full flex justify-center mt-4 mb-4">
            <div className="relative w-full max-w-[280px] h-[250px] flex items-center justify-center">
                
                <img 
                    src={FukidashiImage.src} 
                    alt="Speech Bubble"
                    className="absolute inset-0 w-full h-full object-contain"
                />
              
                <div className="absolute inset-0 flex items-center justify-center transform translate-y-[-15px]">
                    <p className="text-8xl font-bold">
                        {isLoading ? "..." : emoji}
                    </p>
                </div>
                
            </div>
        </div>
      </div>
    </EmojiBackgroundLayout>
  )
}
