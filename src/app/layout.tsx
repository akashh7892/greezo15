import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from './context/Authcontext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Greezo – Healthy Snacks & Juices',
  description:
    'Greezo provides protein-rich sprouts, egg & non-egg meals, and juices at affordable prices. Try our ₹9 juice trial offer today!',
  keywords: [
    'greezo',
    'healthy snacks',
    'juices',
    'protein food',
    'sprouts',
    'Bangalore food delivery',
  ],
  authors: [{ name: 'Greezo Foods' }],
  openGraph: {
    title: 'Greezo – Healthy Snacks & Juices',
    description: 'Affordable, protein-packed healthy snacks & juices delivered fresh.',
    type: 'website',
    url: 'https://greezo.vercel.app',
    images: ['/images/greezo-logo.png'],
  },
  verification: {
    google: 'aZ_riEywDI1TNSgyIhEQ93MGnsWWCa1dPYwhXCg7_yg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="!scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}