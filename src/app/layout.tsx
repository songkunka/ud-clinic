import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UD Clinic — Post-Operative Face-Lift Monitoring',
  description:
    'ระบบติดตามอาการและการฟื้นตัวหลังการผ่าตัดดึงหน้า (Face-Lift) มาตรฐานความปลอดภัย UD Clinic',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-100 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
