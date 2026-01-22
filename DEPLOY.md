# Deployment Guide

## 1. Supabase Setup

1.  **Create Project**: Go to [database.new](https://database.new) and create a new Supabase project.
2.  **SQL Editor**:
    *   Open the SQL Editor in Supabase Dashboard.
    *   Copy the contents of `supabase_schema.sql` from your project root.
    *   Run the script to create tables and RLS policies.
3.  **Auth Settings**:
    *   Go to Authentication > Providers.
    *   Ensure "Email" is enabled.
    *   (Optional) Configure Site URL and Redirect URLs if deploying to production.

## 2. Vercel Deployment

1.  **Import Project**:
    *   Go to Vercel Dashboard -> Add New -> Project.
    *   Import your GitHub repository for `stock-tracker`.
2.  **Environment Variables**:
    *   Add the following variables in the Vercel Project Settings:
        *   `VITE_SUPABASE_URL`: (Found in Supabase Settings > API)
        *   `VITE_SUPABASE_ANON_KEY`: (Found in Supabase Settings > API)
        *   `VITE_FINNHUB_API_KEY`: (Your existing Finnhub Key)
3.  **Deploy**: Click "Deploy".

## 3. Local Development

To run locally:
1.  Copy `.env.example` to `.env` (if you haven't already).
2.  Fill in the Supabase and Finnhub keys.
3.  Run `npm run dev`.
