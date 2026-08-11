/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        useCache: true,
    },
    allowedDevOrigins: (() => {
        try {
            return JSON.parse(process.env.ALLOWEDDEVORIGINS || '[]');
        } catch {
            return [];
        }
    })(),
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
            }
            // Add more domains as needed
        ],
    },
};

module.exports = nextConfig;
