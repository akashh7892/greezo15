import { google } from 'googleapis';

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '';
const SHEET_NAME = 'Orders';

// Service account credentials (you'll need to add these to environment variables)
const credentials = {
  type: 'service_account',
  project_id: process.env.GOOGLE_PROJECT_ID || '',
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID || '',
  private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_CLIENT_EMAIL || '',
  client_id: process.env.GOOGLE_CLIENT_ID || '',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`,
};

export type OrderData = {
  customerName: string;
  phoneNumber: string;
  plan: string;
  mealType: string;
  juicePack: string;
  selectedJuices: string;
  startDate: string;
  shift: string;
  address: string;
  price: string;
  paymentMethod: string;
  transactionId: string;
  status?: string;
};

// Initialize Google Sheets API
async function getGoogleSheetsInstance() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
  } catch (error) {
    console.error('Error initializing Google Sheets:', error);
    throw error;
  }
}

// Create headers if sheet is empty
async function ensureHeaders() {
  try {
    const sheets = await getGoogleSheetsInstance();
    
    // Check if headers exist
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:N1`,
    });

    if (!response.data.values || response.data.values.length === 0) {
      // Add headers
      const headers = [
        'Date',
        'Order ID',
        'Customer Name',
        'Phone Number',
        'Plan',
        'Meal Type',
        'Juice Pack',
        'Selected Juices',
        'Start Date',
        'Shift',
        'Address',
        'Price',
        'Payment Method',
        'Transaction ID',
        'Status'
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers],
        },
      });
    }
  } catch (error) {
    console.error('Error ensuring headers:', error);
  }
}

// Add order to Google Sheets
export async function addOrderToSheet(orderData: OrderData): Promise<{ success: boolean; error?: string; orderId?: string }> {
  try {
    // Check if required environment variables are present
    if (!SPREADSHEET_ID || !process.env.GOOGLE_CLIENT_EMAIL) {
      console.warn('Google Sheets not configured - skipping sheet storage');
      return { success: false, error: 'Google Sheets not configured' };
    }

    const sheets = await getGoogleSheetsInstance();
    
    // Ensure headers exist
    await ensureHeaders();

    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Prepare row data
    const rowData = [
      new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), // Date
      orderId, // Order ID
      orderData.customerName,
      orderData.phoneNumber,
      orderData.plan,
      orderData.mealType,
      orderData.juicePack,
      orderData.selectedJuices,
      orderData.startDate,
      orderData.shift,
      orderData.address,
      orderData.price,
      orderData.paymentMethod,
      orderData.transactionId,
      orderData.status || 'Confirmed'
    ];

    // Add row to sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:O`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [rowData],
      },
    });

    console.log('Order added to Google Sheets successfully:', orderId);
    return { success: true, orderId };

  } catch (error) {
    console.error('Error adding order to Google Sheets:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add to sheet' };
  }
}

// Update order status in sheet
export async function updateOrderStatus(orderId: string, status: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!SPREADSHEET_ID || !process.env.GOOGLE_CLIENT_EMAIL) {
      return { success: false, error: 'Google Sheets not configured' };
    }

    const sheets = await getGoogleSheetsInstance();

    // Find the row with the order ID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!B:B`,
    });

    if (response.data.values) {
      const rowIndex = response.data.values.findIndex(row => row[0] === orderId);
      
      if (rowIndex >= 0) {
        // Update status (column O is the 15th column, 1-indexed)
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!O${rowIndex + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[status]],
          },
        });

        return { success: true };
      }
    }

    return { success: false, error: 'Order ID not found' };

  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update status' };
  }
}

// Get all orders from sheet
export async function getOrdersFromSheet(): Promise<{ success: boolean; orders?: any[]; error?: string }> {
  try {
    if (!SPREADSHEET_ID || !process.env.GOOGLE_CLIENT_EMAIL) {
      return { success: false, error: 'Google Sheets not configured' };
    }

    const sheets = await getGoogleSheetsInstance();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:O`,
    });

    if (response.data.values) {
      const [headers, ...rows] = response.data.values;
      const orders = rows.map(row => {
        const order: any = {};
        headers.forEach((header: string, index: number) => {
          order[header.toLowerCase().replace(/\s+/g, '_')] = row[index] || '';
        });
        return order;
      });

      return { success: true, orders };
    }

    return { success: true, orders: [] };

  } catch (error) {
    console.error('Error getting orders from sheet:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get orders' };
  }
}