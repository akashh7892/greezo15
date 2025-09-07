
"use client";

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const juiceImages = Array.from({ length: 7 }, (_, i) => ({
  src: `https://picsum.photos/seed/juice${i + 1}/600/400`,
  alt: `Fresh juice day ${i + 1}`,
  hint: 'fresh juice'
}));

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
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
}
