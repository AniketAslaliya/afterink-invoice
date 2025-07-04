import React, { ReactNode } from 'react';
import './globals.css';
import type { Metadata } from 'next';

// AfterInk brand color: #9B00FF

export const metadata: Metadata = {
  title: 'AfterInk Invoice Portal',
  description: 'A production-ready, brand-polished, enterprise-secure invoicing portal.',
};

export function generateMetadata(): Metadata {
  return metadata;
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 