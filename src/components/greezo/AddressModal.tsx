"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export interface Address {
  formatted_address: string;
  lat: number;
  lng: number;
  place_id?: string;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSelect: (address: Address) => void;
}

export function AddressModal({ isOpen, onClose, onAddressSelect }: AddressModalProps) {
  const [flat, setFlat] = useState('');
  const [landmark, setLandmark] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset form on open
      setFlat('');
      setLandmark('');
      setFullAddress('');
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const combinedAddress = [flat, landmark, fullAddress].filter(Boolean).join(', ');
    if (!combinedAddress.trim()) {
      setError('Please enter a valid address.');
      return;
    }

    onAddressSelect({
      formatted_address: combinedAddress,
      lat: 0, // No API, so no lat/lng
      lng: 0, // No API, so no lat/lng
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">
            Enter Delivery Address
          </DialogTitle>
          <DialogDescription>
            Please provide your complete delivery address.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flat">Flat / House No.</Label>
              <Input id="flat" value={flat} onChange={(e) => setFlat(e.target.value)} placeholder="e.g., A-123" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landmark">Landmark</Label>
              <Input id="landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="e.g., Near City Park" />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <Label htmlFor="full-address">Full Address *</Label>
            <Textarea
              id="full-address"
              placeholder="Enter your street, area, city, and pincode..."
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              className="min-h-[100px]"
              autoFocus
            />
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
           <Button variant="outline" onClick={onClose}>Cancel</Button>
           <Button 
             onClick={handleConfirm} 
             disabled={!fullAddress.trim()}
           >
             Confirm Address
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}