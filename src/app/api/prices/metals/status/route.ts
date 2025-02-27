import { NextResponse } from 'next/server'
import { getRequestCounter } from '../route'

export async function GET() {
  const counter = getRequestCounter()
  
  return NextResponse.json({
    requests: {
      used: counter.count,
      remaining: 80 - counter.count,
      limit: 80
    },
    period: {
      month: counter.month + 1, // 0-based to 1-based
      year: counter.year
    },
    resetsAt: new Date(counter.year, counter.month + 1, 1).toISOString()
  })
} 