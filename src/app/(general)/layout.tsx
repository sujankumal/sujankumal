import Footer from '@/components/Footer'
import '../globals.css'
import type { Metadata } from 'next'
import { Noto_Serif, Noto_Serif_Devanagari } from 'next/font/google'
import Header from '@/components/Header/Header'
import Script from 'next/script'
import { GA_TRACKING_ID } from '@/constants/constants'
import FAB from '@/components/FAB'
import { generateMetadataAsync as generateSEOMetadata, getSiteConfig } from '../../lib/seo'
import { WebSiteJsonLd, PersonJsonLd } from '../../components/seo/JsonLd'
import PageLoader from '@/components/PageLoader'

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
  return generateSEOMetadata({
    title: "Software Engineer",
    description: "Welcome to my site. Experienced Software Engineer | Innovative Problem Solver | Passionate About Technology",
    path: "/",
  });
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const dynamicConfig = await getSiteConfig();
  return (
    <html lang="en">
      <head>
        {/* Favicon and App Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/bird-32x32-20.gif" sizes="32x32" type="image/gif" />
        <link rel="apple-touch-icon" href="/bird-100x100-20.gif" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#ea580c" />
        <meta name="msapplication-TileColor" content="#ea580c" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* PWA Meta Tags */}
        <meta name="application-name" content={dynamicConfig.name} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={dynamicConfig.name} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>

      {/* <!-- Google tag (gtag.js) --> */}
      <Script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}></Script>
      <Script id='gtag-script'>
        {`window.dataLayer = window.dataLayer || [];
        function gtag(){window.dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', '${GA_TRACKING_ID}');`}
      </Script>
      {/* Structured Data */}
      <WebSiteJsonLd
        name={dynamicConfig.name}
        url={dynamicConfig.url}
        description={dynamicConfig.description}
        searchUrl={`${dynamicConfig.url}/search?q={search_term_string}`}
      />
      <PersonJsonLd
        name={dynamicConfig.name}
        url={dynamicConfig.url}
        jobTitle="Software Engineer"
        sameAs={[
          dynamicConfig.social.linkedin,
          dynamicConfig.social.github,
          dynamicConfig.social.twitter
        ].filter(Boolean)}
      />
      <body className={`${noto.variable} ${notoNepali.variable} antialiased`}>
        <Header />
        <PageLoader />
        {children}
        <Footer />
        <FAB />
      </body>
    </html >
  )
}
