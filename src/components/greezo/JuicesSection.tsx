
"use client";

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

const juiceImages = [
  { src: "/images/juices/lime-chia.png", alt: "Lime Chia Juice - Refreshing lime with chia seeds", hint: "lime chia juice", name: "Lime Chia Juice" },
  { src: "/images/juices/amla-juice.png", alt: "Amla Juice - Fresh vitamin C rich juice", hint: "amla juice", name: "Amla Juice" },
  { src: "/images/juices/brain-booster.png", alt: "Brain Booster - Ondelaga and Honey blend", hint: "brain booster juice", name: "Brain Booster" },
  { src: "/images/juices/ginger-lime.png", alt: "Ginger Lime - Refreshing citrus blend", hint: "ginger lime juice", name: "Lime Ginger Sabja" },
  { src: "/images/juices/kokum.png", alt: "Kokum Juice - Traditional cooling drink", hint: "kokum juice", name: "Kokum Juice" },
  { src: "/images/juices/abc-juice.png", alt: "ABC Juice - Apple, Beetroot, and Carrot blend", hint: "abc juice", name: "ABC Juice" },
];

export function JuicesSection() {
  return (
    <section id="juices" className="py-16 sm:py-24">
      <div className="container mx-auto px-4 flex flex-col items-center">
        <h2 className="text-3xl sm:text-4xl font-headline font-bold text-primary mb-4 text-center">Our Fresh Juices</h2>
        <p className="text-lg text-muted-foreground mb-8 text-center max-w-2xl">
          Complement your meal plan with our daily selection of cold-pressed juices, packed with vitamins and natural flavor.
        </p>
        <Carousel className="w-full max-w-4xl" opts={{ loop: true, align: "start" }}>
          <CarouselContent className="-ml-4">
            {juiceImages.map((juice, index) => (
              <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <Card className="overflow-hidden">
                    <CardContent className="p-0">
                      <Image
                        src={juice.src}
                        alt={juice.alt}
                        data-ai-hint={juice.hint}
                        width={600}
                        height={400}
                        className="object-cover aspect-[3/2] w-full"
                      />
                      <div className="p-3">
                        <h3 className="text-lg font-semibold text-center text-primary">{juice.name}</h3>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
