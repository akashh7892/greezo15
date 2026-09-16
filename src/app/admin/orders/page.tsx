"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, MapPin, Phone, IndianRupee, Clock, Package } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import AdminShell from '../components/AdminShell';

type Order = {
  id: string;
  customerName: string;
  phoneNumber: string;
  address: string | null;
  plan: string;
  mealType: string | null;
  juicePack: boolean;
  selectedJuices: string | null;
  startDate: string | null;
  preferredShift: string | null;
  nearbyLocation: string | null;
  price: string;
  orderStatus: 'Pending' | 'Confirmed';
  createdAt: string;
};

export default function OrderConfirmationPage() {
  return (
    <AdminShell>
      <OrdersContent />
    </AdminShell>
  );
}

function OrdersContent() {
  const { token } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/backend/orders', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        toast({ title: 'Failed to load orders', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Could not reach the server', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, token]);

  useEffect(() => {
    if (!token) return;
    fetchOrders();
    // Poll every 15s so new checkout orders show up automatically
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders, token]);

  const handleConfirm = async (orderId: string) => {
    if (!token) return;
    setConfirmingId(orderId);
    try {
      const res = await fetch(`/api/backend/orders/${orderId}/confirm`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, orderStatus: 'Confirmed' } : o))
        );

        if (data.whatsapp?.waLink) {
          toast({
            title: 'Order confirmed',
            description: 'Redirecting to WhatsApp to send the confirmation message...',
          });
          setTimeout(() => {
            window.location.href = data.whatsapp.waLink;
          }, 800);
        } else {
          toast({
            title: 'Order confirmed',
            description: 'WhatsApp confirmation sent to the customer.',
          });
        }
      } else {
        toast({ title: 'Failed to confirm order', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Could not reach the server', variant: 'destructive' });
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Order Confirmation</h1>
            <p className="text-sm text-muted-foreground">
              Orders placed at checkout appear here automatically.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            No orders yet. New checkouts will show up here automatically.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <Card key={order.id} className="flex flex-col justify-between shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight">{order.customerName}</CardTitle>
                    <Badge
                      variant={order.orderStatus === 'Confirmed' ? 'default' : 'secondary'}
                      className={order.orderStatus === 'Confirmed' ? 'bg-green-600' : ''}
                    >
                      {order.orderStatus}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-2 text-sm">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{order.address || 'No address provided'}</span>
                  </div>

                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Package className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      {order.plan}
                      {order.mealType ? ` — ${order.mealType}` : ''}
                      {order.juicePack
                        ? ` · Juice${order.selectedJuices ? `: ${order.selectedJuices}` : ''}`
                        : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IndianRupee className="h-4 w-4 shrink-0" />
                    <span>Rs {order.price}</span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>
                      {order.startDate || 'ASAP'}
                      {order.preferredShift ? ` · ${order.preferredShift}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{order.phoneNumber}</span>
                  </div>
                </CardContent>

                <div className="p-4 pt-0">
                  <Button
                    className="w-full"
                    disabled={order.orderStatus === 'Confirmed' || confirmingId === order.id}
                    onClick={() => handleConfirm(order.id)}
                  >
                    {confirmingId === order.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {order.orderStatus === 'Confirmed' ? 'Confirmed' : 'Confirm'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
