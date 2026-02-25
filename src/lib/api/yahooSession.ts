/**
 * Yahoo Finance session management using crumb-based authentication.
 * This mimics the approach used by the yfinance Python library.
 *
 * Flow:
 *   1. GET https://fc.yahoo.com → extract Set-Cookie header
 *   2. GET https://query2.finance.yahoo.com/v1/test/getcrumb (with cookie) → crumb string
 *   3. Include cookie + crumb in all subsequent Yahoo Finance API requests
 */

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

let cachedSession: {
  cookie: string
  crumb: string
  expiresAt: number
} | null = null

async function initSession(): Promise<{ cookie: string; crumb: string }> {
  // Step 1 – Get session cookies from Yahoo
  const initRes = await fetch('https://fc.yahoo.com', {
    headers: { 'User-Agent': USER_AGENT },
    redirect: 'manual',
    signal: AbortSignal.timeout(5000),
  })

  const setCookie = initRes.headers.get('set-cookie') || ''
  const cookies = setCookie
    .split(',')
    .map((c) => c.split(';')[0].trim())
    .filter(Boolean)
    .join('; ')

  if (!cookies) {
    throw new Error('Failed to obtain Yahoo session cookies')
  }

  // Step 2 – Get crumb using the cookies
  const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: {
      'User-Agent': USER_AGENT,
      Cookie: cookies,
    },
    signal: AbortSignal.timeout(5000),
  })

  if (!crumbRes.ok) {
    throw new Error(`Failed to get Yahoo crumb: ${crumbRes.status}`)
  }

  const crumb = await crumbRes.text()

  if (!crumb || crumb.includes('<')) {
    throw new Error('Invalid crumb response from Yahoo')
  }

  // Cache for 20 minutes
  cachedSession = {
    cookie: cookies,
    crumb,
    expiresAt: Date.now() + 20 * 60 * 1000,
  }

  console.log('Yahoo Finance session established (crumb obtained)')
  return { cookie: cookies, crumb }
}

/** Get a valid Yahoo Finance session, reusing cached session when possible. */
export async function getYahooSession(): Promise<{ cookie: string; crumb: string }> {
  if (cachedSession && Date.now() < cachedSession.expiresAt) {
    return { cookie: cachedSession.cookie, crumb: cachedSession.crumb }
  }
  return initSession()
}

/** Invalidate the cached session (call when a request gets 401/403). */
export function clearYahooSession(): void {
  cachedSession = null
}

/** Shared User-Agent string for Yahoo Finance requests. */
export { USER_AGENT as YAHOO_USER_AGENT }
