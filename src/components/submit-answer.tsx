"use client"

import { useState, useEffect } from "react"
import { GameButton } from "./game-button"
import dynamic from 'next/dynamic'
import { PageHeader } from "./page-header"
import { useRouter } from "next/navigation"
import { TextInput } from "./text-input"
import { TextDisplay } from "./text-display"
import { useRoomData } from '@/contexts/room-context';
import { GameState } from "@/contexts/types";

const EmojiBackgroundLayoutNoSSR = dynamic(() => import('./emoji-background-layout').then(m => m.EmojiBackgroundLayout), { ssr: false })

export default function SubmitAnswer() {
  const [answerInput, setAnswerInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { 
      roomId,
      roomCode,
      roomState,
      submitAnswer,
      isLeader
  } = useRoomData();

  // デバッグ: isLeaderの状態を確認
  useEffect(() => {
    console.log('[SubmitAnswer] Component state:', { 
      roomState, 
      isLeader, 
      roomId,
      canSubmit: roomState === GameState.ANSWERING 
    });
  }, [roomState, isLeader, roomId]);

  // リロード時に入力内容を復元
  useEffect(() => {
    if (typeof window === 'undefined' || !roomId) return;
    const storageKey = `submitAnswer_draft_${roomId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setAnswerInput(saved);
      console.log('[SubmitAnswer] Restored draft:', saved);
    }
  }, [roomId]);

  // 入力内容をlocalStorageに保存
  useEffect(() => {
    if (typeof window === 'undefined' || !roomId) return;
    const storageKey = `submitAnswer_draft_${roomId}`;
    if (answerInput) {
      localStorage.setItem(storageKey, answerInput);
    }
  }, [answerInput, roomId]);

  useEffect(() => {
    if (roomState === GameState.CHECKING && roomCode) {
      // 画面遷移時にドラフトをクリア
      if (typeof window !== 'undefined' && roomId) {
        localStorage.removeItem(`submitAnswer_draft_${roomId}`);
      }
      router.push(`/room/${roomId}/review-answer`);
    }
  }, [roomState, roomId, router, roomCode])

  const handleSubmitAnswer = async () => {
    if (!answerInput.trim() || isSubmitting) return;
    
    // ANSWERING状態でこの画面にいる場合、リーダーとみなす
    const isInAnsweringState = roomState === GameState.ANSWERING;
    console.log('[SubmitAnswer] Submitting answer:', { 
      answerInput, 
      isLeader, 
      roomState,
      isInAnsweringState 
    });
    
    if (!isInAnsweringState && !isLeader) {
      console.error('[SubmitAnswer] User is not in ANSWERING state and not a leader');
      alert('Only the leader can submit an answer during the answering phase.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
        await submitAnswer(answerInput.trim()); 
        console.log('[SubmitAnswer] Answer submitted successfully');
        // ドラフトをクリア
        if (typeof window !== 'undefined' && roomId) {
          localStorage.removeItem(`submitAnswer_draft_${roomId}`);
        }
    } catch (error) {
        console.error("[SubmitAnswer] Error submitting answer:", error);
        alert('Failed to submit answer. Please try again.');
        setIsSubmitting(false);
    }
  }

  return (
    <EmojiBackgroundLayoutNoSSR>
      <div className="w-full max-w-xs flex flex-col h-full mx-auto">
        {/* Header */}
        <PageHeader 
            title="Final Answer" 
            subtitle="The moment of truth" 
        />

        {/* 1. Leader Label Area - 情報を削ぎ落としてシンプルに */}
        <div className="flex flex-col items-center mt-6">
            <TextDisplay
              value="Leader's Decision"
              inputtitle=""
              height="py-0.5 px-4"
              variant="secondary"
              textSize="text-[10px]"
              marginBottom="mb-2" 
            />
            <p className="text-[11px] font-black text-amber-600/80 uppercase tracking-widest">
              Finalize the team's consensus
            </p>
        </div>
        
        {/* 2. Main Input Area */}
        <div className="flex flex-col items-center justify-center flex-grow relative">
          <div className="absolute w-56 h-56 bg-amber-500/10 rounded-full blur-3xl -z-10"></div>
          
          <div className="w-full px-2 text-center">
            <TextInput
                value={answerInput}
                onChange={setAnswerInput}
                inputtitle="YOUR ANSWER"
                placeholder="What was it?"
                maxLength={20}
                height="py-5"
                variant="secondary"
                textSize="text-2xl"
                uppercase={false}
            />
            
            <p className="mt-4 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
              Confirm before reveal
            </p>
          </div>
        </div>

        {/* 3. Submit Button  */}
        <div className="mt-auto">
          <GameButton 
            variant="secondary" 
            onClick={handleSubmitAnswer} 
            disabled={!answerInput.trim() || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </GameButton>
        </div>
      </div>
    </EmojiBackgroundLayoutNoSSR>
  )
}