# Google Sheets Setup Guide for Greezo Orders

## Step 1: Create a Google Sheets Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Greezo Orders" 
4. Copy the spreadsheet ID from the URL (the long string between `/d/` and `/edit`)
   - Example: `https://docs.google.com/spreadsheets/d/1abc123def456ghi789/edit`
   - ID: `1abc123def456ghi789`

## Step 2: Create a Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

## Step 3: Create Service Account Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "+ CREATE CREDENTIALS" > "Service Account"
3. Fill in service account details:
   - Name: `greezo-sheets-service`
   - Description: `Service account for Greezo order management`
4. Click "Create and Continue"
5. Skip roles for now and click "Continue"
6. Click "Done"

## Step 4: Generate Service Account Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Select "JSON" format
5. Download the key file

## Step 5: Share Spreadsheet with Service Account

1. Open your Google Sheets spreadsheet
2. Click "Share" button
3. Add the service account email (from the JSON file: `client_email`)
4. Give "Editor" permissions
5. Click "Send"

## Step 6: Update Environment Variables

Add these variables to your `.env.local` file:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_ID=your_spreadsheet_id_here
GOOGLE_PROJECT_ID=your_project_id
GOOGLE_PRIVATE_KEY_ID=your_private_key_id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----"
GOOGLE_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=your_client_id
```

Extract these values from the downloaded JSON file:
- `project_id` → `GOOGLE_PROJECT_ID`
- `private_key_id` → `GOOGLE_PRIVATE_KEY_ID`
- `private_key` → `GOOGLE_PRIVATE_KEY` (keep the quotes and newlines)
- `client_email` → `GOOGLE_CLIENT_EMAIL`
- `client_id` → `GOOGLE_CLIENT_ID`

## Step 7: Test the Integration

1. Restart your development server
2. Place a test order with transaction ID
3. Check if the order appears in your Google Sheets
4. Verify WhatsApp message is sent to 9449614641

## Sheet Structure

The system will automatically create these columns:
- Date
- Order ID
- Customer Name
- Phone Number
- Plan
- Meal Type
- Juice Pack
- Selected Juices
- Start Date
- Shift
- Address
- Price
- Payment Method
- Transaction ID
- Status

## Troubleshooting

- **Permission Error**: Make sure the service account email is added to the spreadsheet with Editor permissions
- **Authentication Error**: Verify all environment variables are correctly set
- **API Error**: Ensure Google Sheets API is enabled in your Google Cloud project
- **Private Key Error**: Make sure the private key includes the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` parts

## Security Notes

- Never commit the service account JSON file to version control
- Keep your `.env.local` file secure
- The service account only has access to sheets you explicitly share with it