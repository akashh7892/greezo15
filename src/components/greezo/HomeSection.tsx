
"use client";

import { useState, useRef, useEffect, type RefObject } from 'react';
import Image, { type StaticImageData } from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogContent as DialogContentPrimitive } from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { CheckoutDialog, type CheckoutPlanInfo } from './CheckoutDialog';
import { JuiceSelectionModal } from './JuiceSelectionModal';
import { Plus, Minus, Egg } from 'lucide-react';
import Autoplay from "embla-carousel-autoplay";
import { ContestInfoModal } from './ContestInfoModal';

type HomeSectionProps = {
  onScrollToPlans: () => void; 
  hasEgg: boolean;
};

const sliderImages = [
  { src: "/images/splash/offer.png", alt: " Greezo offer Limited offer - Sprouts salad ₹89 plus lime mint juice ₹9", hint: "special offer promotion" },
  { src: "/images/splash/delivery-new.png", alt: " Greezo delivery Now delivering in Marathahalli & Whitefield - Healthy choices made easy", hint: "delivery area announcement" },
  { src: "/images/splash/packaging.png", alt: "Greezo package Plastic free package - Eco-friendly bagasse trays", hint: "eco-friendly packaging" },
];

export function HomeSection({ onScrollToPlans, hasEgg }: HomeSectionProps) {
  const [showJuiceSelection, setShowJuiceSelection] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [checkoutPlanInfo, setCheckoutPlanInfo] = useState<CheckoutPlanInfo | null>(null);
  const trialSectionRef = useRef<HTMLDivElement>(null);
  const [selectedTrial, setSelectedTrial] = useState<'sprouts' | 'oats' | 'navaratri'>('sprouts');
  const [showContestInfoModal, setShowContestInfoModal] = useState(false);
  const [showEggCounterModal, setShowEggCounterModal] = useState(false);
  const [extraEggCount, setExtraEggCount] = useState(0);
  const [navaratriWithEgg, setNavaratriWithEgg] = useState(false);
  const [showToggleHint, setShowToggleHint] = useState(false);
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const [carouselCurrent, setCarouselCurrent] = useState(0);

  useEffect(() => {
    // This hint now shows in EGG mode and stays until dismissed
    if (hasEgg) {
      setShowToggleHint(true);
    } else {
      setExtraEggCount(0);
      // Immediately hide hint if user switches to veg mode
      setShowToggleHint(false);
    }
  }, [hasEgg]);

  const handleOrderNow = (trialType: 'sprouts' | 'oats' | 'navaratri') => {
    setSelectedTrial(trialType);
    if (hasEgg && (trialType === 'navaratri' || trialType === 'sprouts')) {
      setShowEggCounterModal(true);
    } else {
      setShowJuiceSelection(true);
    }
  };

  const handleJuiceSelection = (healthySelected: boolean, freshSelected: boolean, selectedJuices?: string[], juicePrice?: number) => {
    setShowJuiceSelection(false);
    let planName = 'Muesli Oats - Trial';
    let planHasEgg = false; // Oats doesn't have an egg option
    let price = 149;
    let finalHasEgg = hasEgg;
    let finalJuicePrice = juicePrice !== undefined ? juicePrice : 25;

    if (selectedTrial === 'sprouts') {
      planName = 'Mixed Sprout Salad - Trial';
      price = 99;
      planHasEgg = hasEgg || extraEggCount > 0;
    } else if (selectedTrial === 'navaratri') {
      planName = 'Navaratri Offer - 2 Salads';
      price = 189;
      planHasEgg = extraEggCount > 0;
      finalHasEgg = hasEgg || extraEggCount > 0;
      finalJuicePrice = juicePrice !== undefined ? juicePrice : 45; // Special juice price for combo
    }

    const juiceAdded = healthySelected || freshSelected;

    setCheckoutPlanInfo({
      name: planName, 
      price: price,
      juicePrice: finalJuicePrice,
      juiceAdded: juiceAdded,
      selectedJuices: selectedJuices || [],
      type: 'trial',
      hasEgg: finalHasEgg,
      extraEggCount: extraEggCount,
    });
    setShowCheckoutDialog(true);
  };

  const handleEggCounterConfirm = () => {
    setNavaratriWithEgg(extraEggCount > 0);
    setShowEggCounterModal(false); // Close egg modal
    // Now, proceed to juice selection
    setShowJuiceSelection(true);
  };

  const handleScrollToTrial = () => {
    trialSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <section id="home" className="py-16 sm:py-24">
      {/* Hint for toggling Veg/Non-Veg */}
      {showToggleHint && (        <div className="fixed top-14 right-4 w-max max-w-xs p-3 bg-primary text-primary-foreground text-sm rounded-md shadow-lg z-50 animate-scale-in-pop flex flex-col items-center gap-2">
          <p className="text-center">No need for eggs? Turn to non-egg mode.</p>
          <Button 
            size="sm" 
            variant="secondary" 
            className="h-7 px-3 text-xs bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
            onClick={() => setShowToggleHint(false)}>
            Ok
          </Button>
          <div className="absolute -top-2 right-4 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-primary transform rotate-180"></div>
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-headline font-bold text-primary leading-tight mb-4">Welcome to Greezo</h1>
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
                    <div
                      className="cursor-pointer group focus:outline-none"
                      onClick={handleScrollToTrial}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleScrollToTrial()}
                      role="button"
                      tabIndex={0}
                      aria-label="View trial offer"
                    >
                      <Card className="overflow-hidden group-focus:ring-2 group-focus:ring-primary group-focus:ring-offset-2">
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
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
        
        {/* Ticker Text */}
        <div className="mt-12 overflow-x-hidden">
          <div className="animate-marquee whitespace-nowrap">
            <span className="py-3 mx-8 font-semibold text-lg text-green-800 dark:text-green-200"> The trial plan is included in our main menu</span>
            <span className="py-3 mx-8 font-semibold text-lg text-green-800 dark:text-green-200"> The trial plan is included in our main menu</span>
            <span className="py-3 mx-8 font-semibold text-lg text-green-800 dark:text-green-200"> The trial plan is included in our main menu.</span>
          </div>
        </div>


        {/* Trial Product Section */}
        <div ref={trialSectionRef} className="mt-16 text-center !scroll-smooth" style={{scrollMarginTop: '100px'}}>
          <div className="max-w-4xl mx-auto grid grid-cols-2 gap-2 sm:gap-8">            
            {/* Sprouts Trial Card - relative positioning for hint */}
            <Card className="shadow-lg border-2 border-primary/20 relative overflow-hidden">              
              <div className="absolute top-0 right-0 bg-gradient-to-br from-red-500 to-orange-400 text-white text-xs font-bold px-4 py-2 transform translate-x-4 translate-y-4 rotate-45 shadow-lg z-10 animate-pulse">
                 <span className="font-rupees rupee-symbol"></span>LIMITED OFFER
              </div>
              <CardContent className="p-2 sm:p-4 text-center">
                <Image src={hasEgg ? "/images/meals/mix.png" : "/vegimages/MIX veg.png"} alt={`Mixed ${hasEgg ? 'Egg' : 'Veg'} Meal - Trial Offer`} data-ai-hint="trial meal box" width={150} height={112} className="rounded-lg mb-2 mx-auto" />
                <h3 className="text-sm sm:text-xl font-headline font-bold text-primary mb-1">Mixed Sprout Salad (Trial)</h3>
                <div className="flex items-baseline justify-center gap-2 mb-2">                  <span className="text-base sm:text-2xl font-bold text-black font-rupees rupee-symbol">₹99</span>
                  <span className="line-through text-muted-foreground font-rupees rupee-symbol">₹149</span>
                </div>
                <Button 
                  size="sm"
                  className="w-full"
                  onClick={() => handleOrderNow('sprouts')}
                >
                  Order Now
                </Button>
              </CardContent>
            </Card>

            {/* Oats Trial Card */}
            <Card className="shadow-lg border-2 border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-br from-green-500 to-teal-400 text-white text-xs font-bold px-4 py-2 transform translate-x-4 translate-y-4 rotate-45 shadow-lg z-10 animate-pulse">
                 <span className="font-rupees rupee-symbol"></span>limited OFFER
              </div>
              <CardContent className="p-2 sm:p-4 text-center">
                <Image src={"/images/meals/oats.png"} alt={`Fruits Muesli - Trial Offer`} data-ai-hint="trial meal box" width={150} height={112} className="rounded-lg mb-2 mx-auto" />
                <h3 className="text-sm sm:text-xl font-headline font-bold text-primary mb-1">Fruits Muesli bowl (Trial)</h3>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-base sm:text-2xl font-bold text-black font-rupees rupee-symbol">₹149</span>
                  <span className="line-through text-muted-foreground font-rupees rupee-symbol">₹279</span>
                </div>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleOrderNow('oats')}
                >
                  Order Now
                </Button>
              </CardContent>
            </Card>

            {/* Coupon Code Slider */}
            <div className="col-span-2 mt-8 relative">
              <Carousel
                setApi={setCarouselApi}
                plugins={[
                  Autoplay({
                    delay: 5000,
                    stopOnInteraction: true,
                  }),
                ]}
                className="w-full"
                opts={{ loop: true }}
              >
                <CarouselContent>
                  <CarouselItem>
                  <div className="p-1">
                      <div className="relative flex flex-col items-center justify-center gap-4 p-6 sm:p-10 min-h-[160px] sm:min-h-[140px] rounded-lg bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-primary-foreground overflow-hidden">
                        <div className="absolute -left-12 -top-12 w-36 h-36 rounded-full bg-white/10"></div>
                        <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-white/10"></div>
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center z-10">Follow us on Instagram to win exciting prizes!</h3>
                        <Button asChild size="lg" className="bg-white/90 text-pink-600 hover:bg-white z-10 shadow-lg">
                          <a href="https://www.instagram.com/greezo_official?igsh=OXp5ZHdhY3dkZXRz" target="_blank" rel="noopener noreferrer">Follow Now</a>
                        </Button>
                      </div>
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="p-1">
                      <div className="relative flex flex-col items-center justify-center gap-4 p-6 sm:p-10 min-h-[160px] sm:min-h-[140px] rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 text-primary-foreground overflow-hidden">
                        <div className="absolute -left-12 -top-12 w-36 h-36 rounded-full bg-white/10"></div>
                        <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-white/10"></div>
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center z-10">Win a contest and earn a free juice of your choice!</h3>
                        <Button size="lg" className="bg-white/90 text-blue-600 hover:bg-white z-10 shadow-lg" onClick={() => setShowContestInfoModal(true)}>
                          Enroll Now
                        </Button>
                      </div>
                    </div>
                  </CarouselItem>
                </CarouselContent>
              </Carousel>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <button key={i} onClick={() => carouselApi?.scrollTo(i)} className={`h-2 w-2 rounded-full transition-colors ${carouselCurrent === i ? 'bg-white' : 'bg-white/50'}`}></button>
                ))}
              </div>
            </div>


            {/* Navaratri Offer Card */}
            <div className="col-span-2 mt-8">
              <Card className="shadow-xl border-2 border-yellow-500/50 relative overflow-hidden bg-gradient-to-tr from-yellow-50 to-orange-50">
                <div className="absolute top-0 right-0 bg-gradient-to-br from-pink-500 to-red-500 text-white text-xs font-bold px-4 py-1 transform translate-x-4 translate-y-4 rotate-45 shadow-lg z-10 animate-pulse">LIMITED OFFER</div>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="text-center sm:text-left col-span-1">
                      <h3 className="text-lg sm:text-3xl font-headline font-bold text-primary mb-1 sm:mb-2">Two Salads, One Great Price!</h3>
                      <p className="text-xs sm:text-base text-muted-foreground mb-2 sm:mb-4">Get a delicious combo of two Mixed Sprout Salad </p>
                      <div className="flex items-baseline justify-center sm:justify-start gap-2 mb-3 sm:mb-4">
                        <span className="text-2xl sm:text-4xl font-bold text-black font-rupees rupee-symbol">₹189</span>
                        <span className="line-through text-muted-foreground font-rupees rupee-symbol">₹298</span>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleOrderNow('navaratri')}
                      >
                        Order Combo Now
                      </Button>
                    </div>
                    <div className="w-full col-span-1">
                      <Image src="/vegimages/MIX veg.png" alt="Mixed Sprout Salad" width={400} height={300} className="rounded-lg object-cover aspect-[4/3] shadow-lg" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <CheckoutDialog
        isOpen={showCheckoutDialog}
        onClose={() => setShowCheckoutDialog(false)}
        planInfo={checkoutPlanInfo}
      />

      {/* Contest Info Modal */}
      <ContestInfoModal 
        isOpen={showContestInfoModal}
        onClose={() => setShowContestInfoModal(false)}
      />

      {/* Juice Selection Modal */}
      <JuiceSelectionModal
        isOpen={showJuiceSelection}
        onClose={() => setShowJuiceSelection(false)}
        onSelect={handleJuiceSelection}
        planType={'trial'}
        juicePrice={selectedTrial === 'navaratri' ? 99 : 198} // This is for a single juice
      />

      {/* Egg Add-on Modal */}
      <Dialog open={showEggCounterModal} onOpenChange={setShowEggCounterModal}>
        <DialogContentPrimitive className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <Egg className="h-7 w-7 text-yellow-500" />
              <span>Add Extra Protein? (for Navaratri Combo)</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            {selectedTrial === 'sprouts' ? (
              <div className="text-muted-foreground mb-6 space-y-2">
                <p className="font-semibold text-slate-700">One egg is enough for you!</p>
                <p className="text-sm">Boost your trial meal with a high-quality protein source for just <span className="font-bold text-primary font-rupees rupee-symbol">₹14</span>.</p>
              </div>
            ) : (
              <p className="text-muted-foreground mb-6">Boost your combo salads with extra boiled eggs for just <span className="font-bold text-primary font-rupees rupee-symbol">₹14</span> each.</p>
            )}
            <div className="flex items-center justify-center gap-4 mb-6">
              <Button size="icon" variant="outline" onClick={() => setExtraEggCount(Math.max(0, extraEggCount - 1))} disabled={extraEggCount === 0}>
                <Minus className="h-4 w-4" />

              </Button>
              <span className="text-xl font-bold w-36 text-center whitespace-nowrap">
                {extraEggCount > 0 ? `Added ${extraEggCount} egg${extraEggCount > 1 ? 's' : ''}` : 'No eggs'}
              </span>
              <Button size="icon" onClick={() => setExtraEggCount(extraEggCount + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                size="lg" 
                className="w-full" 
                onClick={handleEggCounterConfirm}
                disabled={extraEggCount === 0}
              >
                  <span>
                    Continue (+ <span className="font-rupees rupee-symbol">₹</span>{extraEggCount * 14})
                  </span>
              </Button>
              <Button variant="outline" className="w-full" onClick={handleEggCounterConfirm}>No thanks, proceed to next</Button>
            </div>
          </div>
        </DialogContentPrimitive>
      </Dialog>
    </section>
  );
}
