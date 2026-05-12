
'use client'

import {GameButton} from './game-button'
import dynamic from 'next/dynamic'
import { useRouter } from "next/navigation"
import { useEffect } from "react"
//FIX: Add
import { useRoomData } from '@/contexts/room-context';
import { GameState } from "@/contexts/types";
import Image from 'next/image';

const EmojiBackgroundLayoutNoSSR = dynamic(() => import('./emoji-background-layout').then(m => m.EmojiBackgroundLayout), { ssr: false })

export default function TitleScreen() {
  const router = useRouter()
   const { 
    createRoom,
    globalError,
    resetRoom,
  } = useRoomData();
  
  // title-screenに到達したときにroom contextの状態を完全にリセット
  useEffect(() => {
    // WebSocket 接続を切断（サーバー側で参加者から削除される）
    if (typeof window !== 'undefined') {
      const ws = (window as any).gameWs;
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        try {
          // 明示的な退出メッセージ送信
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'CLIENT_DISCONNECTED',
              payload: { reason: 'returning_to_title' }
            }));
          }
          
          // WebSocket を切断（サーバーの onclose で参加者削除が実行される）
          ws.close(1000, 'User returning to title');
        } catch (error) {
          // 切断エラーは無視
        }
      }
    }
    
    // state をリセット（localStorage も一緒にクリア）
    resetRoom();
  }, [resetRoom]);
  
  const handleCreateRoom = async() => {
     try {
      console.log("[v0] Starting game for room:")
      await createRoom();    
      console.log("[Title] Success, navigating to create-room");
      router.push("/create-room");
    } catch (error) {
      console.error("Error starting game:", error)
      alert("Failed to start game")
    }
  }

  const handleJoinRoom = () => {
    router.push("/join-room")
  }

  return (
    <EmojiBackgroundLayoutNoSSR>
        {/* Title Section */}
        <div className="w-full flex justify-center mb-6">
          <Image
            src="/images/絵文字解きロゴ.png"
            alt="絵言葉解き"
            width={480}
            height={120}
            className="object-contain"
            priority
          />
        </div>

        {/* Button Section */}
        <div className="w-full space-y-3">
          {/* Create Room Button */}
          <GameButton variant="primary" onClick={handleCreateRoom} icon="+" subtitle="" height="p-10">
            Create Room
          </GameButton>

          {/* Join Room Button */}
          <GameButton variant="secondary" onClick={handleJoinRoom} icon="→" subtitle="" height="p-10">
            Join Room
          </GameButton>
        </div>

    </EmojiBackgroundLayoutNoSSR>
  )
}
