import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { EditorProvider } from '@/components/EditorProvider';
import Header from '@/components/Header';
import Chatbot from '@/components/Chatbot';
import EditorToolbar from '@/components/EditorToolbar';
import LoginModal from '@/components/LoginModal';
import MediaUploadModal from '@/components/MediaUploadModal';
import { getData } from '@/lib/data';
import PageTransition from '@/components/PageTransition';
import { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vikas — Motion Designer & VFX Storyteller',
  description: 'A cinematic portfolio for Vikas, a Motion Designer & VFX Storyteller, showcasing projects with a focus on high-end visuals and smooth animations.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const initialSiteContent = await getData();

  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <EditorProvider initialContent={initialSiteContent}>
          <div className="min-h-screen">
            <Header />
            <main className="pl-0 md:pl-20">
              <PageTransition>{children}</PageTransition>
            </main>
            <Chatbot />
            <EditorToolbar />
            <LoginModal />
            <MediaUploadModal />
          </div>
        </EditorProvider>
      </body>
    </html>
  );
}