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
            {originalEmojis.length > 0 && dummyIndex !== null && (
                <div className="my-6 w-full flex flex-col items-center gap-2">
                    
                    {/* 【上段】ホストの選択：DisplaySelectedEmojisと同じサイズ感 */}
                    <div className="flex flex-col items-center w-full">
                    <p className="text-amber-600/60 text-[10px] mb-1 font-bold">HOST ORIGINAL</p>
                    <div className="flex justify-center gap-2">
                        {originalEmojis.map((emoji, idx) => (
                        <div key={`orig-${idx}`} 
                            className={`w-10 h-10 bg-white border-2 rounded-lg flex items-center justify-center text-xl ${
                            idx === dummyIndex ? 'border-amber-400' : 'border-gray-100 opacity-60'
                            }`}
                        >
                            {emoji}
                        </div>
                        ))}
                    </div>
                    </div>

                    {/* 【中段】シンプルな縦線（コネクター） */}
                    <div className="w-full h-8 relative flex justify-center">
                    <div className="flex justify-center gap-2 w-full">
                        {originalEmojis.map((_, idx) => (
                        <div key={`line-${idx}`} className="w-10 flex justify-center">
                            {idx === dummyIndex && (
                            <div className="w-0.5 h-full bg-amber-400/50"></div>
                            )}
                        </div>
                        ))}
                    </div>
                    </div>

                    {/* 【下段】実際に表示されたセット：少しだけ大きくして強調 */}
                    <div className="flex flex-col items-center w-full">
                    <div className="flex justify-center gap-2">
                        {displayedEmojis.map((emoji, idx) => (
                        <div key={`disp-${idx}`} className="relative">
                            <div className={`w-14 h-14 bg-white border-2 rounded-xl flex items-center justify-center text-3xl shadow-sm ${
                            idx === dummyIndex ? 'border-rose-500' : 'border-amber-300'
                            }`}>
                            {emoji}
                            </div>
                            
                            {/* シンプルなラベル */}
                            {idx === dummyIndex && (
                            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
                                <span className="bg-rose-500 text-white text-[8px] px-2 py-0.5 rounded font-black whitespace-nowrap">
                                DUMMY
                                </span>
                            </div>
                            )}
                        </div>
                        ))}
                    </div>
                    <p className="text-gray-400 text-[10px] mt-8 font-bold uppercase">Displayed Set</p>
                    </div>

                </div>
                )}  
        </div>
        </EmojiBackgroundLayout>
    )
}
