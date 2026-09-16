"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { IndianRupee, Loader2, Phone, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '../context/AdminAuthContext';
import AdminShell from '../components/AdminShell';

type WeekMeta = { label: string; from: string; to: string };
type VendorEarnings = {
  vendorId: string;
  vendorName: string;
  vendorPhone: string | null;
  weeks: number[];
  total: number;
};

type Preset = 'lastWeek' | 'last4Weeks' | 'thisMonth' | 'custom';

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Ranges are computed in local time so "today" matches what the admin sees,
// then sent to the backend as plain YYYY-MM-DD dates.
function rangeForPreset(preset: Preset): { from: string; to: string } {
  const today = new Date();
  const to = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (preset === 'lastWeek') {
    const from = new Date(to);
    from.setDate(from.getDate() - 6);
    return { from: toISODate(from), to: toISODate(to) };
  }
  if (preset === 'last4Weeks') {
    const from = new Date(to);
    from.setDate(from.getDate() - 27);
    return { from: toISODate(from), to: toISODate(to) };
  }
  // thisMonth: 1st of the current month through today — resets automatically
  // once a new month starts, which is what gives the "starts fresh" behaviour.
  const from = new Date(today.getFullYear(), today.getMonth(), 1);
  return { from: toISODate(from), to: toISODate(to) };
}

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'last4Weeks', label: 'Last 4 Weeks' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
];

export default function AdminVendorEarningsPage() {
  return (
    <AdminShell>
      <VendorEarningsContent />
    </AdminShell>
  );
}

function VendorEarningsContent() {
  const { token } = useAdminAuth();
  const { toast } = useToast();

  const [preset, setPreset] = useState<Preset>('thisMonth');
  const initialRange = useMemo(() => rangeForPreset('thisMonth'), []);
  const [fromDate, setFromDate] = useState(initialRange.from);
  const [toDate, setToDate] = useState(initialRange.to);

  const [weeks, setWeeks] = useState<WeekMeta[]>([]);
  const [vendors, setVendors] = useState<VendorEarnings[]>([]);
  const [loading, setLoading] = useState(true);

  const applyPreset = (value: Preset) => {
    setPreset(value);
    if (value !== 'custom') {
      const range = rangeForPreset(value);
      setFromDate(range.from);
      setToDate(range.to);
    }
  };

  const fetchEarnings = useCallback(async () => {
    if (!token || !fromDate || !toDate) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/backend/admin/vendors/earnings?from=${fromDate}&to=${toDate}`,
        { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setWeeks(data.weeks);
        setVendors(data.vendors);
      } else {
        toast({ title: data.error || 'Failed to load earnings', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Could not reach the server', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token, fromDate, toDate, toast]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const grandTotal = useMemo(
    () => vendors.reduce((sum, v) => sum + (Number(v.total) || 0), 0),
    [vendors]
  );

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Vendor Earnings</h1>
            {/* <p className="text-sm text-muted-foreground">
              Name, number, and week-by-week earnings for the selected period.
            </p> */}
          </div>
          <Button variant="outline" size="sm" onClick={fetchEarnings} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="flex flex-wrap items-end gap-4 py-4">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.value}
                  type="button"
                  size="sm"
                  variant={preset === p.value ? 'default' : 'outline'}
                  onClick={() => applyPreset(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="from-date" className="text-xs text-muted-foreground">
                  From
                </Label>
                <Input
                  id="from-date"
                  type="date"
                  className="w-[160px]"
                  value={fromDate}
                  max={toDate}
                  onChange={(e) => {
                    setPreset('custom');
                    setFromDate(e.target.value);
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="to-date" className="text-xs text-muted-foreground">
                  To
                </Label>
                <Input
                  id="to-date"
                  type="date"
                  className="w-[160px]"
                  value={toDate}
                  min={fromDate}
                  onChange={(e) => {
                    setPreset('custom');
                    setToDate(e.target.value);
                  }}
                />
              </div>
              <Button size="sm" onClick={fetchEarnings} disabled={loading}>
                Apply
              </Button>
            </div>

            {!loading && vendors.length > 0 && (
              <div className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground">
                <IndianRupee className="h-4 w-4" />
                <span>{grandTotal.toLocaleString('en-IN')} total across {vendors.length} vendors</span>
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            No vendors found.
          </div>
        ) : (
          <>
            {/* Desktop / tablet: full table */}
            <Card className="hidden sm:block">
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Number</TableHead>
                      {weeks.map((w) => (
                        <TableHead key={w.label} className="text-right whitespace-nowrap">
                          {w.label}
                          <div className="text-[10px] font-normal text-muted-foreground">
                            {w.from} to {w.to}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((v) => (
                      <TableRow key={v.vendorId}>
                        <TableCell className="font-medium">{v.vendorName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            {v.vendorPhone || '—'}
                          </span>
                        </TableCell>
                        {v.weeks.map((amount, i) => (
                          <TableCell key={i} className="text-right">
                            {amount > 0 ? `${amount.toLocaleString('en-IN')} rs` : '—'}
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-semibold">
                          {v.total.toLocaleString('en-IN')} rs
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Mobile: one card per vendor, weeks stacked as rows */}
            <div className="space-y-3 sm:hidden">
              {vendors.map((v) => (
                <Card key={v.vendorId}>
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold leading-tight">{v.vendorName}</p>
                        <span className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {v.vendorPhone || '—'}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</p>
                        <p className="text-lg font-bold text-[#2F6F52]">
                          {v.total.toLocaleString('en-IN')} rs
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t pt-3">
                      {weeks.map((w, i) => (
                        <div
                          key={w.label}
                          className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5"
                        >
                          <div>
                            <p className="text-xs font-medium">{w.label}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {w.from.slice(5)} – {w.to.slice(5)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold">
                            {v.weeks[i] > 0 ? `${v.weeks[i].toLocaleString('en-IN')} rs` : '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}