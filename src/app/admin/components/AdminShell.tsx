// AdminShell.tsx
"use client";

import { useEffect, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ClipboardList, IndianRupee, Loader2, LogOut, Wallet } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminShell({ children }: { children: ReactNode }) {
  const { admin, loading, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !admin) {
      router.replace('/admin/login');
    }
  }, [loading, admin, router]);

  if (loading || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#16281F]">
        <Loader2 className="h-8 w-8 animate-spin text-[#8FB89C]" />
      </div>
    );
  }

  const navItems = [
    { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
    { href: '/admin/commissions', label: 'Commissions', icon: Wallet },
    { href: '/admin/vendor-earnings', label: 'Earnings', icon: IndianRupee },
  ];

  const handleLogout = () => {
    logout();
    router.replace('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#16281F]">
      <header className="sticky top-0 z-20 border-b border-[#E4E0D5] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Image
                src="/images/greezo-logo.png"
                alt="Greezo"
                width={260}
                height={120}
                className="h-16 w-auto shrink-0 object-contain sm:h-20"
                priority
              />
            </div>

            <nav className="hidden items-center gap-1 sm:flex">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-[#EFF4EF] font-medium text-[#2F6F52]'
                        : 'text-[#5B6660] hover:bg-[#F4F3EE] hover:text-[#16281F]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[#5B6660] sm:inline">{admin.name || admin.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-[#5B6660] transition-colors hover:bg-[#F4F3EE] hover:text-[#16281F]"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile nav row */}
        <nav className="flex items-stretch justify-around border-t border-[#E4E0D5] sm:hidden">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
                  active ? 'text-[#2F6F52]' : 'text-[#8A9089]'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div>{children}</div>
    </div>
  );
}