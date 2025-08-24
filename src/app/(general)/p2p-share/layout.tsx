import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'P2P File Share | Sujan Kumal',
  description: 'Secure peer-to-peer file sharing application with real-time communication. Share files directly between devices without server storage.',
  keywords: ['file sharing', 'peer-to-peer', 'P2P', 'secure transfer', 'real-time', 'WebRTC'],
  openGraph: {
    title: 'P2P File Share | Sujan Kumal',
    description: 'Secure peer-to-peer file sharing application with real-time communication',
    type: 'website',
    images: ['/bird-1024x576-20.gif'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'P2P File Share | Sujan Kumal',
    description: 'Secure peer-to-peer file sharing application with real-time communication',
    images: ['/bird-1024x576-20.gif'],
  },
};

export default function P2PShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
