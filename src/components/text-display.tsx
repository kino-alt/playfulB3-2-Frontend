"use client"

{/* Props Interface */}
interface TextDisplayProps {
  value: string
  inputtitle?: string
  height?: string
  variant?: "primary" | "secondary" | "gray"
  textSize?: string
  marginBottom?: string
}

export const TextDisplay = ({value,inputtitle = "",height = "py-3",variant = "primary",textSize = "text-1g sm:text-5g md:text-1xl lg:text-2xl",marginBottom = "mb-6"}: TextDisplayProps)=> {
    
    {/*Display Colors Based on Variant */}
    const getDisplayColors = () => {
      switch (variant) {
        case "primary":
          return "from-emerald-500 to-emerald-600 border-emerald-500 text-white"
        case "secondary":
          return "from-amber-500 to-amber-600 border-amber-500 text-white"
        case "gray":
          return "from-gray-300 to-gray-400 border-gray-300 text-gray-600"
        default:
          return "from-emerald-500 to-emerald-600 border-emerald-500 text-white"
      }
    }

    return (
        <div className={marginBottom}>
            <p className="text-xs text-gray-500 font-semibold  mb-2">{inputtitle}</p>
            <div className={`${height} rounded-xl border-2 transition-all duration-300 bg-gradient-to-r ${getDisplayColors()} flex items-center justify-center`}>
            <p className={`${textSize} font-bold tracking-widest`}>{value}</p>
            </div>
        </div>
    )
}

