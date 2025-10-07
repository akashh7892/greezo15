"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, Sparkles } from 'lucide-react';

interface JuiceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (healthySelected: boolean, freshSelected: boolean, selectedJuices?: string[], juicePrice?: number) => void;
  planType?: 'trial' | 'subscription';
  juicePrice?: number;
}

const ALL_JUICES = [
  {
    name: "Lime Chia Juice",
    image: "/images/juices/lime-chia.png",
    description: "Refreshing lime with chia seeds"
  },
  {
    name: "Amla Juice", 
    image: "/images/juices/amla-juice.png",
    description: "Rich in Vitamin C"
  },
  {
    name: "Brain Booster",
    image: "/images/juices/brain-booster.png",
    description: "Ondelaga and Honey blend"
  },
  {
    name: "Lime Ginger Sabja",
    image: "/images/juices/ginger-lime.png",
    description: "Refreshing citrus blend"
  },
  {
    name: "Kokum Juice",
    image: "/images/juices/kokum.png",
    description: "Traditional kokum drink"
  },
  {
    name: "ABC Juice",
    image: "/images/juices/abc-juice.png",
    description: "Apple, Beetroot & Carrot blend"
  }
];

const FRESH_JUICES = [
  { name: "Grapes Juice", image: "/images/fresh-juices/grapes-juice.png", description: "Rich & antioxidant-packed" },
  { name: "Banana Dates Smoothie", image: "/images/fresh-juices/banana-dates-smoothie.png", description: "Natural energy & sweetness" },
  { name: "Pineapple Juice", image: "/images/fresh-juices/pineapple-juice.png", description: "Sweet & tangy tropical boost" },
  { name: "Apple Smoothie", image: "/images/fresh-juices/apple-smoothie.png", description: "Creamy & wholesome" },
  { name: "Lime Chia Juice", image: "/images/fresh-juices/lime-chia-juice.png", description: "Zesty with a fiber kick" },
  { name: "Tender Coconut", image: "/images/fresh-juices/tender-coconut.png", description: "Pure, hydrating electrolyte" },
];

const TRIAL_JUICES = FRESH_JUICES.slice(0, 3); // First 3 juices for trial
const TRIAL_HEALTHY_JUICES = ALL_JUICES.slice(0, 3);
const TRIAL_FRESH_JUICES = FRESH_JUICES.slice(0, 3);

export function JuiceSelectionModal({
  isOpen,
  onClose,
  onSelect,
  planType = 'trial',
  juicePrice: initialJuicePrice = 9
}: JuiceSelectionModalProps) {
  const [selectedJuices, setSelectedJuices] = useState<string[]>([]);
  const [healthyJuiceAdded, setHealthyJuiceAdded] = useState(false);
  const [freshJuiceAdded, setFreshJuiceAdded] = useState(false);
  const freshJuiceSectionRef = useRef<HTMLDivElement>(null);

  const getJuicesToShow = () => {
    return planType === 'trial' ? TRIAL_JUICES : ALL_JUICES;
    // This function is now only for the subscription plan's ALL_JUICES
    return ALL_JUICES;
  };

  const handleJuiceToggle = (juiceName: string, price: number) => {
    if (planType === 'trial') {
      setSelectedJuices(prev => (prev[0] === juiceName ? [] : [juiceName]));
      // We'll pass the price back through the onSelect function
    } else {
      // For subscriptions, multiple selections
      setSelectedJuices(prev =>
        prev.includes(juiceName) 
          ? prev.filter(j => j !== juiceName)
          : [...prev, juiceName]
      );
    }
  };

  const handleConfirm = () => {
    if (planType === 'subscription') {
      onSelect(healthyJuiceAdded, freshJuiceAdded);
    } else {
      if (selectedJuices.length > 0) {
        // For trial, determine which pack was selected to pass the correct price
        const isHealthy = TRIAL_HEALTHY_JUICES.some(j => j.name === selectedJuices[0]);
        if (isHealthy) {
          onSelect(true, false, selectedJuices, initialJuicePrice);
        } else {
          onSelect(false, true, selectedJuices, initialJuicePrice === 29 ? 59 : 25);
        }
      } else {
        onSelect(false, false, [], 0); // No juice selected
      }
    }
    onClose();
    resetState();
  };

  const handleSkip = () => {
    onSelect(false, false);
    onClose();
    resetState();
  };

  const resetState = () => {
    setSelectedJuices([]);
    setHealthyJuiceAdded(false);
    setFreshJuiceAdded(false);
  };

  const scrollToFreshJuices = () => {
    freshJuiceSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleHealthyJuiceInteraction = (add: boolean) => {
    setHealthyJuiceAdded(add);
    setTimeout(scrollToFreshJuices, 100); // Timeout to allow state update before scrolling
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="text-center sm:text-left">
          <DialogTitle className="text-2xl font-bold text-primary">
            Boost Your Plan with Juices!
          </DialogTitle>
          <DialogDescription>Add our popular juice packs to your subscription.</DialogDescription>
        </DialogHeader>

        {planType === 'subscription' ? (
          <div className="flex flex-col h-full max-h-[75vh]">
            <div className="flex-grow overflow-y-auto -mx-6 px-6 space-y-6 pb-4 pr-2">
              {/* Healthy Juices Section */}
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-center">Immunity Booster Pack</h3>
                <div className="grid grid-cols-3 gap-3">
                  {ALL_JUICES.map(juice => (
                    <Card key={juice.name} className="overflow-hidden rounded-lg border-border/50 shadow-sm flex flex-col">
                      <CardContent className="p-0 flex flex-col text-center">
                        <Image src={juice.image} alt={juice.name} width={80} height={80} className="object-cover aspect-square w-full" />
                        <div className="p-2">
                          <h4 className="font-semibold text-xs">{juice.name}</h4>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              <div className="text-center space-y-1">
                <div className="flex items-baseline justify-center gap-2">
                  <p className="text-xl font-bold"><span className="font-rupees rupee-symbol">₹349</span></p>
                  <p className="text-sm line-through text-muted-foreground"><span className="font-rupees rupee-symbol">₹559</span></p>
                </div>
                <p className="text-xs text-muted-foreground">One juice per day for 6 days.</p> 
                <Button size="sm" variant={healthyJuiceAdded ? "secondary" : "default"} className={`w-auto mt-1 ${healthyJuiceAdded ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600'}`} onClick={() => handleHealthyJuiceInteraction(!healthyJuiceAdded)}>
                  {healthyJuiceAdded ? <><Check className="mr-2 h-4 w-4" /> Added</> : "Add to cart"}
                </Button>
                <Button variant="link" size="sm" className="text-xs h-auto py-1 text-muted-foreground" onClick={() => scrollToFreshJuices()}>
                  No, thanks
                </Button>
                </div>
              </div>

              {/* Fresh Juices Section */}
              <div className="space-y-3" ref={freshJuiceSectionRef} style={{scrollMarginTop: '100px'}}>
                <h3 className="font-bold text-lg text-center">Pure Glow Pack</h3>
                <div className="grid grid-cols-3 gap-3">
                  {FRESH_JUICES.map(juice => (
                    <Card key={juice.name} className="overflow-hidden rounded-lg border-border/50 shadow-sm flex flex-col">
                      <CardContent className="p-0 flex flex-col text-center">
                        <Image src={juice.image} alt={juice.name} width={80} height={80} className="object-cover aspect-square w-full" />
                        <div className="p-2">
                          <h4 className="font-semibold text-xs">{juice.name}</h4>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="text-center space-y-1">
                  <div className="flex items-baseline justify-center gap-2">
                    <p className="text-xl font-bold"><span className="font-rupees rupee-symbol">₹449</span></p>
                    <p className="text-sm line-through text-muted-foreground"><span className="font-rupees rupee-symbol">₹659</span></p>
                  </div>
                  <p className="text-xs text-muted-foreground">One juice per day for 6 days.</p>
                  <Button size="sm" variant={freshJuiceAdded ? "secondary" : "default"} className={`w-auto mt-1 ${freshJuiceAdded ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600'}`} onClick={() => setFreshJuiceAdded(!freshJuiceAdded)}>
                    {freshJuiceAdded ? <><Check className="mr-2 h-4 w-4" /> Added</> : "Add to cart"}
                  </Button>
                </div>
              </div>
            </div>
            <div className="mt-auto pt-4 -mx-6 px-6 border-t bg-background">
              <DialogFooter>
                <Button 
                  size="lg" 
                  className={`w-full transition-colors ${healthyJuiceAdded || freshJuiceAdded ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  disabled={!healthyJuiceAdded && !freshJuiceAdded}
                  onClick={handleConfirm}
                >
                  Continue to Cart
                </Button>
              </DialogFooter>
              <Button variant="link" className="w-full mt-1 text-muted-foreground" onClick={handleSkip}>
                No thanks, skip for now
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Healthy Juices for Trial */}
            <div className="space-y-3">
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-2 mb-1">
                  <p className="text-2xl font-bold text-primary"><span className="font-rupees rupee-symbol">₹{initialJuicePrice}</span></p>
                  <p className="text-md line-through text-muted-foreground"><span className="font-rupees rupee-symbol">₹{initialJuicePrice === 29 ? 69 : 49}</span></p>
                </div>
                {initialJuicePrice === 29 && (
                  <p className="text-xs text-green-600 font-semibold">This plan includes 2 juices. Select one, and we'll deliver two of the same!</p>
                )}
                <p className="text-sm text-muted-foreground">Select a Healthy Juice</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {TRIAL_HEALTHY_JUICES.map((juice) => (
                  <Card
                    key={juice.name}
                    className={`overflow-hidden rounded-xl border-border/50 transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1 ${
                      selectedJuices[0] === juice.name ? 'ring-2 ring-primary' : 'ring-1 ring-transparent'
                    }`}
                    onClick={() => handleJuiceToggle(juice.name, initialJuicePrice)}
                  >
                    <CardContent className="p-0 flex flex-col text-center relative aspect-square justify-center">
                      <Image src={juice.image} alt={juice.name} width={80} height={80} className="object-cover aspect-square w-full rounded-t-xl" />
                      <div className="p-2 flex-grow flex flex-col">
                        <h4 className="font-semibold text-xs mb-1">{juice.name}</h4>
                      </div>
                      {selectedJuices[0] === juice.name && (
                        <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5 shadow-lg">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Fresh Juices for Trial */}
            <div className="space-y-3 pt-4 border-t">
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-2 mb-1">
                  <p className="text-2xl font-bold text-primary"><span className="font-rupees rupee-symbol">₹{initialJuicePrice === 29 ? 59 : 25}</span></p>
                  <p className="text-md line-through text-muted-foreground"><span className="font-rupees rupee-symbol">₹{initialJuicePrice === 29 ? 129 : 99}</span></p>
                </div>
                <p className="text-sm text-muted-foreground">Or try a premium Fresh Juice</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {TRIAL_FRESH_JUICES.map((juice) => (
                  <Card
                    key={juice.name}
                    className={`overflow-hidden rounded-xl border-border/50 transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1 ${
                      selectedJuices[0] === juice.name ? 'ring-2 ring-primary' : 'ring-1 ring-transparent'
                    }`}
                    onClick={() => handleJuiceToggle(juice.name, initialJuicePrice === 29 ? 59 : 25)}
                  >
                    <CardContent className="p-0 flex flex-col text-center relative aspect-square justify-center">
                      <Image src={juice.image} alt={juice.name} width={80} height={80} className="object-cover aspect-square w-full rounded-t-xl" />
                      <div className="p-2 flex-grow flex flex-col">
                        <h4 className="font-semibold text-xs mb-1">{juice.name}</h4>
                      </div>
                      {selectedJuices[0] === juice.name && (
                        <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5 shadow-lg">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                className="w-full"
                onClick={handleConfirm}
                disabled={selectedJuices.length === 0}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Add Selected Juice</span>
              </Button>
            </DialogFooter>
            <Button variant="link" className="w-full -mt-2 text-muted-foreground" onClick={handleSkip}>
              No, thanks
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}