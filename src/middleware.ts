import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware ensures all requests use HTTPS
export function middleware(request: NextRequest) {
    // Check if the request is already using HTTPS
    const requestHeaders = new Headers(request.headers)
    const protocol = requestHeaders.get('x-forwarded-proto') || 'http'

    // Skip for localhost development
    if (request.nextUrl.hostname === 'localhost') {
        return NextResponse.next()
    }

    // If not HTTPS, redirect to HTTPS
    if (protocol !== 'https') {
        // Create the HTTPS URL
        const secureUrl = request.nextUrl.clone()
        secureUrl.protocol = 'https:'

        // Return a redirect response
        return NextResponse.redirect(secureUrl, 301)
    }

    return NextResponse.next()
}

// Only run this middleware on specific paths
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
} 