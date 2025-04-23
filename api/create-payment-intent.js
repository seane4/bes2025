import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client (using Service Role Key for backend access)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- Define your Supabase table/column names ---
// Ensure these match your actual schema from the migration file
const ACTIVITIES_TABLE = 'activities'; // Table with your purchasable items
const ACTIVITY_PK_COLUMN = 'id'; // Primary key of activities (UUID or TEXT)
const PRICE_COLUMN = 'price'; // Column name for price IN CENTS (integer) in ACTIVITIES_TABLE
const CUSTOMERS_TABLE = 'customers'; // As defined in your webhook
const CUSTOMER_EMAIL_COLUMN = 'email'; // Column for customer email
const CUSTOMER_STRIPE_ID_COLUMN = 'stripe_customer_id'; // As defined in your webhook
// Add column names from Customers table that we'll use/pass in metadata
const CUSTOMER_NAME_COLUMN = 'name';
const CUSTOMER_PHONE_COLUMN = 'phone';
const CUSTOMER_ADDR1_COLUMN = 'address_line1';
const CUSTOMER_ADDR2_COLUMN = 'address_line2';
const CUSTOMER_CITY_COLUMN = 'city';
const CUSTOMER_STATE_COLUMN = 'state';
const CUSTOMER_POSTAL_CODE_COLUMN = 'postal_code';
const CUSTOMER_COUNTRY_COLUMN = 'country';
const CUSTOMER_SHIRT_SIZE_COLUMN = 'shirt_size';
const CUSTOMER_HEIGHT_COLUMN = 'height';
const CUSTOMER_WEIGHT_COLUMN = 'weight';
const CUSTOMER_SPOUSE_NAME_COLUMN = 'spouse_name';
const CUSTOMER_SPOUSE_SHIRT_SIZE_COLUMN = 'spouse_shirt_size';
const CUSTOMER_SPOUSE_HEIGHT_COLUMN = 'spouse_height';
const CUSTOMER_SPOUSE_WEIGHT_COLUMN = 'spouse_weight';
// Add others if needed (e.g., additional_guest_name, special_requirements)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Expecting: { items: [...], customerData: { email: ..., name: ..., address: {...}, etc. } }
    const { items: cart, customerData } = req.body;

    // Validate essential parts
    if (!cart || !Array.isArray(cart) || cart.length === 0 || !customerData || !customerData.email) {
      return res.status(400).json({ error: 'Invalid request body. Requires items array and customerData object with email.' });
    }

    // Validate cart items structure (basic check: id, price, quantity)
    if (!cart.every(item => item.id && typeof item.price === 'number' && item.price >= 0 && typeof item.quantity === 'number' && item.quantity > 0)) {
        return res.status(400).json({ error: 'Invalid cart item structure. Each item needs id, non-negative price (in cents), and positive quantity.' });
    }

    // --- Calculate Total Amount Server-Side (in Cents) ---
    // IMPORTANT: We are trusting the 'price' sent from the client.
    // For enhanced security, you SHOULD re-fetch prices server-side based on item.id
    // and potentially item.type/details to prevent price manipulation.
    let calculatedTotalInCents = 0;
    cart.forEach(item => {
        // Ensure price and quantity are valid numbers before calculation
        const price = Number(item.price);
        const quantity = Number(item.quantity);
        if (!isNaN(price) && !isNaN(quantity)) {
            calculatedTotalInCents += price * quantity;
        } else {
            console.warn(`Invalid price or quantity for item ID ${item.id}. Skipping item in total calculation.`);
            // Optionally, throw an error here if any item is invalid
            // throw new Error(`Invalid price or quantity detected for item ${item.id}`);
        }
    });

    // Ensure total is a positive integer
    if (calculatedTotalInCents <= 0) {
        return res.status(400).json({ error: 'Calculated total amount must be positive.' });
    }

    // --- Find or Create Stripe Customer ---
    let stripeCustomerId;
    const existingCustomers = await stripe.customers.list({
      email: customerData.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      stripeCustomerId = existingCustomers.data[0].id;
      // Optionally update the customer details in Stripe if they might have changed
      await stripe.customers.update(stripeCustomerId, {
        name: customerData.name, // Use the primary name
        phone: customerData.phone, // Use primary phone
        address: { // Use primary address details
            line1: customerData.address?.line1,
            line2: customerData.address?.line2,
            city: customerData.address?.city,
            state: customerData.address?.state,
            postal_code: customerData.address?.postal_code,
            country: customerData.address?.country,
        },
        // Add any other relevant fields you collect and want to store in Stripe
        metadata: {
            // Store other non-standard fields from customerData in metadata if needed
            // e.g., spouse_name: customerData.spouseName, shirt_size: customerData.primaryShirtSize
        }
      });
      console.log(`Found and updated Stripe customer: ${stripeCustomerId}`);
    } else {
      const newStripeCustomer = await stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
        address: {
            line1: customerData.address?.line1,
            line2: customerData.address?.line2,
            city: customerData.address?.city,
            state: customerData.address?.state,
            postal_code: customerData.address?.postal_code,
            country: customerData.address?.country,
        },
        metadata: {
            // e.g., spouse_name: customerData.spouseName, shirt_size: customerData.primaryShirtSize
        }
      });
      stripeCustomerId = newStripeCustomer.id;
      console.log(`Created new Stripe customer: ${stripeCustomerId}`);
    }

    // --- Prepare Metadata for Payment Intent ---
    // Include the full cart details and essential customer info for the webhook
    const metadata = {
      // IMPORTANT: Stringify the cart to store it in metadata
      cart_details: JSON.stringify(cart),
      // Include customer email and name for easier linking in the webhook
      customer_email: customerData.email,
      customer_name: customerData.name,
      // Add any other customerData fields needed directly by the webhook if desired
      // e.g., supabase_user_id: customerData.supabaseUserId (if available)
    };

    // --- Create Payment Intent ---
    const paymentIntent = await stripe.paymentIntents.create({
      amount: calculatedTotalInCents,
      currency: 'usd', // Or your desired currency
      customer: stripeCustomerId,
      automatic_payment_methods: { enabled: true },
      metadata: metadata, // Add the prepared metadata
    });

    // Send client secret back to frontend
    res.status(200).json({ clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error('Error creating Payment Intent:', error);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
} 