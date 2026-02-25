// Canonical environment detection for Replit

// Server-side detection (for API routes)
export const IS_REPLIT_SERVER = typeof process !== 'undefined' &&
  (process.env.REPL_SLUG !== undefined || process.env.REPLIT_DB_URL !== undefined)

// Client-side detection (for browser code)
export const IS_REPLIT_CLIENT = typeof window !== 'undefined' &&
  (window.location.hostname.includes('replit') || window.location.hostname.endsWith('.repl.co'))

// Universal detection — picks the right check based on context
export const IS_REPLIT = typeof window !== 'undefined' ? IS_REPLIT_CLIENT : IS_REPLIT_SERVER
