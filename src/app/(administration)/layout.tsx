import '../globals.css'
import { Noto_Sans } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import Script from 'next/script'
import { GA_TRACKING_ID } from '@/constants/constants'
import { auth } from '@/services/auth'

const noto = Noto_Sans({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  subsets: ['latin', 'devanagari']
})

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  const session = await auth();
  console.log("Admin layout",session);
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
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
