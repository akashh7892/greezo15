import type { Metadata } from 'next';
import { AdminAuthProvider } from './context/AdminAuthContext';

export const metadata: Metadata = {
  title: 'Admin | Greezo',
  description: 'Manage orders, vendors and commission payouts for Greezo.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
