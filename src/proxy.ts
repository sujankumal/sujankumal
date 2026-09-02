import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '../auth.config';
import { getClientIp, globalApiRateLimiter, authRateLimiter } from './lib/rate-limiter';

const { auth } = NextAuth(authConfig);

/**
 * Returns the list of approved origins parsed from environment variables,
 * Vercel deployment URLs, and default domains.
 */
function getAllowedOrigins(): string[] {
  const defaultOrigins = [
    'https://sujankumal.com.np',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  const raw = process.env.ALLOWED_ORIGINS || process.env.ALLOWEDDEVORIGINS || '';
  let envOrigins: string[] = [];

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        envOrigins = parsed;
      }
    } catch {
      envOrigins = raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  // Include Vercel deployment URLs (production & preview branches)
  const vercelUrls = [
    process.env.VERCEL_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.METADATA_BASE_URL,
  ].filter(Boolean) as string[];

  const vercelOrigins = vercelUrls.map((url) =>
    url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
  );

  return Array.from(new Set([...defaultOrigins, ...envOrigins, ...vercelOrigins]));
}

/**
 * Builds the Content Security Policy header with a cryptographic per-request nonce.
 */
function buildCspHeader(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  const allowedOrigins = getAllowedOrigins().join(' ');

  const directives = [
    "default-src 'self'",
    // Scripts: allow self, nonced scripts, strict-dynamic, Cloudflare Turnstile, and Google Analytics / Tag Manager.
    // In development mode, 'unsafe-eval' is permitted for Fast Refresh / HMR.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com ${isDev ? "'unsafe-eval'" : ""}`,
    // Styles: allow self, inline styles (needed by Tailwind / CSS-in-JS), and Google Fonts
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Images: allow self, blob, data URIs, and configured remote media hosts
    `img-src 'self' blob: data: https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://images.unsplash.com https://drive.google.com https://drive.usercontent.google.com https://sujankumal.com.np https://www.google-analytics.com https://www.googletagmanager.com ${allowedOrigins}`,
    // Fonts: allow self, Google Fonts, and data URIs
    "font-src 'self' https://fonts.gstatic.com data:",
    // Connect: allow self, Cloudflare Turnstile, Firebase RTDB/Auth endpoints, GA, WebRTC STUN servers, and allowed origins
    `connect-src 'self' https://challenges.cloudflare.com https://*.firebaseio.com wss://*.firebaseio.com https://firebase.googleapis.com https://firebaseinstallations.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com ${allowedOrigins}`,
    // Frames: allow self, Cloudflare Turnstile, and Google OAuth accounts
    "frame-src 'self' https://challenges.cloudflare.com https://accounts.google.com",
    // Frame Ancestors: Anti-Clickjacking - prohibit all embedding in iframes
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

/**
 * Attaches standard clickjacking, MIME, transport, and privacy security headers to any response.
 */
function applyStandardSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
}

export default auth(async function proxy(request) {
  const origin = request.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();
  const isAllowedOrigin = origin ? allowedOrigins.includes(origin) : false;
  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith('/api');
  const clientIp = getClientIp(request.headers);

  // ── 0. Rate Limiting Check ────────────────────────────────────────────────
  const isAuthRoute =
    pathname.startsWith('/api/auth') ||
    pathname === '/log-in' ||
    pathname === '/sign-up';

  if (isAuthRoute) {
    const rateLimit = authRateLimiter.check(`auth:${clientIp}`);
    if (!rateLimit.success) {
      const response = new NextResponse(
        JSON.stringify({
          error: 'Too many authentication attempts. Please try again later.',
          retryAfter: rateLimit.retryAfterSeconds,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.retryAfterSeconds ?? 60),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
      applyStandardSecurityHeaders(response);
      return response;
    }
  } else if (isApiRoute) {
    const rateLimit = globalApiRateLimiter.check(`api:${clientIp}`);
    if (!rateLimit.success) {
      const response = new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded. Please slow down your requests.',
          retryAfter: rateLimit.retryAfterSeconds,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.retryAfterSeconds ?? 60),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
      applyStandardSecurityHeaders(response);
      return response;
    }
  }

  // ── 1. Handle CORS Preflight (OPTIONS) Requests for API Routes ───────────
  if (request.method === 'OPTIONS' && isApiRoute) {
    if (isAllowedOrigin && origin) {
      const preflight = new NextResponse(null, { status: 204 });
      preflight.headers.set('Access-Control-Allow-Origin', origin);
      preflight.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      preflight.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-nonce');
      preflight.headers.set('Access-Control-Max-Age', '86400');
      applyStandardSecurityHeaders(preflight);
      return preflight;
    }
    const forbiddenPreflight = new NextResponse(null, { status: 403 });
    applyStandardSecurityHeaders(forbiddenPreflight);
    return forbiddenPreflight;
  }

  // ── 2. Handle Admin Page Route Protection ────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const session = request.auth;
    if (!session?.user?.verified) {
      const redirectResponse = NextResponse.redirect(new URL('/', request.url));
      applyStandardSecurityHeaders(redirectResponse);
      return redirectResponse;
    }
  }

  // ── 3. Generate Strict CSP Nonce for HTML Pages ──────────────────────────
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = buildCspHeader(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // ── 4. Apply CORS Headers (Only if Origin is Allowlisted) ────────────────
  if (origin && isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }

  // ── 5. Attach Anti-Clickjacking & Security Headers to All Responses ──────
  applyStandardSecurityHeaders(response);

  if (!isApiRoute) {
    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), browsing-topics=()'
    );
  }

  return response;
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt, browserconfig.xml (metadata files)
     */
    {
      source: '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|browserconfig.xml).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
