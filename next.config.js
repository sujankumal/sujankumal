/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        const headers = [];
        if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
            headers.push({
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Robots-Tag',
                        value: 'index, follow',
                    },
                ],
            });
        }
        return headers;
    },
};

module.exports = nextConfig;
