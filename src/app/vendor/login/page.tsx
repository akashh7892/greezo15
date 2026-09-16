"use client";

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Leaf } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useVendorAuth } from '../context/VendorAuthContext';

export default function VendorLoginPage() {
  const { vendor, loading: authLoading, login } = useVendorAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Already logged in? skip straight to the dashboard.
  useEffect(() => {
    if (!authLoading && vendor) {
      router.replace('/vendor/dashboard');
    }
  }, [authLoading, vendor, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password');
      return;
    }

    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    toast({ title: 'Welcome back!', description: 'You are now logged in.' });
    router.replace('/vendor/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-emerald-950 px-4 py-10">
<div className="mb-8 flex flex-col items-center gap-2 text-center">
  <img
    src="/images/greezo-logo-white.png"
    alt="Greezo"
    className="h-12 w-auto object-contain"
  />

  <p className="text-sm text-emerald-200">
    Vendor Portal · where taste meets health
  </p>
</div>

      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Vendor Login</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to track your referrals and earnings.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="vendor-login-email">Email</Label>
              <Input
                id="vendor-login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <Label htmlFor="vendor-login-password">Password</Label>
              <Input
                id="vendor-login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New vendor?{' '}
            <Link href="/vendor/register" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
