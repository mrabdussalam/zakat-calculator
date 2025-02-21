import { Button } from "@/components/ui/button"

export default function TestPage() {
  return (
    <div className="p-8 space-y-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-medium">Button Variants</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Default Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="link">Link Button</Button>
          <Button variant="destructive">Destructive Button</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-medium">Button Sizes</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="sm">Small Button</Button>
          <Button size="default">Default Button</Button>
          <Button size="lg">Large Button</Button>
          <Button size="icon">🔍</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-medium">Button States</h2>
        <div className="flex flex-wrap gap-4">
          <Button disabled>Disabled Button</Button>
          <Button variant="secondary" disabled>Disabled Secondary</Button>
          <Button variant="outline" disabled>Disabled Outline</Button>
        </div>
      </div>
    </div>
  )
} 