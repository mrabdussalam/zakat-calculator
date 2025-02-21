'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

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
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "flex w-full border-b border-gray-200",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex-1 inline-flex items-center justify-center whitespace-nowrap px-3 py-2.5 text-sm font-medium text-gray-500",
      "border-b-2 border-transparent -mb-px",
      "hover:text-gray-700 hover:border-gray-300",
      "focus:outline-none focus:text-gray-700 focus:border-gray-300",
      "data-[state=active]:border-gray-900 data-[state=active]:text-gray-900",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

const TabsComponent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ tabs, defaultTab, className, children, ...props }, ref) => {
  // If tabs prop is provided, use structured layout
  if (tabs) {
    return (
      <TabsPrimitive.Root 
        ref={ref}
        defaultValue={defaultTab || tabs[0].id} 
        className={className}
        {...props}
      >
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
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
      {...props}
    >
      {children}
    </TabsPrimitive.Root>
  )
})
TabsComponent.displayName = "Tabs"

export {
  TabsComponent as Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
}
export type { TabsProps }