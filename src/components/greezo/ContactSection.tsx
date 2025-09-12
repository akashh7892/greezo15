
"use client";
import { Button } from '@/components/ui/button';

export function ContactSection() {
  return (
    <section id="contact" className="py-16 sm:py-24">
      <div className="container mx-auto px-4 flex flex-col items-center">
        <h2 className="text-3xl sm:text-4xl font-headline font-bold text-primary mb-8 text-center">Contact Us</h2>
        <div className="text-center text-lg text-muted-foreground max-w-2xl">
          <p className="mb-2">
            For support, reach out to us via email:
          </p>
          <a href="mailto:greezoofficial@gmail.com" className="font-semibold text-primary hover:underline text-xl">greezoofficial@gmail.com</a>
          <p className="mt-6 mb-2">
            Or get in touch with us directly on WhatsApp:
          </p>
          <Button asChild size="lg">
            <a href="https://wa.me/919449614641" target="_blank" rel="noopener noreferrer">Contact on WhatsApp (+91 9449614641)</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
