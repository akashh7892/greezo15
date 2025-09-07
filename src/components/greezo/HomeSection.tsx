
"use client";

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";

type HomeSectionProps = {
  onScrollToPlans: () => void;
};

const sliderImages = [
  { src: "https://picsum.photos/seed/food1/1200/800", alt: "Healthy meal 1", hint: "healthy meal" },
  { src: "https://picsum.photos/seed/food2/1200/800", alt: "Healthy meal 2", hint: "fresh salad" },
  { src: "https://picsum.photos/seed/food3/1200/800", alt: "Healthy meal 3", hint: "natural food" },
];

export function HomeSection({ onScrollToPlans }: HomeSectionProps) {
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
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
}
