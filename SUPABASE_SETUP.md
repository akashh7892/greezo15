# 🚀 Supabase Setup Guide for Greezo Website

## Overview
Your Greezo website now uses Supabase instead of Google Sheets for better performance, security, and deployment compatibility with Netlify.

## 📋 Setup Steps

### 1. Create Supabase Project
1. Go to [Supabase](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `greezo-orders` (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Choose closest to your users (e.g., `ap-south-1` for India)
5. Click "Create new project"

### 2. Create Database Table
Once your project is ready:

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **"New query"**
3. Paste this SQL and click **"Run"**:

```sql
-- Create orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  customer_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  plan TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  juice_pack BOOLEAN NOT NULL DEFAULT false,
  start_date DATE,
  preferred_shift TEXT,
  price TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending'
);

-- Create index for better performance
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts (for new orders)
CREATE POLICY "Allow anonymous inserts" ON orders
  FOR INSERT WITH CHECK (true);

-- Create policy to allow reads (for viewing orders)
CREATE POLICY "Allow anonymous reads" ON orders
  FOR SELECT USING (true);
```

### 3. Get Your Credentials
1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy your **Project URL** and **anon public** key

### 4. Configure Environment Variables

#### For Local Development:
Update your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

#### For Netlify Deployment:
1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add these variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

## 📊 Viewing Your Orders

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** → **orders**
3. View all orders in real-time with filtering and search

### Option 2: Direct Database Access
```sql
-- View all orders
SELECT * FROM orders ORDER BY created_at DESC;

-- View today's orders
SELECT * FROM orders 
WHERE DATE(created_at) = CURRENT_DATE 
ORDER BY created_at DESC;

-- View orders by payment status
SELECT * FROM orders 
WHERE payment_status = 'pending' 
ORDER BY created_at DESC;
```

## 🎯 Benefits of Supabase vs Google Sheets

| Feature | Supabase ✅ | Google Sheets ❌ |
|---------|------------|------------------|
| **Performance** | Fast database queries | Slow API calls |
| **Scalability** | Unlimited rows | Limited to ~10M cells |
| **Real-time** | Live updates | Manual refresh |
| **Security** | Row-level security | Shared access |
| **Deployment** | Perfect for Netlify | Complex setup |
| **Cost** | Free tier (500MB) | Free tier (limited) |
| **Developer Experience** | SQL, REST APIs, TypeScript | Limited querying |

## 🔧 Data Structure

Your orders table contains:
- **id**: Unique identifier (UUID)
- **created_at**: Timestamp of order creation
- **customer_name**: Customer's full name
- **phone_number**: 10-digit mobile number
- **plan**: Meal plan name
- **meal_type**: Egg/Non-Egg preference
- **juice_pack**: Boolean (true/false)
- **start_date**: Preferred start date (nullable)
- **preferred_shift**: Specific time slots like "6:00 AM - 7:00 AM" or "6:00 PM - 7:00 PM" (nullable)
- **price**: Order price
- **payment_status**: pending/completed/failed

## 🚀 Deployment Ready

Your website is now ready for Netlify deployment:
1. Push your code to GitHub
2. Connect your GitHub repo to Netlify
3. Add the environment variables in Netlify
4. Deploy automatically!

## 🛠 Troubleshooting

**Common Issues:**
1. **Environment variables not working**: Make sure they start with `NEXT_PUBLIC_`
2. **Database connection failed**: Check your URL and anon key
3. **Deployment issues**: Verify environment variables are set in Netlify
4. **RLS errors**: Ensure your policies are correctly configured

Your website is now production-ready with a robust database backend! 🎉