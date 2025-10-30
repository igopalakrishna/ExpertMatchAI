import './globals.css';
import React from 'react';
import { Providers } from './providers';

export const metadata = {
  title: 'DaidaEx',
  description: 'AI-driven expert matching for construction'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <Providers>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
        </Providers>
      </body>
    </html>
  );
}

