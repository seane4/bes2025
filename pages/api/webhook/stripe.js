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
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- IMPORTANT: Define Your Supabase Table and Column Names ---
// *** ADJUST THESE TO MATCH YOUR ACTUAL SUPABASE SCHEMA ***
const CUSTOMERS_TABLE = 'customers'; // Your customers table
const ORDERS_TABLE = 'orders';       // Your orders table
const ORDER_ITEMS_TABLE = 'order_items'; // Your order items table

const CUSTOMER_PK_COLUMN = 'id'; // Primary key of your customers table (e.g., 'id')
const CUSTOMER_STRIPE_ID_COLUMN = 'stripe_customer_id'; // Column storing Stripe Customer ID in your customers table

const ORDER_PK_COLUMN = 'id'; // Primary key of your orders table (e.g., 'id')
const ORDER_CUSTOMER_FK_COLUMN = 'customer_id'; // Foreign key in orders linking to customers table PK
const ORDER_STRIPE_PI_ID_COLUMN = 'stripe_payment_intent_id'; // Column storing Stripe Payment Intent ID
const ORDER_AMOUNT_COLUMN = 'amount'; // Column for total order amount (e.g., numeric)
const ORDER_CURRENCY_COLUMN = 'currency'; // Column for currency (e.g., text)
const ORDER_STATUS_COLUMN = 'status'; // Column for order status (e.g., text)

const ORDER_ITEM_ORDER_FK_COLUMN = 'order_id'; // Foreign key in order_items linking to orders table PK
const ORDER_ITEM_PRODUCT_FK_COLUMN = 'product_id'; // Foreign key in order_items linking to products table PK (adjust if needed)
const ORDER_ITEM_QUANTITY_COLUMN = 'quantity'; // Column for item quantity
// Optional: Add a column for price_at_purchase if you store it in metadata or fetch it
// const ORDER_ITEM_PRICE_COLUMN = 'price_at_purchase';
// --- End of Schema Definitions ---

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
  console.log('Handling payment_intent.succeeded...');

  // 1. Extract Data from PaymentIntent
  const stripePaymentIntentId = paymentIntent.id;
  const stripeCustomerId = paymentIntent.customer; // Stripe Customer ID
  const amountReceived = paymentIntent.amount_received / 100; // Amount in DOLLARS
  const currency = paymentIntent.currency;
  const customerEmail = paymentIntent.receipt_email || paymentIntent.customer?.email; // Get email if available
  const metadata = paymentIntent.metadata; // Retrieve metadata if you stored cart info

  console.log(`  PI ID: ${stripePaymentIntentId}, Stripe Cust ID: ${stripeCustomerId}, Amount: ${amountReceived} ${currency}, Email: ${customerEmail}`);
  console.log(`  Metadata: ${JSON.stringify(metadata)}`);

  // Prevent duplicate processing (optional but recommended)
  const { data: existingOrder, error: checkError } = await supabase
    .from(ORDERS_TABLE)
    .select(ORDER_PK_COLUMN)
    .eq(ORDER_STRIPE_PI_ID_COLUMN, stripePaymentIntentId)
    .maybeSingle(); // Use maybeSingle to not throw error if not found

  if (checkError) {
    console.error('  Error checking for existing order:', checkError);
    throw new Error(`Database error checking order: ${checkError.message}`); // Let the main handler catch this
  }
  if (existingOrder) {
    console.log(`  Order for PaymentIntent ${stripePaymentIntentId} already exists (ID: ${existingOrder[ORDER_PK_COLUMN]}). Skipping.`);
    return; // Exit successfully, already processed
  }

  // 2. Find or Create Customer in Supabase
  let supabaseCustomerId = null;
  if (stripeCustomerId) {
    // Try finding by Stripe Customer ID first
    const { data: customer, error: findError } = await supabase
      .from(CUSTOMERS_TABLE)
      .select(CUSTOMER_PK_COLUMN) // Select the primary key
      .eq(CUSTOMER_STRIPE_ID_COLUMN, stripeCustomerId)
      .maybeSingle();

    if (findError) {
      console.error('  Error finding customer by Stripe ID:', findError);
      // Decide if this is critical - maybe proceed without linking? Or throw error?
      // For now, log and continue, trying email next.
    } else if (customer) {
      supabaseCustomerId = customer[CUSTOMER_PK_COLUMN];
      console.log(`  Found Supabase customer by Stripe ID: ${supabaseCustomerId}`);
    }
  }

  // If not found by Stripe ID, try finding or creating by email (if available)
  if (!supabaseCustomerId && customerEmail) {
     console.log(`  Customer not found by Stripe ID, trying email: ${customerEmail}`);
     // This uses upsert: inserts if email doesn't exist, does nothing if it does (and returns the existing row)
     // 'onConflict' assumes you have a UNIQUE constraint on the email column in your Supabase customers table.
     const { data: customer, error: upsertError } = await supabase
       .from(CUSTOMERS_TABLE)
       .upsert(
         {
           email: customerEmail,
           [CUSTOMER_STRIPE_ID_COLUMN]: stripeCustomerId, // Add Stripe ID if creating
           // Add other customer details from paymentIntent if needed (name, address)
           // name: paymentIntent.customer?.name || paymentIntent.shipping?.name,
         },
         {
           onConflict: 'email', // Specify the column with the unique constraint
           ignoreDuplicates: false, // Set to false to return the existing row on conflict
         }
       )
       .select(CUSTOMER_PK_COLUMN) // Select the primary key after upsert
       .single(); // Expect a single result

     if (upsertError) {
       console.error('  Error upserting customer by email:', upsertError);
       // Decide how critical this is. Maybe proceed without a customer link?
       // Throwing an error might be safer to ensure data integrity.
       throw new Error(`Database error upserting customer: ${upsertError.message}`);
     } else if (customer) {
       supabaseCustomerId = customer[CUSTOMER_PK_COLUMN];
       console.log(`  Upserted/Found Supabase customer by email: ${supabaseCustomerId}`);
       // If we just created the customer, link the Stripe ID if we didn't find it earlier
       if (stripeCustomerId && !customer[CUSTOMER_STRIPE_ID_COLUMN]) {
         const { error: updateStripeIdError } = await supabase
           .from(CUSTOMERS_TABLE)
           .update({ [CUSTOMER_STRIPE_ID_COLUMN]: stripeCustomerId })
           .eq(CUSTOMER_PK_COLUMN, supabaseCustomerId);
         if (updateStripeIdError) console.error('  Error updating Stripe ID for newly upserted customer:', updateStripeIdError);
       }
     }
  }

  if (!supabaseCustomerId) {
      console.warn(`  Could not find or create a Supabase customer record for this order.`);
      // Decide: Proceed with null customer_id in orders table? Or throw error?
      // throw new Error('Failed to associate order with a customer.');
  }

  // 3. Create Order in Supabase
  const { data: newOrder, error: orderError } = await supabase
    .from(ORDERS_TABLE)
    .insert({
      [ORDER_CUSTOMER_FK_COLUMN]: supabaseCustomerId, // Can be null if you allow it
      [ORDER_STRIPE_PI_ID_COLUMN]: stripePaymentIntentId,
      [ORDER_AMOUNT_COLUMN]: amountReceived, // Store amount in dollars
      [ORDER_CURRENCY_COLUMN]: currency,
      [ORDER_STATUS_COLUMN]: paymentIntent.status, // 'succeeded'
      // Add other relevant fields like metadata if needed
      // metadata: metadata
    })
    .select(ORDER_PK_COLUMN) // Select the primary key of the new order
    .single(); // Expect a single result

  if (orderError) {
    console.error('  Error inserting order:', orderError);
    throw new Error(`Database error creating order: ${orderError.message}`);
  }

  const supabaseOrderId = newOrder[ORDER_PK_COLUMN];
  console.log(`  Successfully inserted order with ID: ${supabaseOrderId}`);

  // 4. Create Order Items (Requires item details, e.g., from metadata)
  let cartItems = [];
  if (metadata?.cart_details) { // Check if you stored cart details in metadata
      try {
          cartItems = JSON.parse(metadata.cart_details); // Expecting [{ productId: '...', quantity: ... }]
          console.log(`  Parsed cart items from metadata: ${JSON.stringify(cartItems)}`);
      } catch (parseError) {
          console.error('  Error parsing cart_details from metadata:', parseError);
          // Decide how to handle - maybe log and skip item creation?
          cartItems = []; // Ensure it's an empty array if parsing fails
      }
  } else {
      console.warn('  No cart_details found in PaymentIntent metadata. Cannot create order items.');
  }

  if (cartItems.length > 0 && supabaseOrderId) {
    const orderItemsData = cartItems.map(item => ({
      [ORDER_ITEM_ORDER_FK_COLUMN]: supabaseOrderId,
      [ORDER_ITEM_PRODUCT_FK_COLUMN]: item.productId, // Assumes 'productId' is the key in metadata
      [ORDER_ITEM_QUANTITY_COLUMN]: item.quantity,   // Assumes 'quantity' is the key in metadata
      // Optional: Add price_at_purchase if available in metadata or fetched
    }));

    console.log(`  Attempting to insert order items: ${JSON.stringify(orderItemsData)}`);

    const { error: itemsError } = await supabase
      .from(ORDER_ITEMS_TABLE)
      .insert(orderItemsData);

    if (itemsError) {
      console.error('  Error inserting order items:', itemsError);
      // Log the error but don't necessarily throw, as the main order is already created.
      // Consider adding a status to the order indicating item insertion failed.
    } else {
      console.log(`  Successfully inserted ${orderItemsData.length} order item(s).`);
    }
  }

  console.log(`Finished handling PaymentIntent ${stripePaymentIntentId}`);
}

/**
 * Handle failed payment intents
 */
async function handlePaymentFailed(paymentIntent) {
  console.log('Handling payment_intent.payment_failed...');
  const stripePaymentIntentId = paymentIntent.id;
  // Optional: Update an existing order status to 'failed' in Supabase
  // Or log the failure, notify admin, etc.
  const { error } = await supabase
    .from(ORDERS_TABLE)
    .update({ [ORDER_STATUS_COLUMN]: 'failed' })
    .eq(ORDER_STRIPE_PI_ID_COLUMN, stripePaymentIntentId);

  if (error) {
    console.error(`  Error updating order status to failed for PI ${stripePaymentIntentId}:`, error);
  } else {
    console.log(`  Updated order status to failed for PI ${stripePaymentIntentId}`);
  }
} 