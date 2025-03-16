import type { Config } from "tailwindcss";
import { fontFamily } from 'tailwindcss/defaultTheme'

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Asset colors
        'asset': {
          cash: '#7C3AED',
          'precious-metals': '#F59E0B',
          stocks: '#3B82F6',
          retirement: '#10B981',
          'real-estate': '#EC4899',
          crypto: '#06B6D4',
          'business-assets': '#10B981',
          'other-financial': '#6366F1',
          'debt-receivable': '#8B5CF6'
        },
        // Our custom colors
        gray: {
          50: "#F7F6F8",    // Background
          100: "#F3F4F6",   // Default borders
          200: "#E5E7EB",   // Hover borders
          300: "#D1D5DB",   // Input borders
          400: "#9CA3AF",   // Secondary icons
          500: "#6B7280",   // Secondary text
          600: "#4B5563",   // Darker text
          700: "#374151",   // Strong text
          800: "#1F2937",   // Very dark text
          900: "#111827",   // Primary text
        },
        // Action/Status colors
        'red': {
          500: '#EF4444', // Errors and warnings
          600: '#DC2626', // Hover states
        },
        'blue': {
          600: '#2563EB', // Primary blue
        },
        'orange': {
          500: '#F97316', // Warnings
        },
        // Add green color scale
        'green': {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        // Add emerald color scale
        'emerald': {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        // Background colors with opacity
        'black-alpha': {
          5: 'rgba(0, 0, 0, 0.05)',
          25: 'rgba(0, 0, 0, 0.25)',
        },
        'blue-alpha': {
          10: 'rgba(37, 99, 235, 0.1)',
        },
      },
      // Typography system
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],     // 12px - Extra small text
        'sm': ['0.875rem', { lineHeight: '1.25rem' }], // 14px - Body text
        'base': ['1rem', { lineHeight: '1.5rem' }],    // 16px - Base text
        'lg': ['1.125rem', { lineHeight: '1.75rem' }], // 18px - Subtitles
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],  // 20px - Important headings
        '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px - Section headers
        '3xl': ['1.75rem', { lineHeight: '2.25rem' }], // 28px - Main page titles
      },
      fontWeight: {
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      letterSpacing: {
        'tight': '-0.02em',
        'normal': '0',
        'wide': '0.02em',
      },
      // Component-specific styles
      boxShadow: {
        'xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'sm': '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0px 1px 3px 0px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md': '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'lg': '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'xl': '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 8px 10px -6px rgba(0, 0, 0, 0.1)',
        '2xl': '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        slideUpAndFade: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '0.4' }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        slideUpAndFade: 'slideUpAndFade 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        pulse: 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      fontFamily: {
        sans: ['var(--font-inter)', ...fontFamily.sans],
        'nb-international': ['var(--font-nb-international)', ...fontFamily.sans],
        'anglecia': ['var(--font-anglecia)', 'serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
