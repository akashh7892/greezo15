
"use client";

import { Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SectionRefs } from '@/app/page';

type HeaderProps = {
  scrollToSection: (section: keyof SectionRefs) => void;
};

const navLinks: { name: string; section: keyof SectionRefs }[] = [
  { name: 'Plans', section: 'plans' },
  { name: 'Contact Us', section: 'contact' },
];

export function Header({ scrollToSection }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => scrollToSection('home')}
          >
            <Leaf className="h-7 w-7 text-primary" />
            <span className="text-xl font-headline font-bold text-primary">GreezoGo</span>
          </div>
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Button
                key={link.name}
                variant="ghost"
                className="font-semibold"
                onClick={() => scrollToSection(link.section)}
              >
                {link.name}
              </Button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
