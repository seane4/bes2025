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
const ACTIVITIES_TABLE = 'activities'; // Added for reference if needed later

const CUSTOMER_PK_COLUMN = 'id'; // Primary key of your customers table (e.g., 'id')
const CUSTOMER_EMAIL_COLUMN = 'email'; // Column for customer email
const CUSTOMER_STRIPE_ID_COLUMN = 'stripe_customer_id'; // Column storing Stripe Customer ID

const ORDER_PK_COLUMN = 'id'; // Primary key of your orders table (e.g., 'id')
const ORDER_CUSTOMER_FK_COLUMN = 'customer_id'; // Foreign key in orders linking to customers table PK
const ORDER_STRIPE_PI_ID_COLUMN = 'stripe_payment_intent_id'; // Column storing Stripe Payment Intent ID
const ORDER_AMOUNT_COLUMN = 'amount'; // Column for total order amount IN CENTS (integer)
const ORDER_CURRENCY_COLUMN = 'currency'; // Column for currency (e.g., text)
const ORDER_STATUS_COLUMN = 'status'; // Column for order status (e.g., text)

const ORDER_ITEM_ORDER_FK_COLUMN = 'order_id'; // Foreign key in order_items linking to orders table PK
const ORDER_ITEM_PRODUCT_FK_COLUMN = 'product_id'; // Foreign key in order_items linking to activities table PK
const ORDER_ITEM_QUANTITY_COLUMN = 'quantity'; // Column for quantity
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

// --- Helper Function: Find or Create Customer ---
async function findOrCreateCustomer(stripeCustomerId, customerEmail) {
  if (!stripeCustomerId && !customerEmail) {
    console.warn('Cannot find or create customer without Stripe Customer ID or Email.');
    // Decide how to handle this - maybe create an order without a customer?
    // Or throw an error if customer is mandatory.
    // For now, returning null, assuming orders might allow null customer_id
    return null;
  }

  let query = supabase.from(CUSTOMERS_TABLE);

  // Prefer lookup by Stripe Customer ID if available
  if (stripeCustomerId) {
    query = query.select(`${CUSTOMER_PK_COLUMN}, ${CUSTOMER_STRIPE_ID_COLUMN}`)
                 .eq(CUSTOMER_STRIPE_ID_COLUMN, stripeCustomerId)
                 .maybeSingle();
  } else {
    // Fallback to email if Stripe ID is missing (should be rare with PI flow)
    query = query.select(`${CUSTOMER_PK_COLUMN}, ${CUSTOMER_STRIPE_ID_COLUMN}`)
                 .eq(CUSTOMER_EMAIL_COLUMN, customerEmail)
                 .maybeSingle();
  }

  const { data: existingCustomer, error: findError } = await query;

  if (findError) {
    console.error('Supabase error finding customer:', findError);
    throw new Error(`Error finding customer: ${findError.message}`);
  }

  if (existingCustomer) {
    console.log(`Found existing customer: ${existingCustomer[CUSTOMER_PK_COLUMN]}`);
    // If found by email but Stripe ID is missing in DB, update it
    if (stripeCustomerId && !existingCustomer[CUSTOMER_STRIPE_ID_COLUMN]) {
       const { error: updateError } = await supabase
        .from(CUSTOMERS_TABLE)
        .update({ [CUSTOMER_STRIPE_ID_COLUMN]: stripeCustomerId })
        .eq(CUSTOMER_PK_COLUMN, existingCustomer[CUSTOMER_PK_COLUMN]);

       if (updateError) {
         console.error('Supabase error updating customer with Stripe ID:', updateError);
         // Log error but proceed with the found customer ID
       } else {
         console.log(`Updated customer ${existingCustomer[CUSTOMER_PK_COLUMN]} with Stripe ID ${stripeCustomerId}`);
       }
    }
    return existingCustomer[CUSTOMER_PK_COLUMN];
  }

  // --- Customer Not Found - Create New Customer ---
  console.log('Customer not found, creating new customer.');
  const customerInsertData = {
    [CUSTOMER_EMAIL_COLUMN]: customerEmail, // Email is essential
    // Add other fields if available from metadata or default values
  };
  if (stripeCustomerId) {
    customerInsertData[CUSTOMER_STRIPE_ID_COLUMN] = stripeCustomerId;
  }

  const { data: newCustomer, error: createError } = await supabase
    .from(CUSTOMERS_TABLE)
    .insert(customerInsertData)
    .select(CUSTOMER_PK_COLUMN)
    .single(); // Use single() as we expect one row back

  if (createError) {
    console.error('Supabase error creating customer:', createError);
    // Check for unique constraint violation on email
    if (createError.code === '23505' && createError.message.includes(CUSTOMER_EMAIL_COLUMN)) {
       console.warn('Race condition? Customer likely created between find and insert. Attempting to find again.');
       // Attempt to find again by email, more robustly
       const { data: foundCustomer, error: findAgainError } = await supabase
         .from(CUSTOMERS_TABLE)
         .select(CUSTOMER_PK_COLUMN)
         .eq(CUSTOMER_EMAIL_COLUMN, customerEmail)
         .single(); // Use single here

       if (findAgainError || !foundCustomer) {
         console.error('Failed to find customer even after unique constraint error:', findAgainError);
         throw new Error(`Error creating customer after unique constraint: ${findAgainError?.message || 'Not found'}`);
       }
       console.log(`Found customer via email after race condition: ${foundCustomer[CUSTOMER_PK_COLUMN]}`);
       // Optionally update Stripe ID here too if needed/possible
       return foundCustomer[CUSTOMER_PK_COLUMN];
    }
    throw new Error(`Error creating customer: ${createError.message}`);
  }

  console.log(`Created new customer: ${newCustomer[CUSTOMER_PK_COLUMN]}`);
  return newCustomer[CUSTOMER_PK_COLUMN];
}

// --- Main Handler for Successful Payments ---
async function handlePaymentSucceeded(paymentIntent) {
  const stripePaymentIntentId = paymentIntent.id;
  const stripeCustomerId = paymentIntent.customer; // Stripe Customer ID (string)
  const customerEmail = paymentIntent.metadata?.customer_email || paymentIntent.receipt_email; // Get email from metadata or receipt
  const amountReceived = paymentIntent.amount_received; // Amount in CENTS (integer)
  const currency = paymentIntent.currency; // Currency code (string)
  const metadata = paymentIntent.metadata;

  console.log(`Handling successful payment for PI: ${stripePaymentIntentId}`);

  try {
    // 1. Find or Create Customer Record in Supabase
    const supabaseCustomerId = await findOrCreateCustomer(stripeCustomerId, customerEmail);
    // supabaseCustomerId can be null if findOrCreateCustomer allows it

    // 2. Create Order Record
    // Ensure we don't create duplicate orders for the same Payment Intent
    const { data: existingOrder, error: findOrderError } = await supabase
      .from(ORDERS_TABLE)
      .select(ORDER_PK_COLUMN)
      .eq(ORDER_STRIPE_PI_ID_COLUMN, stripePaymentIntentId)
      .maybeSingle();

    if (findOrderError) {
      console.error('Supabase error checking for existing order:', findOrderError);
      throw new Error(`Error checking for existing order: ${findOrderError.message}`);
    }

    if (existingOrder) {
      console.warn(`Order already exists for Payment Intent ${stripePaymentIntentId}. Skipping creation.`);
      // Optionally update status if needed, but generally should be idempotent
      return; // Successfully handled (already processed)
    }

    // Create the new order
    const { data: newOrder, error: orderError } = await supabase
      .from(ORDERS_TABLE)
      .insert({
        [ORDER_CUSTOMER_FK_COLUMN]: supabaseCustomerId, // Can be null if allowed by findOrCreateCustomer and FK constraint
        [ORDER_STRIPE_PI_ID_COLUMN]: stripePaymentIntentId,
        [ORDER_AMOUNT_COLUMN]: amountReceived, // Store amount IN CENTS
        [ORDER_CURRENCY_COLUMN]: currency.toUpperCase(), // Store currency code
        [ORDER_STATUS_COLUMN]: paymentIntent.status, // 'succeeded'
        // Add other relevant fields like metadata if needed
        // metadata: metadata
      })
      .select(ORDER_PK_COLUMN) // Select the primary key of the newly created order
      .single(); // Expect a single row

    if (orderError) {
      console.error('Supabase error creating order:', orderError);
      throw new Error(`Error creating order: ${orderError.message}`);
    }

    const supabaseOrderId = newOrder[ORDER_PK_COLUMN];
    console.log(`Created new order with ID: ${supabaseOrderId}`);

    // 3. Create Order Items from Metadata
    let cartItems = [];
    if (metadata?.cart_details) {
      try {
        cartItems = JSON.parse(metadata.cart_details);
        if (!Array.isArray(cartItems)) {
          console.warn('cart_details metadata is not an array:', metadata.cart_details);
          cartItems = [];
        }
      } catch (parseError) {
        console.error('Error parsing cart_details metadata:', parseError);
        // Decide how to handle - log, proceed without items, or throw?
        cartItems = []; // Proceed without items for now
      }
    } else {
        console.warn(`No cart_details found in metadata for Payment Intent ${stripePaymentIntentId}`);
    }

    if (cartItems.length > 0) {
      const orderItemsData = cartItems.map(item => ({
        [ORDER_ITEM_ORDER_FK_COLUMN]: supabaseOrderId, // Link to the order created above
        [ORDER_ITEM_PRODUCT_FK_COLUMN]: item.id, // Assumes item.id is the UUID/PK of the activity/product
        [ORDER_ITEM_QUANTITY_COLUMN]: item.quantity,
        // Optional: Add price_at_purchase if you fetch prices here or pass them in metadata
      }));

      const { error: itemsError } = await supabase
        .from(ORDER_ITEMS_TABLE)
        .insert(orderItemsData);

      if (itemsError) {
        console.error('Supabase error creating order items:', itemsError);
        // Consider the order partially failed? Or just log the error?
        // Throwing for now to indicate a problem.
        throw new Error(`Error creating order items: ${itemsError.message}`);
      }
      console.log(`Inserted ${orderItemsData.length} order items for order ${supabaseOrderId}`);
    }

    // 4. (Optional) Trigger Post-Order Actions (e.g., send confirmation email)
    // await sendConfirmationEmail(supabaseOrderId); // Example call

    console.log(`Successfully processed Payment Intent ${stripePaymentIntentId}`);

  } catch (error) {
    console.error(`Error processing payment intent ${stripePaymentIntentId}:`, error);
    // Log error details for investigation
    await logPaymentEvent(null, stripePaymentIntentId, 'processing_error', { error: error.message, stack: error.stack });
    // Rethrow or handle as needed - Stripe might retry the webhook
    throw error;
  }
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