// Stripe Payments Integration for Banff Energy Summit 2025
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Stripe elements once the DOM is loaded
  if (window.location.pathname.includes('checkout.html')) {
    initializeStripeElements();
    initializeSupabase();
  }
});

// Initialize Stripe with your publishable key
let stripe;
let elements;
let cardElement;
let cardNumberElement;
let cardExpiryElement;
let cardCvcElement;

// Initialize Supabase client
let supabase;

function initializeSupabase() {
  const SUPABASE_URL = 'https://your-supabase-project.supabase.co';
  const SUPABASE_ANON_KEY = 'your-supabase-anon-key';
  
  // Create Supabase client
  supabase = supabaseClient.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('Supabase client initialized');
}

function initializeStripeElements() {
  console.log('Initializing Stripe elements...');
  
  // Get Stripe publishable key from environment or use a default test key
  const stripePublishableKey = window.STRIPE_PUBLISHABLE_KEY || 'pk_test_51OxxlOKPl0Oc7cDJfhAVFnllgPBPizxYwMmhJPw7Uqu0iiC7ks12XcCEKm0J7KDGZGPOi8a2DKwDPzdN4yJrBGXL00lQ56I8Yn';
  
  // Initialize Stripe with the publishable key
  stripe = Stripe(stripePublishableKey);
  
  // Create Stripe elements
  elements = stripe.elements({
    fonts: [
      {
        cssSrc: 'https://fonts.googleapis.com/css?family=Sen:400,700,800',
      },
    ],
    locale: 'auto'
  });
  
  // Customize the style of the Stripe elements
  const style = {
    base: {
      color: '#333',
      fontFamily: '"Sen", sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '14px',
      '::placeholder': {
        color: '#aab7c4'
      },
      ':-webkit-autofill': {
        color: '#333'
      }
    },
    invalid: {
      color: '#e53935',
      iconColor: '#e53935',
      '::placeholder': {
        color: '#e53935'
      }
    }
  };
  
  // Create individual Stripe elements for card number, expiration, and CVC
  cardNumberElement = elements.create('cardNumber', {
    style: style,
    placeholder: 'Card number'
  });
  
  cardExpiryElement = elements.create('cardExpiry', {
    style: style,
    placeholder: 'MM / YY'
  });
  
  cardCvcElement = elements.create('cardCvc', {
    style: style,
    placeholder: 'CVC'
  });
  
  // Mount the Stripe elements to the DOM
  const cardNumberContainer = document.querySelector('.w-commerce-commercecheckoutcardnumber div');
  const cardExpiryContainer = document.querySelector('.w-commerce-commercecheckoutcardexpirationdate div');
  const cardCvcContainer = document.querySelector('.w-commerce-commercecheckoutcardsecuritycode div');
  
  if (cardNumberContainer) {
    cardNumberElement.mount(cardNumberContainer);
  }
  
  if (cardExpiryContainer) {
    cardExpiryElement.mount(cardExpiryContainer);
  }
  
  if (cardCvcContainer) {
    cardCvcElement.mount(cardCvcContainer);
  }
  
  // Add event listener to the checkout form
  setupCheckoutFormSubmission();
}

function setupCheckoutFormSubmission() {
  const checkoutButton = document.querySelector('.w-commerce-commercecheckoutplaceorderbutton');
  const customerForm = document.querySelector('#customer-info-form');
  
  if (checkoutButton) {
    checkoutButton.addEventListener('click', function(event) {
      event.preventDefault();
      
      // Validate the customer form
      if (!validateCustomerForm()) {
        return;
      }

      // Check if cart is empty
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      if (cart.length === 0) {
        handlePaymentError('Your cart is empty. Please add items to your cart before checkout.');
        return;
      }
      
      // Disable the button to prevent multiple submissions
      checkoutButton.disabled = true;
      checkoutButton.textContent = 'Processing...';
      
      // Extract customer information
      const customerData = {
        email: customerForm.querySelector('[name="email"]').value,
        primaryName: customerForm.querySelector('[name="primary_name"]').value,
        phone: customerForm.querySelector('[name="primary_phone"]').value,
        address: {
          line1: customerForm.querySelector('[name="address_line1"]').value,
          line2: customerForm.querySelector('[name="address_line2"]').value || '',
          city: customerForm.querySelector('[name="city"]').value,
          state: customerForm.querySelector('[name="state"]').value,
          postal_code: customerForm.querySelector('[name="zip"]').value,
          country: customerForm.querySelector('[name="country"]').value
        },
        shirtSize: customerForm.querySelector('[name="primary_shirt_size"]').value,
        spouseName: customerForm.querySelector('[name="spouse_name"]').value || '',
        spouseShirtSize: customerForm.querySelector('[name="spouse_shirt_size"]').value || '',
        additionalGuestName: customerForm.querySelector('[name="additional_guest_name"]').value || '',
        additionalGuestShirtSize: customerForm.querySelector('[name="additional_guest_shirt_size"]').value || '',
        specialRequirements: customerForm.querySelector('[name="special_requirements"]').value || ''
      };
      
      // Calculate total amount
      let subtotal = 0;
      cart.forEach(item => {
        if (item.type === 'activity') {
          subtotal += parseFloat(item.price);
        } else {
          subtotal += parseFloat(item.total);
        }
      });
      
      const taxRate = 0.05; // 5% tax
      const tax = subtotal * taxRate;
      const total = subtotal + tax;
      
      // Process payment with Stripe
      processPayment(customerData, cart, total)
        .then(result => {
          if (result.success) {
            // Show success message
            showPaymentSuccessMessage(customerData, cart, total, result.orderId);
          } else {
            // Show error message
            handlePaymentError(result.error || 'An error occurred during payment processing');
            // Re-enable the checkout button
            checkoutButton.disabled = false;
            checkoutButton.textContent = 'Place Order';
          }
        })
        .catch(error => {
          console.error('Payment error:', error);
          handlePaymentError('An unexpected error occurred. Please try again later.');
          checkoutButton.disabled = false;
          checkoutButton.textContent = 'Place Order';
        });
    });
  }
}

async function processPayment(customerData, cart, totalAmount) {
  try {
    // Create a PaymentMethod using the card element
    const paymentMethodResult = await stripe.createPaymentMethod({
      type: 'card',
      card: cardNumberElement,
      billing_details: {
        name: customerData.primaryName,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address
      }
    });
    
    if (paymentMethodResult.error) {
      return { success: false, error: paymentMethodResult.error.message };
    }
    
    // Use the payment method ID to create a payment intent directly with Stripe
    // In a production environment, this should be done on the server-side for security
    // For this implementation, we'll create a direct charge using the payment method
    
    // This is a client-side approach only for demo purposes
    // In production, you should use Stripe's server-side SDKs
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // amount in cents
      currency: 'usd',
      payment_method: paymentMethodResult.paymentMethod.id,
      confirm: true,
      return_url: window.location.origin + '/checkout-success.html'
    });
    
    if (paymentIntent.error) {
      return { success: false, error: paymentIntent.error.message };
    }
    
    // If payment is successful, save order to Supabase
    const orderId = 'order_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const orderResult = await saveOrderToSupabase(orderId, customerData, cart, totalAmount, paymentMethodResult.paymentMethod.id);
    
    if (!orderResult.success) {
      console.error('Error saving order to Supabase:', orderResult.error);
      // Still consider payment successful if Stripe payment went through
      return { success: true, orderId: orderId };
    }
    
    // Send confirmation email using Supabase Edge Function
    await sendOrderConfirmationEmail(customerData, orderId, cart, totalAmount);
    
    return { success: true, orderId: orderId };
  } catch (error) {
    console.error('Error processing payment:', error);
    return { success: false, error: error.message };
  }
}

// Save order data to Supabase
async function saveOrderToSupabase(orderId, customerData, cart, totalAmount, paymentMethodId) {
  console.log('Saving order to Supabase:', orderId);
  
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || window.SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY
    );
    
    // Step 1: Create customer record
    const { data: customerRecord, error: customerError } = await supabase
      .from('customers')
      .insert([
        {
          email: customerData.email,
          name: customerData.primaryName,
          phone: customerData.phone,
          address_line1: customerData.address.line1,
          address_line2: customerData.address.line2,
          city: customerData.address.city,
          state: customerData.address.state,
          postal_code: customerData.address.postal_code,
          country: customerData.address.country,
          shirt_size: customerData.shirtSize,
          spouse_name: customerData.spouseName,
          spouse_shirt_size: customerData.spouseShirtSize,
          additional_guest_name: customerData.additionalGuestName,
          additional_guest_shirt_size: customerData.additionalGuestShirtSize,
          special_requirements: customerData.specialRequirements
        }
      ])
      .select('id')
      .single();
      
    if (customerError) {
      throw new Error(`Error creating customer record: ${customerError.message}`);
    }
    
    // Step 2: Create order record
    const { data: orderRecord, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          order_id: orderId,
          customer_id: customerRecord.id,
          subtotal: calculateSubtotal(cart),
          tax: calculateTax(cart),
          total: totalAmount,
          payment_method: 'stripe',
          transaction_id: paymentMethodId,
          status: 'completed'
        }
      ])
      .select('id')
      .single();
      
    if (orderError) {
      throw new Error(`Error creating order record: ${orderError.message}`);
    }
    
    // Step 3: Create order items
    const orderItems = cart.map(item => ({
      order_id: orderRecord.id,
      item_type: item.type,
      item_id: item.id,
      item_name: item.name,
      quantity: item.quantity || 1,
      price: item.price,
      total: item.price * (item.quantity || 1)
    }));
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
      
    if (itemsError) {
      throw new Error(`Error creating order items: ${itemsError.message}`);
    }
    
    // Step 4: Log the payment event
    await supabase
      .from('payment_logs')
      .insert([
        {
          order_id: orderId,
          transaction_id: paymentMethodId,
          event_type: 'payment_succeeded',
          event_data: {
            paymentMethod: 'stripe',
            amount: totalAmount,
            customer: customerData.email
          }
        }
      ]);
    
    console.log('Order saved successfully to Supabase');
    return { success: true, customerId: customerRecord.id, orderId: orderRecord.id };
  } catch (error) {
    console.error('Error saving order to Supabase:', error);
    
    // Log error to Supabase
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || window.SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY
      );
      
      await supabase
        .from('payment_logs')
        .insert([
          {
            order_id: orderId,
            event_type: 'error_saving_order',
            event_data: {
              error: error.message,
              customer: customerData.email
            }
          }
        ]);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return { success: false, error: error.message };
  }
}

// Send confirmation email using Supabase Edge Function
async function sendOrderConfirmationEmail(customerData, orderId, cart, totalAmount) {
  console.log('Sending order confirmation email via Vercel API endpoint');
  
  try {
    // Call the Vercel API endpoint instead of Supabase Edge Function
    const response = await fetch('/api/send-confirmation-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: orderId
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      console.error('Error sending confirmation email:', result.error);
      return { success: false, error: result.error };
    }
    
    console.log('Email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    // Don't block the user flow due to email sending failure
    return { success: false, error: error.message };
  }
}

// Helper function to calculate subtotal
function calculateSubtotal(cart) {
  return cart.reduce((total, item) => {
    if (item.type === 'activity') {
      return total + parseFloat(item.price);
    } else {
      return total + parseFloat(item.total);
    }
  }, 0);
}

// Helper function to calculate tax
function calculateTax(cart) {
  const subtotal = calculateSubtotal(cart);
  return subtotal * 0.05; // 5% tax
}

function validateCustomerForm() {
  const customerForm = document.querySelector('#customer-info-form');
  
  if (!customerForm) return false;
  
  // Check browser form validation
  if (!customerForm.checkValidity()) {
    // Trigger the browser's built-in validation
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.style.display = 'none';
    customerForm.appendChild(submitButton);
    submitButton.click();
    customerForm.removeChild(submitButton);
    
    // Show a general error message
    handlePaymentError('Please fill in all required fields marked with an asterisk (*).');
    return false;
  }
  
  // Additional validation for specific fields
  const email = customerForm.querySelector('[name="email"]').value;
  const primaryName = customerForm.querySelector('[name="primary_name"]').value;
  const phone = customerForm.querySelector('[name="primary_phone"]').value;
  const shirtSize = customerForm.querySelector('[name="primary_shirt_size"]').value;
  const address = customerForm.querySelector('[name="address_line1"]').value;
  const city = customerForm.querySelector('[name="city"]').value;
  const state = customerForm.querySelector('[name="state"]').value;
  const zip = customerForm.querySelector('[name="zip"]').value;
  const country = customerForm.querySelector('[name="country"]').value;
  
  // Validate email
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    handlePaymentError('Please enter a valid email address.');
    return false;
  }
  
  // Validate name
  if (!primaryName || primaryName.trim().length < 3) {
    handlePaymentError('Please enter your full name (first and last name).');
    return false;
  }
  
  // Validate phone
  if (!phone || phone.replace(/[^0-9]/g, '').length < 10) {
    handlePaymentError('Please enter a valid phone number with at least 10 digits.');
    return false;
  }
  
  // Validate shirt size
  if (!shirtSize) {
    handlePaymentError('Please select a shirt size.');
    return false;
  }
  
  // Validate address
  if (!address || address.trim().length < 5) {
    handlePaymentError('Please enter a valid street address.');
    return false;
  }
  
  // Validate city
  if (!city || city.trim().length < 2) {
    handlePaymentError('Please enter a valid city.');
    return false;
  }
  
  // Validate state
  if (!state || state.trim().length < 2) {
    handlePaymentError('Please enter a valid state/province.');
    return false;
  }
  
  // Validate ZIP
  if (!zip || zip.trim().length < 5) {
    handlePaymentError('Please enter a valid ZIP/postal code.');
    return false;
  }
  
  // Validate country
  if (!country) {
    handlePaymentError('Please select a country.');
    return false;
  }
  
  return true;
}

function handlePaymentError(errorMessage) {
  console.error('Payment error:', errorMessage);
  
  // Display the error message to the user
  const errorElement = document.querySelector('.w-commerce-commercecheckouterrorstate');
  const errorMessageElement = document.querySelector('.w-checkout-error-msg');
  
  if (errorElement && errorMessageElement) {
    errorMessageElement.textContent = errorMessage;
    errorElement.style.display = 'flex';
    
    // Scroll to the error message
    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    // Fallback to alert if the error element is not found
    alert('Error: ' + errorMessage);
  }
}

function showPaymentSuccessMessage(customerData, cart, total, orderId) {
  console.log('Payment successful:', orderId);
  console.log('Customer data:', customerData);
  console.log('Cart items:', cart);
  console.log('Total amount:', total);
  
  // Create success message UI
  const successDiv = document.createElement('div');
  successDiv.className = 'payment-success-message';
  successDiv.innerHTML = `
    <div class="payment-success-content">
      <h2>Thank You for Your Registration!</h2>
      <p>Your payment has been successfully processed.</p>
      <p>You will receive a confirmation email shortly with the details of your registration.</p>
      <p>Order Reference: ${orderId}</p>
      <div class="payment-success-buttons">
        <a href="index.html" class="btn">Return to Home</a>
      </div>
    </div>
  `;
  
  // Replace the checkout form with the success message
  const checkoutForm = document.querySelector('.w-commerce-commercecheckoutformcontainer');
  if (checkoutForm) {
    checkoutForm.innerHTML = '';
    checkoutForm.appendChild(successDiv);
    checkoutForm.style.padding = '40px';
    checkoutForm.style.textAlign = 'center';
  }
  
  // Clear the cart
  localStorage.removeItem('cart');
  
  // Update the cart display
  if (typeof updateCartDisplay === 'function') {
    updateCartDisplay();
  }
  
  // Add styles for the success message
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .payment-success-message {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-width: 600px;
      margin: 0 auto;
    }
    
    .payment-success-content {
      text-align: center;
    }
    
    .payment-success-content h2 {
      color: #00ae6b;
      margin-bottom: 20px;
      font-size: 24px;
    }
    
    .payment-success-content p {
      margin-bottom: 16px;
      color: #666;
      font-size: 16px;
      line-height: 1.5;
    }
    
    .payment-success-buttons {
      margin-top: 30px;
    }
    
    .payment-success-buttons .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: #00ae6b;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      transition: background-color 0.3s ease;
    }
    
    .payment-success-buttons .btn:hover {
      background-color: #009a5f;
    }
  `;
  document.head.appendChild(styleSheet);
} 