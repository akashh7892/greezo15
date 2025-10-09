
"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { useToast } from '@/hooks/use-toast';
import { CheckoutDialog, type CheckoutPlanInfo } from './CheckoutDialog';
import { JuiceSelectionModal } from './JuiceSelectionModal';
import { Hand } from 'lucide-react';

type Plan = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  type: 'weekly' | 'monthly';
  isComingSoon?: boolean;
};

const plans: Plan[] = [
  { id: 'w-basic', name: 'Basic Weekly Plan', price: 729, originalPrice: 999, type: 'weekly' },
  { id: 'w-pro', name: 'Pro Weekly Plan', price: 1399, originalPrice: 1999, type: 'weekly', isComingSoon: true },
  { id: 'm-basic', name: 'Basic Monthly Plan', price: 2999, originalPrice: 4000, type: 'monthly' },
  { id: 'm-pro', name: 'Pro Monthly Plan', price: 4499, originalPrice: 5999, type: 'monthly', isComingSoon: true },
];

// Monday to Saturday sequence
const eggMealImages = [
  "/images/meals/mix.png",     // Monday - Mix Sprouts Salad
  "/images/meals/corn.png",    // Tuesday - Corn Salad  
  "/images/meals/oats.png",    // Wednesday - Muesli Oats
  "/images/meals/kabul.png",   // Thursday - Kabul Salad
  "/images/meals/rajma.png",   // Friday - Rajma Salad
  "/images/meals/paneer.png"   // Saturday - Paneer Salad
];

const nonEggMealImages = [
  "/vegimages/MIX veg.png",    // Monday - Mix Sprouts Salad
  "/images/non-egg/corn veg.png",   // Tuesday - Corn Salad
  "/images/meals/oats.png",   // Wednesday - Muesli Oats
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
    protein: "25g"
  },
  {
    day: "Tuesday", 
    name: "Corn Salad",
    eggIngredients: ["Boiled Egg (1 large)", "Avocado (1 medium, sliced)", "Corn Salad (1 cup)", "Dry fruits (1 ounce)", "Guava (2 pieces)"],
    nonEggIngredients: ["Watermelon", "Avocado (1 medium, sliced)", "Corn Salad (1 cup)", "Dry fruits (1 ounce)", "Guava (2 pieces)"],
    protein: "15g"
  },
  {
    day: "Wednesday",
    name: "Fruits Muesli bowl", 
    eggIngredients: ["Muesli (1 cup)", "Mixed Berries", "Milk", "Honey","Banana Slices","Apple Slices","Pomogranate"],
    nonEggIngredients: ["Muesli (1 cup)", "Mixed Berries", "Yogurt", "Honey", "Chia Seeds"],
    protein: "12g"
  },
  {
    day: "Thursday",
    name: "Kabul Salad",
    eggIngredients: ["Boiled Egg (1 large)", "Chickpeas (1 cup)", "Dragon Fruit (1 cup diced)", "Sweet potato (1 ounce)", "Almonds (1 ounce)", "Cashews (1 ounce)"],
    nonEggIngredients: ["Muskmelon", "Chickpeas (1 cup)", "Dragon Fruit (1 cup diced)", "Sweet potato (1 ounce)", "Almonds (1 ounce)", "Cashews (1 ounce)"],
    protein: "30g"
  },
  {
    day: "Friday", 
    name: "Rajma Salad",
    eggIngredients: ["Rajma (1 cup)", "Boiled Egg (1 large)", "Pomegranate Arils (a few)", "Broccoli (a few pieces)", "Carrots (a few pieces)", "Almonds (4 pieces)", "Date (1 large)"],
    nonEggIngredients: ["Rajma (1 cup)", "Pineapple", "Pomegranate Arils (a few)", "Broccoli (a few pieces)", "Carrots (a few pieces)", "Almonds (4 pieces)", "Date (1 large)"],
    protein: "28g"
  },
  {
    day: "Saturday",
    name: "Paneer Salad", 
    eggIngredients: ["Sprouted Bean & Paneer Salad (1 cup, mixed)", "Boiled Egg (1 large)", "Apple Chunks (1 medium apple)", "Sapota"],
    nonEggIngredients: ["Sprouted Bean & Paneer Salad (1 cup, mixed)", "Muskmelon", "Apple Chunks (1 medium apple)", "Sapota"],
    protein: "32g"
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

type PlansSectionProps = {
  hasEgg: boolean;
};

export function PlansSection({ hasEgg }: PlansSectionProps) {
  
  // Popup checkout states
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [checkoutPlanInfo, setCheckoutPlanInfo] = useState<CheckoutPlanInfo | null>(null);
  const [showJuiceSelectionModal, setShowJuiceSelectionModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showViewDetailsHint, setShowViewDetailsHint] = useState(false);
  const hintDismissed = useRef(false);
  const plansSectionRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  const getCurrentMealImages = () => {
    const mealImages = hasEgg ? eggMealImages : nonEggMealImages;
    return mealImages; // Return exactly 6 unique images, no repetition
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hintDismissed.current) {
          setShowViewDetailsHint(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = plansSectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const handleDismissHint = () => {
    setShowViewDetailsHint(false);
    hintDismissed.current = true;
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowJuiceSelectionModal(true);
  };

  const handleJuiceSelectionFromModal = (healthySelected: boolean, freshSelected: boolean) => {
    setShowJuiceSelectionModal(false);
    if (selectedPlan) {
      let finalPrice = selectedPlan.price;
      let juicePriceInfo = { healthy: 0, fresh: 0 };

      if (healthySelected) {
        juicePriceInfo.healthy = 349;
      }
      if (freshSelected) {
        juicePriceInfo.fresh = 459;
      }

      setCheckoutPlanInfo({
        name: selectedPlan.name,
        price: finalPrice,
        juicePrice: juicePriceInfo.healthy + juicePriceInfo.fresh, // Total juice price
        juiceAdded: healthySelected || freshSelected,
        selectedJuices: [], // Simplified for this flow
        type: 'subscription',
        hasEgg,
      });
      setShowCheckoutDialog(true);
    }
  };

  const renderPlans = (type: 'weekly' | 'monthly') => {
    return plans
      .filter(p => p.type === type)
      .map((plan, index) => (
        <Card 
          key={plan.id} 
          className="group animate-in fade-in-50 slide-in-from-bottom-4 overflow-hidden rounded-2xl border-2 border-transparent bg-white shadow-lg transition-all duration-300 hover:border-primary hover:shadow-2xl hover:-translate-y-2"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <Collapsible>
            <CardHeader className="p-6">
              <CardTitle className="text-2xl font-bold text-gray-800">{plan.name}</CardTitle>
              <div className="flex items-baseline gap-2 pt-2">
                <span className="text-4xl font-extrabold text-primary font-rupees rupee-symbol">₹{plan.price.toLocaleString()}</span>
                <span className="text-lg line-through text-muted-foreground font-rupees rupee-symbol">₹{plan.originalPrice.toLocaleString()}</span>
              </div>
            </CardHeader>
            <CardFooter className="flex justify-between items-center p-6 bg-slate-50/70 relative">
              {showViewDetailsHint && (plan.id === 'w-basic' || plan.id === 'm-basic') && (
                <div className="absolute -top-20 left-4 w-max max-w-xs p-3 bg-primary text-primary-foreground text-sm rounded-md shadow-lg z-10 animate-scale-in-pop flex flex-col items-center gap-2">
                  <p className="text-center flex items-center gap-1"><Hand className="h-4 w-4" /> View our product by clicking here</p>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="h-6 px-2 text-xs bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
                    onClick={handleDismissHint}>
                    Ok
                  </Button>
                  <div className="absolute -bottom-2 left-8 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-primary"></div>
                </div>
              )}
              <CollapsibleTrigger asChild >
                <Button variant="ghost" disabled={plan.isComingSoon} className="text-primary hover:bg-primary/10">View Details</Button>
              </CollapsibleTrigger>
              {plan.isComingSoon ? (
                <Button disabled className="w-1/2 cursor-not-allowed bg-gray-300">
                  Coming Soon
                </Button>
              ) : (
                <Button onClick={() => handleSelectPlan(plan)} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg transition-shadow">Add to Cart</Button>
              )}
            </CardFooter>
            <CollapsibleContent className="p-6 pt-4">
              <div className="border-t pt-6">
                <h3 className="text-xl font-bold mb-4 text-center text-primary">What's in the plan:</h3>
                <Carousel className="w-full" opts={{ align: "start", loop: true }}>
                  <CarouselContent className="-ml-4">
                    {mealData.map((meal, index) => (
                      <CarouselItem key={meal.day} className="pl-4 basis-5/6">
                        <div className="p-1">
                          <Card className="flex flex-col overflow-hidden h-full rounded-xl border-border/50">
                            <CardHeader className="p-0">
                              <Image src={getCurrentMealImages()[index]} alt={meal.name} width={300} height={200} className="object-cover w-full aspect-[4/3] rounded-t-xl" />
                            </CardHeader>
                            <CardContent className="p-4 flex-grow flex flex-col">
                              <CardTitle className="text-md font-semibold">{meal.day}</CardTitle>
                              <CardDescription className="text-sm mb-2">{meal.name}</CardDescription>
                              <p className="text-xs text-muted-foreground flex-grow">
                                Ingredients: {hasEgg ? meal.eggIngredients.join(', ') : meal.nonEggIngredients.join(', ')}
                              </p>
                              <p className="text-xs font-bold text-primary mt-2">Protein: {meal.protein}</p>
                            </CardContent>
                          </Card>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden sm:flex -left-4" />
                  <CarouselNext className="hidden sm:flex -right-4" />
                </Carousel>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ));
  };

  return (
    <section id="plans" ref={plansSectionRef} className="pt-8 pb-16 sm:pt-12 sm:pb-24" style={{ backgroundColor: '#F0FAF2' }}>
      <div className="container mx-auto px-4 flex flex-col items-center">
        <h2 className="text-3xl sm:text-4xl font-headline font-bold text-primary mb-4 text-center">Our Subscription Plans</h2>
        <p className="text-lg text-muted-foreground mb-6 text-center max-w-2xl">Select a plan that fits your lifestyle. Cancel or switch anytime.</p>
        <Tabs defaultValue="weekly" className="w-full max-w-4xl">
          <TabsList className="grid w-full grid-cols-2 bg-primary/10 rounded-full">
            <TabsTrigger value="weekly" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Weekly Plans</TabsTrigger>
            <TabsTrigger value="monthly" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Monthly Plans</TabsTrigger>
          </TabsList>
          <TabsContent value="weekly">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              {renderPlans('weekly')}
            </div>
          </TabsContent>
          <TabsContent value="monthly">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              {renderPlans('monthly')}
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
        juicePrice={selectedPlan?.type === 'weekly' ? 399 : 1599}
      />
      <CheckoutDialog
        isOpen={showCheckoutDialog}
        onClose={() => setShowCheckoutDialog(false)}
        planInfo={checkoutPlanInfo}
      />
    </section>
  );
}
