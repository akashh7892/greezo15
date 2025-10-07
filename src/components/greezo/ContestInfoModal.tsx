"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ContestInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContestInfoModal({ isOpen, onClose }: ContestInfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-blue-50 to-cyan-50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-primary">Contest Information</DialogTitle>
          <DialogDescription className="text-center">
            Our contest opens every Monday from 5:00 PM to 9:00 PM!
            Make sure to check back then to participate and win exciting prizes.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}