// VendorDashboardPage.tsx
"use client";

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Copy,
  Crown,
  GlassWater,
  IndianRupee,
  Leaf,
  Loader2,
  Share2,
} from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useVendorAuth } from '../context/VendorAuthContext';
import VendorShell from '../components/VendorShell';
import ReferralDetailsDialog from '../components/ReferralDetailsDialog';

type ReferredCustomer = {
  id: string;
  customerName: string;
  referralCode?: string;
  plan: string;
  planType: 'trial' | 'weekly' | 'monthly' | 'other';
  commission: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
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

// Same badge colors as the "View All" dialog, keyed on the real lowercase
// status values the backend sends (pending | approved | paid | rejected).
const statusStyles: Record<string, string> = {
  approved: 'bg-[#EFF4EF] text-[#2F6F52]',
  paid: 'bg-[#EFF4EF] text-[#2F6F52]',
  pending: 'bg-[#FBF1E4] text-[#B8763F]',
  rejected: 'bg-[#FBEEEE] text-[#B4463E]',
};

export default function VendorDashboardPage() {
  return (
    <VendorShell>
      <DashboardContent />
    </VendorShell>
  );
}

function EarningTile({
  icon,
  label,
  amount,
  count,
  loading,
}: {
  icon: ReactNode;
  label: string;
  amount: number;
  count: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg bg-white px-3 py-3.5 text-center">
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF4EF] text-[#2F6F52]">
        {icon}
      </div>
      {loading ? (
        <Skeleton className="mx-auto mt-2 h-4 w-14" />
      ) : (
        <p className="mt-2 flex items-center justify-center text-sm font-semibold text-[#16281F]">
          <IndianRupee className="h-3 w-3" strokeWidth={2.5} />
          {amount.toLocaleString('en-IN')}
        </p>
      )}
      <p className="mt-0.5 text-[11px] font-medium text-[#5B6660]">{label}</p>
      <p className="text-[10px] text-[#8A9089]">{count} Orders</p>
    </div>
  );
}

function DashboardContent() {
  const { vendor, token } = useVendorAuth();
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);

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

  const handleShare = async () => {
    if (!vendor) return;
    const referralLink =
      typeof window !== 'undefined' ? `${window.location.origin}/?ref=${vendor.referralCode}` : '';
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Greezo — Refer & Earn',
          text: `Use my Greezo referral code ${vendor.referralCode} for a discount on healthy meals!`,
          url: referralLink,
        });
        return;
      } catch {
        // fall through to copy
      }
    }
    navigator.clipboard.writeText(referralLink);
    toast({ title: 'Link copied', description: 'Referral link copied to clipboard.' });
  };

  const visibleReferrals = data ? data.referred.slice(0, VISIBLE_REFERRALS) : [];

  return (
    <div className="min-h-screen bg-[#FAF9F5]">
      {/* Header */}
      <div className="bg-[#16281F] px-6 pb-16 pt-7 lg:px-10 lg:pb-24 lg:pt-9">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div>
                <Image
                  src="/images/greezo-logo-white.png"
                  alt="Greezo"
                  width={346}
                  height={133}
                  className="h-10 lg:h-12 w-auto object-contain object-left"
                  priority
                />

                <p
                  className="mt-1.5 flex items-center gap-1.5 text-base text-[#8FB89C] lg:text-lg"
                  style={{ fontFamily: "'Dancing Script', cursive" }}
                >
                  <Leaf className="h-3.5 w-3.5" strokeWidth={2.5} />
                  where taste meets health
                </p>
              </div>
            </div>
            {/* <button
              onClick={fetchDashboard}
              className="rounded-full p-2 text-[#8FB89C] transition hover:bg-white/10"
              aria-label="Refresh dashboard"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bell className="h-5 w-5" />}
            </button> */}
          </div>

          {/* Hero */}
          <div className="mt-7 grid grid-cols-[1.2fr_1fr] items-center gap-3 lg:mt-10 lg:gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <h2 className="font-['Fraunces',_Georgia,_serif] text-[22px] italic leading-[1.15] text-white sm:text-[28px] lg:text-4xl">
                Refer
                <br />
                Good Food
                <br />
                <span className="text-[#8FB89C]">Earn More</span>
              </h2>
            </div>
            <div className="relative overflow-hidden rounded-2xl shadow-lg">
              <Image
                src="/images/meals/Gemini_Generated_Image_eidmajeidmajeidm.png"
                alt="Healthy Greezo meal"
                width={480}
                height={280}
                className="h-24 w-full object-cover sm:h-36 lg:h-48"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="mx-auto -mt-10 max-w-5xl px-4 pb-24 lg:-mt-14 lg:px-10 lg:pb-14">
        {/* Welcome / referral card */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#E4E0D5] bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2F6F52] text-base font-semibold text-white">
              {vendor?.name?.[0]?.toUpperCase() || 'V'}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#8A9089]">Welcome back,</p>
              <p className="truncate text-base font-semibold text-[#16281F]">{vendor?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyReferralCode}
              className="flex items-center gap-2 rounded-md border border-[#E4E0D5] bg-[#FAF9F5] px-3 py-2 text-xs font-medium text-[#2F6F52] transition hover:bg-[#EFF4EF]"
            >
              Referral ID: {vendor?.referralCode}
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleShare}
              className="flex items-center justify-center rounded-md bg-[#2F6F52] p-2.5 text-white transition hover:bg-[#28603F]"
              aria-label="Share referral link"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
          {/* Earnings */}
          <div className="rounded-xl bg-[#16281F] p-5 lg:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2F6F52]">
                  <IndianRupee className="h-5 w-5 text-[#8FB89C]" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs text-[#8FB89C]">Your Earnings</p>
                  {loading ? (
                    <Skeleton className="mt-1.5 h-7 w-28 bg-white/10" />
                  ) : (
                    <p className="text-2xl font-semibold text-white">
                      Rs {(data?.totalEarnings ?? 0).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              </div>
              {/* <a
                href="#referred-people"
                className="flex items-center gap-1.5 rounded-full border border-white/25 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
              >
                View Details
                <ArrowRight className="h-3.5 w-3.5" />
              </a> */}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2.5">
              <EarningTile
                icon={<GlassWater className="h-4 w-4" />}
                label="Trial"
                amount={data?.summary.trial.earnings ?? 0}
                count={data?.summary.trial.count ?? 0}
                loading={loading}
              />
              <EarningTile
                icon={<CalendarDays className="h-4 w-4" />}
                label="Weekly"
                amount={data?.summary.weekly.earnings ?? 0}
                count={data?.summary.weekly.count ?? 0}
                loading={loading}
              />
              <EarningTile
                icon={<Crown className="h-4 w-4" />}
                label="Monthly"
                amount={data?.summary.monthly.earnings ?? 0}
                count={data?.summary.monthly.count ?? 0}
                loading={loading}
              />
            </div>
          </div>

          {/* Referrals */}
          <div
            id="referred-people"
            className="rounded-xl border border-[#E4E0D5] bg-white p-5 lg:sticky lg:top-6"
          >
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#16281F]">People You Referred</h2>
                <p className="text-xs text-[#8A9089]">{data?.referred.length || 0} people joined</p>
              </div>
              {data && data.referred.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDetailsOpen(true)}
                  className="shrink-0 text-xs font-medium text-[#2F6F52] hover:underline"
                >
                  View All
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
              <div className="rounded-lg border border-dashed border-[#D9D4C6] px-6 py-10 text-center">
                <Share2 className="mx-auto h-6 w-6 text-[#8A9089]" />
                <p className="mt-3 text-sm font-medium text-[#16281F]">No referrals yet</p>
                <p className="mt-1 text-xs text-[#8A9089]">Share your code to start earning rewards.</p>
                <button
                  onClick={handleShare}
                  className="mt-4 rounded-md bg-[#2F6F52] px-5 py-2 text-xs font-medium text-white transition hover:bg-[#28603F]"
                >
                  Share now
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#E4E0D5]">
                {visibleReferrals.map((person) => (
                  <div key={person.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
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
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                        statusStyles[person.status] || 'bg-[#F4F3EE] text-[#5B6660]'
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

      <ReferralDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        referred={data?.referred ?? []}
      />
    </div>
  );
}