"use client"

import type React from "react"

{/* Props Interface */}
interface GameButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: "primary" | "secondary"
  children: React.ReactNode
  subtitle?: string
  icon?: string
  height?:string
}

export function GameButton({ variant, children, subtitle, icon, height="p-4",className, ...props}: GameButtonProps) {
  const baseClass = "w-full inline-flex flex-col items-center justify-center transition-all duration-200 rounded-xl border px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClass = {
    primary: "bg-slate-950 border-slate-900 text-white hover:bg-slate-800 active:scale-[0.97] shadow-lg shadow-slate-200",
    
    // 【参加者側】「参加・反応する」役割。
    // 柔らかい白に近いグレー（slate-50）に、少し太めの枠線。
    // ホストのボタンと並んでも主張しすぎず、かつ「押しやすさ」を感じさせる親切なデザイン。
    secondary: "bg-slate-50 border-slate-300 text-slate-900 hover:bg-white hover:border-slate-400 active:scale-[0.97] shadow-sm"
  };

  return (
    <button
      {...props}
      // `${height}` を以前と同じ位置に入れ、`className` による幅指定（w-fullなど）が効くようにしています
      className={`${baseClass} ${variantClass[variant]} ${height || ""} ${className}`}
    >
      {/* 上段：アイコンとメインテキスト */}
      <div className="flex items-center gap-2">
        {icon && <span className="text-base">{icon}</span>}
        <span className="text-sm font-semibold tracking-normal">
          {children}
        </span>
      </div>

      {/* 下段：サブタイトル（配置は変えず、フォントサイズと不透明度で馴染ませる） */}
      {subtitle && (
        <span className="text-[11px] leading-tight opacity-70 mt-0.5 font-medium">
          {subtitle}
        </span>
      )}
    </button>
  )
}
