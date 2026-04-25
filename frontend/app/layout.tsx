import type {Metadata} from 'next';
import { Inter, Space_Grotesk, Rethink_Sans, Lexend } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });
const rethink = Rethink_Sans({ subsets: ['latin'], variable: '--font-heading' });
const lexend = Lexend({ subsets: ['latin'], variable: '--font-body' });

import { ToastProvider } from '@/lib/toast-context';

export const metadata: Metadata = {
  title: 'Petecho | Your Pet. Digitalised. Forever.',
  description: 'Convert your pet into a digital pet. Keep their essence alive with Petecho.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable} ${rethink.variable} ${lexend.variable}`}>
      <body suppressHydrationWarning className="font-sans bg-white text-black antialiased selection:bg-black selection:text-white">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
