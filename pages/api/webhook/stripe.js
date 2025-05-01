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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20', // Or your preferred recent version
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- Configuration Constants ---
// Customers Table (Adjust to your exact column names)
const CUSTOMERS_TABLE = 'customers';
const CUSTOMER_PK_COLUMN = 'id';
const CUSTOMER_EMAIL_COLUMN = 'email';
const CUSTOMER_NAME_COLUMN = 'name';
const CUSTOMER_PHONE_COLUMN = 'phone';
const CUSTOMER_ADDRESS_STREET_COLUMN = 'address_street'; // Or address_line1
const CUSTOMER_ADDRESS_CITY_COLUMN = 'address_city'; // Or city
const CUSTOMER_ADDRESS_STATE_COLUMN = 'address_state'; // Or state
const CUSTOMER_ADDRESS_POSTAL_CODE_COLUMN = 'address_postal_code'; // Or postal_code
const CUSTOMER_ADDRESS_COUNTRY_COLUMN = 'address_country'; // Or country
const CUSTOMER_STRIPE_ID_COLUMN = 'stripe_customer_id';
// Add other customer columns used from customerData if needed (e.g., shirt_size, height, weight, spouse details)
const CUSTOMER_SHIRT_SIZE_COLUMN = 'shirt_size';
const CUSTOMER_HEIGHT_COLUMN = 'height';
const CUSTOMER_WEIGHT_COLUMN = 'weight';
const CUSTOMER_SPOUSE_NAME_COLUMN = 'spouse_name';
const CUSTOMER_SPOUSE_SHIRT_SIZE_COLUMN = 'spouse_shirt_size';
const CUSTOMER_SPOUSE_HEIGHT_COLUMN = 'spouse_height';
const CUSTOMER_SPOUSE_WEIGHT_COLUMN = 'spouse_weight';


// Orders Table (Adjust to your exact column names)
const ORDERS_TABLE = 'orders';
const ORDER_PK_COLUMN = 'id';
const ORDER_CUSTOMER_ID_COLUMN = 'customer_id'; // Foreign Key to customers
const ORDER_AMOUNT_COLUMN = 'total_amount_cents'; // Ensure this matches your schema (e.g., 'amount')
const ORDER_CURRENCY_COLUMN = 'currency';
const ORDER_STRIPE_PI_ID_COLUMN = 'stripe_payment_intent_id';
const ORDER_STATUS_COLUMN = 'status';
const ORDER_CREATED_AT_COLUMN = 'created_at'; // Supabase handles this automatically if default is set

// Order Items Table (New Consolidated Table - Adjust to your exact column names)
const ORDER_ITEMS_TABLE = 'order_items';
const ORDER_ITEM_PK_COLUMN = 'id';
const ORDER_ITEM_ORDER_ID_COLUMN = 'order_id'; // Foreign Key to orders
const ORDER_ITEM_PRODUCT_ID_COLUMN = 'product_id'; // FK to activities, accommodations, sponsorships
const ORDER_ITEM_PRODUCT_TYPE_COLUMN = 'product_type'; // 'activity', 'accommodation', 'sponsorship'
const ORDER_ITEM_QUANTITY_COLUMN = 'quantity';
const ORDER_ITEM_UNIT_PRICE_CENTS_COLUMN = 'unit_price_cents';
const ORDER_ITEM_LINE_TOTAL_CENTS_COLUMN = 'line_item_total_cents';
const ORDER_ITEM_PRODUCT_NAME_COLUMN = 'product_name'; // Denormalized for convenience
const ORDER_ITEM_METADATA_COLUMN = 'metadata'; // JSONB for extra details (participantType, etc.)

// Hotel Bookings Table (Adjust to your exact column names)
const HOTEL_BOOKINGS_TABLE = 'hotel_bookings';
const HOTEL_BOOKING_PK_COLUMN = 'id';
// IMPORTANT: Linking via order_id based on current migration. Change to ORDER_ITEM_ORDER_ID_COLUMN if schema is updated.
const HOTEL_BOOKING_ORDER_ID_COLUMN = 'order_id'; // Foreign Key to orders
// const HOTEL_BOOKING_ORDER_ITEM_ID_COLUMN = 'order_item_id'; // Use this if FK changes to order_items
const HOTEL_BOOKING_CHECK_IN_COLUMN = 'check_in_date';
const HOTEL_BOOKING_CHECK_OUT_COLUMN = 'check_out_date';
const HOTEL_BOOKING_GUESTS_COLUMN = 'number_of_guests'; // Or 'guests'
const HOTEL_BOOKING_NIGHTS_COLUMN = 'number_of_nights'; // Or 'nights'
const HOTEL_BOOKING_PRICE_PER_NIGHT_CENTS = 'price_per_night_cents';
const HOTEL_BOOKING_TOTAL_PRICE_CENTS = 'total_price_cents';


// --- Webhook Handler ---
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  let event;
  let reqBuffer;

  try {
    reqBuffer = await buffer(req); // Read the raw body
    event = stripe.webhooks.constructEvent(reqBuffer.toString(), sig, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

  console.log(`Received Stripe event: ${event.type}`);

    // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntentSucceeded = event.data.object;
        await handlePaymentSucceeded(paymentIntentSucceeded);
        break;
      case 'payment_intent.payment_failed':
        const paymentIntentPaymentFailed = event.data.object;
        await handlePaymentFailed(paymentIntentPaymentFailed); // Use the updated handler below
        break;
      // Add other event types as needed
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (error) {
      console.error(`Error processing webhook event ${event.id} (Type: ${event.type}):`, error);
      // Return 500 to signal failure to Stripe, potentially triggering retries
      return res.status(500).json({ error: 'Webhook handler failed', details: error.message });
  }
}


// --- Helper Function: Find or Create Customer (Updated) ---
/**
 * Finds or creates a customer in the Supabase database using data from metadata.
 * @param {object} customerData - Data extracted from payment intent metadata.
 * @param {string | null} stripeCustomerId - Optional Stripe Customer ID from payment intent.
 * @returns {Promise<string>} The Supabase customer ID (PK).
 * @throws {Error} If customer data is invalid or database operation fails.
 */
async function findOrCreateCustomer(customerData, stripeCustomerId = null) {
  // Validate essential customer data from metadata
  if (!customerData || !customerData.email) {
    console.error('Customer data or email missing from metadata.', { customerData });
    throw new Error('Customer email is required from metadata.');
  }

  const email = customerData.email.toLowerCase();
  console.log(`Searching for customer with email: ${email}`);

  // 1. Try to find existing customer by email
  let { data: existingCustomer, error: findError } = await supabase
      .from(CUSTOMERS_TABLE)
    .select(`${CUSTOMER_PK_COLUMN}, ${CUSTOMER_STRIPE_ID_COLUMN}`) // Select PK and Stripe ID
    .eq(CUSTOMER_EMAIL_COLUMN, email)
      .maybeSingle();

  if (findError) {
    console.error('Error finding customer by email.', { email, error: findError });
    throw findError; // Re-throw critical errors
  }

  // 2. If found, return existing ID (and optionally update Stripe ID)
  if (existingCustomer) {
    const customerId = existingCustomer[CUSTOMER_PK_COLUMN];
    console.log(`Found existing customer ID: ${customerId}`);
    // Update Stripe Customer ID if it's provided and different or missing
    if (stripeCustomerId && existingCustomer[CUSTOMER_STRIPE_ID_COLUMN] !== stripeCustomerId) {
      const { error: updateStripeIdError } = await supabase
        .from(CUSTOMERS_TABLE)
        .update({ [CUSTOMER_STRIPE_ID_COLUMN]: stripeCustomerId })
        .eq(CUSTOMER_PK_COLUMN, customerId);
      if (updateStripeIdError) {
        console.warn('Failed to update Stripe Customer ID for existing customer.', { customerId, stripeCustomerId, error: updateStripeIdError });
        // Non-critical, proceed
      } else {
        console.log(`Updated Stripe ID for customer ${customerId}`);
      }
    }
    // Optionally: Update other customer details from customerData here if needed
    // const updatePayload = { /* map fields from customerData */ };
    // await supabase.from(CUSTOMERS_TABLE).update(updatePayload).eq(CUSTOMER_PK_COLUMN, customerId);
    return customerId;
  }

  // 3. If not found, create new customer
  console.log(`Customer not found, creating new customer for email: ${email}`);

  // Map customerData from metadata to Supabase columns
  const newCustomerData = {
    [CUSTOMER_EMAIL_COLUMN]: email,
    [CUSTOMER_NAME_COLUMN]: customerData.primaryName || customerData.name, // Adapt based on your customerData structure
    [CUSTOMER_PHONE_COLUMN]: customerData.phone,
    [CUSTOMER_ADDRESS_STREET_COLUMN]: customerData.address?.line1,
    // [CUSTOMER_ADDRESS_LINE2_COLUMN]: customerData.address?.line2, // If you have line2
    [CUSTOMER_ADDRESS_CITY_COLUMN]: customerData.address?.city,
    [CUSTOMER_ADDRESS_STATE_COLUMN]: customerData.address?.state,
    [CUSTOMER_ADDRESS_POSTAL_CODE_COLUMN]: customerData.address?.postal_code,
    [CUSTOMER_ADDRESS_COUNTRY_COLUMN]: customerData.address?.country,
    [CUSTOMER_STRIPE_ID_COLUMN]: stripeCustomerId, // Include Stripe Customer ID if available
    // Map other fields carefully, ensuring type correctness (e.g., parseInt for numbers)
    [CUSTOMER_SHIRT_SIZE_COLUMN]: customerData.shirtSize,
    [CUSTOMER_HEIGHT_COLUMN]: customerData.primaryHeight,
    [CUSTOMER_WEIGHT_COLUMN]: customerData.primaryWeight ? parseInt(customerData.primaryWeight, 10) || null : null,
    [CUSTOMER_SPOUSE_NAME_COLUMN]: customerData.spouseName,
    [CUSTOMER_SPOUSE_SHIRT_SIZE_COLUMN]: customerData.spouseShirtSize,
    [CUSTOMER_SPOUSE_HEIGHT_COLUMN]: customerData.spouseHeight,
    [CUSTOMER_SPOUSE_WEIGHT_COLUMN]: customerData.spouseWeight ? parseInt(customerData.spouseWeight, 10) || null : null,
    // Add other fields as needed
  };

  // Remove null/undefined fields before insert to avoid potential DB errors if columns are NOT NULL without defaults
  Object.keys(newCustomerData).forEach(key => {
    if (newCustomerData[key] === null || newCustomerData[key] === undefined) {
      delete newCustomerData[key];
    }
  });

  const { data: newCustomer, error: insertError } = await supabase
      .from(CUSTOMERS_TABLE)
    .insert(newCustomerData)
      .select(CUSTOMER_PK_COLUMN) // Select the primary key of the new record
    .single(); // Expect exactly one row back

  if (insertError) {
       // Handle potential race condition where customer was created between find and insert
    if (insertError.code === '23505') { // PostgreSQL unique_violation code
      console.warn(`Race condition? Customer with email ${email} likely created between find and insert. Attempting to find again.`);
         const { data: foundCustomer, error: findAgainError } = await supabase
           .from(CUSTOMERS_TABLE)
           .select(CUSTOMER_PK_COLUMN)
        .eq(CUSTOMER_EMAIL_COLUMN, email)
           .single();

         if (findAgainError || !foundCustomer) {
        console.error('Failed to find customer even after unique constraint error:', { email, findAgainError });
           throw new Error(`Error creating/finding customer after unique constraint: ${findAgainError?.message || 'Not found'}`);
         }
         console.log(`Found customer via email after race condition: ${foundCustomer[CUSTOMER_PK_COLUMN]}`);
         // Optionally update Stripe ID here too if needed/possible
      if (stripeCustomerId) {
          await supabase.from(CUSTOMERS_TABLE).update({ [CUSTOMER_STRIPE_ID_COLUMN]: stripeCustomerId }).eq(CUSTOMER_PK_COLUMN, foundCustomer[CUSTOMER_PK_COLUMN]);
      }
         return foundCustomer[CUSTOMER_PK_COLUMN];
       }
    // Otherwise, it's a different insert error
    console.error('Error creating new customer.', { email, error: insertError });
    throw insertError;
  }

  if (!newCustomer) {
      console.error('Failed to create customer, insert operation returned no data.', { email });
      throw new Error('Customer creation failed.');
  }

  const customerId = newCustomer[CUSTOMER_PK_COLUMN];
  console.log(`Successfully created new customer ID: ${customerId}`);
  return customerId;
}


// --- Main Handler for Successful Payments (Updated) ---
/**
 * Handles the 'payment_intent.succeeded' event.
 * Creates customer, order, order items, and hotel bookings based on metadata.
 * @param {Stripe.PaymentIntent} paymentIntent - The successful PaymentIntent object.
 * @throws {Error} If metadata is missing/invalid or database operations fail.
 */
async function handlePaymentSucceeded(paymentIntent) {
  const paymentIntentId = paymentIntent.id;
  console.log(`Handling payment_intent.succeeded: ${paymentIntentId}`);

  // --- 1. Extract Data from Metadata ---
  // Expecting 'validatedItems' (array) and 'customerData' (object)
  const { validatedItems, customerData } = paymentIntent.metadata;

  if (!validatedItems || !customerData) {
    console.error('Missing validatedItems or customerData in PaymentIntent metadata.', { paymentIntentId });
    throw new Error('Missing critical metadata (validatedItems or customerData) in PaymentIntent.');
  }

  // Parse validatedItems if it's stored as a JSON string
  let items;
  try {
    items = typeof validatedItems === 'string' ? JSON.parse(validatedItems) : validatedItems;
    if (!Array.isArray(items)) throw new Error('validatedItems metadata is not an array.');
  } catch (e) {
    console.error('Failed to parse validatedItems metadata.', { paymentIntentId, metadata: paymentIntent.metadata, error: e });
    throw new Error('Invalid validatedItems format in metadata.');
  }

  // --- 2. Find or Create Customer ---
  let customerId;
  try {
    // Pass Stripe Customer ID if available (paymentIntent.customer might be null or a string ID)
    const stripeCustomerId = typeof paymentIntent.customer === 'string' ? paymentIntent.customer : null;
    customerId = await findOrCreateCustomer(customerData, stripeCustomerId);
  } catch (error) {
    console.error('Failed during customer find/create.', { paymentIntentId, error });
    throw error; // Re-throw critical error
  }

  // --- 3. Check for Existing Order (Idempotency) ---
  console.log(`Checking for existing order with PaymentIntent ID: ${paymentIntentId}`);
  const { data: existingOrder, error: checkOrderError } = await supabase
    .from(ORDERS_TABLE)
    .select(ORDER_PK_COLUMN)
    .eq(ORDER_STRIPE_PI_ID_COLUMN, paymentIntentId)
    .maybeSingle();

  if (checkOrderError) {
    console.error('Error checking for existing order.', { paymentIntentId, error: checkOrderError });
    throw checkOrderError; // Critical error
  }

  if (existingOrder) {
    console.warn(`Order already exists for PaymentIntent ID: ${paymentIntentId}. Skipping creation.`, { orderId: existingOrder[ORDER_PK_COLUMN] });
    return; // Idempotency: Already processed this payment
  }

  // --- 4. Create Order ---
  console.log(`Creating new order for customer ID: ${customerId}`);
  const orderData = {
    [ORDER_CUSTOMER_ID_COLUMN]: customerId,
    [ORDER_AMOUNT_COLUMN]: paymentIntent.amount, // Amount in cents from Stripe
    [ORDER_CURRENCY_COLUMN]: paymentIntent.currency,
    [ORDER_STRIPE_PI_ID_COLUMN]: paymentIntentId,
    [ORDER_STATUS_COLUMN]: 'succeeded', // Or map based on paymentIntent.status
  };

  const { data: newOrder, error: insertOrderError } = await supabase
    .from(ORDERS_TABLE)
    .insert(orderData)
    .select(ORDER_PK_COLUMN) // Select the primary key of the new order
    .single();

  if (insertOrderError) {
    console.error('Error creating new order.', { customerId, paymentIntentId, error: insertOrderError });
    // Consider compensating transaction: delete customer if newly created? Complex.
    throw insertOrderError;
  }

   if (!newOrder) {
      console.error('Failed to create order, insert operation returned no data.', { customerId, paymentIntentId });
      throw new Error('Order creation failed.');
  }

  const supabaseOrderId = newOrder[ORDER_PK_COLUMN];
  console.log(`Successfully created order ID: ${supabaseOrderId}`);

  // --- 5. Prepare Order Items & Hotel Bookings from validatedItems ---
  const orderItemsToInsert = [];
  const hotelBookingsToInsert = [];

  for (const item of items) {
    // Basic validation of item data from metadata
    if (!item.id || !item.type || !item.quantity || !item.price_cents || !item.name) {
        console.warn('Skipping item due to missing essential data in validatedItems.', { item, orderId: supabaseOrderId });
        continue; // Skip this item
    }

    // Calculate line item total (assuming item.price_cents is unit price)
    // Ensure quantity is a number
    const quantity = Number(item.quantity) || 0;
    const unitPriceCents = Number(item.price_cents) || 0;
    const lineItemTotal = quantity * unitPriceCents;

    // Prepare data for order_items table
    const orderItemData = {
      [ORDER_ITEM_ORDER_ID_COLUMN]: supabaseOrderId,
      [ORDER_ITEM_PRODUCT_ID_COLUMN]: item.id, // The ID of the activity, accommodation, etc.
      [ORDER_ITEM_PRODUCT_TYPE_COLUMN]: item.type, // 'activity', 'accommodation', 'sponsorship'
      [ORDER_ITEM_QUANTITY_COLUMN]: quantity,
      [ORDER_ITEM_UNIT_PRICE_CENTS_COLUMN]: unitPriceCents,
      [ORDER_ITEM_LINE_TOTAL_CENTS_COLUMN]: lineItemTotal,
      [ORDER_ITEM_PRODUCT_NAME_COLUMN]: item.name, // Denormalized name
      // Store additional relevant details from the item in metadata JSONB
      [ORDER_ITEM_METADATA_COLUMN]: {
        participantType: item.participantType, // Example for activities
        // Add other item-specific details captured in create-payment-intent here
        // e.g., checkIn, checkOut for easier access if needed, though they are also in hotel_bookings
      },
    };
    // Clean up metadata - remove null/undefined if desired
    Object.keys(orderItemData[ORDER_ITEM_METADATA_COLUMN]).forEach(key => {
        if (orderItemData[ORDER_ITEM_METADATA_COLUMN][key] === null || orderItemData[ORDER_ITEM_METADATA_COLUMN][key] === undefined) {
          delete orderItemData[ORDER_ITEM_METADATA_COLUMN][key];
        }
      });

    orderItemsToInsert.push(orderItemData);

    // If it's an accommodation, prepare data for hotel_bookings table
    if (item.type === 'accommodation') {
      // Ensure necessary accommodation details are present in the item from metadata
      if (!item.checkIn || !item.checkOut || !item.guests || !item.nights || !item.price_per_night_cents || !item.total_price_cents) {
          console.warn('Skipping hotel booking creation due to missing accommodation data in validatedItems.', { item, orderId: supabaseOrderId });
          continue; // Skip booking for this item
      }

      const bookingData = {
        order_id: supabaseOrderId,
        accommodation_id: item.id,
        check_in_date: item.checkIn,
        check_out_date: item.checkOut,
        number_of_nights: item.nights,
        number_of_guests: item.guests,
        price_per_night_cents: item.price_per_night_cents,
        total_price_cents: item.total_price_cents,
        status: 'confirmed'
      };

      const { error: bookingError } = await supabase
        .from('hotel_bookings')
        .insert(bookingData);

      if (bookingError) throw bookingError;
    }
  }

  // --- 6. Batch Insert Order Items ---
  if (orderItemsToInsert.length > 0) {
    console.log(`Inserting ${orderItemsToInsert.length} order items for order ID: ${supabaseOrderId}`);
    const { error: insertItemsError } = await supabase
      .from(ORDER_ITEMS_TABLE)
      .insert(orderItemsToInsert);

    if (insertItemsError) {
      console.error('Error inserting order items.', { orderId: supabaseOrderId, error: insertItemsError });
      // Critical failure - order exists but items failed.
      // Consider updating order status to 'failed' or 'requires_attention'.
      throw insertItemsError; // Re-throw to signal webhook failure
    }
    console.log(`Successfully inserted order items for order ID: ${supabaseOrderId}`);
  } else {
    console.warn(`No valid order items found in metadata to insert for order ID: ${supabaseOrderId}.`, { items });
    // This might indicate an issue upstream (create-payment-intent) or with the data in metadata.
    // Consider if an order with no items is valid or should be marked as an error.
  }

  // --- 7. Batch Insert Hotel Bookings ---
  if (hotelBookingsToInsert.length > 0) {
    console.log(`Inserting ${hotelBookingsToInsert.length} hotel bookings for order ID: ${supabaseOrderId}`);
    const { error: insertBookingsError } = await supabase
      .from(HOTEL_BOOKINGS_TABLE)
      .insert(hotelBookingsToInsert);

    if (insertBookingsError) {
      console.error('Error inserting hotel bookings.', { orderId: supabaseOrderId, error: insertBookingsError });
      // Less critical than items failing, but still an issue.
      // Consider updating order status or logging for manual review.
      throw insertBookingsError; // Re-throw to signal webhook failure
    }
    console.log(`Successfully inserted hotel bookings for order ID: ${supabaseOrderId}`);
  }

  // --- 8. Post-Processing (Optional) ---
  // e.g., send confirmation email, update inventory, etc.
  // await sendConfirmationEmail(supabaseOrderId, customerData.email);

  console.log(`Successfully processed payment_intent.succeeded: ${paymentIntentId}, Order ID: ${supabaseOrderId}`);
}


// --- Handler for Failed Payments (Updated) ---
/**
 * Handle failed payment intents. Updates order status if found.
 * @param {Stripe.PaymentIntent} paymentIntent - The failed PaymentIntent object.
 */
async function handlePaymentFailed(paymentIntent) {
  const paymentIntentId = paymentIntent.id;
  console.log(`Handling payment_intent.payment_failed: ${paymentIntentId}`);

  // Attempt to find the corresponding order and update its status
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .update({ [ORDER_STATUS_COLUMN]: 'failed' })
    .eq(ORDER_STRIPE_PI_ID_COLUMN, paymentIntentId)
    .select(ORDER_PK_COLUMN); // Select PK to confirm if update happened

  if (error) {
    console.error(`Error updating order status to failed for PI ${paymentIntentId}:`, error);
    // Don't throw, as the primary event handling succeeded, but log the failure.
  } else if (data && data.length > 0) {
    console.log(`Updated order status to failed for Order ID(s): ${data.map(d => d[ORDER_PK_COLUMN]).join(', ')} (PI: ${paymentIntentId})`);
  } else {
    console.log(`No matching order found to update status to failed for PI ${paymentIntentId}.`);
  }
  // Optional: Log the failure event, notify admin, etc.
  // await logPaymentEvent(null, paymentIntentId, 'payment_failed', { reason: paymentIntent.last_payment_error?.message });
}


// --- REMOVE OLD HELPER FUNCTIONS ---
// Ensure the following functions are DELETED from this file:
// async function createOrderItems(orderId, items) { ... }
// async function createHotelBookings(orderId, items) { ... }
// async function logPaymentEvent(...) { ... } // If you had this specific logger 