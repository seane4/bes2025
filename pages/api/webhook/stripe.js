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
const CUSTOMER_NAME_COLUMN = 'name'; // Added for new customer data
const CUSTOMER_PHONE_COLUMN = 'phone'; // Added for new customer data
const CUSTOMER_ADDR1_COLUMN = 'address_line1'; // Added for new customer data
const CUSTOMER_ADDR2_COLUMN = 'address_line2'; // Added for new customer data
const CUSTOMER_CITY_COLUMN = 'city'; // Added for new customer data
const CUSTOMER_STATE_COLUMN = 'state'; // Added for new customer data
const CUSTOMER_POSTAL_CODE_COLUMN = 'postal_code'; // Added for new customer data
const CUSTOMER_COUNTRY_COLUMN = 'country'; // Added for new customer data
const CUSTOMER_SHIRT_SIZE_COLUMN = 'shirt_size'; // Added for new customer data
const CUSTOMER_HEIGHT_COLUMN = 'height'; // Added for new customer data
const CUSTOMER_WEIGHT_COLUMN = 'weight'; // Added for new customer data
const CUSTOMER_SPOUSE_NAME_COLUMN = 'spouse_name'; // Added for new customer data
const CUSTOMER_SPOUSE_SHIRT_SIZE_COLUMN = 'spouse_shirt_size'; // Added for new customer data
const CUSTOMER_SPOUSE_HEIGHT_COLUMN = 'spouse_height'; // Added for new customer data
const CUSTOMER_SPOUSE_WEIGHT_COLUMN = 'spouse_weight'; // Added for new customer data

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
async function findOrCreateCustomer(stripeCustomerId, customerEmail, customerData) {
  if (!stripeCustomerId && !customerEmail) {
    console.error('Cannot find or create customer without Stripe Customer ID or Email.');
    // Depending on your logic, you might return null or throw an error.
    return null; // Or throw new Error('Missing customer identifiers.');
  }

  let existingCustomer = null;
  let queryError = null;

  // --- Prepare Customer Data for Supabase ---
  // Map frontend customerData fields to Supabase column names
  // Handle potential null/undefined values and type conversions
  const supabaseCustomerData = {
    [CUSTOMER_EMAIL_COLUMN]: customerEmail, // Always include email
    [CUSTOMER_STRIPE_ID_COLUMN]: stripeCustomerId || null, // Include Stripe ID if available
    [CUSTOMER_NAME_COLUMN]: customerData?.primaryName || null,
    [CUSTOMER_PHONE_COLUMN]: customerData?.phone || null,
    [CUSTOMER_ADDR1_COLUMN]: customerData?.address?.line1 || null,
    [CUSTOMER_ADDR2_COLUMN]: customerData?.address?.line2 || null,
    [CUSTOMER_CITY_COLUMN]: customerData?.address?.city || null,
    [CUSTOMER_STATE_COLUMN]: customerData?.address?.state || null,
    [CUSTOMER_POSTAL_CODE_COLUMN]: customerData?.address?.postal_code || null,
    [CUSTOMER_COUNTRY_COLUMN]: customerData?.address?.country || null,
    [CUSTOMER_SHIRT_SIZE_COLUMN]: customerData?.shirtSize || null,
    [CUSTOMER_HEIGHT_COLUMN]: customerData?.primaryHeight || null,
    // Ensure weight is an integer or null
    [CUSTOMER_WEIGHT_COLUMN]: customerData?.primaryWeight ? parseInt(customerData.primaryWeight, 10) || null : null,
    [CUSTOMER_SPOUSE_NAME_COLUMN]: customerData?.spouseName || null,
    [CUSTOMER_SPOUSE_SHIRT_SIZE_COLUMN]: customerData?.spouseShirtSize || null,
    [CUSTOMER_SPOUSE_HEIGHT_COLUMN]: customerData?.spouseHeight || null,
    // Ensure spouse weight is an integer or null
    [CUSTOMER_SPOUSE_WEIGHT_COLUMN]: customerData?.spouseWeight ? parseInt(customerData.spouseWeight, 10) || null : null,
    // Add other fields like additional_guest_name, special_requirements if collected
    // special_requirements: customerData?.specialRequirements || null,
    // additional_guest_name: customerData?.additionalGuestName || null,
    // additional_guest_shirt_size: customerData?.additionalGuestShirtSize || null,
  };
  // Remove null values if your DB handles defaults better or you prefer cleaner objects
  // Object.keys(supabaseCustomerData).forEach(key => supabaseCustomerData[key] == null && delete supabaseCustomerData[key]);


  // --- Find Existing Customer ---
  // Prioritize finding by Stripe Customer ID if available
  if (stripeCustomerId) {
    const { data, error } = await supabase
      .from(CUSTOMERS_TABLE)
      .select(`${CUSTOMER_PK_COLUMN}, ${CUSTOMER_STRIPE_ID_COLUMN}`) // Select PK and stripe ID
      .eq(CUSTOMER_STRIPE_ID_COLUMN, stripeCustomerId)
      .maybeSingle();
    existingCustomer = data;
    queryError = error;
  }

  // If not found by Stripe ID (or no Stripe ID provided), try finding by email
  if (!existingCustomer && customerEmail) {
    console.log(`Customer not found by Stripe ID ${stripeCustomerId}, trying email ${customerEmail}`);
    const { data, error } = await supabase
      .from(CUSTOMERS_TABLE)
      .select(`${CUSTOMER_PK_COLUMN}, ${CUSTOMER_STRIPE_ID_COLUMN}`) // Select PK and stripe ID
      .eq(CUSTOMER_EMAIL_COLUMN, customerEmail)
      .maybeSingle();
    // Avoid overwriting if found by Stripe ID earlier but email search also ran
    if (!existingCustomer) {
        existingCustomer = data;
        queryError = error;
    }
  }

  if (queryError) {
    console.error('Supabase error finding customer:', queryError);
    // Decide how to handle: throw error, return null?
    throw new Error(`Error finding customer: ${queryError.message}`);
  }

  // --- Update or Create ---
  if (existingCustomer) {
    console.log(`Found existing customer: ${existingCustomer[CUSTOMER_PK_COLUMN]}. Updating details...`);
    // --- EDIT START: Update existing customer with all details ---
    // Ensure we don't try to set email to null if it was the lookup key
    if (!supabaseCustomerData[CUSTOMER_EMAIL_COLUMN] && customerEmail) {
        supabaseCustomerData[CUSTOMER_EMAIL_COLUMN] = customerEmail;
    }
     // Ensure we don't try to set stripeId to null if it was the lookup key
    if (!supabaseCustomerData[CUSTOMER_STRIPE_ID_COLUMN] && stripeCustomerId) {
        supabaseCustomerData[CUSTOMER_STRIPE_ID_COLUMN] = stripeCustomerId;
    }

    // Remove the primary key from the update payload as it should not be changed
    const updatePayload = { ...supabaseCustomerData };
    delete updatePayload[CUSTOMER_PK_COLUMN];

    const { error: updateError } = await supabase
      .from(CUSTOMERS_TABLE)
      .update(updatePayload) // Pass the mapped data object without PK
      .eq(CUSTOMER_PK_COLUMN, existingCustomer[CUSTOMER_PK_COLUMN]); // Match by primary key

    if (updateError) {
      console.error(`Supabase error updating customer ${existingCustomer[CUSTOMER_PK_COLUMN]}:`, updateError);
      // Log error but proceed with the existing customer ID
    } else {
      console.log(`Successfully updated customer ${existingCustomer[CUSTOMER_PK_COLUMN]}`);
    }
    return existingCustomer[CUSTOMER_PK_COLUMN]; // Return the existing customer's primary key
    // --- EDIT END ---

  } else {
    // --- Customer Not Found - Create New Customer ---
    console.log('Customer not found, creating new customer with full details.');
    // --- EDIT START: Insert new customer with all details ---
    const { data: newCustomer, error: createError } = await supabase
      .from(CUSTOMERS_TABLE)
      .insert(supabaseCustomerData) // Insert the mapped data object
      .select(CUSTOMER_PK_COLUMN) // Select the primary key of the new record
      .single(); // Expect a single new record

    if (createError) {
      console.error('Supabase error creating customer:', createError);
       // Handle potential race condition where customer was created between find and insert
       if (createError.code === '23505' && customerEmail) { // 23505 is unique_violation
         console.warn('Race condition? Customer likely created between find and insert. Attempting to find again by email.');
         const { data: foundCustomer, error: findAgainError } = await supabase
           .from(CUSTOMERS_TABLE)
           .select(CUSTOMER_PK_COLUMN)
           .eq(CUSTOMER_EMAIL_COLUMN, customerEmail)
           .single();

         if (findAgainError || !foundCustomer) {
           console.error('Failed to find customer even after unique constraint error:', findAgainError);
           throw new Error(`Error creating/finding customer after unique constraint: ${findAgainError?.message || 'Not found'}`);
         }
         console.log(`Found customer via email after race condition: ${foundCustomer[CUSTOMER_PK_COLUMN]}`);
         // Optionally update Stripe ID here too if needed/possible
         // await supabase.from(CUSTOMERS_TABLE).update({ [CUSTOMER_STRIPE_ID_COLUMN]: stripeCustomerId }).eq(CUSTOMER_PK_COLUMN, foundCustomer[CUSTOMER_PK_COLUMN]);
         return foundCustomer[CUSTOMER_PK_COLUMN];
       }
      throw new Error(`Error creating customer: ${createError.message}`);
    }

    console.log(`Created new customer with ID: ${newCustomer[CUSTOMER_PK_COLUMN]}`);
    return newCustomer[CUSTOMER_PK_COLUMN]; // Return the new customer's primary key
    // --- EDIT END ---
  }
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

  // --- Validate Metadata ---
  if (!metadata || !metadata.cart_details || !metadata.customer_email || !metadata.customer_name) {
      // Now also require customer_name for potential creation
      console.error(`Missing required metadata (cart_details, customer_email, customer_name) for Payment Intent ${stripePaymentIntentId}`);
      throw new Error(`Missing required metadata for Payment Intent ${stripePaymentIntentId}`);
  }

  let cartItems = [];
  try {
      cartItems = JSON.parse(metadata.cart_details);
      if (!Array.isArray(cartItems)) {
          throw new Error('cart_details metadata is not a valid JSON array.');
      }
  } catch (e) {
      console.error(`Error parsing cart_details metadata for Payment Intent ${stripePaymentIntentId}:`, e);
      throw new Error(`Invalid cart_details metadata: ${e.message}`);
  }

  // --- Start Transaction ---
  // It's often good practice to wrap related database operations in a transaction
  // if your database/client supports it easily. Supabase JS client doesn't
  // directly expose transaction blocks like SQL, so we proceed sequentially
  // with careful error handling.

  try {
    // 1. Find or Create Customer in Supabase
    let customerId; // This will hold the PK from your 'customers' table

    // Try to find the customer by email
    const { data: existingCustomer, error: findError } = await supabase
      .from(CUSTOMERS_TABLE)
      .select(CUSTOMER_PK_COLUMN) // Select only the primary key
      .eq(CUSTOMER_EMAIL_COLUMN, metadata.customer_email) // Filter by email
      .maybeSingle(); // Use maybeSingle() in case the customer doesn't exist

    if (findError) {
        console.error(`Supabase error finding customer by email ${metadata.customer_email}:`, findError);
        throw new Error(`Database error finding customer: ${findError.message}`);
    }

    if (existingCustomer) {
        customerId = existingCustomer[CUSTOMER_PK_COLUMN];
        console.log(`Found existing customer in Supabase with ID: ${customerId}`);
        // Optional: Update customer details (e.g., name, stripe_customer_id) if needed
        // await supabase.from(CUSTOMERS_TABLE).update({ [CUSTOMER_NAME_COLUMN]: metadata.customer_name, [CUSTOMER_STRIPE_ID_COLUMN]: stripeCustomerId }).eq(CUSTOMER_PK_COLUMN, customerId);
    } else {
        // Customer not found, create a new one
        console.log(`Customer with email ${metadata.customer_email} not found. Creating new customer.`);
        const { data: newCustomer, error: createError } = await supabase
          .from(CUSTOMERS_TABLE)
          .insert({
              [CUSTOMER_EMAIL_COLUMN]: metadata.customer_email,
              [CUSTOMER_NAME_COLUMN]: metadata.customer_name, // Use name from metadata
              [CUSTOMER_STRIPE_ID_COLUMN]: stripeCustomerId, // Store the Stripe Customer ID
              // Add any other required fields for your customers table here
          })
          .select(CUSTOMER_PK_COLUMN) // Select the PK of the newly created customer
          .single(); // Expect a single row back

        if (createError) {
            console.error(`Supabase error creating customer for email ${metadata.customer_email}:`, createError);
            // Check for unique constraint violation (maybe email already exists due to race condition?)
            if (createError.code === '23505') { // PostgreSQL unique violation code
                 throw new Error(`Failed to create customer: Email ${metadata.customer_email} might already exist.`);
            }
            throw new Error(`Database error creating customer: ${createError.message}`);
        }

        if (!newCustomer) {
             throw new Error(`Failed to create or retrieve new customer for email ${metadata.customer_email}.`);
        }
        customerId = newCustomer[CUSTOMER_PK_COLUMN];
        console.log(`Created new customer in Supabase with ID: ${customerId}`);
    }

    // 2. Create the Order Record (using the customerId)
    const { data: newOrder, error: orderError } = await supabase
      .from(ORDERS_TABLE)
      .insert({
        // *** Use the customerId foreign key ***
        customer_id: customerId, // Use the actual column name from your 'orders' table
        // *** Add the other required columns ***
        [ORDER_AMOUNT_COLUMN]: paymentIntent.amount,           // Assumes 'amount' column exists (integer)
        [ORDER_CURRENCY_COLUMN]: paymentIntent.currency,       // Assumes 'currency' column exists (varchar)
        [ORDER_STRIPE_PI_ID_COLUMN]: stripePaymentIntentId,      // Assumes 'stripe_payment_intent_id' column exists (text/varchar)
        [ORDER_STATUS_COLUMN]: 'succeeded',                    // Uses 'status' column (exists)
        // Add other relevant fields if needed (e.g., billing address if stored on order)
      })
      .select(ORDER_PK_COLUMN) // Select the primary key of the new order
      .single(); // Expect a single row back

    if (orderError) {
      console.error(`Supabase error creating order for customer ${customerId}:`, orderError);
      // Check for foreign key violation (e.g., if customerId was somehow invalid)
      if (orderError.code === '23503') { // PostgreSQL foreign key violation
          throw new Error(`Database error creating order: Invalid customer reference ${customerId}.`);
      }
      throw new Error(`Database error creating order: ${orderError.message}`);
    }

    if (!newOrder) {
        throw new Error(`Failed to create or retrieve new order for customer ${customerId}.`);
    }
    const supabaseOrderId = newOrder[ORDER_PK_COLUMN];
    console.log(`Created order ${supabaseOrderId} for customer ${customerId}`);

    // 3. Create Order Items and Hotel Bookings (Logic remains the same as before)
    // ... (loop through cartItems, prepare orderItemsToInsert and hotelBookingsToInsert) ...
    // ... (ensure item.id maps to ORDER_ITEM_PRODUCT_FK_COLUMN) ...
    // ... (ensure participantType maps to ORDER_ITEM_PARTICIPANT_COLUMN for activities) ...
    // ... (ensure hotel details map to HOTEL_BOOKING columns) ...

    // 4. Perform Batch Inserts for Items and Bookings (Logic remains the same)
    // ... (supabase.from(ORDER_ITEMS_TABLE).insert(...)) ...
    // ... (supabase.from(HOTEL_BOOKINGS_TABLE).insert(...)) ...
    // ... (error handling for batch inserts) ...

    // 5. (Optional) Trigger Post-Order Actions
    // ... (await sendConfirmationEmail(supabaseOrderId)) ...

    console.log(`Successfully processed Payment Intent ${stripePaymentIntentId} and created order ${supabaseOrderId}`);

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