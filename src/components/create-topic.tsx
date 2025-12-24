"use client"

import { useState, useEffect, use, useRef } from "react"
import { GameButton } from "./game-button"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { PageHeader } from "./page-header"
import { TextInput } from "./text-input"
import { TextDisplay} from "./text-display"
import { DisplaySelectedEmojis } from "./display-selected-emojis"
import { useRouter } from "next/navigation"
import { Modal } from "./modal"
//FIX: Add
import { useRoomData } from '@/contexts/room-context';
import { GameState } from "@/contexts/types";
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';


export function CreateTopic() {
  const [topicInput, setTopicInput] = useState("")
  const [emojiInput, setEmojiInput] = useState("")
  const [localSelectedEmojis, setLocalSelectedEmojis] = useState<string[]>([])
  const [showHintOverlay, setShowHintOverlay] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const router = useRouter()
  const { 
    roomId,
    roomCode,
    theme, 
    hint,  
    participantsList,
    roomState,
    maxEmojis,
    submitTopic,
    globalError,
  } = useRoomData();
  
  const pickerRef = useRef<HTMLDivElement>(null);
  
  // push next page
  useEffect(() => {
    console.log("Current Room State:", roomState); // デバッグ用
    if (roomState === GameState.DISCUSSING && roomCode) {
      console.log("Navigating to discussion-time...");
      router.push(`/room/${roomId}/waiting-discussion-time`);
    }
  }, [roomState, roomId, router])

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setEmojiInput(emojiData.emoji);
    setShowPicker(false); // 選択したら閉じる
  };

  {/* Toggle hint overlay visibility */}
  const handleToggleHintOverlay = () => {
    setShowHintOverlay(prev => !prev)
  }
    
 const handleAddEmoji = () => {
    if (emojiInput && localSelectedEmojis.length < maxEmojis ) {
      setLocalSelectedEmojis([...localSelectedEmojis, emojiInput]);
      setEmojiInput(""); 
    } else if (localSelectedEmojis.length >= maxEmojis) {
      alert(`絵文字は最大 ${maxEmojis} 個までしか選択できません。`);
    }
  }

  const handleRemoveEmoji = (index: number) => {
    setLocalSelectedEmojis(localSelectedEmojis.filter((_, i) => i !== index));
  }

  {/*submit handler */}
  const handleSubmit = async () => {
    if (!topicInput) {
      alert(`お題を入力してください。`);
      return;
    }
    if (localSelectedEmojis.length !== maxEmojis) {
        alert(`絵文字を${maxEmojis} 個選択してください。`);
        return;
    }
    try {
        console.log(`Submitting topic: ${topicInput} with emojis: ${localSelectedEmojis.join(', ')}`);
        await submitTopic(topicInput, localSelectedEmojis); 
    } catch (error) {
        console.error("Error submitting topic:", error);
        alert("トピックの提出に失敗しました。");
    }
  }

  return (
    <EmojiBackgroundLayout>

      {/* Hint Modal */}
      <Modal
        isOpen={showHintOverlay} 
        onClose={handleToggleHintOverlay}
        title="💡 Hint for Choosing Emojis"
        content={hint} 
      />

      <div className="w-full max-w-xs flex flex-col h-full">
        <PageHeader title="Set the Topic" subtitle={`Set the topic and choose the emojis`} marginBottom="mb-2" />
        
        {/*Theme display*/}
        <TextDisplay
          value={theme || "N/A"}
          inputtitle=""
          height="py-0.5"
          variant="primary"
          textSize="text-sm"
          marginBottom="mb-2"
        />

        {/*Topic input*/}
        <TextInput
          value={topicInput}
          onChange={setTopicInput}
          inputtitle=""
          placeholder="Enter the Topic"
          height="py-2"
          variant="primary"
          mode="edit"
          textSize="text-lg"
          marginBottom="mb-6"
        />

        <div className="flex items-end justify-center gap-3 mb-8 ml-13">
          <div className="relative w-24 h-24">
            {/* Hint Overlay Button */}
            <button
                onClick={handleToggleHintOverlay}
                className="absolute top-2 -left-9 z-10 w-6 h-6 rounded-full bg-yellow-400 text-white font-bold flex items-center justify-center text-sm shadow-md hover:bg-yellow-500 transition-colors"
                title="Refer to Hints"
            >
                !
            </button>

            <div onClick={() => setShowPicker(!showPicker)} className="cursor-pointer">
              <TextInput
                value={emojiInput}
                onChange={() => {}} // readOnlyなので何もしない
                inputtitle="" 
                placeholder=""
                height="py-8"
                variant="gray"
                mode="edit"
                textSize="text-xl"
                marginBottom="mb-2"
                isEmojiInput={true}
                // @ts-ignore (TextInputコンポーネントがPropsを受け取れる場合)
                readOnly={true} 
              />
            </div>

            {/* 5. 絵文字ピッカーのオーバーレイ表示 */}
            {showPicker && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 shadow-2xl">
                <EmojiPicker 
                  onEmojiClick={onEmojiClick}
                  theme={Theme.LIGHT}
                  autoFocusSearch={false}
                  width={280}
                  height={350}
                  // 検索やカテゴリーなどの表示を絞る設定（任意）
                  searchDisabled={false}
                  skinTonesDisabled={true}
                />
              </div>
            )}
            <p className="text-xs text-gray-500 font-semibold uppercase text-center mt-2">Select Emoji</p>
          </div>
          
           {/* Add button */}
          <div className="flex-shrink-0 mb-1"> 
            <GameButton variant="secondary" onClick={handleAddEmoji} height="p-2" disabled={!emojiInput || localSelectedEmojis.length >= maxEmojis}> 
              <p className="text-xs font-bold uppercase"> ADD</p>
            </GameButton>
          </div>
        </div>

        {/*display selected emojis*/}
        <DisplaySelectedEmojis
          selectedEmojis={localSelectedEmojis}
          handleRemoveEmoji={handleRemoveEmoji}
          maxEmojis={maxEmojis}
          roomState={roomState}
        />

        {/*submit button*/}
        <div className="mt-auto">
          <GameButton variant="primary" onClick={handleSubmit} height="py-2">
            Submit 
          </GameButton>
        </div>
      </div>
    </EmojiBackgroundLayout>
  )
}
