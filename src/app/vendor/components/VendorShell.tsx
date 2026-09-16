// VendorShell.tsx
"use client";

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User as UserIcon, Loader2, LayoutDashboard, Leaf, LogOut } from 'lucide-react';
import { useVendorAuth } from '../context/VendorAuthContext';

export default function VendorShell({ children }: { children: ReactNode }) {
  const { vendor, token, loading, logout } = useVendorAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Real referral count for the sidebar footer — this used to be a
  // hardcoded "0 active referrals" regardless of the vendor's actual data.
  const [activeReferrals, setActiveReferrals] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch('/api/backend/vendor/dashboard', {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          const referred = data.referred || [];
          setActiveReferrals(referred.filter((r: { status: string }) => r.status !== 'rejected').length);
        }
      } catch (err) {
        console.error('Failed to load referral count:', err);
      }
    })();
  }, [token]);

  const handleLogout = () => {
    logout();
    router.replace('/vendor/login');
  };

  useEffect(() => {
    if (!loading && !vendor) {
      router.replace('/vendor/login');
    }
  }, [loading, vendor, router]);

  if (loading || !vendor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#16281F]">
        <Loader2 className="h-8 w-8 animate-spin text-[#8FB89C]" />
      </div>
    );
  }

  const navItems = [
    { href: '/vendor/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/vendor/profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#16281F] lg:flex">
      {/* Desktop Sidebar — sticky so it stays put while the main content scrolls */}
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:border-r lg:border-[#E4E0D5] lg:bg-white">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <Leaf className="h-5 w-5 text-[#2F6F52]" strokeWidth={2} />
          <span className="font-['Fraunces',_Georgia,_serif] text-lg italic text-[#16281F]">Greezo</span>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 rounded-md py-2.5 pl-4 pr-3 text-sm transition-colors ${
                  active
                    ? 'bg-[#EFF4EF] font-medium text-[#2F6F52]'
                    : 'text-[#5B6660] hover:bg-[#F4F3EE] hover:text-[#16281F]'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-[#2F6F52]" />
                )}
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#E4E0D5] px-6 py-5">
          <p className="text-xs text-[#8A9089]">Referral status</p>
          <p className="mt-0.5 text-sm font-medium text-[#16281F]">
            {activeReferrals === null ? '—' : activeReferrals} active referral{activeReferrals === 1 ? '' : 's'}
          </p>
        </div>

        <div className="border-t border-[#E4E0D5] p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md py-2.5 pl-4 pr-3 text-sm text-[#5B6660] transition-colors hover:bg-[#F4F3EE] hover:text-[#16281F]"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 pb-20 lg:pb-0">{children}</div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-[#E4E0D5] bg-white/95 backdrop-blur-sm lg:hidden">
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
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] text-[#8A9089] transition-colors"
        >
          <LogOut className="h-5 w-5" strokeWidth={1.75} />
          Logout
        </button>
      </nav>
    </div>
  );
}