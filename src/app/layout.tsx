import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import AuthModal from '@/components/AuthModal';
import ChatbotWidget from '@/components/ChatbotWidget';

export const metadata: Metadata = {
  title: 'PRIZM Salon — Multicolour Cuts, Colour & Studio Rituals',
  description: 'Architectural cuts, prism colour and studio rituals under a ceiling of neon. Book a slot and pay online in seconds.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-zinc-100 antialiased selection:bg-neon-cyan selection:text-black">
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <AuthModal />
            <ChatbotWidget />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
