"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
  content: React.ReactNode
}

interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  tabs?: Tab[]
  defaultTab?: string
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn("relative flex w-full border-b border-gray-200", className)} {...props} />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex-1 inline-flex items-center justify-center whitespace-nowrap px-3 py-2.5 text-sm font-medium",
      "text-gray-600 hover:text-gray-900",
      "hover:bg-gray-50",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-opacity-50",
      "data-[state=active]:text-gray-900 data-[state=active]:hover:bg-transparent",
      "transition-colors duration-150",
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => <TabsPrimitive.Content ref={ref} className={cn("mt-4", className)} {...props} />)
TabsContent.displayName = TabsPrimitive.Content.displayName

const TabsComponent = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Root>, TabsProps>(
  ({ tabs, defaultTab, className, children, ...props }, ref) => {
    const [activeTab, setActiveTab] = React.useState(defaultTab || (tabs && tabs[0].id))
    const [indicatorWidth, setIndicatorWidth] = React.useState(0)
    const [indicatorOffset, setIndicatorOffset] = React.useState(0)

    const tabRefs = React.useRef<{ [key: string]: HTMLButtonElement | null }>({})

    React.useEffect(() => {
      const activeTabElement = tabRefs.current[activeTab as string]
      if (activeTabElement) {
        setIndicatorWidth(activeTabElement.offsetWidth)
        setIndicatorOffset(activeTabElement.offsetLeft)
      }
    }, [activeTab])

    const handleTabChange = (value: string) => {
      setActiveTab(value)
    }

    // If tabs prop is provided, use structured layout
    if (tabs) {
      return (
        <TabsPrimitive.Root
          ref={ref}
          defaultValue={defaultTab || tabs[0].id}
          className={className}
          onValueChange={handleTabChange}
          {...props}
        >
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} ref={(el) => {
                tabRefs.current[tab.id] = el
                return undefined
              }}>
                {tab.label}
              </TabsTrigger>
            ))}
            <motion.div
              className="absolute bottom-0 h-0.5 bg-gray-900 z-10"
              initial={false}
              animate={{
                width: indicatorWidth,
                x: indicatorOffset,
              }}
              transition={{
                type: "tween",
                ease: "easeInOut",
                duration: 0.15,
              }}
            />
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {tab.content}
            </TabsContent>
          ))}
        </TabsPrimitive.Root>
      )
    }

    // Otherwise, use unstructured layout (direct children)
    return (
      <TabsPrimitive.Root
        ref={ref}
        defaultValue={defaultTab}
        className={className}
        onValueChange={handleTabChange}
        {...props}
      >
        {children}
      </TabsPrimitive.Root>
    )
  },
)
TabsComponent.displayName = "Tabs"

export { TabsComponent as Tabs, TabsList, TabsTrigger, TabsContent }
export type { TabsProps }

