import type { Metadata } from 'next';
import { VendorAuthProvider } from './context/VendorAuthContext';

export const metadata: Metadata = {
  title: 'Vendor Portal | Greezo',
  description: 'Track referrals, earnings and payouts as a Greezo vendor.',
};

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return <VendorAuthProvider>{children}</VendorAuthProvider>;
}
