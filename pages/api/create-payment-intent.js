import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe with API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20', // Use your desired version
});

// Initialize Supabase client (ensure URL and Service Key are correct)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use SERVICE ROLE KEY on server
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- Define Supabase table/column names (adjust if needed) ---
const ACTIVITIES_TABLE = 'activities';
const ACCOMMODATIONS_TABLE = 'accommodations'; // Assuming you have this table
const SPONSORSHIPS_TABLE = 'sponsorships';
const PRICE_CENTS_COLUMN = 'price_cents'; // Standard price column for activities/sponsorships
const ACCOM_PRICE_CENTS_COLUMN = 'price_per_night_cents'; // Price per night for accommodations
const ACCOM_ID_COLUMN = 'id'; // PK for accommodations
const ACCOM_NAME_COLUMN = 'name'; // e.g., 'Standard Room'

export default async function handler(req, res) { // Adjust if using Express (req, res)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { items, customerData } = req.body;

    // --- Basic Input Validation ---
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart items are required.' });
    }
    if (!customerData || typeof customerData !== 'object' || !customerData.email) {
      // Add more checks for required customer fields if necessary
      return res.status(400).json({ error: 'Valid customer data (including email) is required.' });
    }

    let calculatedTotalCents = 0;
    const validatedItemsForMetadata = []; // Store details needed by webhook

    // --- Server-side Price Validation Loop ---
    for (const item of items) {
      // Validate basic item structure received from client
      if (!item.id || !item.type || !item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
          console.warn('Received invalid item structure from client:', item);
          return res.status(400).json({ error: 'Invalid item data received.' });
      }

      let unitPriceCents = 0;
      let productName = item.name || 'Unknown Product'; // Use client name as fallback
      let productId = item.id;
      let productType = item.type;
      let quantity = item.quantity; // Use client quantity
      let dbData = null; // To store fetched DB record

      try {
        switch (productType) {
          case 'activity': {
            const { data, error } = await supabase
              .from(ACTIVITIES_TABLE)
              .select(`id, title, ${PRICE_CENTS_COLUMN}`) // Select needed fields
              .eq('id', productId)
              .single(); // Expect exactly one match

            if (error) throw new Error(`DB error fetching activity ${productId}: ${error.message}`);
            if (!data) throw new Error(`Activity with ID ${productId} not found.`);

            unitPriceCents = data[PRICE_CENTS_COLUMN];
            productName = data.title || productName; // Prefer DB name
            dbData = data;
            break;
          }

          case 'accommodation': {
            // Accommodation price depends on nights
            if (typeof item.nights !== 'number' || item.nights < 1 || !item.checkInDate || !item.checkOutDate) {
                throw new Error(`Invalid nights/dates for accommodation ${productId}.`);
            }
            const nights = item.nights;

            const { data: room } = await supabase
              .from(ACCOMMODATIONS_TABLE)
              .select('price_per_night_cents, room_type')
              .eq(ACCOM_ID_COLUMN, productId)
              .single();

            if (!room) throw new Error(`Room type not found: ${productId}`);

            // Validate the price calculation
            const expectedTotal = room.price_per_night_cents * nights;
            if (item.price !== expectedTotal) {
                throw new Error('Price mismatch for accommodation booking');
            }

            // Add booking metadata for webhook
            item.metadata = {
                room_type: room.room_type,
                check_in: item.checkInDate,
                check_out: item.checkOutDate,
                nights: item.nights,
                guests: item.guestCount,
                price_per_night_cents: room.price_per_night_cents
            };

            unitPriceCents = room.price_per_night_cents * nights; // This is the total for the line item
            productName = room[ACCOM_NAME_COLUMN] || productName; // Prefer DB name
            quantity = 1; // Accommodation is always quantity 1
            dbData = room; // Store fetched data
            // Add price_per_night_cents to dbData for metadata if needed by webhook
            dbData.price_per_night_cents = room.price_per_night_cents;
            break;
          }

          case 'sponsorship': {
            const { data, error } = await supabase
              .from(SPONSORSHIPS_TABLE)
              .select(`id, name, ${PRICE_CENTS_COLUMN}`)
              .eq('id', productId)
              .single();

            if (error) throw new Error(`DB error fetching sponsorship ${productId}: ${error.message}`);
            if (!data) throw new Error(`Sponsorship with ID ${productId} not found.`);

            unitPriceCents = data[PRICE_CENTS_COLUMN];
            productName = data.name || productName; // Prefer DB name
            dbData = data;
            break;
          }

          default:
            throw new Error(`Unsupported item type: ${productType}`);
        }

        // --- Validate Fetched Price ---
        if (typeof unitPriceCents !== 'number' || unitPriceCents < 0) {
          throw new Error(`Invalid unit price (cents) found for ${productType} ${productId}.`);
        }

        // --- Calculate Line Item Total ---
        const lineItemTotalCents = unitPriceCents * quantity; // For accommodation, unitPriceCents IS the total
        calculatedTotalCents += lineItemTotalCents;

        // --- Prepare Item for Metadata (using validated/fetched data) ---
        const validatedItem = {
          id: productId,
          type: productType,
          name: productName, // Use name fetched/validated from DB
          quantity: quantity,
          // Store price components IN CENTS for the webhook
          unit_price_cents: productType === 'accommodation' ? dbData.price_per_night_cents : unitPriceCents, // Store per-night for accom, unit for others
          line_item_total_cents: lineItemTotalCents, // Store calculated line total
          // Include other necessary details from original item for webhook
          ...(productType === 'activity' && { participantType: item.participantType }),
          ...(productType === 'accommodation' && {
              checkIn: item.checkInDate,
              checkOut: item.checkOutDate,
              nights: item.nights,
              guests: item.guestCount,
              // price_per_night_cents is already included via unit_price_cents above
          }),
        };
        validatedItemsForMetadata.push(validatedItem);

      } catch (validationError) {
          console.error(`Validation Error for item ${item.id}: ${validationError.message}`);
          // Return a specific error indicating which item failed validation
          return res.status(400).json({
              error: `Item validation failed: ${validationError.message}`,
              itemId: item.id
          });
      }
    } // End validation loop

    // --- Ensure Total is Valid ---
    if (calculatedTotalCents <= 0 && validatedItemsForMetadata.length > 0) {
        // Allow $0 total only if a valid discount makes it $0 (add discount logic if needed)
        // Otherwise, it's an error if items exist but total is zero.
        console.error('Calculated total is zero despite having items. Check prices in DB.');
        return res.status(500).json({ error: 'Calculated total is zero. Please check item prices.' });
    }


    // --- Create Stripe Payment Intent ---
    console.log(`Creating Payment Intent for amount: ${calculatedTotalCents} cents`);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: calculatedTotalCents,
      currency: 'usd', // Or your desired currency (e.g., 'cad')
      automatic_payment_methods: { enabled: true },
      // --- Metadata for Webhook (use validated data) ---
      metadata: {
        // Stringify validated items and customer data
        // Ensure the total length of metadata doesn't exceed Stripe limits (50 keys, 500 chars per value)
        validatedItems: JSON.stringify(validatedItemsForMetadata), // Send validated data
        customerData: JSON.stringify(customerData), // Pass customer form data
        // Add order ID from your system if generated pre-payment
      },
    });

    // --- Return client secret to frontend ---
    res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        amount: calculatedTotalCents // Optionally return amount for confirmation
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    // Avoid sending detailed internal errors to the client in production
    res.status(500).json({ error: `Internal Server Error. Please try again later.` });
  }
} 