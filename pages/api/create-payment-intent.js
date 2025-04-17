import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client (using Service Role Key for backend access)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role Key on server
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- Define your Supabase table/column names ---
// Ensure these match your actual schema AFTER applying ALTER commands
const ACTIVITIES_TABLE = 'activities'; // Table with your purchasable items
const ACTIVITY_PK_COLUMN = 'id'; // Primary key of activities (UUID)
const PRICE_COLUMN = 'price'; // Column name for price IN CENTS (INTEGER) in activities table
const CUSTOMERS_TABLE = 'Customers'; // Case-sensitive table name from your setup
const CUSTOMER_EMAIL_COLUMN = 'email'; // Column for customer email (VARCHAR)
const CUSTOMER_STRIPE_ID_COLUMN = 'stripe_customer_id'; // Added via ALTER TABLE

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Expecting cart = [{ id: 'activity_uuid_or_text_id', quantity: 1 }, ...]
    // Expecting customerEmail = 'user@example.com'
    const { cart, customerEmail } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0 || !customerEmail) {
      return res.status(400).json({ error: 'Invalid request body. Requires cart array and customerEmail.' });
    }

    // Validate cart items structure
    if (!cart.every(item => item.id && typeof item.quantity === 'number' && item.quantity > 0)) {
        return res.status(400).json({ error: 'Invalid cart item structure. Each item needs id and positive quantity.' });
    }

    // 1. Fetch Product Prices (in Cents) from Supabase
    const productIds = cart.map(item => item.id);
    const { data: productsData, error: productsError } = await supabase
      .from(ACTIVITIES_TABLE)
      .select(`${ACTIVITY_PK_COLUMN}, ${PRICE_COLUMN}`) // Select PK and the price column (must be integer cents)
      .in(ACTIVITY_PK_COLUMN, productIds); // Filter by the primary key column

    if (productsError) {
      console.error('Supabase error fetching products:', productsError);
      return res.status(500).json({ error: 'Database error fetching product details.' });
    }

    // Create a map for easy price lookup: { productId: priceInCents }
    const productPrices = productsData.reduce((map, product) => {
        map[product[ACTIVITY_PK_COLUMN]] = product[PRICE_COLUMN];
        return map;
    }, {});


    // 2. Calculate Total Amount Server-Side (in Cents) and Prepare Metadata
    let calculatedTotalInCents = 0;
    const lineItemsForMetadata = []; // To store details for the webhook

    for (const item of cart) {
      const priceInCents = productPrices[item.id];

      if (priceInCents === undefined || priceInCents === null) {
        // This should ideally not happen if the .in() query worked correctly and all IDs exist
        console.error(`Price not found for product ID: ${item.id}. Available prices:`, productPrices);
        return res.status(400).json({ error: `Details not found for item ID: ${item.id}. It may be inactive or invalid.` });
      }

      if (typeof priceInCents !== 'number' || !Number.isInteger(priceInCents) || priceInCents < 0) {
          console.error(`Invalid price format for product ID ${item.id}:`, priceInCents);
          return res.status(500).json({ error: `Invalid price configuration for item ID: ${item.id}.` });
      }

      calculatedTotalInCents += priceInCents * item.quantity;
      lineItemsForMetadata.push({
          id: item.id, // Pass the activity/product ID
          quantity: item.quantity
          // Optional: add name/price here if needed by webhook differently, but keep it minimal
      });
    }

    // Basic validation for the final amount
    if (calculatedTotalInCents <= 0) { // Stripe requires amount > 0 (usually >= 50 cents depending on currency)
        console.error('Calculated total is not positive:', calculatedTotalInCents);
        // Check Stripe minimums for your currency (e.g., 50 for USD cents)
        if (calculatedTotalInCents < 50) { // Example check for CAD/USD
             return res.status(400).json({ error: 'Order total is below the minimum required amount.' });
        }
        return res.status(400).json({ error: 'Calculated total must be positive.' });
    }

    console.log(`Server Calculated Total: ${calculatedTotalInCents} cents`);

    // 3. Find or Create Stripe Customer
    let stripeCustomerId;
    // Check Supabase first if you store the mapping reliably
     const { data: dbCustomer, error: dbCustError } = await supabase
        .from(CUSTOMERS_TABLE)
        .select(CUSTOMER_STRIPE_ID_COLUMN)
        .eq(CUSTOMER_EMAIL_COLUMN, customerEmail)
        .maybeSingle();

    if (dbCustError) {
        console.warn('Supabase error checking for existing customer by email:', dbCustError);
        // Proceed to check Stripe API, but log this
    }

    if (dbCustomer && dbCustomer[CUSTOMER_STRIPE_ID_COLUMN]) {
        stripeCustomerId = dbCustomer[CUSTOMER_STRIPE_ID_COLUMN];
        console.log(`Found existing Stripe Customer ID in DB: ${stripeCustomerId}`);
        // Optional: Verify this customer still exists in Stripe? Usually not necessary.
    } else {
        // If not found in DB or DB check failed, query Stripe API
        console.log('Stripe Customer ID not found in DB or DB check failed, querying Stripe API...');
        const existingCustomers = await stripe.customers.list({ email: customerEmail, limit: 1 });

        if (existingCustomers.data.length > 0) {
          stripeCustomerId = existingCustomers.data[0].id;
          console.log(`Found existing Stripe Customer via API: ${stripeCustomerId}`);
          // Optional: Update Supabase customer record with this Stripe Customer ID if missing
          if (!dbCustomer || !dbCustomer[CUSTOMER_STRIPE_ID_COLUMN]) {
              // Perform update in Supabase (handle errors gracefully)
              // ... update logic ...
          }
        } else {
          // Create new Stripe Customer
          console.log('Creating new Stripe Customer via API...');
          const newStripeCustomer = await stripe.customers.create({
              email: customerEmail,
              // Add name if available from client request body?
              // name: customerData?.primaryName
          });
          stripeCustomerId = newStripeCustomer.id;
          console.log(`Created new Stripe Customer via API: ${stripeCustomerId}`);
          // Optional: Create or update Supabase customer record with this Stripe Customer ID
          // ... insert/update logic ... (Webhook also handles this, maybe redundant here)
        }
    }


    // 4. Create Stripe Payment Intent (using amount in Cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: calculatedTotalInCents, // Use the server-calculated total in CENTS
      currency: 'cad', // IMPORTANT: Use your correct currency code (e.g., 'usd', 'cad')
      customer: stripeCustomerId,
      automatic_payment_methods: { enabled: true }, // Recommended by Stripe
      // --- CRUCIAL: Pass cart details for webhook ---
      metadata: {
        // Stringify the array for metadata storage
        cart_details: JSON.stringify(lineItemsForMetadata),
        customer_email: customerEmail // Pass email explicitly for webhook fallback
      },
    });

    console.log(`Created Payment Intent: ${paymentIntent.id}`);

    // 5. Return Client Secret to Frontend
    res.status(200).json({ clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error('Error creating Payment Intent:', error);
    // Avoid sending detailed internal errors to the client in production
    const userMessage = error.type === 'StripeCardError' ? error.message : 'Could not initiate payment. Please try again.';
    res.status(500).json({ error: userMessage }); // Send a generic or card-specific error
  }
} 