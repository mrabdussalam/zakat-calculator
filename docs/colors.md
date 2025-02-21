## Color System

### Primary Colors
- `gray-900`: `#111827` - Dark text and primary buttons
- `gray-500`: `#6B7280` - Secondary text and less prominent elements
- `blue-600`: `#2563EB` - Interactive elements and links
- `white`: `#FFFFFF` - Backgrounds and text on dark backgrounds

### Status Colors
- `red-500`: `#EF4444` - Errors, negative amounts, and warnings
- `red-600`: `#DC2626` - Darker red for hover states
- `orange-500`: `#F97316` - Warning states and alerts
- `blue-600/10`: `#2563EB1A` - Light blue with 10% opacity for subtle highlights

### Background Colors
- `bg-white`: `#FFFFFF` - Primary background for cards and containers
- `bg-gray-100`: `#F3F4F6` - Light gray for subtle backgrounds
- `bg-black/5`: `#0000000D` - Very subtle black with 5% opacity
- `bg-blue-600/10`: `#2563EB1A` - Light blue with 10% opacity for interactive elements

### Gray Scale
- `gray-100`: `#F3F4F6`
- `gray-200`: `#E5E7EB`
- `gray-300`: `#D1D5DB`
- `gray-400`: `#9CA3AF`
- `gray-500`: `#6B7280`
- `gray-600`: `#4B5563`
- `gray-700`: `#374151`
- `gray-800`: `#1F2937`
- `gray-900`: `#111827`

### Common Color Combinations
- Primary text: `text-gray-900` (`#111827`)
- Secondary text: `text-gray-500` (`#6B7280`)
- Error text: `text-red-500` (`#EF4444`)
- Links: `text-blue-600` (`#2563EB`)

## Shadow System

### Basic Shadows
- `shadow-xs`: `box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);`
- `shadow-sm`: `box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);`
- `shadow-md`: `box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);`
- `shadow-lg`: `box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);`
- `shadow-xl`: `box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);`

### Common Shadow Use Cases with Properties

#### Card Shadows
```html
<!-- Basic Card -->
<div class="bg-white shadow-xs border border-gray-200 rounded-lg">
<!-- box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); -->

<!-- Elevated Card -->
<div class="bg-white shadow-lg ring-1 ring-gray-900/5 rounded-xl">
<!-- box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); -->
<!-- ring properties: ring-width: 1px; ring-color: rgb(17 24 39 / 0.05); -->

<!-- Interactive Card -->
<div class="bg-white shadow-xs hover:shadow-md transition-shadow">
<!-- Default: box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); -->
<!-- Hover: box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); -->
```

#### Dropdown/Menu Shadows
```html
<!-- Dropdown Menu -->
<div class="bg-white shadow-lg ring-1 ring-gray-900/5">
<!-- box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); -->
<!-- ring properties: ring-width: 1px; ring-color: rgb(17 24 39 / 0.05); -->
```

#### Modal Shadows
```html
<!-- Modal Dialog -->
<dialog class="bg-white shadow-xs border border-alpha-black-25 rounded-2xl">
<!-- box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); -->
<!-- border-color: rgba(0, 0, 0, 0.25); -->
```

#### Button Shadows
```html
<!-- Button with Shadow -->
<button class="shadow-sm hover:shadow-md transition-shadow">
```

### Shadow Combinations
- Cards with borders: `shadow-xs border border-alpha-black-25`
- Elevated elements: `shadow-lg ring-1 ring-gray-900/5`
- Interactive elements: `shadow-xs hover:shadow-md transition-shadow`
- Modals and dropdowns: `shadow-lg`

### Special Shadow Effects
- Inset shadows: `box-shadow: inset 0 -1px 0 0 rgba(0,0,0,0.1);`
- Custom shadows: `box-shadow: 0 2px 4px rgba(0,0,0,0.1);`

### Shadow with Alpha Values
- `ring-gray-900/5`: Ring color with 5% opacity - `rgba(17, 24, 39, 0.05)`
- `border-alpha-black-25`: Border color with 25% opacity - `rgba(0, 0, 0, 0.25)`

### Transition Properties
When using `transition-shadow`:
```css
transition-property: box-shadow;
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
transition-duration: 150ms;
```