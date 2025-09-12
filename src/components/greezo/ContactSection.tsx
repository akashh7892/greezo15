
"use client";

export function ContactSection() {
  return (
    <section id="contact" className="py-16 sm:py-24">
      <div className="container mx-auto px-4 flex flex-col items-center">
        <h2 className="text-3xl sm:text-4xl font-headline font-bold text-primary mb-8 text-center">Contact Us</h2>
        <div className="text-center text-lg text-muted-foreground max-w-2xl">
          <p className="mb-4">
            Contact us at: <a href="tel:+919876543210" className="font-semibold text-primary hover:underline">+91 9876543210</a>
          </p>
          <p>
            or email: <a href="mailto:support@greezo.com" className="font-semibold text-primary hover:underline">support@greezo.com</a>
          </p>
        </div>
      </div>
    </section>
  );
}
