
"use client";

import { useRef } from "react";
import type { RefObject } from "react";
import { Header } from "@/components/greezo/Header";
import { HomeSection } from "@/components/greezo/HomeSection";
import { PlansSection } from "@/components/greezo/PlansSection";
import { JuicesSection } from "@/components/greezo/JuicesSection";
import { AboutSection } from "@/components/greezo/AboutSection";
import { ContactSection } from "@/components/greezo/ContactSection";

export type SectionRefs = {
  home: RefObject<HTMLDivElement>;
  plans: RefObject<HTMLDivElement>;
  juices: RefObject<HTMLDivElement>;
  about: RefObject<HTMLDivElement>;
  contact: RefObject<HTMLDivElement>;
};

export default function GreezoGoPage() {
  const homeRef = useRef<HTMLDivElement>(null);
  const plansRef = useRef<HTMLDivElement>(null);
  const juicesRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  const sectionRefs: SectionRefs = {
    home: homeRef,
    plans: plansRef,
    juices: juicesRef,
    about: aboutRef,
    contact: contactRef,
  };

  const scrollToSection = (section: keyof SectionRefs) => {
    sectionRefs[section].current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header scrollToSection={scrollToSection} />
      <main className="flex-grow pt-16">
        <div ref={homeRef}>
          <HomeSection onScrollToPlans={() => scrollToSection("plans")} />
        </div>
        <div ref={plansRef}>
          <PlansSection />
        </div>
        <div ref={juicesRef}>
          <JuicesSection />
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
