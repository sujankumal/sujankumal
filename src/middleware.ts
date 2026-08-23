import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';

/**
 * Builds the Content Security Policy header with a cryptographic per-request nonce.
 */
function buildCspHeader(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';

  const directives = [
    "default-src 'self'",
    // Scripts: allow self, nonced scripts, strict-dynamic, and Google Analytics / Tag Manager.
    // In development mode, 'unsafe-eval' is permitted for Fast Refresh / HMR.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com https://www.google-analytics.com ${isDev ? "'unsafe-eval'" : ""}`,
    // Styles: allow self, inline styles (needed by Tailwind / CSS-in-JS), and Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Images: allow self, blob, data URIs, and configured remote media hosts
    "img-src 'self' blob: data: https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://images.unsplash.com https://drive.google.com https://drive.usercontent.google.com https://sujankumal.com.np https://www.google-analytics.com https://www.googletagmanager.com",
    // Fonts: allow self, Google Fonts, and data URIs
    "font-src 'self' https://fonts.gstatic.com data:",
    // Connect: allow self, Firebase RTDB/Auth endpoints, GA, and WebRTC STUN servers
    "connect-src 'self' https://*.firebaseio.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com stun:stun.l.google.com:19302 stun:stun1.l.google.com:19302 stun:stun2.l.google.com:19302 stun:stun3.l.google.com:19302 stun:stun4.l.google.com:19302",
    // Frames: allow self and Google OAuth accounts
    "frame-src 'self' https://accounts.google.com",
    // Frame Ancestors: prevent site framing (clickjacking defense)
    "frame-ancestors 'none'",
    // Prevent plugins like Flash, Java, Silverlight
    "object-src 'none'",
    // Restrict injected <base> tags to same-origin
    "base-uri 'self'",
    // Restrict form submissions to same-origin
    "form-action 'self'",
    // Block mixed (HTTP) content on HTTPS
    "block-all-mixed-content",
    "upgrade-insecure-requests",
  ];

  return directives.join('; ');
}

export async function middleware(request: NextRequest) {
  // 1. Generate unique, unguessable cryptographic nonce for this request
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = buildCspHeader(nonce);

  // 2. Attach nonce and CSP to request headers so Next.js Server Components can read them
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  // 3. Handle Admin Route Protection
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/admin')) {
    const session = await auth();
    if (!session?.user?.verified) {
      // If not logged in / verified, redirect to homepage or login
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 4. Create response passing the modified request headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 5. Attach Strict CSP and Defense-in-Depth Security Headers to response
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  );
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes (handled independently)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt, browserconfig.xml (metadata files)
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|browserconfig.xml).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
