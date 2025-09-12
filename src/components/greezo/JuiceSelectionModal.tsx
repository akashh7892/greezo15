"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles } from 'lucide-react';

interface JuiceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selected: boolean, selectedJuices?: string[]) => void;
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
    image: "/juice_images/alma juice .png",
    description: "Rich in Vitamin C"
  },
  {
    name: "Brain Booster",
    image: "/juice_images/brain boster.png", 
    description: "Blueberry & nuts blend"
  },
  {
    name: "Ginger Lime",
    image: "/juice_images/gingerLime.png",
    description: "Refreshing ginger & lime"
  },
  {
    name: "Kokum Juice",
    image: "/juice_images/kokum.png",
    description: "Traditional kokum drink"
  },
  {
    name: "Lime Chia",
    image: "/juice_images/lime and chia .png",
    description: "Lime with chia seeds"
  }
];

const TRIAL_JUICES = ALL_JUICES.slice(0, 3); // First 3 juices for trial

export function JuiceSelectionModal({
  isOpen,
  onClose,
  onSelect,
  planType = 'trial',
  juicePrice = 9
}: JuiceSelectionModalProps) {
  const [selectedJuices, setSelectedJuices] = useState<string[]>([]);
  const [showSelection, setShowSelection] = useState(true);

  const getJuicesToShow = () => {
    return planType === 'trial' ? TRIAL_JUICES : ALL_JUICES;
  };

  const handleJuiceToggle = (juiceName: string) => {
    if (planType === 'trial') {
      // For trial, only one selection allowed
      setSelectedJuices([juiceName]);
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
    onSelect(true, selectedJuices);
    onClose();
    resetState();
  };

  const handleSkip = () => {
    onSelect(false);
    onClose();
    resetState();
  };

  const resetState = () => {
    setSelectedJuices([]);
    setShowSelection(true);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Add Fresh Juice?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Price Display */}
          <div className="text-center">
            <p className="text-xl font-bold text-primary mb-2">
              <span className="font-rupees rupee-symbol">{planType === 'trial' ? '+₹9' : '+₹499'}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {planType === 'trial' 
                ? 'Select your favorite juice for trial (choose 1)' 
                : 'Enjoy fresh juice variety with your subscription'
              }
            </p>
          </div>

          {/* Juice Selection Grid */}
          <div className={`grid gap-4 ${
            planType === 'trial' 
              ? 'grid-cols-1 sm:grid-cols-3' 
              : 'grid-cols-2 sm:grid-cols-3'
          }`}>
            {getJuicesToShow().map((juice, index) => (
              <Card 
                key={index}
                className={`transition-all duration-200 ${
                  planType === 'trial'
                    ? `cursor-pointer hover:shadow-lg ${
                        selectedJuices.includes(juice.name) 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:shadow-md'
                      }`
                    : 'hover:shadow-md' // Subscription: just subtle hover effect, no selection styling
                }`}
                onClick={planType === 'trial' ? () => handleJuiceToggle(juice.name) : undefined}
              >
                <CardContent className="p-4 text-center">
                  <div className="relative">
                    <Image 
                      src={juice.image}
                      alt={juice.name}
                      data-ai-hint="fresh juice option"
                      width={120}
                      height={120}
                      className="rounded-lg mx-auto mb-2"
                    />
                    {planType === 'trial' && selectedJuices.includes(juice.name) && (
                      <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-1">
                        <Sparkles className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{juice.name}</h4>
                  <p className="text-xs text-muted-foreground">{juice.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selection Info */}
          {planType === 'trial' && selectedJuices.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700 text-center">
                <strong>{selectedJuices[0]}</strong> selected! Perfect choice for your trial.
              </p>
            </div>
          )}


          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-center gap-3">
            <Button 
              size="lg" 
              onClick={handleConfirm}
              disabled={planType === 'trial' && selectedJuices.length === 0}
            >
              <Sparkles />
              <span>
                {planType === 'trial'
                  ? <>Add for <span className="font-rupees rupee-symbol" />9</>
                  : <>Add Juice Pack <span className="font-rupees rupee-symbol" />499</>
                }
              </span>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleSkip}
            >
              Skip Juice
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {planType === 'trial' 
              ? 'Try our fresh juice with your trial meal!'
              : 'Fresh juices delivered with your meal subscription'
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}