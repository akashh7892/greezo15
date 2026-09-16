"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAdminAuth } from './context/AdminAuthContext';

export default function AdminIndexPage() {
  const { admin, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(admin ? '/admin/orders' : '/admin/login');
  }, [loading, admin, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-emerald-950">
      <Loader2 className="h-8 w-8 animate-spin text-white" />
    </div>
  );
}
