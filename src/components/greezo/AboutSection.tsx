
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export function AboutSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <section id="about" className="py-16 sm:py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div
            ref={ref}
            className={`transition-all duration-1000 ease-out ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}
          >
            <h2 className="text-3xl sm:text-4xl font-headline font-bold text-primary mb-6">About Greezo</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              At Greezo, we believe that healthy eating should be both simple and delicious. We provide fresh, natural, and nutritionally balanced meals designed to help you lead a vibrant and nourished life without the hassle of cooking.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mt-4">
              Our chefs use only the highest quality ingredients, sourced locally whenever possible, to create a rotating menu that's as exciting as it is wholesome. Join the Greezo family and rediscover the joy of eating well.
            </p>
          </div>
          <div className={`transition-all duration-1000 ease-out delay-200 ${isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            <Image
              src="https://picsum.photos/seed/aboutus/600/500"
              alt="Healthy food preparation"
              data-ai-hint="healthy food"
              width={600}
              height={500}
              className="rounded-xl shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
