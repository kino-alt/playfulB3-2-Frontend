
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
        <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: displayLength}).map((_, index) => (
            <div
            key={index}
            className="relative aspect-square" 
            >
            {selectedEmojis[index] ? (
                <button
                onClick={() => isEditable && handleRemoveEmoji(index)}
                className="w-full h-full bg-white text-gray-500 border-2 border-amber-300 rounded-lg flex items-center justify-center text-3xl group relative"
                >
                {selectedEmojis[index]}

                {/* Delete Overlay */}
                {isEditable && (
                  <div
                      className="absolute inset-0 bg-red-600/70 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                      <span className="text-white text-3xl font-bold">×</span>
                  </div>
                )}
                </button>
            ) : (
                // Empty slot
                <div className="w-full h-full bg-gray-200/50 rounded-lg border border-gray-300/50"></div>
            )}
            </div>
        ))}
        </div>
    </div>
  );
}
