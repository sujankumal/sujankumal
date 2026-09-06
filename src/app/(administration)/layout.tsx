import '../globals.css';
import { Noto_Serif, Noto_Serif_Devanagari } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import Script from 'next/script';
import { headers } from 'next/headers';
import { auth } from '@/services/auth';
import { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata, getSiteConfig } from '../../lib/seo';
import AdminShell from '@/components/admin/AdminShell';
import GoogleAnalytics from '@/components/GoogleAnalytics';

const noto = Noto_Serif({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-noto-english',
});

const notoNepali = Noto_Serif_Devanagari({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['devanagari'],
  style: ['normal'],
  variable: '--font-noto-nepali',
});

export async function generateMetadata(): Promise<Metadata> {
  return generateSEOMetadata({
    title: "Admin",
    path: "/admin",
  });
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const dynamicConfig = await getSiteConfig();
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html lang="en">
      <GoogleAnalytics />
      {/* Add schema markup */}
      <Script id="schema-markup" type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          "name": dynamicConfig.name,
          "jobTitle": "Software Engineer",
          "url": dynamicConfig.url,
          "sameAs": [
            dynamicConfig.social.twitter,
            dynamicConfig.social.linkedin,
            dynamicConfig.social.github,
          ].filter(Boolean),
          "description": dynamicConfig.description,
        })}
      </Script>
      {/* Cloudflare Turnstile — loaded here with nonce so strict-dynamic trusts it
          and its child scripts (including proof-of-work eval calls). */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        nonce={nonce}
      />
      <body className={`${noto.variable} ${notoNepali.variable} antialiased`}>
        <SessionProvider session={session}>
          <AdminShell session={session}>
            {children}
          </AdminShell>
        </SessionProvider>
      </body>
    </html>
  );
}
