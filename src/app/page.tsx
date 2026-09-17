"use client";

import { useEffect, useState } from 'react';
import { Header } from '@/components/user/Header';
import { HomeSection } from '@/components/user/HomeSection';
import { JuicesSection } from '@/components/user/JuicesSection';
import { PlansSection } from '@/components/user/PlansSection';
import { AboutSection } from '@/components/user/AboutSection';
import { ContactSection } from '@/components/user/ContactSection';
import AccountPage from '@/components/user/AccountPage';

type Section = 'home' | 'juices' | 'plans' | 'about' | 'contact';

export default function Home() {
  const [hasEgg, setHasEgg] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [accountTab, setAccountTab] = useState<'login' | 'register'>('login');

  // The checkout dialog can't navigate to a dedicated /account route (there
  // isn't one — "Account" is just this toggled section), so it asks for the
  // account view via a custom event instead of a prop drilled through every
  // section that might render the checkout dialog.
  useEffect(() => {
    const handleOpenAccount = (e: Event) => {
      const tab = (e as CustomEvent<{ tab?: 'login' | 'register' }>).detail?.tab;
      setAccountTab(tab === 'register' ? 'register' : 'login');
      setShowAccount(true);
    };
    window.addEventListener('greezo:open-account', handleOpenAccount);
    return () => window.removeEventListener('greezo:open-account', handleOpenAccount);
  }, []);

  const scrollToSection = (section: Section) => {
    const el = document.getElementById(section);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Header
        scrollToSection={scrollToSection}
        hasEgg={hasEgg}
        setHasEgg={setHasEgg}
        showAccount={showAccount}
        setShowAccount={setShowAccount}
      />

      {showAccount ? (
        <AccountPage key={accountTab} initialTab={accountTab} />
      ) : (
        <main>
          <HomeSection onScrollToPlans={() => scrollToSection('plans')} hasEgg={hasEgg} />
          <PlansSection hasEgg={hasEgg} />
          <AboutSection />
          <ContactSection />
        </main>
      )}
    </>
  );
}