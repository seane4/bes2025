import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client (using Service Role Key for backend access)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role Key on server
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
    // --- EDIT START: Receive full customerData object ---
    // Expecting: { items: [...], customerData: { email: ..., primaryName: ..., address: {...}, primaryHeight: ..., etc. } }
    const { items: cart, customerData } = req.body;

    // Validate essential parts
    if (!cart || !Array.isArray(cart) || cart.length === 0 || !customerData || !customerData.email) {
      return res.status(400).json({ error: 'Invalid request body. Requires items array and customerData object with email.' });
    }
    // --- EDIT END ---

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
    const customerEmail = customerData.email; // Extract email

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
        // --- EDIT START: Update existing Stripe customer with latest details ---
        try {
            await stripe.customers.update(stripeCustomerId, {
                name: customerData.primaryName,
                phone: customerData.phone,
                address: { // Use the nested address object
                    line1: customerData.address?.line1,
                    line2: customerData.address?.line2,
                    city: customerData.address?.city,
                    state: customerData.address?.state,
                    postal_code: customerData.address?.postal_code,
                    country: customerData.address?.country,
                },
                // Add other fields Stripe supports if needed
            });
            console.log(`Updated existing Stripe Customer ${stripeCustomerId} with latest details.`);
        } catch (stripeUpdateError) {
            console.warn(`Failed to update Stripe Customer ${stripeCustomerId}:`, stripeUpdateError);
            // Log error but continue, payment can likely still proceed
        }
        // --- EDIT END ---
    } else {
        // If not found in DB or DB check failed, query Stripe API
        console.log('Stripe Customer ID not found in DB or DB check failed, querying Stripe API...');
        const existingCustomers = await stripe.customers.list({ email: customerEmail, limit: 1 });

        if (existingCustomers.data.length > 0) {
          stripeCustomerId = existingCustomers.data[0].id;
          console.log(`Found existing Stripe Customer via API: ${stripeCustomerId}`);
          // --- EDIT START: Update existing Stripe customer with latest details ---
          try {
              await stripe.customers.update(stripeCustomerId, {
                  name: customerData.primaryName,
                  phone: customerData.phone,
                  address: {
                      line1: customerData.address?.line1,
                      line2: customerData.address?.line2,
                      city: customerData.address?.city,
                      state: customerData.address?.state,
                      postal_code: customerData.address?.postal_code,
                      country: customerData.address?.country,
                  },
              });
              console.log(`Updated existing Stripe Customer ${stripeCustomerId} via API with latest details.`);
          } catch (stripeUpdateError) {
              console.warn(`Failed to update Stripe Customer ${stripeCustomerId} found via API:`, stripeUpdateError);
          }
          // --- EDIT END ---
          // Optional: Update Supabase customer record with this Stripe Customer ID if missing
          if (!dbCustomer || !dbCustomer[CUSTOMER_STRIPE_ID_COLUMN]) {
              const { error: updateSupabaseError } = await supabase
                .from(CUSTOMERS_TABLE)
                .update({ [CUSTOMER_STRIPE_ID_COLUMN]: stripeCustomerId })
                .eq(CUSTOMER_EMAIL_COLUMN, customerEmail); // Match by email to update
              if (updateSupabaseError) {
                  console.error('Supabase error updating customer with Stripe ID:', updateSupabaseError);
              } else {
                  console.log(`Updated Supabase customer ${customerEmail} with Stripe ID ${stripeCustomerId}`);
              }
          }
        } else {
          // Create new Stripe Customer
          console.log('Creating new Stripe Customer via API...');
          // --- EDIT START: Create Stripe customer with more details ---
          const newStripeCustomer = await stripe.customers.create({
              email: customerEmail,
              name: customerData.primaryName,
              phone: customerData.phone,
              address: {
                  line1: customerData.address?.line1,
                  line2: customerData.address?.line2,
                  city: customerData.address?.city,
                  state: customerData.address?.state,
                  postal_code: customerData.address?.postal_code,
                  country: customerData.address?.country,
              },
              // Add metadata if needed, though we pass full data in PI metadata
          });
          // --- EDIT END ---
          stripeCustomerId = newStripeCustomer.id;
          console.log(`Created new Stripe Customer via API: ${stripeCustomerId}`);
          // Optional: Create or update Supabase customer record with this Stripe Customer ID
          // The webhook (`pages/api/webhook/stripe.js`) handles the comprehensive create/update,
          // but we can ensure the stripe_customer_id is linked here if the customer already exists in Supabase.
          if (dbCustomer && !dbCustomer[CUSTOMER_STRIPE_ID_COLUMN]) { // If customer existed in DB but lacked Stripe ID
             const { error: updateSupabaseError } = await supabase
                .from(CUSTOMERS_TABLE)
                .update({ [CUSTOMER_STRIPE_ID_COLUMN]: stripeCustomerId })
                .eq(CUSTOMER_EMAIL_COLUMN, customerEmail);
             if (updateSupabaseError) {
                 console.error('Supabase error updating customer with new Stripe ID:', updateSupabaseError);
             } else {
                 console.log(`Updated Supabase customer ${customerEmail} with new Stripe ID ${stripeCustomerId}`);
             }
          }
          // If dbCustomer didn't exist at all, the webhook will create the full record.
        }
    }


    // 4. Create Stripe Payment Intent (using amount in Cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: calculatedTotalInCents, // Use the server-calculated total in CENTS
      currency: 'cad', // IMPORTANT: Use your correct currency code (e.g., 'usd', 'cad')
      customer: stripeCustomerId,
      automatic_payment_methods: { enabled: true }, // Recommended by Stripe
      // --- EDIT START: Pass full customerData and cart details in metadata ---
      metadata: {
        // Stringify complex objects/arrays for metadata
        cart_details: JSON.stringify(lineItemsForMetadata),
        // Store the entire customerData object as a string
        // The webhook will parse this to get all details.
        customer_details: JSON.stringify(customerData),
        // Keep email separate for easier access/fallback if needed
        customer_email: customerEmail
      },
      // --- EDIT END ---
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