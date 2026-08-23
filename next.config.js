/** @type {import('next').NextConfig} */

function getAllowedOrigins() {
    const raw = process.env.ALLOWED_ORIGINS || process.env.ALLOWEDDEVORIGINS || '';
    let origins = [];

    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                origins = parsed;
            }
        } catch {
            origins = raw.split(',').map((s) => s.trim()).filter(Boolean);
        }
    }

    // Auto-include Vercel deployment URLs if present
    const vercelUrls = [
        process.env.VERCEL_URL,
        process.env.NEXT_PUBLIC_VERCEL_URL,
        process.env.VERCEL_BRANCH_URL,
        process.env.VERCEL_PROJECT_PRODUCTION_URL,
        process.env.METADATA_BASE_URL,
    ].filter(Boolean);

    const vercelOrigins = vercelUrls.map((url) => url.replace(/^https?:\/\//, ''));

    return Array.from(new Set([...origins, ...vercelOrigins]));
}

const nextConfig = {
    reactStrictMode: true,
    cacheComponents: true,
    allowedDevOrigins: getAllowedOrigins(),
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'drive.google.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'sujankumal.com.np',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'drive.usercontent.google.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains; preload',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
