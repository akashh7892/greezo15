
'use server';

import { supabase, type OrderInsert } from '@/lib/supabase';
import { addOrderToSheet, type OrderData as SheetsOrderData } from '@/lib/sheets';
import {
  generateWhatsAppMessage,
  type GenerateWhatsAppMessageInput,
} from '@/ai/flows/generate-whatsapp-message';

type OrderData = {
  customerName: string;
  phoneNumber: string;
  plan: string;
  type: string;
  juicePack: string;
  selectedJuices?: string;
  startDate: string;
  shift: string;
  address?: string;
  price: string;
  paymentMethod?: string;
  transactionId?: string;
  paymentStatus?: string;
};

export async function saveOrderToSupabase(orderData: OrderData): Promise<{ success: boolean; error?: string; orderId?: string; sheetOrderId?: string | null }> {
  try {
    // Prepare order data for Supabase
    const orderInsert: OrderInsert = {
      customer_name: orderData.customerName,
      phone_number: orderData.phoneNumber,
      plan: orderData.plan,
      meal_type: orderData.type,
      juice_pack: orderData.juicePack === 'Yes',
      selected_juices: orderData.selectedJuices || null,
      start_date: orderData.startDate === 'ASAP' ? null : orderData.startDate,
      preferred_shift: orderData.shift === 'Any time' ? null : orderData.shift,
      address: orderData.address || null,
      price: orderData.price,
      payment_method: orderData.paymentMethod || null,
      transaction_id: orderData.transactionId || null,
      payment_status: orderData.paymentStatus || (orderData.transactionId ? 'paid' : 'pending')
    };

    // Insert order into Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert(orderInsert)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return { success: false, error: 'Failed to save order data' };
    }

    console.log('Order saved to Supabase successfully:', data);
    
    // Also save to Google Sheets
    let sheetOrderId = null;
    try {
      const sheetsData: SheetsOrderData = {
        customerName: orderData.customerName,
        phoneNumber: orderData.phoneNumber,
        plan: orderData.plan,
        mealType: orderData.type,
        juicePack: orderData.juicePack,
        selectedJuices: orderData.selectedJuices || 'None',
        startDate: orderData.startDate,
        shift: orderData.shift,
        address: orderData.address || 'Not provided',
        price: orderData.price,
        paymentMethod: orderData.paymentMethod || 'Not specified',
        transactionId: orderData.transactionId || 'N/A',
        status: orderData.transactionId ? 'Paid' : 'Pending'
      };
      
      const sheetResult = await addOrderToSheet(sheetsData);
      if (sheetResult.success) {
        console.log('Order saved to Google Sheets:', sheetResult.orderId);
        sheetOrderId = sheetResult.orderId;
      } else {
        console.warn('Failed to save to Google Sheets:', sheetResult.error);
      }
    } catch (sheetError) {
      console.error('Google Sheets error:', sheetError);
      // Don't fail the order if sheet saving fails
    }
    
    // Generate WhatsApp message if order is completed
    if (orderData.transactionId || orderData.paymentMethod === 'Cash on Delivery') {
      try {
        await generateAndSendWhatsAppMessage(orderData, data.id, sheetOrderId);
      } catch (whatsappError) {
        console.error('WhatsApp message generation failed:', whatsappError);
        // Don't fail the order if WhatsApp message fails
      }
    }
    
    return { success: true, orderId: data.id, sheetOrderId };
  } catch (error) {
    console.error('Error saving to Supabase:', error);
    return { success: false, error: 'Failed to save order data' };
  }
}

async function generateAndSendWhatsAppMessage(orderData: OrderData, orderId: string, sheetOrderId?: string | null) {
  try {
    const messageInput: GenerateWhatsAppMessageInput = {
      customerName: orderData.customerName,
      phoneNumber: orderData.phoneNumber,
      selectedPlan: orderData.plan,
      planType: orderData.plan.includes('Trial') ? 'trial' : 
                orderData.plan.includes('Weekly') ? 'weekly' : 'monthly',
      mealType: orderData.type,
      addJuice: orderData.juicePack === 'Yes',
      selectedJuices: orderData.selectedJuices,
      startDate: orderData.startDate,
      shift: orderData.shift,
      address: orderData.address || 'Address not provided',
      totalPrice: orderData.price,
      paymentMethod: orderData.paymentMethod || 'Not specified',
      transactionId: orderData.transactionId
    };

    const result = await generateWhatsAppMessage(messageInput);
    
    if (result && result.message) {
      // Enhanced WhatsApp message with order IDs
      const enhancedMessage = `${result.message}\n\n📋 Order Reference:\n• Supabase ID: ${orderId}${sheetOrderId ? `\n• Sheet ID: ${sheetOrderId}` : ''}\n\n🕐 Order Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;
      
      console.log('Generated WhatsApp message:', enhancedMessage);
      
      // Create WhatsApp link with enhanced message
      const whatsappLink = `https://wa.me/919449614641?text=${encodeURIComponent(enhancedMessage)}`;
      console.log('WhatsApp link:', whatsappLink);
      
      // Auto-redirect to WhatsApp after order completion
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.open(whatsappLink, '_blank');
        }, 1000);
      }
      
      return { success: true, message: result.message, link: whatsappLink };
    }
    
    throw new Error('Failed to generate message');
  } catch (error) {
    console.error('Error in generateAndSendWhatsAppMessage:', error);
    throw error;
  }
}

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
