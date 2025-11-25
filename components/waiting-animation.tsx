type WaitingAnimationProps = {
  variant?: "primary" | "secondary"
}

export function WaitingAnimation({ variant = "primary" }: WaitingAnimationProps) {
  const colorClass = variant === "primary" ? "bg-emerald-500" : "bg-amber-500"
  return (
    <div className="flex gap-2">
      <div className={`w-3 h-3 ${colorClass} rounded-full animate-bounce`}></div>
      <div className={`w-3 h-3 ${colorClass} rounded-full animate-bounce`} style={{ animationDelay: "0.2s" }}></div>
      <div className={`w-3 h-3 ${colorClass} rounded-full animate-bounce`} style={{ animationDelay: "0.4s" }}></div>
    </div>
  )
}
