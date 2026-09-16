// VendorProfilePage.tsx
"use client";

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Copy,
  HelpCircle,
  Leaf,
  LogOut,
  Pencil,
  Settings as SettingsIcon,
  Share2,
  Wallet,
  Mail,
  Phone,
  Sparkles,
  Gift,
  IndianRupee,
  Clock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useVendorAuth } from '../context/VendorAuthContext';
import VendorShell from '../components/VendorShell';

export default function VendorProfilePage() {
  return (
    <VendorShell>
      <ProfileContent />
    </VendorShell>
  );
}

function MenuRow({
  icon,
  title,
  subtitle,
  onClick,
  badge,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
  badge?: string;
  danger?: boolean;
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 px-4 py-3.5 text-left" type="button">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${danger ? 'bg-[#FBEEEE] text-[#B4463E]' : 'bg-[#EFF4EF] text-[#2F6F52]'}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium ${danger ? 'text-[#B4463E]' : 'text-[#16281F]'}`}>{title}</p>
          {badge && (
            <span className="rounded-full bg-[#EFF4EF] px-2 py-0.5 text-[10px] font-medium text-[#2F6F52]">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-[#8A9089]">{subtitle}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#C4C0B2]" />
    </button>
  );
}

function ProfileContent() {
  const { vendor, token, logout, updateVendor } = useVendorAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [editOpen, setEditOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [name, setName] = useState(vendor?.name || '');
  const [phone, setPhone] = useState(vendor?.phone || '');
  const [payoutMethod, setPayoutMethod] = useState(vendor?.payoutMethod || '');
  const [payoutId, setPayoutId] = useState(
    (vendor?.payoutDetails as any)?.upiId || (vendor?.payoutDetails as any)?.accountNumber || ''
  );
  const [saving, setSaving] = useState(false);

  // Real referral stats — these used to be hardcoded (0 / 4.8 / ₹0) instead
  // of reflecting the vendor's actual data, same numbers the dashboard uses.
  const [stats, setStats] = useState<{ referrals: number; pending: number; earnings: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

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
          setStats({
            referrals: referred.length,
            pending: referred.filter((r: { status: string }) => r.status === 'pending').length,
            earnings: data.totalEarnings ?? 0,
          });
        }
      } catch (err) {
        console.error('Failed to load referral stats:', err);
      } finally {
        setStatsLoading(false);
      }
    })();
  }, [token]);

  if (!vendor) return null;

  const referralLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?ref=${vendor.referralCode}`
      : `/?ref=${vendor.referralCode}`;

  const handleShare = async () => {
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

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/backend/vendor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (data.success) {
        updateVendor({ name: data.vendor.name, phone: data.vendor.phone });
        toast({ title: 'Profile updated' });
        setEditOpen(false);
      } else {
        toast({ title: data.error || 'Update failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Could not reach the server', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayout = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payoutDetails = payoutMethod === 'upi' ? { upiId: payoutId } : { accountNumber: payoutId };
      const res = await fetch('/api/backend/vendor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ payoutMethod, payoutDetails }),
      });
      const data = await res.json();
      if (data.success) {
        updateVendor({ payoutMethod: data.vendor.payoutMethod, payoutDetails: data.vendor.payoutDetails });
        toast({ title: 'Payout details updated' });
        setPayoutOpen(false);
      } else {
        toast({ title: data.error || 'Update failed', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Could not reach the server', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/vendor/login');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5]">
      {/* Header */}
      <div className="bg-[#16281F] px-6 pb-14 pt-7">
        <div className="mx-auto flex max-w-lg items-center justify-center gap-2.5">
          <Leaf className="h-5 w-5 text-[#8FB89C]" />
          <h1 className="font-['Fraunces',_Georgia,_serif] text-2xl italic text-white">Greezo</h1>
        </div>
        <p className="mt-1 text-center text-xs text-[#8FB89C]">where taste meets health</p>
      </div>

      <div className="mx-auto -mt-8 max-w-lg px-4 pb-16">
        {/* Profile card */}
        <div className="rounded-lg border border-[#E4E0D5] bg-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#2F6F52] text-xl font-semibold text-white">
              {vendor.name?.[0]?.toUpperCase() || 'V'}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-[#16281F]">{vendor.name}</p>
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <button className="rounded-full p-1 text-[#8A9089] transition hover:bg-[#F4F3EE]" type="button">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit profile</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div>
                        <Label htmlFor="edit-name">Full name</Label>
                        <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="edit-phone">Phone</Label>
                        <Input
                          id="edit-phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="10-digit number"
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={saving} className="bg-[#2F6F52] hover:bg-[#28603F]">
                          {saving ? 'Saving...' : 'Save changes'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="mt-1.5 space-y-1 text-xs text-[#8A9089]">
                <p className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {vendor.email}
                </p>
                {vendor.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    +91 {vendor.phone}
                  </p>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-[#EFF4EF] px-3 py-1 text-xs font-medium text-[#2F6F52]">
                  {vendor.referralCode}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(vendor.referralCode);
                    toast({ title: 'Copied referral code' });
                  }}
                  className="rounded-full p-1.5 text-[#8A9089] transition hover:bg-[#F4F3EE]"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex divide-x divide-[#E4E0D5] rounded-lg border border-[#E4E0D5] bg-white">
          <div className="flex-1 px-4 py-3.5 text-center">
            <Sparkles className="mx-auto h-4 w-4 text-[#8A9089]" />
            <p className="mt-1 text-xs text-[#8A9089]">Referrals</p>
            <p className="text-base font-semibold text-[#16281F]">
              {statsLoading ? '—' : stats?.referrals ?? 0}
            </p>
          </div>
          <div className="flex-1 px-4 py-3.5 text-center">
            <Clock className="mx-auto h-4 w-4 text-[#8A9089]" />
            <p className="mt-1 text-xs text-[#8A9089]">Pending</p>
            <p className="text-base font-semibold text-[#16281F]">
              {statsLoading ? '—' : stats?.pending ?? 0}
            </p>
          </div>
          <div className="flex-1 px-4 py-3.5 text-center">
            <Gift className="mx-auto h-4 w-4 text-[#8A9089]" />
            <p className="mt-1 text-xs text-[#8A9089]">Rewards</p>
            <p className="flex items-center justify-center text-base font-semibold text-[#16281F]">
              {statsLoading ? (
                '—'
              ) : (
                <>
                  <IndianRupee className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {(stats?.earnings ?? 0).toLocaleString('en-IN')}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Menu */}
        <div className="mt-4 divide-y divide-[#E4E0D5] rounded-lg border border-[#E4E0D5] bg-white">
          <MenuRow
            icon={<Share2 className="h-4 w-4" />}
            title="Share referral link"
            subtitle="Invite friends and earn rewards"
            onClick={handleShare}
          />

          <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
            <DialogTrigger asChild>
              <div>
                <MenuRow
                  icon={<Wallet className="h-4 w-4" />}
                  title="Payout details"
                  subtitle={
                    vendor.payoutMethod
                      ? `Configured · ${vendor.payoutMethod.toUpperCase()}`
                      : 'Add or update payment details'
                  }
                  badge={vendor.payoutMethod ? 'Active' : undefined}
                />
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Payout details</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSavePayout} className="space-y-4">
                <div>
                  <Label htmlFor="payout-method">Payout method</Label>
                  <select
                    id="payout-method"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                  >
                    <option value="">Select method</option>
                    <option value="upi">UPI</option>
                    <option value="bank">Bank transfer</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="payout-id">
                    {payoutMethod === 'bank' ? 'Account number' : 'UPI ID'}
                  </Label>
                  <Input
                    id="payout-id"
                    value={payoutId}
                    onChange={(e) => setPayoutId(e.target.value)}
                    placeholder={payoutMethod === 'bank' ? '1234567890' : 'name@upi'}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={saving} className="bg-[#2F6F52] hover:bg-[#28603F]">
                    {saving ? 'Saving...' : 'Save payout details'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <MenuRow
            icon={<SettingsIcon className="h-4 w-4" />}
            title="Settings"
            subtitle="Manage your account preferences"
          />

          <MenuRow
            icon={<HelpCircle className="h-4 w-4" />}
            title="Help & support"
            subtitle="Get in touch with our team"
          />

          <MenuRow
            icon={<LogOut className="h-4 w-4" />}
            title="Logout"
            subtitle="Sign out of your account"
            onClick={handleLogout}
            danger
          />
        </div>
      </div>
    </div>
  );
}