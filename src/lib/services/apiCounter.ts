import fs from 'fs'
import path from 'path'

export const COUNTER_FILE = path.join(process.cwd(), 'data', 'metal-api-counter.json')

export interface RequestCounter {
  count: number
  month: number
  year: number
}

export function getRequestCounter(): RequestCounter {
  try {
    if (fs.existsSync(COUNTER_FILE)) {
      const data = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8'))
      const now = new Date()

      // Reset counter if it's a new month
      if (data.month !== now.getMonth() || data.year !== now.getFullYear()) {
        const newCounter = {
          count: 0,
          month: now.getMonth(),
          year: now.getFullYear()
        }
        fs.writeFileSync(COUNTER_FILE, JSON.stringify(newCounter))
        return newCounter
      }

      return data
    }
  } catch (error) {
    console.error('Error reading counter file:', error)
  }

  // Default counter if file doesn't exist or error occurs
  const now = new Date()
  return {
    count: 0,
    month: now.getMonth(),
    year: now.getFullYear()
  }
}
