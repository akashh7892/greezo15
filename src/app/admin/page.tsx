"use client";

import { FormEvent, useState } from 'react';
import { getRecentOrders } from '@/app/actions';
import type { Order } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ADMIN_NAME = 'Akash';
const ADMIN_PASSWORD = 'Akash@7892';

export default function AdminPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadOrders = async () => {
    setIsLoading(true);
    const result = await getRecentOrders();
    setOrders(result.orders);
    setError(result.error || '');
    setIsLoading(false);
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (name === ADMIN_NAME && password === ADMIN_PASSWORD) {
      setError('');
      setIsAuthenticated(true);
      await loadOrders();
      return;
    }
    setError('Incorrect admin name or password.');
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-primary">Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="admin-name">Name</Label>
                <Input id="admin-name" value={name} onChange={(event) => setName(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" type="submit">Open Admin</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/40 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-primary">Admin Orders</h1>
            <p className="text-sm text-muted-foreground">Confirmed orders from the last 24 hours.</p>
          </div>
          <Button variant="outline" onClick={loadOrders} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh orders'}
          </Button>
        </div>

        {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {!isLoading && !error && orders.length === 0 && (
          <Card><CardContent className="p-6 text-center text-muted-foreground">No confirmed orders in the last 24 hours.</CardContent></Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="space-y-2 p-5 text-sm">
                <div className="flex justify-between gap-4"><strong>{order.customer_name}</strong><strong>₹{order.price}</strong></div>
                <p>{order.phone_number} · {order.plan}</p>
                <p>Delivery: {order.start_date || 'ASAP'} · {order.preferred_shift || 'Any time'}</p>
                <p>Juice: {order.juice_pack ? 'Yes' : 'No'}{order.selected_juices ? ` — ${order.selected_juices}` : ''}</p>
                <p>{order.address || 'No address provided'}</p>
                <p className="text-xs text-muted-foreground">Confirmed: {new Date(order.created_at).toLocaleString('en-IN')}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
