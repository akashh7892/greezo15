
"use client";

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { saveOrderToSupabase } from '@/app/actions';
import { CheckCircle, Loader2, Send, ShoppingCart, Sparkles, XCircle, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { TIME_SLOTS } from '@/lib/constants';
import { AddressModal, type Address } from './AddressModal';
import { JuiceSelectionModal } from './JuiceSelectionModal';

type Plan = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  type: 'weekly' | 'monthly';
};

const plans: Plan[] = [
  { id: 'w-basic', name: 'Basic Weekly Plan', price: 729, originalPrice: 999, type: 'weekly' },
  { id: 'm-basic', name: 'Basic Monthly Plan', price: 2999, originalPrice: 3999, type: 'monthly' },
];

// Monday to Saturday sequence
const eggMealImages = [
  "/images/meals/mix.png",     // Monday - Mix Sprouts Salad
  "/images/meals/corn.png",    // Tuesday - Corn Salad  
  "/images/meals/soya.png",    // Wednesday - Soya Salad
  "/images/meals/kabul.png",   // Thursday - Kabul Salad
  "/images/meals/rajma.png",   // Friday - Rajma Salad
  "/images/meals/paneer.png"   // Saturday - Paneer Salad
];

const nonEggMealImages = [
  "/images/non-egg/MIX veg.png",    // Monday - Mix Sprouts Salad
  "/images/non-egg/corn veg.png",   // Tuesday - Corn Salad
  "/images/non-egg/soya veg.png",   // Wednesday - Soya Salad  
  "/images/non-egg/kabul veg.png",  // Thursday - Kabul Salad
  "/images/non-egg/rajma veg.png",  // Friday - Rajma Salad
  "/images/non-egg/paneer veg.png"  // Saturday - Paneer Salad
];

const mealData = [
  {
    day: "Monday",
    name: "Mix Sprouts Salad",
    eggIngredients: ["Boiled Egg (1 large)", "Sprouted Bean Salad (1 cup, mixed)", "Mandarin Orange (1 medium)", "Kiwi (1 medium)", "Almonds (1 ounce)", "Cashews (1 ounce)"],
    nonEggIngredients: ["Grapes", "Sprouted Bean Salad (1 cup, mixed)", "Mandarin Orange (1 medium)", "Kiwi (1 medium)", "Almonds (1 ounce)", "Cashews (1 ounce)"],
    protein: "31.3 - 34.3g"
  },
  {
    day: "Tuesday", 
    name: "Corn Salad",
    eggIngredients: ["Boiled Egg (1 large)", "Avocado (1 medium, sliced)", "Corn Salad (1 cup)", "Dry fruits (1 ounce)", "Guava (2 pieces)"],
    nonEggIngredients: ["Watermelon", "Avocado (1 medium, sliced)", "Corn Salad (1 cup)", "Dry fruits (1 ounce)", "Guava (2 pieces)"],
    protein: "26.7g"
  },
  {
    day: "Wednesday",
    name: "Soya Salad", 
    eggIngredients: ["Boiled Soya with veggies (1 cup)", "Boiled Egg", "Pears chunks", "Plums", "Nuts"],
    nonEggIngredients: ["Boiled Soya with veggies (1 cup)", "Banana", "Pears chunks", "Plums", "Nuts"],
    protein: "33 - 36g"
  },
  {
    day: "Thursday",
    name: "Kabul Salad",
    eggIngredients: ["Boiled Egg (1 large)", "Chickpeas (1 cup)", "Dragon Fruit (1 cup diced)", "Sweet potato (1 ounce)", "Almonds (1 ounce)", "Cashews (1 ounce)"],
    nonEggIngredients: ["Muskmelon", "Chickpeas (1 cup)", "Dragon Fruit (1 cup diced)", "Sweet potato (1 ounce)", "Almonds (1 ounce)", "Cashews (1 ounce)"],
    protein: "33.8g"
  },
  {
    day: "Friday", 
    name: "Rajma Salad",
    eggIngredients: ["Rajma (1 cup)", "Boiled Egg (1 large)", "Pomegranate Arils (a few)", "Broccoli (a few pieces)", "Carrots (a few pieces)", "Almonds (4 pieces)", "Date (1 large)"],
    nonEggIngredients: ["Rajma (1 cup)", "Pineapple", "Pomegranate Arils (a few)", "Broccoli (a few pieces)", "Carrots (a few pieces)", "Almonds (4 pieces)", "Date (1 large)"],
    protein: "23.9g"
  },
  {
    day: "Saturday",
    name: "Paneer Salad", 
    eggIngredients: ["Sprouted Bean & Paneer Salad (1 cup, mixed)", "Boiled Egg (1 large)", "Apple Chunks (1 medium apple)", "Sapota"],
    nonEggIngredients: ["Sprouted Bean & Paneer Salad (1 cup, mixed)", "Muskmelon", "Apple Chunks (1 medium apple)", "Sapota"],
    protein: "28.8 - 33.8g"
  }
];

const juiceImages = [
  "/images/juices/abc-juice.png",
  "/images/juices/amla-juice.png", 
  "/images/juices/brain-booster.png",
  "/images/juices/ginger-lime.png",
  "/images/juices/kokum.png",
  "/images/juices/lime-chia.png"
];

export function PlansSection() {
  const [openCollapsibleId, setOpenCollapsibleId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showJuiceSection, setShowJuiceSection] = useState(false);
  const [showJuiceSelectionModal, setShowJuiceSelectionModal] = useState(false);
  const [juiceAdded, setJuiceAdded] = useState<boolean | null>(null);
  const [selectedJuices, setSelectedJuices] = useState<string[]>([]);
  const [hasEgg, setHasEgg] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  
  // Popup checkout states
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [checkoutJuiceAdded, setCheckoutJuiceAdded] = useState<boolean>(false);
  
  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod' | null>(null);
  
  // Transaction ID for UPI payments
  const [transactionId, setTransactionId] = useState('');
  
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
  
  const { toast } = useToast();

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
    
    // Subscription plans always require transaction ID (UPI only)
    return isBasicValid && validateTransactionId(transactionId);
  }, [customerName, phoneNumber, selectedDate, selectedShift, selectedAddress, transactionId]);

  const getCurrentMealImages = () => {
    const mealImages = hasEgg ? eggMealImages : nonEggMealImages;
    return mealImages; // Return exactly 6 unique images, no repetition
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowJuiceSelectionModal(true);
  };
  
  const handleJuiceSelectionFromModal = (selected: boolean, juices?: string[]) => {
    setJuiceAdded(selected);
    setSelectedJuices(juices || []);
    setShowJuiceSection(true);
  };
  
  const handleJuiceDecision = (add: boolean) => {
    setJuiceAdded(add);
  };

  const handleBookNow = (plan: Plan, juiceAdded: boolean) => {
    setCheckoutPlan(plan);
    setCheckoutJuiceAdded(juiceAdded);
    setShowCheckoutDialog(true);
  };

  const handleChangeJuiceSelection = () => {
    setJuiceAdded(null); // Reset juice decision to show juice selection screen again
    // Keep selectedPlan and showJuiceSection intact so user stays in the flow
  };

  const resetFlow = () => {
    setOpenCollapsibleId(null);
    setSelectedPlan(null);
    setShowJuiceSection(false);
    setShowJuiceSelectionModal(false);
    setJuiceAdded(null);
    setSelectedJuices([]);
    setSelectedDate(undefined);
    setSelectedShift('');
    setSelectedAddress(null);
    setShowAddressModal(false);
    setCustomerName('');
    setPhoneNumber('');
    setPaymentMethod(null);
    setTransactionId('');
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
      transactionId: !validateTransactionId(transactionId) // Always required for subscription plans (UPI only)
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
    
    setError('');
    return true;
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

  const handleConfirmOrder = async () => {
    // Use checkoutPlan if in popup mode, otherwise use selectedPlan
    const planToProcess = checkoutPlan || selectedPlan;
    const juiceAddedToProcess = checkoutPlan ? checkoutJuiceAdded : juiceAdded;
    
    if (!planToProcess) return;
    if (!validateForm()) return;
    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Calculate total price
      let totalPrice = planToProcess.price;
      if (juiceAddedToProcess) {
        totalPrice += 499; // Add juice pack price
      }
      
      // Prepare order data
      const orderData = {
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        plan: planToProcess.name,
        type: hasEgg ? 'Egg' : 'Non-Egg',
        juicePack: juiceAddedToProcess ? 'Yes' : 'No',
        selectedJuices: selectedJuices.length > 0 ? selectedJuices.join(', ') : 'None',
        startDate: selectedDate ? format(selectedDate, 'PPP') : 'ASAP',
        shift: selectedShift || 'Any time',
        address: selectedAddress?.formatted_address || '',
        price: `₹${totalPrice}`,
        paymentMethod: 'UPI Payment', // Subscription plans only support UPI
        transactionId: transactionId.trim() // Include transaction ID from form
      };
      
      // Open UPI payment link first
      const upiLink = `upi://pay?pa=akashpg911@ibl&pn=Akash&am=${totalPrice}&cu=INR&tn=Payment${totalPrice}`;
      window.location.href = upiLink;
      
      // Small delay to allow UPI app to open
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save order to database with transaction ID
      const result = await saveOrderToSupabase(orderData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save order');
      }

      // Reset all states after successful submission
      resetFlow();
      setShowCheckoutDialog(false);
      setCheckoutPlan(null);
      setCheckoutJuiceAdded(false);
      
    } catch (error) {
      console.error('Error processing order:', error);
      setError(error instanceof Error ? error.message : 'Failed to process order');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPlans = (type: 'weekly' | 'monthly') => {
    return plans.filter(p => p.type === type).map(plan => (
      <Collapsible key={plan.id} open={openCollapsibleId === plan.id} onOpenChange={() => setOpenCollapsibleId(openCollapsibleId === plan.id ? null : plan.id)}>
        <Card className="overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-primary">{plan.name}</CardTitle>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-rupees rupee-symbol">₹{plan.price.toLocaleString()}</span>
              <span className="line-through text-muted-foreground font-rupees rupee-symbol">₹{plan.originalPrice.toLocaleString()}</span>
            </div>
          </CardHeader>
          <CardFooter>
            <CollapsibleTrigger asChild>
              <Button className="w-full">View Details</Button>
            </CollapsibleTrigger>
          </CardFooter>
        </Card>
        <CollapsibleContent className="mt-4">
          <Card className="shadow-lg animate-in fade-in-0 zoom-in-95">
            <CardHeader>
              <CardTitle>What's in the {plan.name}?</CardTitle>
              <CardDescription>A week of delicious, healthy meals curated for you.</CardDescription>
            </CardHeader>
            <CardContent>
              <Carousel opts={{ align: 'start', loop: true }} className="w-full">
                <CarouselContent>
                  {getCurrentMealImages().map((src, index) => {
                    const meal = mealData[index];
                    const ingredients = hasEgg ? meal.eggIngredients : meal.nonEggIngredients;
                    return (
                      <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                        <div className="p-1">
                          <Card className="h-full">
                            <CardContent className="p-4">
                              <Image 
                                src={src} 
                                data-ai-hint="healthy meal box" 
                                alt={`${meal.day} - ${meal.name}`} 
                                width={600} 
                                height={400} 
                                className="rounded-lg mb-3" 
                              />
                              <div className="text-center">
                                <h4 className="font-bold text-primary mb-1">{meal.day}</h4>
                                <h5 className="font-semibold text-sm mb-2">{meal.name}</h5>
                                <div className="text-xs text-muted-foreground mb-2">
                                  <ul className="list-none space-y-1">
                                    {ingredients.map((ingredient, i) => (
                                      <li key={i}>• {ingredient}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="text-xs font-bold text-primary">
                                  Total: {meal.protein} protein
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
              </Carousel>
              {(!showJuiceSection || selectedPlan?.id !== plan.id) && (
                <div className="text-center mt-6">
                  <Button size="lg" onClick={() => handleSelectPlan(plan)}>
                    <ShoppingCart className="mr-2" /> Add to Cart
                  </Button>
                </div>
              )}
            </CardContent>

            {showJuiceSection && selectedPlan?.id === plan.id && juiceAdded === null && (
              <CardContent className="border-t pt-6 animate-in fade-in-0">
                <div className="text-center">
                  <h3 className="text-2xl font-headline font-bold mb-2">Add Fresh Juice Pack?</h3>
                  <p className="text-xl font-bold text-primary mb-4 font-rupees rupee-symbol">Just ₹499</p>
                  <Carousel opts={{ align: 'start', loop: true }} className="w-full max-w-2xl mx-auto mb-6">
                    <CarouselContent>
                      {juiceImages.map((src, index) => (
                        <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                          <div className="p-1">
                              <Image src={src} data-ai-hint="fresh juice" alt={`Juice ${index + 1}`} width={600} height={400} className="rounded-lg" />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                  <div className="flex justify-center gap-4">
                    <Button size="lg" onClick={() => handleJuiceDecision(true)}><Sparkles className="mr-2"/> Yes, Add Juice</Button>
                    <Button size="lg" variant="outline" onClick={() => handleJuiceDecision(false)}>Skip</Button>
                  </div>
                </div>
              </CardContent>
            )}

            {juiceAdded !== null && selectedPlan?.id === plan.id && (
              <CardContent className="border-t pt-6 bg-primary/5 animate-in fade-in-0">
                <div className="text-center">
                  <h3 className="text-2xl font-headline font-bold mb-4">Ready to Order?</h3>
                  
                  {/* Order Summary Preview */}
                  <div className="text-left max-w-md mx-auto bg-card p-4 rounded-lg shadow-sm border space-y-2 mb-6">
                    <div className="flex justify-between items-center">
                        <p className="font-semibold text-muted-foreground">Plan:</p>
                        <p className="font-bold">{selectedPlan.name}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="font-semibold text-muted-foreground">Type:</p>
                        <p className="font-bold">{hasEgg ? '🥚 Egg' : '🥗 Non-Egg'}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="font-semibold text-muted-foreground">Juice Pack:</p>
                        <div className="flex items-center gap-2 font-bold">
                          {juiceAdded ? <CheckCircle className="text-green-500"/> : <XCircle className="text-red-500"/>}
                          <span>{juiceAdded ? 'Yes' : 'No'}</span>
                        </div>
                    </div>
                    {juiceAdded && selectedJuices.length > 0 && (
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-muted-foreground">Selected Juices:</p>
                        <p className="font-bold text-sm">{selectedJuices.slice(0, 2).join(', ')}{selectedJuices.length > 2 ? '...' : ''}</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t">
                        <p className="font-semibold text-muted-foreground">Total Price:</p>
                        <p className="font-bold text-lg font-rupees rupee-symbol">₹{(selectedPlan.price + (juiceAdded ? 499 : 0)).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {/* Change Juice Selection Button */}
                  <div className="mb-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleChangeJuiceSelection}
                    >
                      Change Juice Selection
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      Want to modify your juice preference?
                    </p>
                  </div>
                  
                  {/* Book Now Button */}
                  <Button 
                    size="lg" 
                    className="w-full bg-green-600 hover:bg-green-700 mb-4" 
                    onClick={() => handleBookNow(selectedPlan, juiceAdded)}
                  >
                    Book Now
                  </Button>
                  
                  <p className="text-sm text-muted-foreground">
                    Click "Book Now" to proceed with payment and delivery details
                  </p>
                </div>
              </CardContent>
            )}


          </Card>
        </CollapsibleContent>
      </Collapsible>
    ));
  };

  return (
    <section id="plans" className="py-16 sm:py-24 bg-card">
      <div className="container mx-auto px-4 flex flex-col items-center">
        <h2 className="text-3xl sm:text-4xl font-headline font-bold text-primary mb-4 text-center">Choose Your Plan</h2>
        <p className="text-lg text-muted-foreground mb-6 text-center max-w-2xl">Select a plan that fits your lifestyle. Cancel or switch anytime.</p>
        
        {/* Egg/Non-Egg Toggle */}
        <div className="flex items-center space-x-3 mb-8">
          <Label htmlFor="egg-toggle" className={`font-semibold ${!hasEgg ? 'text-primary' : 'text-muted-foreground'}`}>
            🥗 Non-Egg
          </Label>
          <Switch 
            id="egg-toggle"
            name="egg-preference"
            checked={hasEgg}
            onCheckedChange={(checked) => setHasEgg(checked)}
            className="data-[state=checked]:bg-yellow-500"
          />
          <Label htmlFor="egg-toggle" className={`font-semibold ${hasEgg ? 'text-yellow-600' : 'text-muted-foreground'}`}>
            🥚 Egg
          </Label>
        </div>
        <Tabs defaultValue="weekly" className="w-full max-w-4xl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">Weekly Plans</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Plans</TabsTrigger>
          </TabsList>
          <TabsContent value="weekly">
            <div className="flex justify-center mt-8">
              <div className="max-w-md w-full">
                {renderPlans('weekly')}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="monthly">
            <div className="flex justify-center mt-8">
              <div className="max-w-md w-full">
                {renderPlans('monthly')}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Juice Selection Modal */}
      <JuiceSelectionModal
        isOpen={showJuiceSelectionModal}
        onClose={() => setShowJuiceSelectionModal(false)}
        onSelect={handleJuiceSelectionFromModal}
        planType="subscription"
        juicePrice={499}
      />

      {/* Address Selection Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAddressSelect={handleAddressSelect}
      />

      {/* Checkout Dialog */}
      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Checkout</DialogTitle>
          </DialogHeader>
          
          {checkoutPlan && (
            <div className="space-y-6">
              {/* Customer Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="checkout-customerName">Your Name *</Label>
                  <Input
                    id="checkout-customerName"
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
                  <Label htmlFor="checkout-phoneNumber">Phone Number *</Label>
                  <Input
                    id="checkout-phoneNumber"
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
                        disabled={(date) => date < new Date()}
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
                      {TIME_SLOTS.MORNING.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1 text-sm font-semibold text-muted-foreground border-t mt-1 pt-2">Evening</div>
                      {TIME_SLOTS.EVENING.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-card p-4 rounded-lg space-y-3 border">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-muted-foreground">Plan:</span>
                  <span className="font-bold">{checkoutPlan.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-muted-foreground">Type:</span>
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle className="text-green-500 h-4 w-4"/>
                    <span>{hasEgg ? 'Egg' : 'Non-Egg'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-muted-foreground">Juice Pack:</span>
                  <div className="flex items-center gap-2 font-bold">
                    {checkoutJuiceAdded ? <CheckCircle className="text-green-500 h-4 w-4"/> : <XCircle className="text-red-500 h-4 w-4"/>}
                    <span>{checkoutJuiceAdded ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                {checkoutJuiceAdded && selectedJuices.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-muted-foreground">Selected Juices:</span>
                    <span className="font-bold text-sm">{selectedJuices.slice(0, 2).join(', ')}{selectedJuices.length > 2 ? '...' : ''}</span>
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
                    <span className="text-xl font-bold text-black font-rupees rupee-symbol">₹{(checkoutPlan.price + (checkoutJuiceAdded ? 499 : 0)).toLocaleString()}</span>
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

              {/* Payment Method Selection - UPI Only for Plans */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Payment Method *</Label>
                  <div className="space-y-2">
                    <Button 
                      size="lg" 
                      className="w-full"
                      variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                      onClick={() => handlePaymentMethodSelect('upi')}
                      disabled={isLoading}
                    >
                      Pay Now (UPI)
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Subscription plans require UPI payment
                    </p>
                  </div>
                </div>

                {/* Transaction ID Field - Always visible for subscription plans */}
                <div className="space-y-4">
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
                    <Label htmlFor="checkout-transactionId">UPI Transaction ID *</Label>
                    <Input
                      id="checkout-transactionId"
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
                
                {/* Process Order Button */}
                {paymentMethod && (
                  <Button 
                    size="lg" 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    onClick={handleConfirmOrder}
                    disabled={isLoading || !isFormValid}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Order...
                      </>
                    ) : (
                      `Confirm Order - Pay ₹${(checkoutPlan.price + (checkoutJuiceAdded ? 499 : 0)).toLocaleString()}`
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
