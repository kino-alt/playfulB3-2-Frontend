
import React from 'react';
import { GameState } from "@/contexts/types";

{/* Props Interface */}
interface DisplaySelectedEmojisProps {
  selectedEmojis: string[];
  handleRemoveEmoji: (index: number) => void;
  maxEmojis: number; 
  roomState: GameState;
}

export function DisplaySelectedEmojis({ selectedEmojis, handleRemoveEmoji, maxEmojis ,roomState}: DisplaySelectedEmojisProps) {
  const displayLength = maxEmojis; 
  const isEditable = roomState === GameState.SETTING_TOPIC;

  return (
    <div className="bg-white/10 rounded-2xl p-1 flex-grow">

        {/* count emoji */}
        <p className="text-amber-600/80 text-xs mb-2">Selected ({selectedEmojis.length}/{displayLength})</p>

        {/* Emoji Grid */}
        <div className="grid grid-cols-5 gap-2"> 
          {Array.from({ length: displayLength }).map((_, index) => (
            <div key={index} className="relative aspect-square">
              {selectedEmojis[index] ? (
                <div className="relative w-full h-full">
                  <div className="w-full h-full bg-white border-2 border-amber-400/60 rounded-lg flex items-center justify-center text-2xl">
                    {selectedEmojis[index]}
                  </div>
                  {isEditable && (
                    <button
                      onClick={() => handleRemoveEmoji(index)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center shadow-sm"
                    >
                      ×
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-full h-full bg-gray-100 rounded-lg border-2 border-dashed border-gray-200" />
              )}
            </div>
          ))}
        </div>
    </div>
  );
}
