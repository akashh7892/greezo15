
"use client";
import { Button } from '@/components/ui/button';
import { Instagram, Mail, MessageCircle } from 'lucide-react';

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "greezoofficial@gmail.com";
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919449614641";
const INSTAGRAM_URL = "https://www.instagram.com/greezo_official?igsh=OXp5ZHdhY3dkZXRz";

export function ContactSection() {
  return (
    <section id="contact" className="py-16 sm:py-24">
      <div className="container mx-auto px-4 flex flex-col items-center">
        <h2 className="text-3xl sm:text-4xl font-headline font-bold text-primary mb-8 text-center">Get In Touch</h2>
        <p className="text-lg text-muted-foreground mb-10 text-center max-w-2xl">
          Have questions, feedback, or just want to say hello? We'd love to hear from you!
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" variant="outline">
            <a href={`mailto:${CONTACT_EMAIL}`}>
              <Mail className="mr-2 h-5 w-5" />
              Email Us
            </a>
          </Button>
          <Button asChild size="lg">
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-5 w-5" />
              Chat on WhatsApp
            </a>
          </Button>
          <Button asChild size="lg" className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white hover:opacity-90 transition-opacity">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              <Instagram className="mr-2 h-5 w-5" />
              Follow on Instagram
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
