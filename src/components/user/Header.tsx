"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Bell, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/app/context/Authcontext';

type SectionRefs = {
  home: HTMLElement | null;
  juices: HTMLElement | null;
  plans: HTMLElement | null;
  about: HTMLElement | null;
  contact: HTMLElement | null;
};

type HeaderProps = {
  scrollToSection: (section: keyof SectionRefs) => void;
  hasEgg: boolean;
  setHasEgg: (checked: boolean) => void;
  showAccount?: boolean;
  setShowAccount?: (show: boolean) => void;
};

const navLinks: { name: string; section: keyof SectionRefs }[] = [
  { name: 'Juices', section: 'juices' },
  { name: 'Plans', section: 'plans' },
  { name: 'About Us', section: 'about' },
  { name: 'Contact Us', section: 'contact' },
];

export function Header({ 
  scrollToSection, 
  hasEgg, 
  setHasEgg, 
  showAccount, 
  setShowAccount 
}: HeaderProps) {
  const { user } = useAuth();

  const handleAccountClick = () => {
    if (setShowAccount) {
      setShowAccount(!showAccount);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => {
                if (setShowAccount && showAccount) {
                  setShowAccount(false);
                }
                scrollToSection('home');
              }}
            >
              <Image src="/images/greezo-logo.png" alt="Greezo Logo" width={120} height={60} className="rounded-md object-contain" />
            </div>
            <nav className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => (
                <Button
                  key={link.name}
                  variant="ghost"
                  className="font-semibold"
                  onClick={() => {
                    if (setShowAccount && showAccount) {
                      setShowAccount(false);
                    }
                    scrollToSection(link.section);
                  }}
                >
                  {link.name}
                </Button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {/* Egg/Non-Egg Toggle */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="global-egg-toggle" className={`text-sm font-semibold transition-colors ${!hasEgg ? 'text-primary' : 'text-muted-foreground'}`}>
                Non-Egg
              </Label>
              <Switch 
                id="global-egg-toggle"
                name="global-egg-preference"
                checked={hasEgg}
                onCheckedChange={setHasEgg}
                className="data-[state=checked]:bg-yellow-500"
              />
              <Label htmlFor="global-egg-toggle" className={`text-sm font-semibold transition-colors ${hasEgg ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                Egg
              </Label>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4 text-center">
                <p className="text-sm text-muted-foreground">No notifications till now.</p>
              </PopoverContent>
            </Popover>

            <Button 
              variant="ghost" 
              className="gap-2 font-semibold"
              onClick={handleAccountClick}
            >
              {showAccount ? (
                <X className="h-5 w-5" />
              ) : (
                <User className="h-5 w-5" />
              )}
              <span className="hidden sm:inline">
                {user ? user.name.split(' ')[0] : 'Account'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}