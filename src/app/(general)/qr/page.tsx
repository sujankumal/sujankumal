import QR from "@/components/QR/qr";
import { Metadata } from "next";
import { Suspense } from 'react';
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: 'QR | Sujan Kumal | Software Engineer',
  description: "QR generator is a web application that allows users to create QR codes for various purposes, such as sharing links, contact information, and more. It is designed to be user-friendly and efficient, making it easy for anyone to generate QR codes quickly.",
  openGraph: {
    images: ['/bird-1024x576-20.png'],
    type: 'website',
    url: 'https://sujankumal.com.np/',
    siteName: 'Sujan Kumal | Software Engineer',
    title: 'QR | Sujan Kumal | Software Engineer',
    description: "QR generator is a web application that allows users to create QR codes for various purposes, such as sharing links, contact information, and more. It is designed to be user-friendly and efficient, making it easy for anyone to generate QR codes quickly.",
  },
  twitter: {
    card: 'summary',
    creator: '@sujan_03_',
    site: '@sujan_03_',
    images: ['/bird-1024x576-20.png'],
    title: 'QR | Sujan Kumal | Software Engineer',
    description: "QR generator is a web application that allows users to create QR codes for various purposes, such as sharing links, contact information, and more. It is designed to be user-friendly and efficient, making it easy for anyone to generate QR codes quickly.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function Page() {
  return (
    <main className="grid md:grid-cols-4 min-h-screen justify-center">
      <div className="mb-8 p-2 md:m-8 md:col-span-3 inline-flex justify-center">
        <Suspense fallback={<div>Loading tools...</div>}>
          <QR />
        </Suspense>
      </div>
      <aside className="w-full md:col-span-1">
        <div className="h-full px-3 py-4 overflow-y-auto dark:bg-gray-800">
          <Sidebar />
        </div>
      </aside>
    </main>
  );
}