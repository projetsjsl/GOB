import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JSLAI RobotWeb Ultimate v5.0 - AI Browser Automation',
  description: 'Professional web automation with AI, multi-provider support, and full customization',
  icons: { icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🤖</text></svg>' }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
