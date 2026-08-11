import type { Metadata } from 'next';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import Sidebar from "@/components/Sidebar";

export const instant = false;

export const metadata: Metadata = {
  title: 'Image Tools | Sujan Kumal | Software Engineer',
  description: 'Compress, crop, rotate, and edit images online with Sujan Kumal’s Image Tools.',
  openGraph: {
    title: 'Image Tools | Sujan Kumal | Software Engineer',
    description: 'Compress, crop, rotate, and edit images online with Sujan Kumal’s Image Tools.',
    type: 'website',
    url: 'https://sujankumal.com.np/imagetools',
    siteName: 'Sujan Kumal',
    images: ['/bird-1024x576-20.png'],
  },
  twitter: {
    card: 'summary',
    title: 'Image Tools | Sujan Kumal | Software Engineer',
    description: 'Compress, crop, rotate, and edit images online with Sujan Kumal’s Image Tools.',
    images: ['/bird-1024x576-20.png'],
    creator: '@sujan_03_',
    site: '@sujan_03_',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const ImageTool = dynamic(() => import('@/components/Tools/ImageTool'));

export default function ToolsPage() {
  return (
    <main className="grid md:grid-cols-4 min-h-screen justify-center">
      <div className="mb-8 p-2 md:m-8 md:col-span-3 inline-flex justify-center">
        <Suspense fallback={<div>Loading tools...</div>}>
          <ImageTool />
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
