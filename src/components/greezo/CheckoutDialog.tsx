"use client";

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { saveOrderToSupabase } from '@/app/actions';

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

export function CheckoutDialog({ isOpen, onClose, planInfo }: CheckoutDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi'>('cod');
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [preferredShift, setPreferredShift] = useState('');
  const [nearbyLocation, setNearbyLocation] = useState('');
  const [address, setAddress] = useState('');
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);

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
    }
  }, [isOpen, planInfo?.type]);

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

  const totalPrice =
    planInfo.price +
    (planInfo.juiceAdded
      ? planInfo.juicePrice
      : 0) +
    eggPrice +
    handlingCharge;

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

  const handleConfirmOrder = () => {
    if (paymentMethod === 'upi') {
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

    // Save the confirmed order for the admin dashboard. The existing WhatsApp
    // flow below continues even if the database is temporarily unavailable.
    void saveOrderToSupabase({
      customerName,
      phoneNumber,
      plan: planNameWithEgg,
      type: planInfo.hasEgg ? 'Egg' : 'Veg',
      juicePack: planInfo.juiceAdded ? 'Yes' : 'No',
      selectedJuices: planInfo.selectedJuices.join(', '),
      startDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'ASAP',
      shift: preferredShift,
      address: `${address}, ${nearbyLocation}`,
      price: String(totalPrice),
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'confirmed',
    }).catch((error) => console.error('Order storage failed:', error));

    toast({
      title: "Your order is confirmed",
      description: "You will receive a WhatsApp message within five minutes.",
    });

    const message = `
*New Greezo Order Confirmation*
-----------------------------------
*Name:* ${customerName}
*Phone:* ${phoneNumber}
*Start Date:* ${
      selectedDate
        ? format(selectedDate, 'PPP')
        : 'N/A'
    }
*Preferred Shift:* ${preferredShift}
*Plan:* ${planNameWithEgg}
*Juice Pack:* ${
      planInfo.juiceAdded ? 'Yes' : 'No'
    }
${
      (planInfo.hasEgg &&
        planInfo.type === 'subscription') ||
      (planInfo.extraEggCount &&
        planInfo.extraEggCount > 0)
        ? `*Protein Add-on:* Egg ${
            planInfo.extraEggCount
              ? `(x${planInfo.extraEggCount})`
              : ''
          }`
        : ''
    }
${
      planInfo.juiceAdded &&
      planInfo.selectedJuices.length > 0
        ? `*Selected Juice(s):* ${planInfo.selectedJuices.join(', ')}`
        : ''
    }
*Handling Charge:* ₹${handlingCharge}
*Total Price:* ₹${totalPrice}
*Nearby Location:* ${nearbyLocation}
*Address:* ${address}
*Payment Type:* Cash On Delivery
-----------------------------------
`.trim();

    const whatsappNumber =
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
      '919449614641';

    const whatsappUrl =
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        message
      )}`;

    setTimeout(() => {
      window.open(
        whatsappUrl,
        '_blank'
      );

      onClose();
    }, 3000);
  };

  return (
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
  );
}
