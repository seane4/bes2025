# Banff Energy Summit - Supabase Backend

This directory contains the necessary files and instructions for setting up the Supabase backend for the Banff Energy Summit website. The backend handles order processing, customer data storage, and email confirmations.

## Overview

The Banff Energy Summit website uses Supabase for:
1. Database storage for orders, customers, and event data
2. Email sending via Edge Functions
3. Security and access control with Row Level Security (RLS)

## Getting Started

### Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Stripe account](https://stripe.com/docs/development)
- SMTP email provider (e.g., SendGrid, AWS SES, etc.)

### Setup Instructions

1. **Create a Supabase Project**

   Go to [app.supabase.com](https://app.supabase.com) and create a new project.

2. **Link Your Local Project to Supabase**

   ```bash
   supabase link --project-ref <your-project-reference>
   ```

3. **Set Up Environment Variables**

   Copy the `.env.example` file to `.env` and fill in your values:

   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Apply Database Migrations**

   ```bash
   supabase db push
   ```

5. **Deploy Edge Functions**

   ```bash
   supabase functions deploy send-confirmation-email
   ```

6. **Set Up Edge Function Secrets**

   ```bash
   supabase secrets set --env-file .env
   ```

## Database Structure

The database consists of the following tables:

- `customers` - Stores customer information
- `orders` - Stores order headers
- `order_items` - Stores line items for each order
- `activities` - Stores information about available activities
- `accommodations` - Stores information about available accommodations
- `payment_logs` - Logs payment events for auditing

See the `migrations` directory for the full schema.

## Row Level Security (RLS) Policies

The database uses Row Level Security to control access to data:

- Anonymous users can create orders and customer records during checkout
- Only authenticated admin users can view all orders and customer data
- Everyone can view activity and accommodation information

## Edge Functions

### send-confirmation-email

This function is triggered after a successful order is placed. It:

1. Retrieves order details from the database
2. Generates HTML email content
3. Sends the confirmation email via SMTP
4. Logs the email activity in the database

## Frontend Integration

In the frontend JavaScript code, we use the Supabase client to:

1. Store customer and order data after successful payment
2. Trigger the email confirmation Edge Function
3. Provide a unified API for all backend operations

## Webhook Setup

Set up a Stripe webhook in your Stripe dashboard, pointing to your Supabase Edge Function URL:

```
https://your-project.functions.supabase.co/stripe-webhook
```

Configure it to listen for the following events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

## Maintenance and Troubleshooting

### Viewing Logs

To view logs for Edge Functions:

```bash
supabase functions logs send-confirmation-email
```

### Database Backups

Supabase automatically handles database backups. You can also manually create backups:

```bash
supabase db dump -f backup.sql
```

### Common Issues

- **CORS Errors**: Make sure your Supabase project has the correct CORS settings in the dashboard.
- **Email Sending Failures**: Verify SMTP credentials and check logs for detailed error messages.
- **RLS Policy Issues**: Test policies using the SQL editor in the Supabase dashboard.

## Security Considerations

- Never expose your `service_role_key` in client-side code
- Always use RLS policies to restrict data access
- Use HTTPS for all API requests
- Validate and sanitize all user inputs

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Edge Functions Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions) 