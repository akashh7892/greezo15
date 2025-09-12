
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { CheckCircle, XCircle, Calendar as CalendarIcon, Loader2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { saveOrderToSupabase } from '@/app/actions';
import { TIME_SLOTS, isSlotAvailable, getSlotRestrictionMessage, hasTimeSlotPassed } from '@/lib/constants';
import { AddressModal, type Address } from './AddressModal';
import { JuiceSelectionModal } from './JuiceSelectionModal';
import Autoplay from "embla-carousel-autoplay";

type HomeSectionProps = {
  onScrollToPlans: () => void;
};

const sliderImages = [
  { src: "/images/splash/delivery-new.jpg", alt: "Now delivering in Marathahalli & Whitefield - Healthy choices made easy", hint: "delivery area announcement" },
  { src: "/images/splash/packaging.png", alt: "Plastic free package - Eco-friendly bagasse trays", hint: "eco-friendly packaging" },
  { src: "/images/splash/offer.png", alt: "Limited offer - Sprouts salad ₹69 plus lime mint juice ₹9", hint: "special offer promotion" },
];

export function HomeSection({ onScrollToPlans }: HomeSectionProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [showJuiceSelection, setShowJuiceSelection] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [hasEgg, setHasEgg] = useState(false); // Trial meal preference
  const [juiceSelected, setJuiceSelected] = useState<boolean>(false);
  const [selectedJuices, setSelectedJuices] = useState<string[]>([]);
  
  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Address selection
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  
  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod' | null>(null);
  
  // Transaction ID for UPI payments
  const [transactionId, setTransactionId] = useState('');
  
  // Pending order data for UPI transactions (stored until transaction ID verified)
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);
  
  // UI states
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

  // Transaction ID validation function - defined before useMemo to prevent hoisting errors
  const validateTransactionId = (id: string): boolean => {
    const trimmedId = id.trim();
    if (!trimmedId) return false;
    if (trimmedId.length < 8) return false;
    if (trimmedId.length > 50) return false;
    // Check for valid characters (alphanumeric and common special chars)
    if (!/^[A-Za-z0-9\-_]+$/.test(trimmedId)) return false;
    return true;
  };

  // Memoized form validation state to prevent infinite re-renders
  const isFormValid = useMemo(() => {
    const isBasicValid = customerName.trim() && 
                        phoneNumber.trim() && 
                        /^[6-9]\d{9}$/.test(phoneNumber.trim()) &&
                        selectedDate && 
                        selectedShift && 
                        selectedAddress;
    
    // For UPI payments, also check transaction ID
    if (paymentMethod === 'upi') {
      return isBasicValid && validateTransactionId(transactionId);
    }
    
    // For COD, only basic validation needed
    return isBasicValid;
  }, [customerName, phoneNumber, selectedDate, selectedShift, selectedAddress, paymentMethod, transactionId]);

  // Clear selected shift when date changes and the selected slot becomes unavailable
  useEffect(() => {
    if (selectedDate && selectedShift) {
      const isCurrentSlotAvailable = isSlotAvailable(selectedDate, selectedShift);
      if (!isCurrentSlotAvailable) {
        setSelectedShift(''); // Clear the selected shift if it's no longer available
        if (fieldErrors.selectedShift) {
          setFieldErrors(prev => ({ ...prev, selectedShift: false }));
        }
      }
    }
  }, [selectedDate, selectedShift, fieldErrors.selectedShift]);

  // Address selection handler
  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setShowAddressModal(false);
    if (fieldErrors.selectedAddress) {
      setFieldErrors(prev => ({ ...prev, selectedAddress: false }));
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {
      customerName: !customerName.trim(),
      phoneNumber: !phoneNumber.trim() || !/^[6-9]\d{9}$/.test(phoneNumber.trim()),
      selectedDate: !selectedDate,
      selectedShift: !selectedShift,
      selectedAddress: !selectedAddress,
      transactionId: paymentMethod === 'upi' ? !validateTransactionId(transactionId) : false
    };

    setFieldErrors(errors);

    // Set error message for the first error found
    if (errors.customerName) {
      setError('Please enter your name');
      return false;
    }
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(phoneNumber.trim())) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    if (errors.selectedDate) {
      setError('Please select a start date');
      return false;
    }
    if (errors.selectedShift) {
      setError('Please select a preferred shift');
      return false;
    }
    if (errors.selectedAddress) {
      setError('Please add your delivery address');
      return false;
    }
    if (errors.transactionId) {
      setError('Please enter a valid transaction ID for UPI payment');
      return false;
    }
    
    // Additional validation: Check if selected time slot is still available
    if (selectedDate && selectedShift && !isSlotAvailable(selectedDate, selectedShift)) {
      setError('Selected time slot is no longer available. Please choose another shift.');
      setSelectedShift(''); // Clear the invalid selection
      return false;
    }
    
    setError('');
    return true;
  };

  const handleOrderNow = () => {
    setShowJuiceSelection(true);
  };

  const handleJuiceSelection = (selected: boolean, juices?: string[]) => {
    setJuiceSelected(selected);
    setSelectedJuices(juices || []);
    setShowCheckout(true);
  };


  const handlePaymentMethodSelect = (method: 'upi' | 'cod') => {
    // Validate form first to show red outlines
    const isValid = validateForm();
    
    // Only set payment method if validation passes
    if (isValid) {
      setPaymentMethod(method);
      setError(''); // Clear any existing errors
    }
  };

  const handleFinalOrder = async () => {
    if (!validateForm()) return;
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Calculate total price
      const totalPrice = 69 + (juiceSelected ? 9 : 0);
      
      // Prepare order data
      const orderData = {
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        plan: 'Mixed Sprout Salad - Trial',
        type: hasEgg ? 'Egg' : 'Non-Egg',
        juicePack: juiceSelected ? 'Yes' : 'No',
        selectedJuices: selectedJuices.join(', ') || 'None',
        startDate: selectedDate ? format(selectedDate, 'PPP') : 'ASAP',
        shift: selectedShift || 'Any time',
        address: selectedAddress?.formatted_address || '',
        price: `₹${totalPrice}`,
        paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI Payment',
        ...(paymentMethod === 'upi' && { transactionId: transactionId.trim() })
      };
      
      // For UPI payments, open payment link first
      if (paymentMethod === 'upi') {
        const upiLink = `upi://pay?pa=akashpg911@ibl&pn=Akash&am=${totalPrice}&cu=INR&tn=Payment${totalPrice}`;
        window.location.href = upiLink;
        
        // Small delay to allow UPI app to open
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Save order to database (with transaction ID if UPI)
      const result = await saveOrderToSupabase(orderData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save order');
      }
      
      // Reset and close
      setShowCheckout(false);
      setSelectedDate(undefined);
      setSelectedShift('');
      setCustomerName('');
      setPhoneNumber('');
      setSelectedAddress(null);
      setPaymentMethod(null);
      setTransactionId('');
      setJuiceSelected(false);
      setSelectedJuices([]);
      
    } catch (error) {
      console.error('Error processing order:', error);
      setError(error instanceof Error ? error.message : 'Failed to process order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="home" className="py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-headline font-bold text-primary leading-tight mb-4">
              Welcome to Greezo
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8">
              Fresh, Natural & Healthy Meals, Delivered.
            </p>
            <Button size="lg" onClick={onScrollToPlans}>
              View Plans
            </Button>
          </div>
          <div>
            <Carousel
              plugins={[
                Autoplay({
                  delay: 3000,
                  stopOnInteraction: true,
                }),
              ]}
              className="w-full"
              opts={{
                loop: true,
              }}
            >
              <CarouselContent>
                {sliderImages.map((image, index) => (
                  <CarouselItem key={index}>
                    <Card>
                      <CardContent className="p-0">
                        <Image
                          src={image.src}
                          alt={image.alt}
                          data-ai-hint={image.hint}
                          width={1200}
                          height={800}
                          className="rounded-lg object-cover aspect-video"
                          priority={index === 0}
                        />
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
        
        {/* Trial Product Section */}
        <div className="mt-16 text-center">
          <div className="max-w-md mx-auto">
            {/* Egg/Non-Egg Toggle for Trial */}
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Label htmlFor="trial-egg-toggle" className={`font-semibold ${!hasEgg ? 'text-primary' : 'text-muted-foreground'}`}>
                🥗 Non-Egg
              </Label>
              <Switch 
                id="trial-egg-toggle"
                name="trial-egg-preference"
                checked={hasEgg}
                onCheckedChange={(checked) => setHasEgg(checked)}
                className="data-[state=checked]:bg-yellow-500"
              />
              <Label htmlFor="trial-egg-toggle" className={`font-semibold ${hasEgg ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                🥚 Egg
              </Label>
            </div>
            <Card className="shadow-xl border-2 border-primary/20 relative overflow-visible">
              {/* Welcome Offer Tab */}
              <div className="absolute -top-0 left-4 bg-red-600 text-white px-4 py-2 text-sm font-bold transform -rotate-12 shadow-lg z-10" style={{clipPath: 'polygon(0% 0%, 90% 0%, 100% 100%, 10% 100%)'}}>
                Welcome Offer
              </div>
              <CardContent className="p-6">
                <Image
                  src={hasEgg ? "/images/meals/mix.png" : "/vegimages/MIX veg.png"}
                  alt={`Mixed ${hasEgg ? 'Egg' : 'Veg'} Meal - Trial Offer`}
                  data-ai-hint="trial meal box"
                  width={400}
                  height={300}
                  className="rounded-lg mb-4 mx-auto"
                />
                <h3 className="text-2xl font-headline font-bold text-primary mb-2">
                  Mixed Sprout Salad {hasEgg ? '(Egg)' : '(Veg)'}
                </h3>
                <div className="flex items-baseline justify-center gap-2 mb-4">
                  <span className="text-3xl font-bold text-black font-rupees rupee-symbol">₹69</span>
                  <span className="line-through text-muted-foreground font-rupees rupee-symbol">₹119</span>
                </div>
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handleOrderNow}
                >
                  Order Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
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
              {/* Start Date */}
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
                        today.setHours(0, 0, 0, 0); // Reset to start of day
                        const compareDate = new Date(date);
                        compareDate.setHours(0, 0, 0, 0); // Reset to start of day
                        return compareDate < today; // Only disable dates before today
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Preferred Shift */}
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
                {/* Time slot restriction message */}
                {selectedDate && (
                  <div className="mt-2">
                    {(() => {
                      const now = new Date();
                      const currentHour = now.getHours();
                      const currentMinute = now.getMinutes();
                      const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
                      
                      // Check if any evening slots are disabled for today
                      const isToday = selectedDate.toDateString() === now.toDateString();
                      const isEveningDisabled = isToday && currentHour >= 15;
                      
                      // Check if future date booking is disabled
                      const isFuture = selectedDate > now && selectedDate.toDateString() !== now.toDateString();
                      const isFutureBookingDisabled = isFuture && currentHour === 0; // At midnight (12:00 AM)
                      
                      if (isEveningDisabled) {
                        return (
                          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                            📅 Slots are filled, book in the next shift
                          </p>
                        );
                      }
                      
                      if (isFutureBookingDisabled) {
                        return (
                          <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                            🔒 Booking window closed, please try again later.
                          </p>
                        );
                      }
                      
                      // Show helpful info about upcoming cutoffs
                      if (isToday && currentHour < 15) {
                        const hoursLeft = 15 - currentHour;
                        return (
                          <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
                            ✅ Evening slots available for {hoursLeft} more hours
                          </p>
                        );
                      }
                      
                      return null;
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-card p-4 rounded-lg space-y-3 border">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">Plan:</span>
                <span className="font-bold">Mixed Sprout Salad - Trial ({hasEgg ? 'Egg' : 'Veg'})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">Type:</span>
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle className="text-green-500 h-4 w-4"/>
                  <span>{hasEgg ? '🥚 Egg' : '🥗 Non-Egg'}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">Juice Pack:</span>
                <div className="flex items-center gap-2 font-bold">
                  {juiceSelected ? <CheckCircle className="text-green-500 h-4 w-4"/> : <XCircle className="text-red-500 h-4 w-4"/>}
                  <span>{juiceSelected ? 'Yes' : 'No'}</span>
                </div>
              </div>
              {juiceSelected && selectedJuices.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-muted-foreground">Selected Juice:</span>
                  <span className="font-bold text-sm">{selectedJuices[0]}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">Start Date:</span>
                <span className="font-bold">{selectedDate ? format(selectedDate, "MMM dd") : 'ASAP'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">Shift:</span>
                <span className="font-bold">{selectedShift || 'Any time'}</span>
              </div>
              {selectedAddress && (
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-muted-foreground">Address:</span>
                  <div className="flex-1 text-right">
                    <div className="space-y-1">
                      <span className="font-bold text-sm block">{selectedAddress.formatted_address}</span>
                      <span className="text-xs text-muted-foreground/70 block">
                        Coordinates: {selectedAddress.lat.toFixed(6)}°, {selectedAddress.lng.toFixed(6)}°
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-semibold text-muted-foreground">Price:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-black font-rupees rupee-symbol">₹{69 + (juiceSelected ? 9 : 0)}</span>
                  <span className="line-through text-muted-foreground font-rupees rupee-symbol">₹{119 + (juiceSelected ? 9 : 0)}</span>
                </div>
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

            {/* Payment Method Selection - Both UPI and COD for Trial */}
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Payment Method *</Label>
                <div className="space-y-3">
                  <Button 
                    size="lg" 
                    className="w-full"
                    variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                    onClick={() => handlePaymentMethodSelect('upi')}
                    disabled={isLoading}
                  >
                    Pay Now (UPI)
                  </Button>
                  <div className="text-center">
                    <span className="text-sm text-muted-foreground">or</span>
                  </div>
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
              </div>

              {/* Transaction ID Field - Only for UPI */}
              {paymentMethod === 'upi' && (
                <div className="space-y-4 animate-in fade-in-0">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">
                        MANDATORY
                      </div>
                      <p className="text-sm text-blue-700 font-semibold">
                        Transaction ID Required
                      </p>
                    </div>
                    <p className="text-xs text-blue-600">
                      After making UPI payment, enter your transaction ID from your payment app.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="transactionId">UPI Transaction ID *</Label>
                    <Input
                      id="transactionId"
                      type="text"
                      placeholder="Enter transaction ID (e.g., 123456789012)"
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
                    <p className="text-xs text-muted-foreground">
                      Usually 8-50 characters long (letters, numbers, hyphens, underscores)
                    </p>
                    {transactionId && (
                      <div className="mt-1">
                        {validateTransactionId(transactionId) ? (
                          <p className="text-xs text-green-600">
                            ✓ Valid transaction ID format
                          </p>
                        ) : (
                          <p className="text-xs text-red-600">
                            Please check the transaction ID format
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Process Order Button */}
              {paymentMethod && (
                <Button 
                  size="lg" 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  onClick={handleFinalOrder}
                  disabled={isLoading || !isFormValid}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Order...
                    </>
                  ) : (
                    `Confirm Order - ${paymentMethod === 'upi' ? `Pay ₹${69 + (juiceSelected ? 9 : 0)}` : 'Cash on Delivery'}`
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Juice Selection Modal */}
      <JuiceSelectionModal
        isOpen={showJuiceSelection}
        onClose={() => setShowJuiceSelection(false)}
        onSelect={handleJuiceSelection}
        planType="trial"
        juicePrice={9}
      />

      {/* Address Selection Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAddressSelect={handleAddressSelect}
      />
    </section>
  );
}
