import '../globals.css'
import { Noto_Serif, Noto_Serif_Devanagari } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import Script from 'next/script'
import { GA_TRACKING_ID, METADATA_BASE_URL } from '@/constants/constants'
import { auth } from '@/services/auth'
import { Metadata } from 'next'
import { getSiteConfig } from '../../lib/seo'
import AdminShell from '@/components/admin/AdminShell'


const noto = Noto_Serif({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-noto-english',
})

const notoNepali = Noto_Serif_Devanagari({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['devanagari'],
  style: ['normal'],
  variable: '--font-noto-nepali',
})

export async function generateMetadata(): Promise<Metadata> {
  const dynamicConfig = await getSiteConfig();
  const title = `Admin | ${dynamicConfig.name} | Software Engineer`;
  const description = dynamicConfig.description;
  const siteUrl = dynamicConfig.url;

  return {
    title,
    description,
    metadataBase: new URL(METADATA_BASE_URL || siteUrl),
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      images: ['/bird-1024x576-20.png'],
      type: 'website',
      url: siteUrl,
      siteName: title,
      title,
      description,
    },
    twitter: {
      card: 'summary',
      creator: dynamicConfig.social.twitter,
      site: dynamicConfig.social.twitter,
      images: ['/bird-1024x576-20.png'],
      title,
      description,
    },
    icons: {
      icon: '/bird-32x32-20.gif',
    },
  };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  const session = await auth();
  const dynamicConfig = await getSiteConfig();

  return (
    <html lang="en">
      {/* <!-- Google tag (gtag.js) --> */}
      <Script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}></Script>
      <Script id='gtag-script'>
        {`window.dataLayer = window.dataLayer || [];
        function gtag(){window.dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', '${GA_TRACKING_ID}');`}
      </Script>
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
            dynamicConfig.social.github
          ].filter(Boolean),
          "description": dynamicConfig.description
        })}
      </Script>
      <body className={`${noto.variable} ${notoNepali.variable} antialiased`}>
        <SessionProvider session={session}>
          <AdminShell session={session}>
            {children}
          </AdminShell>
        </SessionProvider>
      </body>
    </html>
  )
}
