// Stripe Payments Integration for Banff Energy Summit 2025
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Stripe elements once the DOM is loaded
  if (window.location.pathname.includes('checkout.html')) {
    // Wait for env-config.js to load
    const checkStripeKey = setInterval(() => {
      if (window.STRIPE_PUBLISHABLE_KEY) {
        clearInterval(checkStripeKey);
        initializeStripeElements();
        initializeSupabase();
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkStripeKey);
      if (!window.STRIPE_PUBLISHABLE_KEY) {
        console.error('Failed to load Stripe publishable key');
      }
    }, 5000);
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
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.error('Supabase configuration missing');
    return;
  }
  
  try {
    // Create Supabase client
    supabase = supabaseClient.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    console.log('Supabase client initialized');
  } catch (error) {
    console.error('Error initializing Supabase:', error);
  }
}

function initializeStripeElements() {
  console.log('Initializing Stripe elements...');
  
  if (!window.STRIPE_PUBLISHABLE_KEY) {
    console.error('Stripe publishable key not found');
    return;
  }
  
  try {
    // Initialize Stripe with the publishable key
    stripe = Stripe(window.STRIPE_PUBLISHABLE_KEY);
    
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
    
    // Store the Stripe elements in a global variable for access from other scripts
    window.stripeElements = {
      number: cardNumberElement,
      expiry: cardExpiryElement,
      cvc: cardCvcElement
    };
    
    // Wait for the DOM to be fully ready
    setTimeout(() => {
      mountStripeElements();
    }, 500);
  } catch (error) {
    console.error('Error initializing Stripe:', error);
  }
}

function mountStripeElements() {
  const cardNumberContainer = document.getElementById('card-number-element');
  const cardExpiryContainer = document.getElementById('card-expiry-element');
  const cardCvcContainer = document.getElementById('card-cvc-element');
  
  // Helper function to mount a single element
  const mountElement = (element, container, name) => {
    if (!container) {
      console.error(`${name} container not found`);
      return;
    }
    
    try {
      // Clean up any existing element
      if (element._mounted) {
        element.unmount();
      }
      
      // Mount the element
      element.mount(container);
      element._mounted = true;
      console.log(`${name} element mounted`);
      
      // Add event listeners
      element.on('focus', () => {
        container.classList.add('focused');
      });
      
      element.on('blur', () => {
        container.classList.remove('focused');
      });
      
      element.on('change', (event) => {
        if (event.error) {
          container.classList.add('invalid');
        } else {
          container.classList.remove('invalid');
        }
      });
    } catch (error) {
      console.error(`Error mounting ${name} element:`, error);
    }
  };
  
  // Mount each element
  mountElement(cardNumberElement, cardNumberContainer, 'Card number');
  mountElement(cardExpiryElement, cardExpiryContainer, 'Card expiry');
  mountElement(cardCvcElement, cardCvcContainer, 'Card CVC');
  
  // Set up form submission after elements are mounted
  setupCheckoutFormSubmission();
}

function setupCheckoutFormSubmission() {
  const checkoutButton = document.querySelector('.w-commerce-commercecheckoutplaceorderbutton');
  const customerForm = document.querySelector('.w-commerce-commercecheckoutcustomerinfowrapper');
  
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
  // Note: totalAmount calculated client-side is NO LONGER USED for payment creation.
  // It might still be useful for displaying to the user before they click "Pay".
  // Ensure any display correctly formats cents to dollars (e.g., totalAmount / 100).
  try {
    // 1. Create PaymentMethod (still needed for card details)
    const paymentMethodResult = await stripe.createPaymentMethod({
      type: 'card',
      card: cardNumberElement,
      billing_details: {
        name: customerData.primaryName,
        email: customerData.email,
        // Include other details if needed by Stripe/your setup
        // phone: customerData.phone,
        // address: customerData.address // Often collected by Stripe Elements Link/Payment Element
      }
    });
    
    if (paymentMethodResult.error) {
      console.error("PaymentMethod creation error:", paymentMethodResult.error);
      return { success: false, error: paymentMethodResult.error.message };
    }
    const paymentMethodId = paymentMethodResult.paymentMethod.id;

    // 2. Call your backend to create the Payment Intent
    // Prepare only the necessary data: item IDs and quantities.
    const cartForServer = cart.map(item => ({ id: item.id, quantity: item.quantity || 1 }));

    const response = await fetch('/api/create-payment-intent', { // Ensure this path is correct
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cart: cartForServer, customerEmail: customerData.email }),
    });

    const paymentIntentData = await response.json();

    if (!response.ok || paymentIntentData.error) {
      console.error("Error fetching client secret:", paymentIntentData.error || response.statusText);
      return { success: false, error: paymentIntentData.error || 'Failed to initialize payment.' };
    }

    // 3. Confirm the Payment Intent on the client using the clientSecret from the server
    const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
      paymentIntentData.clientSecret, // The client secret returned by your backend
      {
        payment_method: paymentMethodId, // Attach the payment method collected
      }
    );

    if (confirmError) {
      // Handle errors like insufficient funds, card declined, etc.
      console.error('Stripe payment confirmation error:', confirmError);
      return { success: false, error: confirmError.message };
    }

    // 4. Payment successful! Redirect or show success message.
    // Order saving and email sending are now handled by the webhook.
    console.log('PaymentIntent confirmed successfully:', paymentIntent);
    // You might redirect to a success page, passing the paymentIntent.id if needed
    // e.g., window.location.href = `/checkout-success.html?payment_intent=${paymentIntent.id}`;
    return { success: true, paymentIntentId: paymentIntent.id };

  } catch (error) {
    console.error('Error processing payment:', error);
    return { success: false, error: error.message };
  }
}

function validateCustomerForm() {
  const customerForm = document.querySelector('.w-commerce-commercecheckoutcustomerinfowrapper');
  
  if (!customerForm) {
    console.error('Customer form not found');
    handlePaymentError('Form error: Could not find the customer information form.');
    return false;
  }
  
  // Check required fields
  const email = customerForm.querySelector('[name="email"]')?.value;
  const primaryName = customerForm.querySelector('[name="primary_name"]')?.value;
  const phone = customerForm.querySelector('[name="primary_phone"]')?.value;
  const shirtSize = customerForm.querySelector('[name="primary_shirt_size"]')?.value;
  const address = customerForm.querySelector('[name="address_line1"]')?.value;
  const city = customerForm.querySelector('[name="city"]')?.value;
  const state = customerForm.querySelector('[name="state"]')?.value;
  const zip = customerForm.querySelector('[name="zip"]')?.value;
  const country = customerForm.querySelector('[name="country"]')?.value;
  
  // Create an array to collect all error messages
  let errors = [];
  
  // Validate email
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Please enter a valid email address.');
  }
  
  // Validate name
  if (!primaryName || primaryName.trim().length < 3) {
    errors.push('Please enter your full name (first and last name).');
  }
  
  // Validate phone
  if (!phone || phone.replace(/[^0-9]/g, '').length < 10) {
    errors.push('Please enter a valid phone number with at least 10 digits.');
  }
  
  // Validate shirt size
  if (!shirtSize) {
    errors.push('Please select a shirt size.');
  }
  
  // Validate address
  if (!address || address.trim().length < 5) {
    errors.push('Please enter a valid street address.');
  }
  
  // Validate city
  if (!city || city.trim().length < 2) {
    errors.push('Please enter a valid city.');
  }
  
  // Validate state
  if (!state || state.trim().length < 2) {
    errors.push('Please enter a valid state/province.');
  }
  
  // Validate ZIP
  if (!zip || zip.trim().length < 5) {
    errors.push('Please enter a valid ZIP/postal code.');
  }
  
  // Validate country
  if (!country) {
    errors.push('Please select a country.');
  }
  
  // If there are errors, display them
  if (errors.length > 0) {
    handlePaymentError(errors.join('<br>'));
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

// In your cart display logic
const displayTotal = (cartTotalInCents / 100).toFixed(2);
document.getElementById('grand-total-display').textContent = `$${displayTotal}`; 