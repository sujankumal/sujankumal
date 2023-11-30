import Footer from '@/components/Footer'
import './globals.css'
import type { Metadata } from 'next'
import { Noto_Sans } from 'next/font/google'
import Header from '@/components/Header/Header'
import Script from 'next/script'
import { GA_TRACKING_ID } from '@/constants/constants'

const noto = Noto_Sans({
  weight:['100','200','300','400','500','600','700','800'],
  subsets:['latin']
})

export const metadata: Metadata = {
  title: 'Er. Sujan Kumal | A Software Engineer',
  description: "Welcome to Sujan Kumal's Site. Experienced Software Engineer | Innovative Problem Solver | Passionate About Technology",
  icons: {
    icon: '/bird-32x32-20.gif',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
      <body className={noto.className}>
        <Header/>
        {children}
        <Footer/>
      </body>
    </html>
  )
}
