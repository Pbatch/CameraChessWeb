import type { LucideIcon } from "lucide-react";

// Sized in em, as the icon font it replaced was, so it follows the text size it's given.
// Filled for solid shapes, such as play and stop.
const Icon = ({ icon: Svg, filled = false, className = "text-2xl" }: {
  icon: LucideIcon, filled?: boolean, className?: string
}) => {
  return (
    <Svg className={`inline-block size-[1em] align-[-0.125em]${filled ? " fill-current" : ""} ${className}`.trim()}
      aria-hidden="true" />
  )
}

export default Icon;
