const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const router = express.Router();

// Validate discount code
function validateDiscountCode(code) {
  // In a production environment, you would typically check against a database
  const validDiscounts = {
    'TRACTS': {
      type: 'percentage',
      amount: 100
    }
  };
  
  return validDiscounts[code] || null;
}

// Create Payment Intent endpoint
router.post('/create-payment-intent', async (req, res) => {
  try {
    const {
      amount,
      currency,
      items,
      customer_info,
      discount
    } = req.body;

    // Validate the request
    if (!amount && !discount) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Validate discount if present
    let finalAmount = amount;
    if (discount) {
      const validDiscount = validateDiscountCode(discount.code);
      if (!validDiscount) {
        return res.status(400).json({ error: 'Invalid discount code' });
      }
      
      if (validDiscount.type === 'percentage' && validDiscount.amount === 100) {
        finalAmount = 0;
      }
    }

    // Create a customer in Stripe
    const customer = await stripe.customers.create({
      name: customer_info.name,
      email: customer_info.email,
      shipping: customer_info.shipping
    });

    // Create the payment intent with final amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency,
      customer: customer.id,
      metadata: {
        order_items: JSON.stringify(items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))),
        discount_applied: discount ? discount.code : null
      },
      shipping: customer_info.shipping,
      receipt_email: customer_info.email,
      automatic_payment_methods: {
        enabled: true,
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      error: 'Failed to create payment intent'
    });
  }
});

// Webhook handler for Stripe events
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle specific event types
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handleSuccessfulPayment(paymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await handleFailedPayment(failedPayment);
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Error handling webhook event:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Save order details endpoint
router.post('/save-order', async (req, res) => {
  try {
    const {
      payment_intent_id,
      amount,
      customer_info,
      items
    } = req.body;

    // Here you would typically save the order to your database
    // This is just a placeholder - implement your database logic here
    const order = {
      payment_intent_id,
      amount,
      customer_info,
      items,
      status: 'confirmed',
      created_at: new Date()
    };

    // Send confirmation email
    await sendOrderConfirmationEmail(order);

    res.json({ success: true, order });
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({
      error: 'Failed to save order'
    });
  }
});

// Helper functions
async function handleSuccessfulPayment(paymentIntent) {
  // Implement your payment success logic here
  // For example: update order status, send confirmation email, etc.
  console.log('Payment succeeded:', paymentIntent.id);
}

async function handleFailedPayment(paymentIntent) {
  // Implement your payment failure logic here
  // For example: update order status, send failure notification, etc.
  console.error('Payment failed:', paymentIntent.id);
}

async function sendOrderConfirmationEmail(order) {
  // Implement your email sending logic here
  // For example: use nodemailer or your preferred email service
  console.log('Sending confirmation email for order:', order.payment_intent_id);
}

module.exports = router; 