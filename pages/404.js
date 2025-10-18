import { useEffect } from 'react';
<script src="/js/enhanced-tracking.js"></script>
import { useRouter } from 'next/router';

export default function Custom404() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/producto');
  }, []);
  return null;
}