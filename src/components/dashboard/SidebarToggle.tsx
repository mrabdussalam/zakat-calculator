import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/toast"

interface SidebarToggleProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function SidebarToggle({ isCollapsed, onToggle }: SidebarToggleProps) {
  const handleToggle = () => {
    onToggle();
    
    // Example toast notification
    toast({
      title: isCollapsed ? "Sidebar expanded" : "Sidebar collapsed",
      description: "Your workspace has been adjusted",
      variant: "success",
      duration: 2000
    });
  }
  
  return (
    <div 
      className={cn(
        "absolute -right-3 top-6 z-10",
        "h-6 w-6",
        "flex items-center justify-center",
        "rounded-full border border-gray-200 bg-white shadow-sm",
        "cursor-pointer",
        "transition-transform hover:scale-110",
      )}
      onClick={handleToggle}
    >
      <div className={cn(
        "h-3 w-3 transition-transform duration-300",
        isCollapsed ? "rotate-180" : "rotate-0"
      )}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.5 9L4.5 6L7.5 3" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  )
} 