// app/layout.js
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata = {
  title: 'Traject',
  description: 'Track your project. Honestly.',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#C4643A',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}