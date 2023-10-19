import Footer from '@/components/Footer'
import './globals.css'
import type { Metadata } from 'next'
import { Inter, Noto_Sans } from 'next/font/google'
import Header from '@/components/Header/Header'

const noto = Noto_Sans({
  weight:['100','200','300','400','500','600','700','800'],
  subsets:['latin']
})

export const metadata: Metadata = {
  title: 'Er. Sujan Kumal | A Software Engineer',
  description: "Welcome to Sujan Kumal's Site. Experienced Software Engineer | Innovative Problem Solver | Passionate About Technology",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={noto.className}>
        <Header/>
        {children}
        <Footer/>
      </body>
    </html>
  )
}
