"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  IndianRupee,
  Loader2,
  RefreshCw,
  Wallet,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '../context/AdminAuthContext';
import AdminShell from '../components/AdminShell';

type Commission = {
  id: string;
  vendorId: string;
  vendorName: string;
  orderId: string;
  customerName: string;
  paymentMethod: string | null;
  subscriptionType: string;
  commissionAmount: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  createdAt: string;
};

type StatusFilter = 'pending' | 'approved' | 'paid' | 'all';

const STATUS_BADGE: Record<Commission['status'], string> = {
  pending: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  approved: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  paid: 'bg-green-100 text-green-800 hover:bg-green-100',
  rejected: 'bg-red-100 text-red-800 hover:bg-red-100',
};

export default function AdminCommissionsPage() {
  return (
    <AdminShell>
      <CommissionsContent />
    </AdminShell>
  );
}

function CommissionsContent() {
  const { token } = useAdminAuth();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [payingVendorId, setPayingVendorId] = useState<string | null>(null);

  const fetchCommissions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const qs = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
      const res = await fetch(`/api/backend/admin/commissions${qs}`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCommissions(data.commissions);
      } else {
        toast({ title: 'Failed to load commissions', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Could not reach the server', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, token, toast]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  const handleApprove = async (id: string) => {
    if (!token) return;
    setActingId(id);
    try {
      const res = await fetch(`/api/backend/admin/commissions/${id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Commission approved' });
        setCommissions((prev) => prev.filter((c) => c.id !== id));
      } else {
        toast({ title: data.error || 'Failed to approve', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Could not reach the server', variant: 'destructive' });
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!token) return;
    setActingId(id);
    try {
      const res = await fetch(`/api/backend/admin/commissions/${id}/reject`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Commission rejected' });
        setCommissions((prev) => prev.filter((c) => c.id !== id));
      } else {
        toast({ title: data.error || 'Failed to reject', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Could not reach the server', variant: 'destructive' });
    } finally {
      setActingId(null);
    }
  };

  const handlePayoutVendor = async (vendorId: string, vendorName: string) => {
    if (!token) return;
    setPayingVendorId(vendorId);
    try {
      const res = await fetch('/api/backend/admin/commissions/payout', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ vendorId }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Payout complete',
          description: `${data.paidCount} commission${data.paidCount === 1 ? '' : 's'} marked paid for ${vendorName}.`,
        });
        setCommissions((prev) => prev.filter((c) => c.vendorId !== vendorId));
      } else {
        toast({ title: data.error || 'Payout failed', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Could not reach the server', variant: 'destructive' });
    } finally {
      setPayingVendorId(null);
    }
  };

  // Group approved commissions by vendor so payout is one click per vendor.
  const approvedByVendor = useMemo(() => {
    if (statusFilter !== 'approved') return [];
    const map = new Map<string, { vendorId: string; vendorName: string; total: number; count: number }>();
    for (const c of commissions) {
      const existing = map.get(c.vendorId);
      const amount = Number(c.commissionAmount) || 0;
      if (existing) {
        existing.total += amount;
        existing.count += 1;
      } else {
        map.set(c.vendorId, { vendorId: c.vendorId, vendorName: c.vendorName, total: amount, count: 1 });
      }
    }
    return Array.from(map.values());
  }, [commissions, statusFilter]);

  const totalShown = useMemo(
    () => commissions.reduce((sum, c) => sum + (Number(c.commissionAmount) || 0), 0),
    [commissions]
  );

  return (
    <div className="min-h-screen bg-muted/30 px-3 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold sm:text-3xl">Vendor Commissions</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Approve cash-on-delivery commissions and run vendor payouts.
            </p>
          </div>
          {/* <Button
            variant="outline"
            size="sm"
            onClick={fetchCommissions}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button> */}
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <TabsList className="w-full overflow-x-auto sm:w-auto">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          {!loading && commissions.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
              <IndianRupee className="h-4 w-4 shrink-0" />
              <span>
                {totalShown.toLocaleString('en-IN')} across {commissions.length} commission
                {commissions.length === 1 ? '' : 's'}
              </span>
            </div>
          )}
        </div>

        {/* Per-vendor payout bar — only meaningful on the "approved" tab */}
        {statusFilter === 'approved' && !loading && approvedByVendor.length > 0 && (
          <Card className="mb-4 border-blue-200 bg-blue-50/50">
            <CardContent className="flex flex-col gap-3 py-4">
              <p className="text-sm font-medium text-blue-900">
                Weekly payout — mark every approved commission as paid for a vendor
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {approvedByVendor.map((v) => (
                  <Button
                    key={v.vendorId}
                    variant="outline"
                    size="sm"
                    className="w-full justify-center border-blue-300 bg-white sm:w-auto sm:justify-start"
                    disabled={payingVendorId === v.vendorId}
                    onClick={() => handlePayoutVendor(v.vendorId, v.vendorName)}
                  >
                    {payingVendorId === v.vendorId ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wallet className="mr-2 h-4 w-4" />
                    )}
                    Pay {v.vendorName} · {v.total.toLocaleString('en-IN')} rs
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg sm:h-16" />
            ))}
          </div>
        ) : commissions.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground sm:p-12">
            No {statusFilter === 'all' ? '' : statusFilter} commissions right now.
          </div>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <div className="space-y-3 sm:hidden">
              {commissions.map((c) => (
                <Card key={c.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{c.vendorName}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.customerName}</p>
                      </div>
                      <Badge className={`${STATUS_BADGE[c.status]} shrink-0`} variant="secondary">
                        {c.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Plan</p>
                        <p className="capitalize font-medium">{c.subscriptionType}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Payment</p>
                        <p className="capitalize font-medium">{c.paymentMethod || '—'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Commission</p>
                        <p className="flex items-center gap-1 font-semibold">
                          <IndianRupee className="h-3.5 w-3.5" strokeWidth={2.5} />
                          {Number(c.commissionAmount).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {statusFilter === 'pending' && (
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
                          disabled={actingId === c.id}
                          onClick={() => handleApprove(c.id)}
                        >
                          {actingId === c.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="mr-1.5 h-4 w-4" /> Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                          disabled={actingId === c.id}
                          onClick={() => handleReject(c.id)}
                        >
                          <X className="mr-1.5 h-4 w-4" /> Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop / tablet: table */}
            <Card className="hidden sm:block">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead>Status</TableHead>
                        {statusFilter === 'pending' && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.vendorName}</TableCell>
                          <TableCell>{c.customerName}</TableCell>
                          <TableCell className="capitalize">{c.subscriptionType}</TableCell>
                          <TableCell className="capitalize text-muted-foreground">
                            {c.paymentMethod || '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(c.commissionAmount).toLocaleString('en-IN')} rs
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_BADGE[c.status]} variant="secondary">
                              {c.status}
                            </Badge>
                          </TableCell>
                          {statusFilter === 'pending' && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-green-300 text-green-700 hover:bg-green-50"
                                  disabled={actingId === c.id}
                                  onClick={() => handleApprove(c.id)}
                                >
                                  {actingId === c.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-300 text-red-700 hover:bg-red-50"
                                  disabled={actingId === c.id}
                                  onClick={() => handleReject(c.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}