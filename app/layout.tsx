import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ExchangeDeal AI',
  description: 'AI-powered phone price comparison',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
