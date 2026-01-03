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
  {/* Base and Variant Classes */}
  const baseClass =
    'w-full rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:-translate-y-0.5 border-2'

  {/* Variant Specific Classes */}
  const variantClass = {
    primary: "bg-emerald-50 border-emerald-500 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-emerald-600",
    secondary: "bg-amber-50 border-amber-500 hover:bg-gradient-to-r hover:from-amber-500 hover:to-amber-600",
  }

  {/* Text Color Classes */}
  const textColorClass = {
    primary: "text-emerald-600 group-hover:text-white",
    secondary: "text-amber-600 group-hover:text-white",
  }

  return (
    <button 
      {...props} // 🔴 ここで type="submit" や disabled が適用される
      className={`${height} ${baseClass} ${variantClass[variant]} group ${props.disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      <div
        className={`flex flex-row items-center justify-center gap-2 font-bold uppercase text-sm tracking-wide ${textColorClass[variant]}`}
      >
        {icon && <span>{icon}</span>}
        <span>{children}</span>
      </div>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </button>
  )
}
