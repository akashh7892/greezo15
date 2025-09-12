
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { CheckoutDialog, type CheckoutPlanInfo } from './CheckoutDialog';
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
  const [showJuiceSelection, setShowJuiceSelection] = useState(false);
  const [hasEgg, setHasEgg] = useState(false); // Trial meal preference
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [checkoutPlanInfo, setCheckoutPlanInfo] = useState<CheckoutPlanInfo | null>(null);

  const handleOrderNow = () => {
    setShowJuiceSelection(true);
  };

  const handleJuiceSelection = (selected: boolean, juices?: string[]) => {
    setShowJuiceSelection(false);
    setCheckoutPlanInfo({
      name: 'Mixed Sprout Salad - Trial',
      price: 69,
      juicePrice: 9,
      juiceAdded: selected,
      selectedJuices: juices || [],
      type: 'trial',
      hasEgg,
    });
    setShowCheckoutDialog(true);
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

      <CheckoutDialog
        isOpen={showCheckoutDialog}
        onClose={() => setShowCheckoutDialog(false)}
        planInfo={checkoutPlanInfo}
      />

      {/* Juice Selection Modal */}
      <JuiceSelectionModal
        isOpen={showJuiceSelection}
        onClose={() => setShowJuiceSelection(false)}
        onSelect={handleJuiceSelection}
        planType="trial"
        juicePrice={9}
      />
    </section>
  );
}
