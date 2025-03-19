// Stripe webhook handler for Vercel deployment
import { buffer } from 'micro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Disable the default body parser for raw body access
export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      // Add more event types as needed
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (err) {
    console.error(`Error processing webhook: ${err.message}`);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

/**
 * Handle successful payment intents
 */
async function handlePaymentSucceeded(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);

  try {
    // Find the order with this transaction ID
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('transaction_id', paymentIntent.id)
      .maybeSingle();

    if (orderError) {
      throw new Error(`Error finding order: ${orderError.message}`);
    }

    if (!orders) {
      console.log('No order found with transaction ID:', paymentIntent.id);
      // This could be a payment not initiated through our website
      // Log it for investigation
      await supabase.from('payment_logs').insert({
        transaction_id: paymentIntent.id,
        event_type: 'payment_succeeded_no_order',
        event_data: paymentIntent
      });
      return;
    }

    // Update order status if needed
    if (orders.status !== 'completed') {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'completed', updated_at: new Date() })
        .eq('id', orders.id);

      if (updateError) {
        throw new Error(`Error updating order status: ${updateError.message}`);
      }
    }

    // Log the event
    await supabase.from('payment_logs').insert({
      order_id: orders.order_id,
      transaction_id: paymentIntent.id,
      event_type: 'webhook_payment_succeeded',
      event_data: {
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        payment_method: paymentIntent.payment_method
      }
    });
  } catch (error) {
    console.error('Error processing payment_intent.succeeded webhook:', error);
    // Log the error
    await supabase.from('payment_logs').insert({
      transaction_id: paymentIntent.id,
      event_type: 'webhook_error',
      event_data: {
        error: error.message,
        event: 'payment_intent.succeeded'
      }
    });
  }
}

/**
 * Handle failed payment intents
 */
async function handlePaymentFailed(paymentIntent) {
  console.log('Payment failed:', paymentIntent.id);

  try {
    // Find the order with this transaction ID
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('transaction_id', paymentIntent.id)
      .maybeSingle();

    if (orderError) {
      throw new Error(`Error finding order: ${orderError.message}`);
    }

    if (orders) {
      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'failed', 
          updated_at: new Date() 
        })
        .eq('id', orders.id);

      if (updateError) {
        throw new Error(`Error updating order status: ${updateError.message}`);
      }

      // Log the event
      await supabase.from('payment_logs').insert({
        order_id: orders.order_id,
        transaction_id: paymentIntent.id,
        event_type: 'webhook_payment_failed',
        event_data: {
          amount: paymentIntent.amount / 100, // Convert from cents
          currency: paymentIntent.currency,
          error: paymentIntent.last_payment_error,
          payment_method: paymentIntent.payment_method
        }
      });
    } else {
      // No order found, just log the event
      await supabase.from('payment_logs').insert({
        transaction_id: paymentIntent.id,
        event_type: 'webhook_payment_failed_no_order',
        event_data: {
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          error: paymentIntent.last_payment_error
        }
      });
    }
  } catch (error) {
    console.error('Error processing payment_intent.payment_failed webhook:', error);
    // Log the error
    await supabase.from('payment_logs').insert({
      transaction_id: paymentIntent.id,
      event_type: 'webhook_error',
      event_data: {
        error: error.message,
        event: 'payment_intent.payment_failed'
      }
    });
  }
} 