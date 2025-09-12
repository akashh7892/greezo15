"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Calendar as CalendarIcon, Loader2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { TIME_SLOTS, isSlotAvailable, getSlotRestrictionMessage } from '@/lib/constants';
import { AddressModal, type Address } from './AddressModal';

export type CheckoutPlanInfo = {
  name: string;
  price: number;
  juicePrice: number;
  juiceAdded: boolean;
  selectedJuices: string[];
  type: 'trial' | 'subscription';
  hasEgg: boolean;
};

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  planInfo: CheckoutPlanInfo | null;
}

export function CheckoutDialog({ isOpen, onClose, planInfo }: CheckoutDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod' | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState({
    customerName: false,
    phoneNumber: false,
    selectedDate: false,
    selectedShift: false,
    selectedAddress: false,
    transactionId: false
  });

  useEffect(() => {
    if (!isOpen) {
      // Reset form when dialog closes
      setSelectedDate(undefined);
      setSelectedShift('');
      setCustomerName('');
      setPhoneNumber('');
      setSelectedAddress(null);
      setPaymentMethod(null);
      setTransactionId('');
      setIsLoading(false);
      setError('');
      setFieldErrors({
        customerName: false,
        phoneNumber: false,
        selectedDate: false,
        selectedShift: false,
        selectedAddress: false,
        transactionId: false
      });
    }
  }, [isOpen]);

  const validateTransactionId = (id: string): boolean => {
    const trimmedId = id.trim();
    if (!trimmedId) return false;
    if (trimmedId.length < 8) return false;
    if (trimmedId.length > 50) return false;
    if (!/^[A-Za-z0-9\-_]+$/.test(trimmedId)) return false;
    return true;
  };

  const isFormValid = useMemo(() => {
    if (!planInfo) return false;
    const isBasicValid = customerName.trim() &&
                        phoneNumber.trim() &&
                        /^[6-9]\d{9}$/.test(phoneNumber.trim()) &&
                        selectedDate &&
                        selectedShift &&
                        selectedAddress;

    if (planInfo.type === 'subscription' || paymentMethod === 'upi') {
      return isBasicValid && validateTransactionId(transactionId);
    }
    if (planInfo.type === 'trial' && paymentMethod === 'cod') {
      return isBasicValid;
    }
    return false;
  }, [customerName, phoneNumber, selectedDate, selectedShift, selectedAddress, paymentMethod, transactionId, planInfo]);

  const validateForm = (skipTransactionIdCheck = false) => {
    if (!planInfo) return false;
    const errors = {
      customerName: !customerName.trim(),
      phoneNumber: !phoneNumber.trim() || !/^[6-9]\d{9}$/.test(phoneNumber.trim()),
      selectedDate: !selectedDate,
      selectedShift: !selectedShift,
      selectedAddress: !selectedAddress,
      transactionId: (planInfo.type === 'subscription' || paymentMethod === 'upi') && !skipTransactionIdCheck ? !validateTransactionId(transactionId) : false
    };

    setFieldErrors(errors);

    if (errors.customerName) { setError('Please enter your name'); return false; }
    if (!phoneNumber.trim()) { setError('Please enter your phone number'); return false; }
    if (!/^[6-9]\d{9}$/.test(phoneNumber.trim())) { setError('Please enter a valid 10-digit phone number'); return false; }
    if (errors.selectedDate) { setError('Please select a start date'); return false; }
    if (errors.selectedShift) { setError('Please select a preferred shift'); return false; }
    if (errors.selectedAddress) { setError('Please add your delivery address'); return false; }
    if (errors.transactionId) { setError('Please enter a valid transaction ID for UPI payment'); return false; }
    
    setError('');
    return true;
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setShowAddressModal(false);
    if (fieldErrors.selectedAddress) {
      setFieldErrors(prev => ({ ...prev, selectedAddress: false }));
    }
  };

  const handlePaymentMethodSelect = (method: 'upi' | 'cod') => {
    const isValid = validateForm(true); // Skip transaction ID check for now
    if (isValid) {
      setPaymentMethod(method);
      setError('');
    }
  };

  const handleInitiateUpiPayment = (skipTransactionIdCheck = false) => {
    if (!planInfo) return;
    if (!validateForm(skipTransactionIdCheck)) return;
    const totalPrice = planInfo.price + (planInfo.juiceAdded ? planInfo.juicePrice : 0);
    const upiLink = `upi://pay?pa=akashpg911@ibl&pn=Akash&am=${totalPrice}&cu=INR&tn=Payment${totalPrice}`;
    window.location.href = upiLink;
  };

  const openWhatsApp = (orderData: any) => {
    const businessNumber = "919449614641";
    const message = `
      New Greezo Order Confirmation:
      ---------------------------------
      Name: ${orderData.customerName}
      Phone: ${orderData.phoneNumber}
      Plan: ${orderData.plan}
      Type: ${orderData.type}
      Juice Pack: ${orderData.juicePack}
      ${orderData.juicePack === 'Yes' ? `Selected Juice(s): ${orderData.selectedJuices}` : ''}
      Start Date: ${orderData.startDate}
      Shift: ${orderData.shift}
      Address: ${orderData.address}
      Total Price: ${orderData.price}
      Payment Method: ${orderData.paymentMethod}
      Transaction ID: ${orderData.transactionId || 'N/A (COD)'}
    `.trim().replace(/\s+/g, ' ');
    const whatsappUrl = `https://wa.me/${businessNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleConfirmOrder = async () => {
    if (!planInfo || !validateForm()) return;
    if (planInfo.type === 'trial' && !paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const totalPrice = planInfo.price + (planInfo.juiceAdded ? planInfo.juicePrice : 0);
      const finalPaymentMethod = planInfo.type === 'subscription' ? 'UPI Payment' : (paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI Payment');

      const orderData = {
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        plan: planInfo.name,
        type: planInfo.hasEgg ? 'Egg' : 'Non-Egg',
        juicePack: planInfo.juiceAdded ? 'Yes' : 'No',
        selectedJuices: planInfo.selectedJuices.join(', ') || 'None',
        startDate: selectedDate ? format(selectedDate, 'PPP') : 'ASAP',
        shift: selectedShift || 'Any time',
        address: selectedAddress?.formatted_address || '',
        price: `₹${totalPrice}`,
        paymentMethod: finalPaymentMethod,
        ...(finalPaymentMethod === 'UPI Payment' && { transactionId: transactionId.trim() })
      };

      console.log('Order data that would be saved:', orderData);
      openWhatsApp(orderData);
      onClose();

    } catch (error) {
      console.error('Error processing order:', error);
      setError(error instanceof Error ? error.message : 'Failed to process order');
    } finally {
      setIsLoading(false);
    }
  };

  if (!planInfo) return null;

  const totalPrice = planInfo.price + (planInfo.juiceAdded ? planInfo.juicePrice : 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Checkout</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Customer Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Your Name *</Label>
              <Input
                id="customerName"
                name="customerName"
                type="text"
                placeholder="Enter your full name"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (fieldErrors.customerName && e.target.value.trim()) {
                    setFieldErrors(prev => ({ ...prev, customerName: false }));
                  }
                }}
                className={`w-full ${fieldErrors.customerName ? 'border-red-500 focus:border-red-500' : ''}`}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhoneNumber(value);
                  if (fieldErrors.phoneNumber && value.trim() && /^[6-9]\d{9}$/.test(value)) {
                    setFieldErrors(prev => ({ ...prev, phoneNumber: false }));
                  }
                }}
                className={`w-full ${fieldErrors.phoneNumber ? 'border-red-500 focus:border-red-500' : ''}`}
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Date and Shift Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={`w-full justify-start text-left font-normal ${fieldErrors.selectedDate ? 'border-red-500 hover:border-red-500' : ''}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "MMM dd, yy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      if (fieldErrors.selectedDate && date) {
                        setFieldErrors(prev => ({ ...prev, selectedDate: false }));
                      }
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>Preferred Shift *</Label>
              <Select 
                value={selectedShift} 
                onValueChange={(value) => {
                  setSelectedShift(value);
                  if (fieldErrors.selectedShift && value) {
                    setFieldErrors(prev => ({ ...prev, selectedShift: false }));
                  }
                }}
              >
                <SelectTrigger className={`w-full ${fieldErrors.selectedShift ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-sm font-semibold text-muted-foreground">Morning</div>
                  {TIME_SLOTS.MORNING.map((slot) => {
                    const isAvailable = isSlotAvailable(selectedDate, slot.value);
                    const restrictionMessage = getSlotRestrictionMessage(selectedDate, slot.value);
                    return (
                      <SelectItem 
                        key={slot.value} 
                        value={slot.value}
                        disabled={!isAvailable}
                        className={!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                        title={restrictionMessage || undefined}
                      >
                        {slot.label}
                      </SelectItem>
                    );
                  })}
                  <div className="px-2 py-1 text-sm font-semibold text-muted-foreground border-t mt-1 pt-2">Evening</div>
                  {TIME_SLOTS.EVENING.map((slot) => {
                    const isAvailable = isSlotAvailable(selectedDate, slot.value);
                    const restrictionMessage = getSlotRestrictionMessage(selectedDate, slot.value);
                    return (
                      <SelectItem 
                        key={slot.value} 
                        value={slot.value}
                        disabled={!isAvailable}
                        className={!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                        title={restrictionMessage || undefined}
                      >
                        {slot.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-card p-4 rounded-lg space-y-3 border">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-muted-foreground">Plan:</span>
              <span className="font-bold">{planInfo.name} ({planInfo.hasEgg ? 'Egg' : 'Veg'})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-muted-foreground">Juice Pack:</span>
              <div className="flex items-center gap-2 font-bold">
                {planInfo.juiceAdded ? <CheckCircle className="text-green-500 h-4 w-4"/> : <XCircle className="text-red-500 h-4 w-4"/>}
                <span>{planInfo.juiceAdded ? 'Yes' : 'No'}</span>
              </div>
            </div>
            {planInfo.juiceAdded && planInfo.selectedJuices.length > 0 && (
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">Selected Juice(s):</span>
                <span className="font-bold text-sm">{planInfo.selectedJuices.join(', ')}</span>
              </div>
            )}
            {selectedAddress && (
              <div className="flex justify-between items-start">
                <span className="font-semibold text-muted-foreground">Address:</span>
                <span className="font-bold text-sm text-right">{selectedAddress.formatted_address}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-semibold text-muted-foreground">Total Price:</span>
              <span className="text-xl font-bold text-black font-rupees rupee-symbol">₹{totalPrice.toLocaleString()}</span>
            </div>
          </div>

          {/* Add Address Button */}
          <div className="mb-4">
            <Button 
              variant="outline" 
              className={`w-full ${fieldErrors.selectedAddress ? 'border-red-500 hover:border-red-500' : ''}`}
              onClick={() => setShowAddressModal(true)}
            >
              <MapPin className="mr-2 h-4 w-4" />
              {selectedAddress ? 'Change Address' : 'Add Address'}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Payment Section */}
          {planInfo.type === 'trial' ? (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Payment Method *</Label>
              <Button 
                size="lg" 
                className="w-full"
                variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                onClick={() => handlePaymentMethodSelect('upi')}
                disabled={isLoading}
              >
                Pay Now (UPI)
              </Button>
              <div className="text-center"><span className="text-sm text-muted-foreground">or</span></div>
              <Button 
                size="lg" 
                className="w-full"
                variant={paymentMethod === 'cod' ? 'default' : 'outline'}
                onClick={() => handlePaymentMethodSelect('cod')}
                disabled={isLoading}
              >
                Cash on Delivery
              </Button>
            </div>
          ) : null}

          {/* Transaction ID Field - Only for UPI */}
          {(planInfo.type === 'subscription' || paymentMethod === 'upi') && (
            <div className="space-y-4 animate-in fade-in-0">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex flex-col gap-3 text-center">
                  <p className="text-sm text-blue-700">1. Click the button below to pay via your UPI app.</p>
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleInitiateUpiPayment(true)}
                    disabled={isLoading}
                  >
                    Pay ₹{totalPrice} via UPI
                  </Button>
                  <p className="text-sm text-blue-700">2. After paying, enter the Transaction ID below to confirm.</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transactionId">UPI Transaction ID *</Label>
                <Input
                  id="transactionId"
                  type="text"
                  placeholder="Enter transaction ID"
                  value={transactionId}
                  onChange={(e) => {
                    setTransactionId(e.target.value);
                    if (fieldErrors.transactionId && validateTransactionId(e.target.value)) {
                      setFieldErrors(prev => ({ ...prev, transactionId: false }));
                    }
                  }}
                  className={`w-full ${fieldErrors.transactionId ? 'border-red-500 focus:border-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
          
          {/* Process Order Button */}
          {(planInfo.type === 'subscription' || paymentMethod) && (
            <Button 
              size="lg" 
              className="w-full bg-green-600 hover:bg-green-700" 
              onClick={handleConfirmOrder}
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
              ) : (
                `Confirm Order`
              )}
            </Button>
          )}
        </div>
        <AddressModal
          isOpen={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          onAddressSelect={handleAddressSelect}
        />
      </DialogContent>
    </Dialog>
  );
}