"use client";

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, ArrowLeft } from 'lucide-react';

interface FreshJuiceAddonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (added: boolean) => void;
}

const FRESH_JUICES = [
  { name: "Grapes Juice", image: "/images/fresh-juices/grapes-juice.png", description: "Rich & antioxidant-packed" },
  { name: "Apple Smoothie", image: "/images/fresh-juices/apple-smoothie.png", description: "Creamy & wholesome" },
  { name: "Pineapple Juice", image: "/images/fresh-juices/pineapple-juice.png", description: "Sweet & tangy tropical boost" },
  { name: "Banana Dates Smoothie", image: "/images/fresh-juices/banana-dates-smoothie.png", description: "Natural energy & sweetness" },
  { name: "Lime Chia Juice", image: "/images/fresh-juices/lime-chia-juice.png", description: "Zesty with a fiber kick" },
  { name: "Tender Coconut", image: "/images/fresh-juices/tender-coconut.png", description: "Pure, hydrating electrolyte" },
];

export function FreshJuiceAddonModal({ isOpen, onClose, onConfirm }: FreshJuiceAddonModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={onClose}>
          <ArrowLeft className="h-6 w-6" />
          <span className="sr-only">Go back</span>
        </Button>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary text-center">
            One More Thing!
          </DialogTitle>
        </DialogHeader>
        <div className="w-full space-y-4 py-4 text-center">
          <div className="grid grid-cols-3 gap-3 p-1">
            {FRESH_JUICES.map((juice) => (
              <Card key={juice.name} className="overflow-hidden rounded-xl border-border/50 group transition-all hover:shadow-lg hover:-translate-y-1">
                <CardContent className="p-0 flex flex-col text-center">
                  <Image
                    src={juice.image}
                    alt={juice.name}
                    width={100}
                    height={100}
                    className="object-cover aspect-square w-full"
                  />
                  <div className="p-2 flex-grow flex flex-col">
                    <h4 className="font-semibold text-sm mb-1">{juice.name}</h4>
                    <p className="text-xs text-muted-foreground mt-auto">{juice.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-2">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-3xl font-bold text-primary font-rupees rupee-symbol">₹459</span>
              <span className="text-xl line-through text-muted-foreground font-rupees rupee-symbol">₹699</span>
            </div>
            <p className="text-muted-foreground">
              Add a pack of <strong>6 Fresh Juices</strong> to your order.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-center gap-3 pt-4">
            <Button onClick={() => onConfirm(true)} size="sm">
              <Sparkles className="mr-2 h-4 w-4" />
              Add Fresh Juices
            </Button>
            <Button variant="outline" onClick={() => onConfirm(false)} size="sm">
              Continue to Cart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}