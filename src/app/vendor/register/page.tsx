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

export default function VendorRegisterPage() {
  const { vendor, loading: authLoading, register } = useVendorAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && vendor) {
      router.replace('/vendor/dashboard');
    }
  }, [authLoading, vendor, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    if (phone && !/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number, or leave it blank');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      phone: phone || undefined,
      password,
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    toast({
      title: 'Account created!',
      description: 'Your vendor account is ready — start sharing your referral link.',
    });
    router.replace('/vendor/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-emerald-950 px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
  <img
    src="/images/greezo-logo-white.png"
    alt="Greezo"
    className="h-12 w-auto object-contain"
  />        <p className="text-sm text-emerald-200">Vendor Portal · where taste meets health</p>
      </div>

      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Become a Vendor</CardTitle>
          <p className="text-sm text-muted-foreground">
            Refer good food, earn more. Create your vendor account below.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="vendor-reg-name">Full Name</Label>
              <Input
                id="vendor-reg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
              />
            </div>
            <div>
              <Label htmlFor="vendor-reg-email">Email</Label>
              <Input
                id="vendor-reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <Label htmlFor="vendor-reg-phone">Phone (optional)</Label>
              <Input
                id="vendor-reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit number"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="vendor-reg-password">Password</Label>
                <Input
                  id="vendor-reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <Label htmlFor="vendor-reg-confirm">Confirm Password</Label>
                <Input
                  id="vendor-reg-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Vendor Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already a vendor?{' '}
            <Link href="/vendor/login" className="font-medium text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
