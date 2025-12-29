"use client"

import React from "react"

{/* Props Interface */}
interface TextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  inputtitle?: string
  maxLength?: number
  height?: string
  variant?: "primary" | "secondary" | "gray"
  mode?: "edit" | "display"
  uppercase?: boolean
  textSize?: string
  marginBottom?: string
  isEmojiInput?: boolean
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      value,
      onChange,
      placeholder = "Enter text",
      inputtitle = "",
      maxLength = 20,
      height = "py-3",
      variant = "primary",
      mode,
      uppercase = true,
      textSize = "text-1g sm:text-5g md:text-1xl lg:text-2xl",
      marginBottom = "mb-6",
      isEmojiInput = false
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = React.useState(false)

    {/* Input Colors Based on Variant */}
    const getDisplayColors = () => {
      switch (variant) {
        case "primary":
          return "bg-emerald-50 border-emerald-500 text-emerald-600"
        case "secondary":
          return "bg-amber-50 border-amber-500 text-amber-600"
        case "gray":
          return "bg-gray-50 border-gray-400/80 text-gray-500"
        default:
          return "bg-emerald-50 border-emerald-500 text-emerald-600"
      }
    }

    {/* Focus Border Colors Based on Variant */}
    const getFocusColors = () => {
      switch (variant) {
        case "primary":
          return "focus:border-emerald-500"
        case "secondary":
          return "focus:border-amber-500"
        case "gray":
          return "focus:border-gray-400/80"
        default:
          return "focus:border-emerald-500"
      }
    }

    const isInputtitleShown = inputtitle && inputtitle.trim() !== ""
    const isDisabled = mode === "display"
    const hasValue = value && value.trim() !== ""
    const shouldShowDisplayColor = hasValue && !isDisabled

    return (
      <div className={`relative ${marginBottom}`}>
        
        {isInputtitleShown && (
          <p 
            className="absolute -top-1.5 left-3 px-1.5 text-[10px] font-black tracking-[0.15em] uppercase z-10 leading-none select-none pointer-events-none"
            style={{
              color: (shouldShowDisplayColor || isFocused || isDisabled)
                ? (variant === "primary" ? "#10b981" : variant === "secondary" ? "#d97706" : "#86898eff")
                : "#9ca3af", 
              
              background: (() => {
                const baseRGB = (shouldShowDisplayColor || isDisabled)
                  ? (variant === "primary" ? "236,253,245" : variant === "secondary" ? "255,251,235" : "249,250,251")
                  : "255, 255, 255"; 
                
                return `linear-gradient(to top, 
                  rgba(${baseRGB}, 1) 0%, 
                  rgba(${baseRGB}, 0.9) 60%, 
                  rgba(255, 255, 255, 0) 100%)`;
              })(),
              paddingBottom: '1px'
            }}
          >
            {inputtitle}
          </p>
        )}

        {isDisabled ? (
          <div className={`px-4 ${height} border-2 rounded-xl ${getDisplayColors()} flex items-center justify-center`}>
            <p className={`${textSize} font-bold ${isEmojiInput ? '' : 'tracking-widest'}`}>{value}</p>
          </div>
        ) : (
          <input
            ref={ref}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={maxLength}
            disabled={isDisabled}
            className={`w-full px-4 ${height} border-2 rounded-xl ${shouldShowDisplayColor ? getDisplayColors() : 'bg-white text-gray-700 border-gray-300'} ${textSize} font-bold ${isEmojiInput ? '' : 'tracking-widest'} text-center placeholder:text-gray-400 focus:outline-none ${getFocusColors()} transition-all caret-gray-700`}
          />
        )}
      </div>
    )
  },
)

TextInput.displayName = "TextInput"