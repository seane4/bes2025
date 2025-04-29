// Remove Next.js specific exports
// const config = { api: { bodyParser: false } };

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Initialize Supabase using the URL from env-config
const supabaseUrl = 'https://nxeyxsojtistrgadsyju.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Constants for database tables and columns
const CUSTOMERS_TABLE = 'customers';
const ORDERS_TABLE = 'orders';
const ORDER_ITEMS_TABLE = 'order_items';
const HOTEL_BOOKINGS_TABLE = 'hotel_bookings';

// Modify the handler to be Express middleware
module.exports = async function stripeWebhookHandler(req, res) {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`Handling ${event.type} event`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

// Keep your existing helper functions (handlePaymentSucceeded, handlePaymentFailed, etc.) 