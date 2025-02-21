export function TableHeader() {
  return (
    <div className="px-4 py-2 bg-gray-50 rounded-t-lg">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">Category</span>
        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
          <span className="w-[140px] text-right">Asset Value</span>
          <span className="w-[140px] text-right">Zakatable Amount</span>
          <span className="w-[100px] text-right">Zakat Due</span>
        </div>
      </div>
    </div>
  )
} 