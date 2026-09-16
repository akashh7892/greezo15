"use client";

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ArrowLeft,
  Clock,
  IndianRupee,
  Loader2,
  LogOut,
  MapPin,
  Package,
  Phone,
  User as UserIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/app/context/Authcontext';
import { useRouter } from 'next/navigation';

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
  price: string;
  orderStatus: 'Pending' | 'Confirmed';
  createdAt: string;
};

export default function AccountPage({
  initialTab = 'login',
  onBackToHome,
}: {
  initialTab?: 'login' | 'register';
  onBackToHome?: () => void;
}) {
  const { user, token, loading: authLoading, login, register, logout } = useAuth();
  const router = useRouter();

  const handleBackToHome = () => {
    if (onBackToHome) {
      onBackToHome();
    } else {
      router.push('/');
    }
  };

  const handleOrderNow = () => {
    handleBackToHome();
    // Use setTimeout to ensure the account view has closed and plans
    // section is back in the DOM before scrolling.
    setTimeout(() => {
      const trialElement = document.getElementById('trial');
      if (trialElement) {
        trialElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8 sm:px-8 pt-20">
      <div className="mx-auto max-w-3xl">
        {/* <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBackToHome}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
          <Image
            src="/images/greezo-logo.png"
            alt="Greezo Logo"
            width={100}
            height={50}
            className="rounded-md object-contain"
          />
        </div> */}

        {authLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : user ? (
          <AccountDashboard user={user} token={token as string} onLogout={logout} handleOrderNow={handleOrderNow} />
        ) : (
          <AuthForms login={login} register={register} initialTab={initialTab} />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   Logged-out view: Login / Register
   ========================================================= */

const minimalInputClass =
  'h-11 rounded-none border-0 border-b border-[#D8D3C4] bg-transparent px-0 text-base text-[#16281F] placeholder:text-[#A9AA9F] focus-visible:border-[#2F6F52] focus-visible:ring-0 focus-visible:ring-offset-0';

function AuthForms({
  login,
  register,
  initialTab = 'login',
}: {
  login: ReturnType<typeof useAuth>['login'];
  register: ReturnType<typeof useAuth>['register'];
  initialTab?: 'login' | 'register';
}) {
  const { toast } = useToast();
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);

  // Login state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!/^\d{10}$/.test(loginPhone)) {
      setLoginError('Please enter a valid 10-digit phone number');
      return;
    }
    if (!loginPassword) {
      setLoginError('Password is required');
      return;
    }

    setLoginLoading(true);
    const result = await login(loginPhone, loginPassword);
    setLoginLoading(false);

    if (!result.success) {
      setLoginError(result.error);
      return;
    }

    toast({ title: 'Welcome back!', description: 'You are now logged in.' });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim()) {
      setRegError('Name is required');
      return;
    }
    if (!/^\d{10}$/.test(regPhone)) {
      setRegError('Please enter a valid 10-digit phone number');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match');
      return;
    }

    setRegLoading(true);
    const result = await register(regName.trim(), regPhone, regPassword, regEmail.trim() || undefined);
    setRegLoading(false);

    if (!result.success) {
      setRegError(result.error);
      return;
    }

    toast({ title: 'Account created!', description: "You're all set to place an order." });
  };

  return (
    <div className="mx-auto w-full max-w-md py-6">
      <h1 className="text-3xl font-bold text-[#16281F]">My Account</h1>
      <p className="mt-2 text-sm text-[#5B6660]">
        Login or create a free account to place orders and track them here.
      </p>

      {/* Minimal tab toggle — plain text + underline, no boxed pills */}
      <div className="mt-8 flex gap-8 border-b border-[#E4E0D5]">
        <button
          type="button"
          onClick={() => setTab('login')}
          className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
            tab === 'login'
              ? 'border-[#2F6F52] text-[#16281F]'
              : 'border-transparent text-[#8A9089] hover:text-[#16281F]'
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setTab('register')}
          className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
            tab === 'register'
              ? 'border-[#2F6F52] text-[#16281F]'
              : 'border-transparent text-[#8A9089] hover:text-[#16281F]'
          }`}
        >
          Register
        </button>
      </div>

      {tab === 'login' ? (
        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div>
            <Label htmlFor="login-phone" className="text-xs uppercase tracking-wide text-[#8A9089]">
              Phone Number
            </Label>
            <Input
              id="login-phone"
              type="tel"
              value={loginPhone}
              onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit number"
              className={minimalInputClass}
            />
          </div>
          <div>
            <Label htmlFor="login-password" className="text-xs uppercase tracking-wide text-[#8A9089]">
              Password
            </Label>
            <Input
              id="login-password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Your password"
              className={minimalInputClass}
            />
          </div>

          {loginError && <p className="text-sm text-red-500">{loginError}</p>}

          <Button
            type="submit"
            className="mt-2 w-full rounded-full bg-[#2F6F52] py-6 text-base hover:bg-[#265A43]"
            disabled={loginLoading}
          >
            {loginLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="mt-8 space-y-6">
          <div>
            <Label htmlFor="reg-name" className="text-xs uppercase tracking-wide text-[#8A9089]">
              Full Name
            </Label>
            <Input
              id="reg-name"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              placeholder="Your Name"
              className={minimalInputClass}
            />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="reg-phone" className="text-xs uppercase tracking-wide text-[#8A9089]">
                Phone Number
              </Label>
              <Input
                id="reg-phone"
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit number"
                className={minimalInputClass}
              />
            </div>
            <div>
              <Label htmlFor="reg-email" className="text-xs uppercase tracking-wide text-[#8A9089]">
                Email (optional)
              </Label>
              <Input
                id="reg-email"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="you@example.com"
                className={minimalInputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="reg-password" className="text-xs uppercase tracking-wide text-[#8A9089]">
                Password
              </Label>
              <Input
                id="reg-password"
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="At least 6 characters"
                className={minimalInputClass}
              />
            </div>
            <div>
              <Label htmlFor="reg-confirm-password" className="text-xs uppercase tracking-wide text-[#8A9089]">
                Confirm Password
              </Label>
              <Input
                id="reg-confirm-password"
                type="password"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className={minimalInputClass}
              />
            </div>
          </div>

          {regError && <p className="text-sm text-red-500">{regError}</p>}

          <Button
            type="submit"
            className="mt-2 w-full rounded-full bg-[#2F6F52] py-6 text-base hover:bg-[#265A43]"
            disabled={regLoading}
          >
            {regLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>
      )}
    </div>
  );
}

/* =========================================================
   Logged-in view: profile + order history
   ========================================================= */

function AccountDashboard({
  user,
  token,
  onLogout,
  handleOrderNow,
}: {
  user: { name: string; phone: string; email?: string | null };
  token: string;
  onLogout: () => void;
  handleOrderNow: () => void;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMyOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/backend/orders/mine', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        toast({ title: 'Failed to load your orders', variant: 'destructive' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Could not reach the server', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <Card className="shadow-sm">
        <CardContent className="flex flex-col items-start justify-between gap-4 pt-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.phone}</p>
              {user.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
            </div>
          </div>
          <Button variant="outline" onClick={onLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>

      {/* Order history */}
      <div>
        <h2 className="mb-3 text-xl font-bold">My Orders</h2>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            <p className="mb-4">You haven't placed any orders yet.</p>
            <Button onClick={handleOrderNow}>Order Now</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg leading-tight">{order.plan}</CardTitle>
                    <Badge
                      variant={order.orderStatus === 'Confirmed' ? 'default' : 'secondary'}
                      className={order.orderStatus === 'Confirmed' ? 'bg-green-600' : ''}
                    >
                      {order.orderStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{order.address || 'No address provided'}</span>
                  </div>

                  {(order.mealType || order.juicePack) && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Package className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        {order.mealType || ''}
                        {order.juicePack
                          ? ` · Juice${order.selectedJuices ? `: ${order.selectedJuices}` : ''}`
                          : ''}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IndianRupee className="h-4 w-4 shrink-0" />
                    <span>{order.price}</span>
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

                  <p className="pt-1 text-xs text-muted-foreground">
                    Placed on {new Date(order.createdAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}