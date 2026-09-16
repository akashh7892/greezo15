// VendorDashboardPage.tsx
"use client";

import { useCallback, useEffect, useState } from 'react';
import {
  Bell,
  Copy,
  Leaf,
  Loader2,
  Share2,
  TrendingUp,
  Users,
} from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  VendorAuthProvider,
  useVendorAuth,
} from './context/VendorAuthContext';
import VendorShell from './components/VendorShell';

type ReferredCustomer = {
  id: string;
  customerName: string;
  referralCode?: string;
  plan: string;
  planType: 'trial' | 'weekly' | 'monthly' | 'other';
  commission: number;
  status: 'Paid' | 'Pending';
  createdAt: string;
};

type DashboardData = {
  totalEarnings: number;
  summary: {
    trial: { count: number; earnings: number };
    weekly: { count: number; earnings: number };
    monthly: { count: number; earnings: number };
  };
  referred: ReferredCustomer[];
};

const VISIBLE_REFERRALS = 4;

export default function VendorDashboardPage() {
  return (
    <VendorAuthProvider>
      <VendorShell>
        <DashboardContent />
      </VendorShell>
    </VendorAuthProvider>
  );
}

function Stat({
  label,
  amount,
  sub,
  loading,
  emphasize,
}: {
  label: string;
  amount: number;
  sub?: string;
  loading: boolean;
  emphasize?: boolean;
}) {
  return (
    <div className="flex-1 px-5 py-4 first:pl-0 last:pr-0">
      <p className="text-xs text-[#8A9089]">{label}</p>
      {loading ? (
        <Skeleton className="mt-1.5 h-6 w-16" />
      ) : (
        <p className={`mt-0.5 text-xl font-semibold ${emphasize ? 'text-[#2F6F52]' : 'text-[#16281F]'}`}>
          ₹{amount.toLocaleString('en-IN')}
        </p>
      )}
      {sub && <p className="mt-0.5 text-xs text-[#8A9089]">{sub}</p>}
    </div>
  );
}

function DashboardContent() {
  const { vendor, token } = useVendorAuth();
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/backend/vendor/dashboard', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });

      const raw = await res.text();
      let json: any;
      try {
        json = JSON.parse(raw);
      } catch {
        console.error('Non-JSON response from dashboard API:', raw.slice(0, 300));
        toast({
          title: 'Server error',
          description: 'The dashboard service returned an unexpected response.',
          variant: 'destructive',
        });
        setData(null);
        return;
      }

      if (res.ok && json.success) {
        setData(json);
      } else {
        toast({ title: json.error || 'Failed to load dashboard', variant: 'destructive' });
        setData(null);
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Could not reach the server', variant: 'destructive' });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const copyReferralCode = () => {
    if (!vendor) return;
    navigator.clipboard.writeText(vendor.referralCode);
    toast({ title: 'Copied', description: 'Referral code copied to clipboard.' });
  };

  const visibleReferrals = data
    ? showAll
      ? data.referred
      : data.referred.slice(0, VISIBLE_REFERRALS)
    : [];

  return (
    <div className="min-h-screen bg-[#FAF9F5]">
      {/* Header */}
      <div className="bg-[#16281F] px-6 pb-8 pt-7 lg:px-10 lg:pt-9">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Leaf className="h-5 w-5 text-[#8FB89C]" />
              <div>
                <h1 className="font-['Fraunces',_Georgia,_serif] text-2xl italic text-white">Greezo</h1>
                <p className="text-xs text-[#8FB89C]">where taste meets health</p>
              </div>
            </div>
            <button
              onClick={fetchDashboard}
              className="rounded-full p-2 text-[#8FB89C] transition hover:bg-white/10"
              aria-label="Refresh dashboard"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bell className="h-5 w-5" />}
            </button>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2F6F52] text-base font-semibold text-white">
              {vendor?.name?.[0]?.toUpperCase() || 'V'}
            </div>
            <div className="min-w-[140px] flex-1">
              <p className="text-xs text-[#8FB89C]">Welcome back</p>
              <p className="text-base font-medium text-white">{vendor?.name}</p>
            </div>
            <button
              onClick={copyReferralCode}
              className="flex items-center gap-2 rounded-md border border-white/15 px-3 py-1.5 text-xs text-[#D9E7DC] transition hover:bg-white/5"
            >
              {vendor?.referralCode}
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 lg:px-10 lg:pb-12">
        {/* Stats row */}
        <div className="flex flex-wrap divide-x divide-[#E4E0D5] rounded-lg border border-[#E4E0D5] bg-white px-5">
          <Stat label="Total earnings" amount={data?.totalEarnings ?? 0} loading={loading} emphasize />
          <Stat
            label="Trial"
            amount={data?.summary.trial.earnings ?? 0}
            sub={`${data?.summary.trial.count ?? 0} orders`}
            loading={loading}
          />
          <Stat
            label="Weekly"
            amount={data?.summary.weekly.earnings ?? 0}
            sub={`${data?.summary.weekly.count ?? 0} orders`}
            loading={loading}
          />
          <Stat
            label="Monthly"
            amount={data?.summary.monthly.earnings ?? 0}
            sub={`${data?.summary.monthly.count ?? 0} orders`}
            loading={loading}
          />
        </div>

        {/* Quick actions */}
        <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
          <button className="flex items-center gap-3 rounded-lg border border-[#E4E0D5] bg-white px-4 py-3.5 text-left transition hover:border-[#2F6F52]/40">
            <Share2 className="h-4 w-4 text-[#2F6F52]" />
            <span className="text-sm font-medium text-[#16281F]">Share referral</span>
          </button>
          <button className="flex items-center gap-3 rounded-lg border border-[#E4E0D5] bg-white px-4 py-3.5 text-left transition hover:border-[#2F6F52]/40">
            <TrendingUp className="h-4 w-4 text-[#2F6F52]" />
            <span className="text-sm font-medium text-[#16281F]">Analytics</span>
          </button>
          <button className="flex items-center gap-3 rounded-lg border border-[#E4E0D5] bg-white px-4 py-3.5 text-left transition hover:border-[#2F6F52]/40">
            <Users className="h-4 w-4 text-[#2F6F52]" />
            <span className="text-sm font-medium text-[#16281F]">Team</span>
          </button>
        </div>

        {/* Referrals */}
        <div id="referred-people" className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#16281F]">People you referred</h2>
              <p className="text-xs text-[#8A9089]">{data?.referred.length || 0} people joined through your link</p>
            </div>
            {data && data.referred.length > VISIBLE_REFERRALS && (
              <button
                onClick={() => setShowAll((s) => !s)}
                className="text-xs font-medium text-[#2F6F52] hover:underline"
              >
                {showAll ? 'Show less' : 'View all'}
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : !data || data.referred.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#D9D4C6] px-6 py-12 text-center">
              <Share2 className="mx-auto h-6 w-6 text-[#8A9089]" />
              <p className="mt-3 text-sm font-medium text-[#16281F]">No referrals yet</p>
              <p className="mt-1 text-xs text-[#8A9089]">Share your code to start earning rewards.</p>
              <button className="mt-4 rounded-md bg-[#2F6F52] px-5 py-2 text-xs font-medium text-white transition hover:bg-[#28603F]">
                Share now
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#E4E0D5] rounded-lg border border-[#E4E0D5] bg-white">
              {visibleReferrals.map((person) => (
                <div key={person.id} className="flex items-center gap-4 px-4 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFF4EF] text-sm font-medium text-[#2F6F52]">
                    {person.customerName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#16281F]">{person.customerName}</p>
                    <p className="text-xs text-[#8A9089]">
                      <span className="capitalize">{person.planType}</span>
                      {' · '}
                      {new Date(person.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      person.status === 'Paid'
                        ? 'bg-[#EFF4EF] text-[#2F6F52]'
                        : 'bg-[#FBF1E4] text-[#B8763F]'
                    }`}
                  >
                    {person.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}