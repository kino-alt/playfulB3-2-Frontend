"use client"

import { useState, useEffect, useRef } from "react"
import { GameButton } from "./game-button"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { PageHeader } from "./page-header"
import { TextInput } from "./text-input"
import { TextDisplay} from "./text-display"
import { DisplaySelectedEmojis } from "./display-selected-emojis"
import { useRouter } from "next/navigation"
import { useRoomData } from '@/contexts/room-context';
import { GameState } from "@/contexts/types";
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

export function CreateTopic() {
  const [topicInput, setTopicInput] = useState("")
  const [emojiInput, setEmojiInput] = useState("")
  const [localSelectedEmojis, setLocalSelectedEmojis] = useState<string[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [step, setStep] = useState<"topic" | "emoji">("topic") // 段階管理
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter()
  
  const { 
    roomId,
    roomCode,
    theme, 
    hint,  
    roomState,
    maxEmojis,
    submitTopic,
  } = useRoomData();
  
  const isEmojiComplete = localSelectedEmojis.length === maxEmojis;

  // 入力が止まったらステップを移行するタイマー
  useEffect(() => {
    if (topicInput.trim() !== "" && step === "topic") {
      if (timerRef.current) clearTimeout(timerRef.current);
      
      timerRef.current = setTimeout(() => {
        setStep("emoji");
      }, 1000); // 1秒間入力が止まったら移行
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [topicInput, step]);

  useEffect(() => {
    if (roomState === GameState.DISCUSSING && roomCode) {
      router.push(`/room/${roomId}/waiting-discussion-time`);
    }
  }, [roomState, roomId, router, roomCode])

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setEmojiInput(emojiData.emoji);
    setShowPicker(false);
  };

  const handleAddEmoji = () => {
    if (emojiInput && localSelectedEmojis.length < maxEmojis ) {
      setLocalSelectedEmojis([...localSelectedEmojis, emojiInput]);
      setEmojiInput(""); 
    }
  }

  const handleRemoveEmoji = (index: number) => {
    setLocalSelectedEmojis(localSelectedEmojis.filter((_, i) => i !== index));
  }

  const handleSubmit = async () => {
    if (!topicInput || !isEmojiComplete) return;
    try {
      await submitTopic(topicInput, localSelectedEmojis); 
    } catch (error) {
      console.error(error);
      alert("送信に失敗しました。");
    }
  }

  return (
    <EmojiBackgroundLayout> 
      <div className="w-full max-w-xs flex flex-col h-full relative">
        <PageHeader title="Set the Topic" subtitle="Prepare your quiz" marginBottom="mb-2" />
        
        <TextDisplay
          value={theme || "N/A"}
          inputtitle=""
          height="py-0.5"
          variant="primary"
          textSize="text-sm"
          marginBottom="mb-4"
        />

        {/* 吹き出し: お題入力時（Theme と Topic の間） */}
        {step === "topic" && (
          <div className="mb-2 z-20 flex justify-center">
            <div className="bg-amber-400 text-gray-600/80 text-xs font-black py-3 px-4 rounded-2xl shadow-xl relative text-center border-2 border-white leading-relaxed max-w-[280px] animate-bounce-slow">
               🖋️テーマに沿った「お題」を入力してね！
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-amber-400"></div>
            </div>
          </div>
        )}

        {/* --- Area 1: Topic Input --- */}
        <div className="relative mb-8">
          <TextInput
            value={topicInput}
            onChange={(val) => {
              setTopicInput(val);
              if (step === "emoji") setStep("topic"); 
            }}
            placeholder={hint ? `Ex. ${hint}` : "Enter your topic"}
            height="py-3"
            variant="primary"
            textSize="text-xl"
            marginBottom="mb-0"
            maxLength={50}
            uppercase={false}
          />
        </div>

        {/* --- Area 2: Emoji Selection --- */}
        <div className={`relative transition-all duration-500 ${step === "topic" ? 'opacity-30 grayscale pointer-events-none scale-95' : 'opacity-100 scale-100'}`}>
          
          <div className="flex items-end justify-center gap-3 mb-5 ml-13">
            <div className="relative w-24 h-24">
              <div onClick={() => !isEmojiComplete && setShowPicker(!showPicker)} className="cursor-pointer">
                <TextInput
                  value={emojiInput}
                  onChange={() => {}} 
                  inputtitle="" 
                  placeholder=""
                  height="py-8"
                  variant="gray"
                  mode="edit"
                  textSize="text-3xl"
                  marginBottom="mb-0"
                  isEmojiInput={true}
                  // @ts-ignore
                  readOnly={true} 
                />
              </div>

              {showPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[70%] z-50 shadow-2xl">
                    <EmojiPicker onEmojiClick={onEmojiClick} theme={Theme.LIGHT} width={280} height={300} skinTonesDisabled />
                  </div>
                </>
              )}
            </div>
            
            <div className="flex-shrink-0 mb-1"> 
              <GameButton variant="secondary" onClick={handleAddEmoji} height="p-2" disabled={!emojiInput || isEmojiComplete}> 
                <p className="text-sm font-black uppercase">ADD</p>
              </GameButton>
            </div>
          </div>

          {/* 吹き出し: 絵文字選択時（Emoji Display と DisplaySelectedEmojis の間） */}
          {step === "emoji" && !isEmojiComplete && (
            <div className="mt-1 mb-1 z-20 flex justify-center">
              <div className="bg-amber-400 text-gray-600/80 text-xs font-black py-3 px-4 rounded-2xl shadow-xl relative text-center border-2 border-white leading-relaxed max-w-[280px] animate-bounce-slow">
                🔍お題を表現する絵文字を<br/>あと <span style={{fontSize: '1.1rem', color: '#dc2626', fontWeight: '900'}}>
                  {maxEmojis - localSelectedEmojis.length}
                </span> 個選んで！
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-amber-400"></div>
              </div>
            </div>
          )}

          <div className="flex-grow overflow-y-auto no-scrollbar min-h-[70px]">
            <DisplaySelectedEmojis
              selectedEmojis={localSelectedEmojis}
              handleRemoveEmoji={handleRemoveEmoji}
              maxEmojis={maxEmojis}
              roomState={roomState}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-auto pt-4">
          <GameButton 
            variant="primary" 
            onClick={handleSubmit}
            disabled={step === "topic" || !isEmojiComplete}
          >
            Submit 
          </GameButton>
        </div>
      </div>

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translate(-3%, 0); }
          50% { transform: translate(-3%, -8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite ease-in-out;
        }
      `}</style>
    </EmojiBackgroundLayout>
  )
}