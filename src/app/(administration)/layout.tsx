import '../globals.css'
import { Noto_Sans } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import Script from 'next/script'
import { GA_TRACKING_ID, METADATA_BASE_URL } from '@/constants/constants'
import { auth } from '@/services/auth'
import { Metadata } from 'next'

const noto = Noto_Sans({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  subsets: ['latin', 'devanagari']
})

export const metadata: Metadata = {
  title: 'Sujan Kumal | A Software Engineer',
  description: "Welcome to Sujan Kumal's Site. Experienced Software Engineer | Innovative Problem Solver | Passionate About Technology",
  metadataBase: new URL(METADATA_BASE_URL),
  robots: {
    index: true,
    follow: true,
  },
  openGraph:{
    images:['/bird-1024x576-20.gif'],
    type:'website',
    url:'https://sujankumal.com.np/',
    siteName:'Sujan Kumal | A Software Engineer',
    title:'Sujan Kumal | A Software Engineer',
    description:"Welcome to Sujan Kumal's Site. Experienced Software Engineer | Innovative Problem Solver | Passionate About Technology",
  },
  twitter:{
    card:'summary_large_image',
    creator:'@sujan_03_',
    site:'@sujan_03_',
    images:['/bird-1024x576-20.gif'],
    title:'Sujan Kumal | A Software Engineer',
    description:"Welcome to Sujan Kumal's Site. Experienced Software Engineer | Innovative Problem Solver | Passionate About Technology",
  },
  icons: {
    icon: '/bird-32x32-20.gif',
  },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  const session = await auth();
  
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
          "name": "Sujan Kumal",
          "jobTitle": "Software Engineer",
          "url": "https://sujankumal.com.np/",
          "sameAs": [
            "https://twitter.com/sujan_03_",
            "https://www.linkedin.com/in/sujankumal/"
          ],
          "description": "Experienced Software Engineer | Innovative Problem Solver | Passionate About Technology"
        })}
      </Script>
      <body className={noto.className}>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
