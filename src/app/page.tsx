
"use client";

import { useState, useRef } from "react";
import type { RefObject } from "react";
import { Header } from "@/components/greezo/Header";
import { HomeSection } from "@/components/greezo/HomeSection";
import { PlansSection } from "@/components/greezo/PlansSection";
import { AboutSection } from "@/components/greezo/AboutSection";
import { ContactSection } from "@/components/greezo/ContactSection";

export type SectionRefs = {
  home: RefObject<HTMLDivElement>;
  plans: RefObject<HTMLDivElement>;
  trial: RefObject<HTMLDivElement>;
  contact: RefObject<HTMLDivElement>;
  // The following are kept for type compatibility but are not used.
  juices: RefObject<HTMLDivElement>;
  about: RefObject<HTMLDivElement>;
};

export default function GreezoGoPage() {
  const homeRef = useRef<HTMLDivElement>(null);
  const plansRef = useRef<HTMLDivElement>(null);
  const trialRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  const sectionRefs: SectionRefs = {
    home: homeRef,
    plans: plansRef,
    trial: trialRef,
    contact: contactRef,
    juices: useRef<HTMLDivElement>(null), // Dummy ref
    about: aboutRef,
  };

  const scrollToSection = (section: keyof SectionRefs) => {
    sectionRefs[section].current?.scrollIntoView({ behavior: "smooth" });
  };

  const [hasEgg, setHasEgg] = useState(true);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header 
        scrollToSection={scrollToSection} 
        hasEgg={hasEgg}
        setHasEgg={setHasEgg}
      />
      <main className="flex-grow pt-16">
        <div ref={homeRef}>
          <HomeSection onScrollToPlans={() => scrollToSection("plans")} hasEgg={hasEgg} />
        </div>
        <div ref={plansRef}>
          <PlansSection hasEgg={hasEgg} />
        </div>
        <div ref={aboutRef}>
          <AboutSection />
        </div>
        <div ref={contactRef}>
          <ContactSection />
        </div>
      </main>
    </div>
  );
}
