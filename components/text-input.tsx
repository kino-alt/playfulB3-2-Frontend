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

    {/*Input Colors Based on Variant */}
    const getDisplayColors = () => {
      switch (variant) {
        case "primary":
          return "bg-emerald-50 border-emerald-500 text-emerald-600"
        case "secondary":
          return "bg-amber-50 border-amber-500 text-amber-600"
        case "gray":
          return "bg-gray-50 border-gray-300 text-gray-400"
        default:
          return "bg-emerald-50 border-emerald-500 text-emerald-600"
      }
    }

    {/*Focus Border Colors Based on Variant */}
    const getFocusColors = () => {
      switch (variant) {
        case "primary":
          return "focus:border-emerald-500"
        case "secondary":
          return "focus:border-amber-500"
        case "gray":
          return "focus:border-gray-300"
        default:
          return "focus:border-emerald-500"
      }
    }

    const isInputtitleShown = inputtitle && inputtitle.trim() !== ""

    {/* Determine if display mode should be shown */}
    const shouldShowDisplay = mode === "display" || (mode === undefined && value.trim() !== "")
    const isDisabled = mode === "display"

    return (
      <div className = {marginBottom}>
        {isInputtitleShown && <p className="text-xs text-gray-500 font-semibold mb-2">{inputtitle}</p>}

        {isDisabled ? (
            <div className={`px-4 ${height} border-2 rounded-xl ${getDisplayColors()} flex items-center justify-center`}>
            <p className={`${textSize} font-bold ${isEmojiInput ? '' : 'tracking-widest'}`}>{value}</p>
          </div>
        ) : (
            <div className="relative w-full">
            {shouldShowDisplay && value.trim() !== "" && (
                <div
                className={`absolute inset-0 px-4 ${height} border-2 rounded-xl ${getDisplayColors()} flex items-center justify-center`}
                >
                <p className={`${textSize} font-bold ${isEmojiInput ? '' : 'tracking-widest'}`}>{value}</p>
                </div>
            )}

            <input
              ref={ref}
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
              maxLength={maxLength}
              disabled={isDisabled}
              className={`relative z-10 w-full px-4 ${height} ${
                shouldShowDisplay && value.trim() ? "bg-transparent text-transparent" : "bg-white text-gray-700"
              } border-2 ${
                shouldShowDisplay && value.trim() ? "border-transparent" : "border-gray-300"
              } rounded-xl ${textSize} font-bold ${isEmojiInput ? '' : 'tracking-widest'} text-center placeholder:text-gray-400 focus:outline-none ${getFocusColors()} transition-all caret-gray-700`}
            />
          </div>
        )}
      </div>
    )
  },
)

TextInput.displayName = "TextInput"
