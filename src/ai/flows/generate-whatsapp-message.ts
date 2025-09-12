'use server';

/**
 * @fileOverview Generates a pre-filled WhatsApp message for order confirmation.
 *
 * - generateWhatsAppMessage - A function that generates the WhatsApp message.
 * - GenerateWhatsAppMessageInput - The input type for the generateWhatsAppMessage function.
 * - GenerateWhatsAppMessageOutput - The return type for the generateWhatsAppMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWhatsAppMessageInputSchema = z.object({
  customerName: z.string().describe('Customer name'),
  phoneNumber: z.string().describe('Customer phone number'),
  selectedPlan: z.string().describe('The selected meal plan (e.g., Basic Weekly Plan).'),
  planType: z.string().describe('Plan type (trial, weekly, monthly)'),
  mealType: z.string().describe('Meal preference (Egg or Non-Egg)'),
  addJuice: z.boolean().describe('Whether the user wants to add a juice pack.'),
  selectedJuices: z.string().optional().describe('Names of selected juices'),
  startDate: z.string().describe('Preferred start date'),
  shift: z.string().describe('Preferred delivery shift'),
  address: z.string().describe('Delivery address'),
  totalPrice: z.string().describe('Total order amount'),
  paymentMethod: z.string().describe('Payment method chosen'),
  transactionId: z.string().optional().describe('UPI transaction ID if paid online'),
});
export type GenerateWhatsAppMessageInput = z.infer<
  typeof GenerateWhatsAppMessageInputSchema
>;

const GenerateWhatsAppMessageOutputSchema = z.object({
  message: z.string().describe('The pre-filled WhatsApp message.'),
});
export type GenerateWhatsAppMessageOutput = z.infer<
  typeof GenerateWhatsAppMessageOutputSchema
>;

export async function generateWhatsAppMessage(
  input: GenerateWhatsAppMessageInput
): Promise<GenerateWhatsAppMessageOutput> {
  return generateWhatsAppMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWhatsAppMessagePrompt',
  input: {schema: GenerateWhatsAppMessageInputSchema},
  output: {schema: GenerateWhatsAppMessageOutputSchema},
  prompt: `You are a helpful assistant that generates comprehensive WhatsApp messages for Greezo meal order confirmations.

  Generate a detailed message based on the following order information:
  Customer: {{{customerName}}} ({{{phoneNumber}}})
  Plan: {{{selectedPlan}}}
  Type: {{{planType}}} - {{{mealType}}}
  Juice Add-on: {{#if addJuice}}Yes{{#if selectedJuices}} - {{{selectedJuices}}}{{/if}}{{else}}No{{/if}}
  Start Date: {{{startDate}}}
  Delivery Shift: {{{shift}}}
  Address: {{{address}}}
  Total Amount: {{{totalPrice}}}
  Payment: {{{paymentMethod}}}{{#if transactionId}} (Transaction ID: {{{transactionId}}}){{/if}}
  
  Generate a professional WhatsApp message that includes all these details in a well-formatted way. The message should:
  1. Start with a greeting to Greezo
  2. Include complete customer and order details
  3. Be clear and organized
  4. End with a request for confirmation
  
  Make it look professional but friendly.
  `,
});

const generateWhatsAppMessageFlow = ai.defineFlow(
  {
    name: 'generateWhatsAppMessageFlow',
    inputSchema: GenerateWhatsAppMessageInputSchema,
    outputSchema: GenerateWhatsAppMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt({
      customerName: input.customerName,
      phoneNumber: input.phoneNumber,
      selectedPlan: input.selectedPlan,
      planType: input.planType,
      mealType: input.mealType,
      addJuice: input.addJuice,
      selectedJuices: input.selectedJuices || '',
      startDate: input.startDate,
      shift: input.shift,
      address: input.address,
      totalPrice: input.totalPrice,
      paymentMethod: input.paymentMethod,
      transactionId: input.transactionId || '',
    });
    return output!;
  }
);
