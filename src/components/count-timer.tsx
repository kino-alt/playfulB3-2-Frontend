"use client"

import { TextInput } from "./text-input"

interface CountTimerProps {
  timervalue: number | string | null
  height?: string // 高さを指定するプロパティを追加
}

/**
 * 秒数を MM:SS 形式に変換
 */
function secondsToTimeFormat(seconds: number | string | null): string {
  if (seconds === null || seconds === undefined) return "05:00"

  // If backend already sends "MM:SS", just use it
  if (typeof seconds === 'string' && seconds.includes(':')) {
    return seconds
  }

  const totalSeconds = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds
  if (isNaN(totalSeconds)) return "05:00"
  
  const minutes = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function CountTimer({ timervalue, height = "py-8" }: CountTimerProps) {
    const displayValue = secondsToTimeFormat(timervalue)
    
    return (
    <>
      {/* Timer Display */}
      <TextInput
        value={displayValue}
        onChange={() => {}}
        inputtitle=""
        placeholder=""
        height={height} // 受け取ったheightをTextInputに渡す
        variant="gray"
        mode="display"
        textSize="text-4xl"
      />
    </>
  );
};