import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from './components/Navbar';
import AuthProvider from './components/AuthProvider';
import PageTransition from './components/PageTransition';
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'InkSight - Professional Rorschach Testing Platform',
  description: 'Streamline Rorschach scoring with our secure, HIPAA-compliant platform. Automate complex Exner scoring and generate comprehensive psychological reports instantly.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-primary-bg">
          <AuthProvider>
            <Navbar />
            <Suspense fallback={null}>
              <PageTransition />
            </Suspense>
            <main className="py-6">{children}</main>
          </AuthProvider>
          
          {/* Professional Footer */}
          <footer className="bg-secondary-bg border-t border-accent-border">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Company Info */}
                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-2xl font-bold text-primary-text mb-4">InkSight</h3>
                  <p className="text-secondary-text mb-4 max-w-md">
                    Professional psychological testing platform designed for mental health professionals. 
                    Streamline your practice with automated Rorschach scoring and comprehensive reporting.
                  </p>
                  <div className="flex space-x-4">
                    <a href="#" className="text-secondary-text hover:text-primary-text transition-colors">
                      <span className="sr-only">LinkedIn</span>
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                    <a href="#" className="text-secondary-text hover:text-primary-text transition-colors">
                      <span className="sr-only">Twitter</span>
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Navigation */}
                <div>
                  <h4 className="text-lg font-semibold text-primary-text mb-4">Navigation</h4>
                  <ul className="space-y-2">
                    <li><a href="/" className="text-secondary-text hover:text-primary-text transition-colors">Home</a></li>
                    <li><a href="/form" className="text-secondary-text hover:text-primary-text transition-colors">New Test</a></li>
                    <li><a href="/patients" className="text-secondary-text hover:text-primary-text transition-colors">Patients</a></li>
                    <li><a href="#" className="text-secondary-text hover:text-primary-text transition-colors">About Us</a></li>
                    <li><a href="#" className="text-secondary-text hover:text-primary-text transition-colors">Contact</a></li>
                  </ul>
                </div>

                {/* Legal & Contact */}
                <div>
                  <h4 className="text-lg font-semibold text-primary-text mb-4">Legal & Contact</h4>
                  <ul className="space-y-2">
                    <li><a href="#" className="text-secondary-text hover:text-primary-text transition-colors">Privacy Policy</a></li>
                    <li><a href="#" className="text-secondary-text hover:text-primary-text transition-colors">Terms of Service</a></li>
                    <li><a href="#" className="text-secondary-text hover:text-primary-text transition-colors">HIPAA Compliance</a></li>
                    <li className="text-secondary-text">support@inksight.com</li>
                  </ul>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="border-t border-accent-border mt-8 pt-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <p className="text-secondary-text text-sm">
                    © 2025 InkSight. All rights reserved.
                  </p>
                  <div className="flex space-x-6 mt-4 md:mt-0">
                    <span className="text-secondary-text text-sm">HIPAA Compliant</span>
                    <span className="text-secondary-text text-sm">SSL Encrypted</span>
                    <span className="text-secondary-text text-sm">ISO 27001</span>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
