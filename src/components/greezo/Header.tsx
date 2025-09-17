
"use client";

import { Bell, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import type { SectionRefs } from '@/app/page';

type HeaderProps = {
  scrollToSection: (section: keyof SectionRefs) => void;
};

const navLinks: { name: string; section: keyof SectionRefs }[] = [
  { name: 'Plans', section: 'plans' },
  { name: 'About Us', section: 'about' },
  { name: 'Contact Us', section: 'contact' },
];

export function Header({ scrollToSection }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => scrollToSection('home')}
          >
            <span className="text-xl font-headline font-bold text-primary">Greezo</span>
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
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                No notifications till now.
              </p>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
