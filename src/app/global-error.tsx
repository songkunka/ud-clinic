'use client';

import './globals.css';
import { RouteErrorFallback } from '@/components/common/RouteErrorFallback';

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="th">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <title>UD Clinic</title>
        <RouteErrorFallback error={error} retry={retry} />
      </body>
    </html>
  );
}
