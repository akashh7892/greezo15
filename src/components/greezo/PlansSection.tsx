
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useToast } from '@/hooks/use-toast';
import { getWhatsAppMessage } from '@/app/actions';
import { CheckCircle, Loader2, Send, ShoppingCart, Sparkles, XCircle } from 'lucide-react';

type Plan = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  type: 'weekly' | 'monthly';
};

const plans: Plan[] = [
  { id: 'w-basic', name: 'Basic Weekly Plan', price: 2999, originalPrice: 4000, type: 'weekly' },
  { id: 'w-pro', name: 'Pro Weekly Plan', price: 4500, originalPrice: 6000, type: 'weekly' },
  { id: 'm-basic', name: 'Basic Monthly Plan', price: 10999, originalPrice: 15000, type: 'monthly' },
  { id: 'm-pro', name: 'Pro Monthly Plan', price: 16999, originalPrice: 22000, type: 'monthly' },
];

const dayImages = Array.from({ length: 7 }, (_, i) => `https://picsum.photos/seed/day${i + 1}/600/400`);
const juiceImages = Array.from({ length: 7 }, (_, i) => `https://picsum.photos/seed/juice${i + 1}/600/400`);

export function PlansSection() {
  const [openCollapsibleId, setOpenCollapsibleId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showJuiceSection, setShowJuiceSection] = useState(false);
  const [juiceAdded, setJuiceAdded] = useState<boolean | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowJuiceSection(true);
  };
  
  const handleJuiceDecision = (add: boolean) => {
    setJuiceAdded(add);
  };

  const resetFlow = () => {
    setOpenCollapsibleId(null);
    setSelectedPlan(null);
    setShowJuiceSection(false);
    setJuiceAdded(null);
  }

  const handleConfirmOrder = async () => {
    if (!selectedPlan) return;
    setIsGenerating(true);
    const result = await getWhatsAppMessage({
      selectedPlan: selectedPlan.name,
      'add Juice': !!juiceAdded,
    });

    if (result.success && result.message) {
      const phoneNumber = '9449614641';
      const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(result.message)}`;
      window.open(url, '_blank');
      toast({
        title: "Order on its way!",
        description: "Your WhatsApp is open to confirm the order.",
      });
      resetFlow();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to generate order message.',
      });
    }
    setIsGenerating(false);
  };

  const renderPlans = (type: 'weekly' | 'monthly') => {
    return plans.filter(p => p.type === type).map(plan => (
      <Collapsible key={plan.id} open={openCollapsibleId === plan.id} onOpenChange={() => setOpenCollapsibleId(openCollapsibleId === plan.id ? null : plan.id)}>
        <Card className="overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-primary">{plan.name}</CardTitle>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">₹{plan.price.toLocaleString()}</span>
              <span className="line-through text-muted-foreground">₹{plan.originalPrice.toLocaleString()}</span>
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
                  {dayImages.map((src, index) => (
                    <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                      <div className="p-1">
                          <Image src={src} data-ai-hint="salad bowl" alt={`Day ${index + 1} meal`} width={600} height={400} className="rounded-lg" />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
              {!showJuiceSection && (
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
                  <p className="text-xl font-bold text-primary mb-4">Just ₹559</p>
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
                  <h3 className="text-2xl font-headline font-bold mb-4">Checkout</h3>
                  <div className="text-left max-w-md mx-auto bg-card p-4 rounded-lg shadow-sm border space-y-2 mb-6">
                      <div className="flex justify-between items-center">
                          <p className="font-semibold text-muted-foreground">Plan:</p>
                          <p className="font-bold">{selectedPlan.name}</p>
                      </div>
                      <div className="flex justify-between items-center">
                          <p className="font-semibold text-muted-foreground">Juice Pack:</p>
                          <div className="flex items-center gap-2 font-bold">
                            {juiceAdded ? <CheckCircle className="text-green-500"/> : <XCircle className="text-red-500"/>}
                            <span>{juiceAdded ? 'Yes' : 'No'}</span>
                          </div>
                      </div>
                  </div>
                  <Button size="lg" onClick={handleConfirmOrder} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}
                    Order Now
                  </Button>
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
        <p className="text-lg text-muted-foreground mb-8 text-center max-w-2xl">Select a plan that fits your lifestyle. Cancel or switch anytime.</p>
        <Tabs defaultValue="weekly" className="w-full max-w-4xl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">Weekly Plans</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Plans</TabsTrigger>
          </TabsList>
          <TabsContent value="weekly">
            <div className="grid md:grid-cols-2 gap-8 mt-8">
              {renderPlans('weekly')}
            </div>
          </TabsContent>
          <TabsContent value="monthly">
            <div className="grid md:grid-cols-2 gap-8 mt-8">
              {renderPlans('monthly')}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
