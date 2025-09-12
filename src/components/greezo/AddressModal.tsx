"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapSelector, type Address } from './MapSelector';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSelect: (address: Address) => void;
}

export function AddressModal({ isOpen, onClose, onAddressSelect }: AddressModalProps) {
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  
  const handleAddressSelect = (address: Address) => {
    onAddressSelect(address);
    onClose();
  };

  // Enhanced dialog timing to ensure portal is fully ready
  useEffect(() => {
    if (isOpen) {
      // Reset map render state when opening
      setShouldRenderMap(false);
      
      // Delay map rendering to ensure dialog portal and animations are complete
      const timer = setTimeout(() => {
        setShouldRenderMap(true);
      }, 300); // Wait 300ms after dialog opens
      
      return () => {
        clearTimeout(timer);
      };
    } else {
      // Immediately hide map when closing
      setShouldRenderMap(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">
            Select Delivery Address
          </DialogTitle>
          <DialogDescription>
            Search for your location or click on the map to select your delivery address.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {/* Only render MapSelector when modal is open AND portal is stable */}
          {isOpen && shouldRenderMap ? (
            <MapSelector
              onAddressSelect={handleAddressSelect}
              onClose={onClose}
            />
          ) : isOpen ? (
            <div className="flex items-center justify-center h-[400px] bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Preparing map interface...</p>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { Address };