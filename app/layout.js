import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from './components/Navbar';
import PageTransition from './components/PageTransition';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Psychological Test Form',
  description: 'A modern form for psychological testing responses',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-900">
          <Navbar />
          <Suspense fallback={null}>
            <PageTransition />
          </Suspense>
          <main className="py-6">{children}</main>
          <footer className="bg-gray-800 border-t border-gray-700">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-gray-400">
                &copy; {new Date().getFullYear()} Psychological Testing System. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
