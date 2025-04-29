import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe with API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Table names and columns for price verification
const ACTIVITIES_TABLE = 'activities';
const ACCOMMODATIONS_TABLE = 'accommodations';
const SPONSORSHIPS_TABLE = 'sponsorships';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, customerData } = req.body;

    if (!items?.length || !customerData?.email) {
      return res.status(400).json({ 
        error: 'Missing required data', 
        details: 'Both items array and customer email are required' 
      });
    }

    // Will store validated items with server-verified prices
    const validatedItemsForMetadata = [];
    let calculatedTotalCents = 0;

    // Validate and calculate price for each item
    for (const item of items) {
      if (!item.id || !item.type || !item.quantity) {
        console.error('Invalid item in cart:', item);
        return res.status(400).json({ 
          error: 'Invalid item data', 
          details: 'Each item must have id, type, and quantity' 
        });
      }

      let verifiedItem;
      
      switch (item.type) {
        case 'activity': {
          const { data: activity, error } = await supabase
            .from(ACTIVITIES_TABLE)
            .select('id, title, price_cents, description')
            .eq('id', item.id)
            .single();

          if (error || !activity) {
            console.error('Error fetching activity:', error);
            return res.status(400).json({ 
              error: 'Invalid activity', 
              details: `Activity ${item.id} not found or error occurred` 
            });
          }

          const lineItemTotal = activity.price_cents * item.quantity;
          calculatedTotalCents += lineItemTotal;

          validatedItemsForMetadata.push({
            id: activity.id,
            type: 'activity',
            name: activity.title,
            quantity: item.quantity,
            price_cents: activity.price_cents,
            total_price_cents: lineItemTotal,
            participantType: item.participantType // Pass through from client
          });
          break;
        }

        case 'accommodation': {
          const { data: accommodation, error } = await supabase
            .from(ACCOMMODATIONS_TABLE)
            .select('id, name, price_per_night_cents, description')
            .eq('id', item.id)
            .single();

          if (error || !accommodation) {
            console.error('Error fetching accommodation:', error);
            return res.status(400).json({ 
              error: 'Invalid accommodation', 
              details: `Accommodation ${item.id} not found or error occurred` 
            });
          }

          // Validate dates and calculate nights
          const checkIn = new Date(item.checkIn);
          const checkOut = new Date(item.checkOut);
          
          if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
            return res.status(400).json({ 
              error: 'Invalid dates', 
              details: 'Check-in and check-out dates must be valid' 
            });
          }

          const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
          if (nights < 1) {
            return res.status(400).json({ 
              error: 'Invalid stay duration', 
              details: 'Check-out must be after check-in' 
            });
          }

          const lineItemTotal = accommodation.price_per_night_cents * nights;
          calculatedTotalCents += lineItemTotal;

          validatedItemsForMetadata.push({
            id: accommodation.id,
            type: 'accommodation',
            name: accommodation.name,
            quantity: 1,
            price_per_night_cents: accommodation.price_per_night_cents,
            total_price_cents: lineItemTotal,
            checkIn: item.checkIn,
            checkOut: item.checkOut,
            nights,
            guests: item.guests
          });
          break;
        }

        case 'sponsorship': {
          const { data: sponsorship, error } = await supabase
            .from(SPONSORSHIPS_TABLE)
            .select('id, name, price_cents, description')
            .eq('id', item.id)
            .single();

          if (error || !sponsorship) {
            console.error('Error fetching sponsorship:', error);
            return res.status(400).json({ 
              error: 'Invalid sponsorship', 
              details: `Sponsorship ${item.id} not found or error occurred` 
            });
          }

          const lineItemTotal = sponsorship.price_cents * item.quantity;
          calculatedTotalCents += lineItemTotal;

          validatedItemsForMetadata.push({
            id: sponsorship.id,
            type: 'sponsorship',
            name: sponsorship.name,
            quantity: item.quantity,
            price_cents: sponsorship.price_cents,
            total_price_cents: lineItemTotal
          });
          break;
        }

        default:
          return res.status(400).json({ 
            error: 'Invalid item type', 
            details: `Type ${item.type} is not supported` 
          });
      }
    }

    // Create Stripe PaymentIntent with validated data
    const paymentIntent = await stripe.paymentIntents.create({
      amount: calculatedTotalCents,
      currency: 'usd', // Make configurable if needed
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        // Convert objects to strings for Stripe metadata
        validatedItems: JSON.stringify(validatedItemsForMetadata),
        customerData: JSON.stringify(customerData)
      }
    });

    // Return the client_secret to the frontend
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount: calculatedTotalCents
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
} 