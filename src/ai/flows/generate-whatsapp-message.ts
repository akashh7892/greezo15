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
  selectedPlan: z.string().describe('The selected meal plan (e.g., Basic Weekly Plan).'),
  'add Juice': z.boolean().describe('Whether the user wants to add a juice pack.'),
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
  prompt: `You are a helpful assistant that generates pre-filled WhatsApp messages for order confirmation.

  Generate a message based on the following information:
  Selected Plan: {{{selectedPlan}}}
  Add Juice: {{#if addJuice}}Yes{{else}}No{{/if}}
  
  The message should follow this format:
  "Hello, I would like to order the following Greezo plan: [Selected Plan], Add-On Juice: [Yes/No]. Please contact me."
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
        selectedPlan: input.selectedPlan,
        addJuice: input['add Juice'],
    });
    return output!;
  }
);
