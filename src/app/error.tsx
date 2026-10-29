'use client';

import { RouteErrorFallback } from '@/components/common/RouteErrorFallback';

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <RouteErrorFallback error={error} retry={retry} />;
}
