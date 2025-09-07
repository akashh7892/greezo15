
'use server';

import {
  generateWhatsAppMessage,
  type GenerateWhatsAppMessageInput,
} from '@/ai/flows/generate-whatsapp-message';

export async function getWhatsAppMessage(
  input: GenerateWhatsAppMessageInput
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const result = await generateWhatsAppMessage(input);
    if (!result || !result.message) {
      throw new Error('AI did not return a message.');
    }
    return { success: true, message: result.message };
  } catch (error) {
    console.error('Error generating WhatsApp message:', error);
    return { success: false, error: 'Failed to generate message.' };
  }
}
