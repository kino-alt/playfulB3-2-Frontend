"use client"

import React from "react"

interface EmojiComparisonProps {
  originalEmojis: string[]
  displayedEmojis: string[]
  dummyIndex: number | null
  selectedEmojis?: string[]
  className?: string
}

export const EmojiComparisonDisplay = ({
  originalEmojis = [],
  displayedEmojis = [],
  dummyIndex,
  selectedEmojis = [],
  className = "",
}: EmojiComparisonProps) => {
  const isDummyMode = originalEmojis.length > 0 && dummyIndex !== null && dummyIndex !== undefined

  if (!isDummyMode) {
    const emojisToShow = displayedEmojis.length > 0 ? displayedEmojis : selectedEmojis
    return (
      <div className={`flex justify-center gap-2 py-4 ${className}`}>
        {emojisToShow.map((emoji: string, idx: number) => (
          <div key={`simple-${idx}`} className="w-12 h-12 bg-white border-2 border-emerald-500/30 rounded-xl flex items-center justify-center text-2xl shadow-sm">
            {emoji}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`w-full flex flex-col items-center gap-1 ${className}`}>
      
      {/* --- 上段：Host's Original Choice --- */}
      <div className="flex flex-col items-center w-full">
        <span className="text-[9px] font-black tracking-[0.2em] text-emerald-600/80 mb-2 uppercase">Original</span>
        <div className="flex justify-center gap-2.5">
          {originalEmojis.map((emoji, idx) => {
            const isDummy = idx === dummyIndex
            return (
              <div key={`orig-${idx}`} 
                className={`w-13 h-13 bg-white border-2 rounded-xl flex items-center justify-center text-2xl relative shadow-sm ${
                  isDummy ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-gray-300'
                }`}
              >
                {emoji}
                {isDummy && (
                  <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm border border-white">
                    !
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* --- 中段：コネクター --- */}
      <div className="relative w-full h-10 flex justify-center">
        <div className="flex justify-center gap-2.5 w-full">
          {originalEmojis.map((_, idx) => (
            <div key={`line-${idx}`} className="w-13 flex flex-col items-center">
              {idx === dummyIndex && (
                <div className="h-full flex flex-col items-center justify-between">
                  <div className="w-[3px] flex-1 bg-gradient-to-b from-emerald-500/60 to-amber-500/60"></div>
                  <div className="w-2 h-2 border-r-2 border-b-2 border-amber-500/60 rotate-45 -mt-1.5"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* --- 下段：Participants' View --- */}
      <div className="flex flex-col items-center w-full">
        <div className="flex justify-center gap-2.5">
          {displayedEmojis.map((emoji, idx) => {
            const isDummy = idx === dummyIndex
            return (
              <div key={`disp-${idx}`} 
                className={`w-13 h-13 bg-white border-2 rounded-xl flex items-center justify-center text-2xl shadow-md relative ${
                  isDummy ? 'border-amber-400 ring-4 ring-amber-100' : 'border-gray-300'
                }`}
              >
                {emoji}
                {isDummy && (
                  <div className="absolute -bottom-2 -right-2 bg-rose-500 text-white text-[7px] px-1.5 py-0.5 rounded font-black shadow-sm z-10">
                    DUMMY
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        <span className="text-[9px] font-black tracking-[0.2em] text-amber-400 mt-2 uppercase">Displayed</span>
      </div>

    </div>
  )
}