"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { CalendarIcon, LogIn, UserPlus, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/app/context/Authcontext';

export interface CheckoutPlanInfo {
  name: string;
  price: number;
  juicePrice: number;
  juiceAdded: boolean;
  selectedJuices: string[];
  type: 'subscription' | 'trial';
  hasEgg: boolean;
  extraEggCount?: number;
}

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  planInfo: CheckoutPlanInfo | null;
}

/*
 * Delivery Areas
 *
 * Areas are separated into two categories:
 * 1. Areas Near Whitefield / Marathahalli
 * 2. Areas Near Dasarahalli
 *
 * Soladevanahalli is the center point for the Dasarahalli area.
 */

const locationGroups = [
  {
    label: "Areas Near Whitefield / Marathahalli",
    locations: [
      "Brookefield - Whitefield",
      "Munnekollal - Marathahalli",
      "Kadubeesanahalli - Marathahalli",
      "Hoodi - Marathahalli",
      "ITPL - Whitefield",
      "Doddenakundi - Marathahalli",
      "Panathur - Marathahalli",
      "Garudachar Palya - Marathahalli",
      "Kundalahalli - Whitefield",
      "Varthur - Whitefield",
      "Hope Farm Junction - Whitefield",
      "Siddapura - Whitefield",
      "Madhevpura",
    ],
  },
  {
    label: "Areas Near Dasarahalli",
    locations: [
      "Soladevanahalli - Center",
      "Chikkabanavara",
      "Thammenahalli",
      "Sasiveghatta",
      "Hesaraghatta",
      "Bagalakunte",
      "Nagasandra",
      "T. Dasarahalli",
      "Chokkasandra",
      "Peenya",
      "Jalahalli West",
      "Dodda Bidarakallu",
      "Mallasandra",
      "Madavara",
      "Bhuvaneshwari Nagar",
    ],
  },
];

// Customer-facing discount a valid referral code unlocks — mirrors
// REFERRAL_DISCOUNTS on the backend and the Greezo Referral & Subscription
// Commission Structure doc. Trial orders can still use a code (it links the
// order to the vendor) but get ₹0 off.
const REFERRAL_DISCOUNTS = { trial: 0, weekly: 99, monthly: 250 } as const;

type ReferralStatus = 'idle' | 'checking' | 'valid' | 'invalid';

export function CheckoutDialog({ isOpen, onClose, planInfo }: CheckoutDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi'>('cod');
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [preferredShift, setPreferredShift] = useState('');
  const [nearbyLocation, setNearbyLocation] = useState('');
  const [address, setAddress] = useState('');
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const [referralCode, setReferralCode] = useState('');
  const [referralStatus, setReferralStatus] = useState<ReferralStatus>('idle');
  const [referralVendorName, setReferralVendorName] = useState('');

  const { user, token } = useAuth();

  const [errors, setErrors] = useState<
    Partial<
      Record<
        'customerName' |
        'phoneNumber' |
        'selectedDate' |
        'preferredShift' |
        'address' |
        'nearbyLocation',
        string
      >
    >
  >({});

  const { toast } = useToast();

  const disabledDays = (date: Date) => {
    const now = new Date();

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // Disable past dates
    if (date < today) {
      return true;
    }

    // For trial plan, disable today if it's after the last slot cutoff (5 PM)
    if (
      planInfo?.type === 'trial' &&
      date.getTime() === today.getTime() &&
      now.getHours() >= 17
    ) {
      return true;
    }

    // Disable Sundays
    if (date.getDay() === 0) {
      return true;
    }

    return false;
  };

  const availableShifts = useMemo(() => {
    if (!selectedDate) return [];

    const allShifts = [
      '6-7 AM',
      '7-8 AM',
      '8-9 AM',
      '9-10 AM',
      '6-7 PM',
      '7-8 PM',
      '8-9 PM',
    ];

    if (planInfo?.type !== 'trial') {
      return allShifts;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selDate = new Date(selectedDate);
    selDate.setHours(0, 0, 0, 0);

    const isToday = selDate.getTime() === today.getTime();
    const currentHour = new Date().getHours();

    if (isToday) {
      const eveningShifts = [
        '6-7 PM',
        '7-8 PM',
        '8-9 PM',
      ];

      if (currentHour >= 17) {
        // All today's shifts are closed
        return [];
      }

      if (currentHour >= 15) {
        // Show only 6-7 PM and 7-8 PM shifts
        return eveningShifts.filter(
          (shift) => shift !== '8-9 PM'
        );
      }

      return eveningShifts;
    }

    // For future dates, show all shifts
    return allShifts;
  }, [selectedDate, planInfo?.type]);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      let initialDate = new Date(now);

      // If today is Sunday, default to Monday
      if (initialDate.getDay() === 0) {
        initialDate.setDate(initialDate.getDate() + 1);
      }

      // For trial after 5 PM, default to tomorrow
      if (
        planInfo?.type === 'trial' &&
        now.getHours() >= 17
      ) {
        initialDate = new Date(
          now.setDate(now.getDate() + 1)
        );
      }

      setSelectedDate(initialDate);
    } else {
      // Reset form on close
      setCustomerName('');
      setPhoneNumber('');
      setPreferredShift('');
      setAddress('');
      setNearbyLocation('');
      setErrors({});
      setPaymentMethod('cod');
      setSelectedDate(undefined);
      setReferralCode('');
      setReferralStatus('idle');
      setReferralVendorName('');
    }
  }, [isOpen, planInfo?.type]);

  // Prefill from the logged-in customer's account so they don't retype it.
  useEffect(() => {
    if (isOpen && user) {
      setCustomerName((prev) => prev || user.name || '');
      setPhoneNumber((prev) => prev || user.phone || '');
    }
  }, [isOpen, user]);

  // Live-validate the referral code (debounced) against the backend, which
  // is the source of truth for which vendor a code belongs to.
  useEffect(() => {
    const code = referralCode.trim();
    if (!code) {
      setReferralStatus('idle');
      setReferralVendorName('');
      return;
    }

    setReferralStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/backend/referral/validate/${encodeURIComponent(code)}`);
        const data = await res.json();
        if (data.success) {
          setReferralStatus('valid');
          setReferralVendorName(data.vendorName || '');
        } else {
          setReferralStatus('invalid');
          setReferralVendorName('');
        }
      } catch {
        setReferralStatus('invalid');
        setReferralVendorName('');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [referralCode]);

  useEffect(() => {
    if (
      selectedDate &&
      planInfo?.type === 'trial'
    ) {
      const isToday =
        new Date(selectedDate).setHours(0, 0, 0, 0) ===
        new Date().setHours(0, 0, 0, 0);

      if (
        isToday &&
        availableShifts.length === 0
      ) {
        toast({
          title: "Today's slots are full",
          description:
            "Today's delivery slots are full. Please select tomorrow.",
        });
      }
    }
  }, [
    selectedDate,
    availableShifts,
    planInfo?.type,
    toast,
  ]);

  if (!planInfo) return null;

  const handlingCharge = 2;

  const eggPrice =
    (planInfo.extraEggCount || 0) * 12;

  const planBucket: 'trial' | 'weekly' | 'monthly' | 'other' =
    planInfo.type === 'trial'
      ? 'trial'
      : planInfo.name.toLowerCase().includes('weekly')
      ? 'weekly'
      : planInfo.name.toLowerCase().includes('monthly')
      ? 'monthly'
      : 'other';

  const referralDiscount =
    referralStatus === 'valid' ? REFERRAL_DISCOUNTS[planBucket as 'trial' | 'weekly' | 'monthly'] || 0 : 0;

  const totalPrice =
    planInfo.price +
    (planInfo.juiceAdded
      ? planInfo.juicePrice
      : 0) +
    eggPrice +
    handlingCharge -
    referralDiscount;

  const planNameWithEgg =
    planInfo.type === 'subscription'
      ? `${planInfo.name} (${planInfo.hasEgg ? 'Egg' : 'Veg'})`
      : planInfo.name;

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!customerName.trim()) {
      newErrors.customerName =
        'Name is required';
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      newErrors.phoneNumber =
        'Please enter a valid 10-digit phone number';
    }

    if (!selectedDate) {
      newErrors.selectedDate =
        'Start date is required';
    }

    if (!preferredShift) {
      newErrors.preferredShift =
        'Please select a shift';
    }

    if (!nearbyLocation) {
      newErrors.nearbyLocation =
        'Nearby Location is required';
    }

    if (!address.trim()) {
      newErrors.address =
        'Address is required';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleConfirmOrder = async () => {
    if (paymentMethod === 'upi') {
      return;
    }

    if (!token) {
      setShowLoginPrompt(true);
      return;
    }

    if (!validateForm()) {
      toast({
        title: "Incomplete Form",
        description:
          "Please fill in all required fields correctly.",
        variant: "destructive",
      });

      return;
    }

    if (referralStatus === 'checking') {
      toast({
        title: 'Checking referral code',
        description: "Hang on a moment while we verify that code.",
      });
      return;
    }

    if (referralCode.trim() && referralStatus === 'invalid') {
      toast({
        title: 'Invalid referral code',
        description: 'Remove the code or double-check it before placing your order.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: "Placing your order",
      description:
        "Please wait a moment while we save your order.",
    });

    setIsPlacingOrder(true);

    // Persist the order to Postgres via the Express backend so it shows up on
    // the Order Confirmation page. If this fails we still let the customer
    // continue to WhatsApp (don't block checkout on a backend hiccup), but we
    // surface a toast so it's not silently lost.
    try {
      const response = await fetch('/api/backend/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerName,
          phoneNumber,
          address: `${nearbyLocation ? `${nearbyLocation} - ` : ''}${address}`,
          nearbyLocation,
          plan: planNameWithEgg,
          mealType: planInfo.type,
          juicePack: planInfo.juiceAdded ? 'Yes' : 'No',
          selectedJuices: planInfo.selectedJuices?.join(', ') || undefined,
          startDate: selectedDate ? format(selectedDate, 'PPP') : 'ASAP',
          preferredShift,
          price: String(totalPrice),
          paymentMethod: 'Cash on Delivery',
          referralCode: referralStatus === 'valid' ? referralCode.trim() : undefined,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        console.error('Failed to save order to backend:', result.error);
        toast({
          title: 'Order not saved',
          description:
            result.error || "Something went wrong saving your order. Please try again or contact us directly.",
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Order placed!',
        description:
          "We've received your order. You'll get a WhatsApp confirmation from GREEZO shortly.",
      });

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error saving order to backend:', err);
      toast({
        title: 'Order not saved',
        description:
          "Couldn't reach our server. Please check your connection and try again.",
        variant: 'destructive',
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <>
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">

        <DialogHeader>
          <DialogTitle className="text-2xl">
            Confirm Your Order
          </DialogTitle>

          <DialogDescription>
            Review your plan and choose a payment method.
          </DialogDescription>
        </DialogHeader>

        {/* Plan Info */}
        <div className="my-4 p-4 bg-muted/50 rounded-lg border">

          <h3 className="font-semibold text-lg mb-2">
            {planNameWithEgg}
          </h3>

          <div className="flex justify-between text-sm">
            <span>Base Plan</span>

            <span className="font-rupees rupee-symbol">
              ₹{planInfo.price}
            </span>
          </div>

          {planInfo.juiceAdded && (
            <div className="flex justify-between text-sm">
              <span>Juice Pack</span>

              <span className="font-rupees rupee-symbol">
                ₹{planInfo.juicePrice}
              </span>
            </div>
          )}

          {planInfo.extraEggCount &&
            planInfo.extraEggCount > 0 && (
              <div className="flex justify-between text-sm">
                <span>
                  Extra Eggs (x
                  {planInfo.extraEggCount})
                </span>

                <span className="font-rupees rupee-symbol">
                  ₹
                  {planInfo.extraEggCount * 12}
                </span>
              </div>
            )}

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Handling Charge</span>

            <span className="font-rupees rupee-symbol">
              ₹{handlingCharge}
            </span>
          </div>

          <div className="border-t my-2"></div>

          <div className="flex justify-between font-bold text-md">
            <span>Total Price</span>

            <span className="font-rupees rupee-symbol">
              ₹{totalPrice}
            </span>
          </div>

        </div>

        {/* Payment Method Selection */}
        <div className="space-y-4">

          <Label className="text-md font-semibold">
            Select Payment Method
          </Label>

          <RadioGroup
            defaultValue="cod"
            value={paymentMethod}
            onValueChange={(value) =>
              setPaymentMethod(
                value as 'cod' | 'upi'
              )
            }
          >

            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="cod"
                id="cod"
              />

              <Label htmlFor="cod">
                Cash On Delivery (COD)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="upi"
                id="upi"
              />

              <Label htmlFor="upi">
                UPI Payment
              </Label>
            </div>

          </RadioGroup>
        </div>

        {paymentMethod === 'upi' && (
          <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-r-lg animate-in fade-in-50">

            <h4 className="font-bold">
              Pay via UPI (Currently Unavailable)
            </h4>

            <p className="text-sm mt-1">
              Due to a high volume of orders and recent UPI
              security restrictions, we’re temporarily
              disabling UPI payments to ensure smooth service
              for all our customers. We appreciate your
              understanding and recommend you select Cash On
              Delivery for now.
            </p>

          </div>
        )}

        {paymentMethod === 'cod' && (
          <div className="mt-6 space-y-4 animate-in fade-in-50">

            <h3 className="font-semibold text-lg border-t pt-4">
              Delivery Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <Label htmlFor="name">
                  Customer Name
                </Label>

                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) =>
                    setCustomerName(e.target.value)
                  }
                  placeholder="Your Name"
                />

                {errors.customerName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.customerName}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">
                  Phone Number
                </Label>

                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(e.target.value)
                  }
                  placeholder="10-digit number"
                />

                {errors.phoneNumber && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

            </div>

            {/* Vendor Referral Code */}
            <div>
              <Label htmlFor="referral-code">
                Vendor Referral Code (optional)
              </Label>

              <div className="relative">
                <Input
                  id="referral-code"
                  value={referralCode}
                  onChange={(e) =>
                    setReferralCode(e.target.value.toUpperCase())
                  }
                  placeholder="Enter code if a vendor referred you"
                  className="pr-9 uppercase placeholder:normal-case"
                />

                {referralStatus === 'checking' && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}

                {referralStatus === 'valid' && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                )}

                {referralStatus === 'invalid' && (
                  <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                )}
              </div>

              {referralStatus === 'valid' && (
                <p className="text-green-600 text-xs mt-1">
                  Referred by {referralVendorName || 'a Greezo vendor'}
                  {referralDiscount > 0 && (
                    <> — Rs {referralDiscount} off applied</>
                  )}
                </p>
              )}

              {referralStatus === 'invalid' && (
                <p className="text-red-500 text-xs mt-1">
                  Invalid referral code
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <Label htmlFor="start-date">
                  Start Date
                </Label>

                <Popover
                  open={isDatePickerOpen}
                  onOpenChange={setDatePickerOpen}
                >

                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      id="start-date"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate &&
                          "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />

                      {selectedDate
                        ? format(
                            selectedDate,
                            "PPP"
                          )
                        : (
                          <span>
                            Pick a date
                          </span>
                        )}
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0">

                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {

                        if (
                          date &&
                          date.getDay() === 0
                        ) {
                          toast({
                            title:
                              "Sunday not available",
                            description:
                              "Sorry, we do not deliver on Sundays.",
                            variant:
                              "destructive",
                          });

                          setDatePickerOpen(true);

                          return;
                        }

                        setSelectedDate(date);
                        setDatePickerOpen(false);

                        // Reset shift when date changes
                        setPreferredShift('');
                      }}
                      disabled={disabledDays}
                      initialFocus
                    />

                  </PopoverContent>
                </Popover>

                {planInfo.type === 'trial' && (
                  <p className="text-xs text-muted-foreground mt-1.5 px-1">
                    Order before 5PM for todays evening Shift
                    or order for tommorow Shift
                  </p>
                )}

                {errors.selectedDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.selectedDate}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="shift">
                  Preferred Shift
                </Label>

                <Select
                  onValueChange={setPreferredShift}
                  value={preferredShift}
                  disabled={!selectedDate}
                >

                  <SelectTrigger id="shift">
                    <SelectValue
                      placeholder="Select a time slot"
                    />
                  </SelectTrigger>

                  <SelectContent>
                    {availableShifts.map(
                      (shift) => (
                        <SelectItem
                          key={shift}
                          value={shift}
                        >
                          {shift}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>

                </Select>

                {errors.preferredShift && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.preferredShift}
                  </p>
                )}
              </div>

            </div>

            {/* Nearby Location */}
            <div>

              <Label htmlFor="location">
                Nearby Location
              </Label>

              <Select
                onValueChange={setNearbyLocation}
                value={nearbyLocation}
              >

                <SelectTrigger id="location">
                  <SelectValue placeholder="Select your nearby location" />
                </SelectTrigger>

                <SelectContent>

                  {locationGroups.map(
                    (group) => (
                      <div key={group.label}>

                        {/* Category heading */}
                        <div className="px-2 py-2 text-sm font-bold text-muted-foreground bg-muted/50">
                          {group.label}
                        </div>

                        {group.locations.map(
                          (location) => (
                            <SelectItem
                              key={location}
                              value={location}
                            >
                              {location}
                            </SelectItem>
                          )
                        )}

                      </div>
                    )
                  )}

                </SelectContent>

              </Select>

              {errors.nearbyLocation && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.nearbyLocation}
                </p>
              )}

            </div>

            {/* Full Address */}
            <div>

              <Label htmlFor="address">
                Full Address
              </Label>

              <Input
                id="address"
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                placeholder="House No, Street, Landmark..."
              />

              {errors.address && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.address}
                </p>
              )}

            </div>

          </div>
        )}

        <DialogFooter className="mt-6">

          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={handleConfirmOrder}
            disabled={paymentMethod === 'upi'}
          >
            {paymentMethod === 'cod'
              ? 'Confirm Order'
              : 'Proceed to Order'}
          </Button>

        </DialogFooter>

      </DialogContent>
    </Dialog>

    {/* Logged-out state: proper popup with buttons to Login / Register,
        instead of a toast that's easy to miss. */}
    <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
      <AlertDialogContent className="sm:max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Please log in to order</AlertDialogTitle>
          <AlertDialogDescription>
            You need an account to place an order. Log in if you already have
            one, or create a free account — it only takes a minute.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button
            className="w-full"
            onClick={() => {
              setShowLoginPrompt(false);
              onClose();
              window.dispatchEvent(new CustomEvent('greezo:open-account', { detail: { tab: 'login' } }));
            }}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Log In
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setShowLoginPrompt(false);
              onClose();
              window.dispatchEvent(new CustomEvent('greezo:open-account', { detail: { tab: 'register' } }));
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Create Free Account
          </Button>
          <AlertDialogCancel className="mt-0 w-full">Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}