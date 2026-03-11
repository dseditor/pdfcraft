'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Root page redirects to Traditional Chinese
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/zh-TW');
  }, [router]);

  // Render nothing while redirecting
  return null;
}
