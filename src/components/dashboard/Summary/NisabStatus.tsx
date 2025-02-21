import { cn } from "@/lib/utils"

interface NisabStatusProps {
  nisabStatus: {
    meetsNisab: boolean
  }
}

export function NisabStatus({ nisabStatus }: NisabStatusProps) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <div className="flex items-center gap-2">
        <div className={cn(
          "h-2 w-2 rounded-full",
          nisabStatus.meetsNisab ? "bg-green-500" : "bg-gray-300"
        )} />
        <div className="font-medium text-gray-900">
          {nisabStatus.meetsNisab ? "Meets Nisab" : "Below Nisab"}
        </div>
      </div>
    </div>
  )
} 