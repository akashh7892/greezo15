// ReferralDetailsDialog.tsx
//
// Full breakdown of everyone a vendor has referred — who, which plan,
// when, and the current payout status. Wire it up from the "View All"
// button on the vendor dashboard:
//
//   const [detailsOpen, setDetailsOpen] = useState(false);
//   ...
//   <button onClick={() => setDetailsOpen(true)}>View All</button>
//   <ReferralDetailsDialog
//     open={detailsOpen}
//     onOpenChange={setDetailsOpen}
//     referred={data?.referred ?? []}
//   />
"use client";

import { IndianRupee, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export type ReferredCustomer = {
  id: string;
  customerName: string;
  plan: string;
  planType: 'trial' | 'weekly' | 'monthly' | string;
  commission: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected' | string;
  createdAt: string;
};

const statusStyles: Record<string, string> = {
  approved: 'bg-[#EFF4EF] text-[#2F6F52]',
  paid: 'bg-[#EFF4EF] text-[#2F6F52]',
  pending: 'bg-[#FBF1E4] text-[#B8763F]',
  rejected: 'bg-[#FBEEEE] text-[#B4463E]',
};

export default function ReferralDetailsDialog({
  open,
  onOpenChange,
  referred,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referred: ReferredCustomer[];
}) {
  const totalCommission = referred.reduce((sum, r) => sum + (Number(r.commission) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>People You Referred</DialogTitle>
          <DialogDescription>
            {referred.length} {referred.length === 1 ? 'person' : 'people'} referred so far · Rs{' '}
            {totalCommission.toLocaleString('en-IN')} total commission
          </DialogDescription>
        </DialogHeader>

        {referred.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-[#8A9089]">
            <Users className="h-6 w-6" />
            <p className="text-sm">No referrals yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E4E0D5]">
            {referred.map((person) => (
              <div key={person.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFF4EF] text-sm font-medium text-[#2F6F52]">
                  {person.customerName?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-[#16281F]">{person.customerName}</p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${
                        statusStyles[person.status] || 'bg-[#F4F3EE] text-[#5B6660]'
                      }`}
                    >
                      {person.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#8A9089]">
                    {person.plan} <span className="capitalize">({person.planType})</span>
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-[#8A9089]">
                    <span>
                      {new Date(person.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-0.5 font-medium text-[#16281F]">
                      <IndianRupee className="h-3 w-3" strokeWidth={2.5} />
                      {Number(person.commission).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}