
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    const subject = `Message from ${name}`;
    const body = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
    const mailtoLink = `mailto:akashpg911@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  return (
    <section id="contact" className="py-16 sm:py-24">
      <div className="container mx-auto px-4 flex flex-col items-center">
        <h2 className="text-3xl sm:text-4xl font-headline font-bold text-primary mb-4 text-center">Contact Us</h2>
        <p className="text-lg text-muted-foreground mb-8 text-center max-w-2xl">Have questions or feedback? We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.</p>
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader>
            <CardTitle>Send a Message</CardTitle>
            <CardDescription>Your feedback is important to us.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your.email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Your message..." rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" onClick={handleSendMessage}>Send Message</Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
