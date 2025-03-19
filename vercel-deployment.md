# Deploying Banff Energy Summit to Vercel

This guide explains how to deploy the Banff Energy Summit website to Vercel while using Supabase as the backend for order processing, customer data storage, and email confirmations.

## Overview

The Banff Energy Summit website uses:
- **Vercel** for hosting and serverless functions
- **Supabase** for database and storage
- **Stripe** for payment processing

This architecture offers several advantages:
- Vercel's global CDN for fast page loads
- Supabase for easy database management
- Serverless functions for backend operations
- Automatic CI/CD deployment pipeline

## Prerequisites

- [Vercel account](https://vercel.com/signup)
- [Supabase account](https://supabase.com/)
- [Stripe account](https://stripe.com/) (for payment processing)
- [GitHub account](https://github.com/) (recommended for deployment)

## Setting Up Supabase

1. **Create a new Supabase project**
   - Go to the [Supabase Dashboard](https://app.supabase.com/)
   - Click "New Project" and follow the setup wizard
   - Note your project URL and keys (available in Project Settings > API)

2. **Apply the database migrations**
   - Install the Supabase CLI: `npm install -g supabase`
   - Login to Supabase: `supabase login`
   - Initialize the project: `supabase init`
   - Link to your remote project: `supabase link --project-ref your-project-ref`
   - Push the database schema: `supabase db push`

## Deploying to Vercel

### Option 1: Deploy from GitHub

1. **Push your code to GitHub**
   - Create a new repository
   - Push your code to the repository

2. **Import the project in Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" > "Project"
   - Select your GitHub repository
   - Configure the project:
     - Build Command: `npm run build` (or as appropriate for your project)
     - Output Directory: `public` (or your build output directory)
   - Click "Deploy"

### Option 2: Deploy from CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy the project**
   ```bash
   vercel
   ```

## Environment Variables

Set the following environment variables in your Vercel project:

1. **Go to Vercel Dashboard > Your Project > Settings > Environment Variables**

2. **Add the following environment variables:**

   ```
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Stripe API Keys
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key
   STRIPE_SECRET_KEY=sk_test_your-key
   STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

   # Email Configuration
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email-username
   EMAIL_PASSWORD=your-email-password
   EMAIL_FROM=registration@banffenergysummit.com

   # Site Configuration
   NEXT_PUBLIC_SITE_URL=https://your-vercel-deployment-url.vercel.app
   NEXT_PUBLIC_SITE_NAME=Banff Energy Summit 2025
   ```

## Setting Up Stripe Webhooks

1. **Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)**

2. **Click "Add Endpoint"**

3. **Set the endpoint URL to**:
   ```
   https://your-vercel-deployment-url.vercel.app/api/webhook/stripe
   ```

4. **Select events to listen for**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

5. **Get your webhook signing secret and set it as `STRIPE_WEBHOOK_SECRET` in Vercel**

## Testing Your Deployment

1. **Make a test purchase on your site**

2. **Check Vercel logs**:
   - Go to Vercel Dashboard > Your Project > Deployments > Latest Deployment > Functions
   - Check logs for the serverless functions

3. **Check Supabase data**:
   - Go to Supabase Dashboard > Your Project > Table Editor
   - Verify that orders, customers, and email logs are being created

## Troubleshooting

### Vercel Deployment Issues

- **Check your build logs** in the Vercel dashboard
- Ensure all dependencies are correctly listed in `package.json`
- Verify your build command and output directory settings

### API/Serverless Function Issues

- Check the **function logs** in Vercel
- Ensure environment variables are correctly set
- Test the API routes locally using Vercel CLI: `vercel dev`

### Supabase Connection Issues

- Verify your Supabase URL and keys
- Check that RLS (Row Level Security) policies are correctly set
- Test database operations using Supabase Dashboard > SQL Editor

### Stripe Payment Issues

- Check Stripe Dashboard > Events for payment attempts
- Verify webhook events are being received (check for 200 status codes)
- Test with Stripe test cards and test mode

## Optimization Tips

1. **Cache Static Assets**
   - Use Vercel's built-in caching for static assets

2. **API Route Optimization**
   - Use edge caching for read-only API routes
   - Implement proper error handling and response codes

3. **Database Query Optimization**
   - Use appropriate indexes on frequently queried fields
   - Limit result sets to only necessary data

4. **Monitoring**
   - Set up Vercel Analytics to monitor site performance
   - Enable Supabase's monitoring features

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Next.js with Vercel](https://nextjs.org/docs/deployment) 