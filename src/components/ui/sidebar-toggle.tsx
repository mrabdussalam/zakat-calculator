import { cn } from "@/lib/utils"
import { ChevronLeft } from "lucide-react"

interface SidebarToggleProps {
  isCollapsed: boolean
  onToggle: () => void
  className?: string
}

export function SidebarToggle({ isCollapsed, onToggle, className }: SidebarToggleProps) {
  return (
    <div className={cn(
      "absolute top-6 z-10",
      isCollapsed ? "left-0 w-[68px] flex justify-center translate-x-1" : "right-3",
      "transition-all duration-200",
      className
    )}>
      <button
        onClick={onToggle}
        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors group"
      >
        <ChevronLeft 
          className={cn(
            "h-4 w-4 text-gray-500 group-hover:text-gray-900 transition-all duration-200",
            isCollapsed ? "rotate-180 group-hover:translate-x-0.5" : "group-hover:-translate-x-0.5"
          )} 
        />
        <span className="sr-only">
          {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        </span>
      </button>
    </div>
  )
} 